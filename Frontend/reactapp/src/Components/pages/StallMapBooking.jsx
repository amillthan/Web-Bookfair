import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";

import {
  SlideDown,
  SlideLeft,
  SlideRight,
  SlideUp,
} from "../../animation/direction";
import {
  StallApi,
  ReservationApi,
  PaymentApi,
  QrPassApi,
} from "../../services/StallReservationApi";

// 🔸 If you still use image map, keep this.
// If you are using real grid map, remove map image.
import mapImg from "../../assets/stall-map.png";

/* =========================
   ✅ BACKGROUND THEME (EDIT HERE)
   =========================
   Change these Tailwind classes to any colors you want.
*/
const BG = {
  page: "min-h-screen bg-[#0B4C5F] text-white", // main background
  pageOverlay:
    "min-h-screen bg-gradient-to-b from-[#0B4C5F] via-[#063645] to-[#021B22] text-white",
  card: "bg-white/10 border border-white/15",
  cardStrong: "bg-white/12 border border-white/20",
};

const pill = (status) => {
  if (status === "AVAILABLE") return "bg-emerald-500/90 text-white";
  if (status === "RESERVED") return "bg-amber-500/90 text-white";
  return "bg-slate-600/80 text-white";
};

const ring = (status) => {
  if (status === "AVAILABLE") return "ring-2 ring-emerald-400";
  if (status === "RESERVED") return "ring-2 ring-amber-400";
  return "ring-1 ring-white/20";
};

export default function StallBooking() {
  const [userId, setUserId] = useState(() =>
    Number(localStorage.getItem("userId") || 0)
  );

  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 CHANGE: selected → selectedStalls (array, max 3)
  const [selectedStalls, setSelectedStalls] = useState([]);

  // flow
  const [step, setStep] = useState("SELECT"); // SELECT | RESERVE | PAY | QR
  const [reservation, setReservation] = useState(null);
  const [payment, setPayment] = useState(null);
  const [qrPass, setQrPass] = useState(null);

  // payment inputs
  const [amount, setAmount] = useState("5000.00"); // will be overwritten by total
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [referenceNumber, setReferenceNumber] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🟢 Timer for 30‑minute hold
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const timerRef = useRef(null);

  // --- polling real-time refresh ---
  const fetchStalls = async () => {
    try {
      setLoading(true);
      const data = await StallApi.getAll(); // should return array
      setStalls(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        e?.response?.data?.message || e.message || "Failed to load stalls"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls();
    const t = setInterval(fetchStalls, 2000); // ✅ real-time via polling
    return () => clearInterval(t);
  }, []);

  // 🟢 Timer management
  const startTimer = (minutes = 30) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const expiry = Date.now() + minutes * 60 * 1000;
    setTimeLeft(minutes * 60);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up – release and reset
          setError("Reservation time expired. Please select stalls again.");
          setReservation(null);
          setSelectedStalls([]);
          setStep("SELECT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(null);
  };

  useEffect(() => {
    return () => stopTimer(); // cleanup on unmount
  }, []);

  const stallsByCode = useMemo(() => {
    const m = new Map();
    stalls.forEach((s) => m.set(String(s.stallCode).toUpperCase(), s));
    return m;
  }, [stalls]);

  // Split halls by stallCode first letter
  const hallA = useMemo(
    () =>
      stalls.filter((s) =>
        String(s.stallCode || "")
          .toUpperCase()
          .startsWith("A")
      ),
    [stalls]
  );
  const hallB = useMemo(
    () =>
      stalls.filter((s) =>
        String(s.stallCode || "")
          .toUpperCase()
          .startsWith("B")
      ),
    [stalls]
  );

  // 🟢 Toggle stall selection (max 3)
  const toggleStall = (stall) => {
    if (stall.status !== "AVAILABLE") return; // cannot select reserved

    setSelectedStalls((prev) => {
      const already = prev.find((s) => s.stallId === stall.stallId);
      if (already) {
        // remove
        return prev.filter((s) => s.stallId !== stall.stallId);
      } else {
        // add if less than 3
        if (prev.length >= 3) {
          alert("You can select a maximum of 3 stalls.");
          return prev;
        }
        return [...prev, stall];
      }
    });

    // If we were in a later step, go back to SELECT
    if (step !== "SELECT" && step !== "QR") {
      setStep("SELECT");
      setReservation(null);
      setPayment(null);
      setQrPass(null);
      stopTimer();
    }
  };

  // 🟢 Compute total price based on selected stalls (you need a price field per stall)
  const totalPrice = useMemo(() => {
    // Assuming each stall object has a `price` property; if not, derive from size
    return selectedStalls.reduce((sum, s) => {
      // If price not present, derive from stallCode or size
      let price = s.price;
      if (!price) {
        const code = s.stallCode;
        if (code.startsWith("A")) price = 2500;
        else if (code.startsWith("B")) price = 5000;
        else price = 7500;
      }
      return sum + price;
    }, 0);
  }, [selectedStalls]);

  // Update amount field when totalPrice changes
  useEffect(() => {
    setAmount(totalPrice.toFixed(2));
  }, [totalPrice]);

  const reserveStall = async () => {
    setError("");
    setSuccess("");

    if (!userId || userId <= 0) {
      setError("User ID not found. Save userId in localStorage after login.");
      return;
    }
    if (selectedStalls.length === 0) {
      setError("Select at least one stall.");
      return;
    }

    try {
      const stallIds = selectedStalls.map((s) => s.stallId);
      const res = await ReservationApi.create({
        userId,
        stallIds,
        // If genres are needed, add them here
      });

      setReservation(res);
      // 🟢 Start 30‑minute timer
      startTimer(30);
      setStep("PAY");
      setSuccess("Reservation created. Email will be sent by backend.");
      await fetchStalls();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Reservation failed");
    }
  };

  const createPayment = async () => {
    setError("");
    setSuccess("");

    if (!reservation?.reservationId) {
      setError("Reservation not created.");
      return;
    }

    try {
      const pay = await PaymentApi.create({
        reservationId: reservation.reservationId,
        amount,
        paymentMethod,
        paymentDetails: JSON.stringify({
          note: "UI payment",
          method: paymentMethod,
        }),
      });
      setPayment(pay);

      // Optional instant success (if admin/manual reference provided)
      if (referenceNumber.trim()) {
        const successPay = await PaymentApi.markSuccess({
          paymentId: pay.paymentId,
          referenceNumber,
        });
        setPayment(successPay);
        setSuccess("Payment SUCCESS. Email sent by backend.");
      } else {
        setSuccess("Payment PENDING created. Pending email sent by backend.");
      }

      setStep("QR");
      // Timer continues; will be stopped when QR is generated
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Payment failed");
    }
  };

  const generateQr = async () => {
    setError("");
    setSuccess("");

    try {
      const qr = await QrPassApi.generate(reservation.reservationId);
      setQrPass(qr);
      // 🟢 Stop timer – booking completed
      stopTimer();
      setSuccess("QR Pass generated successfully.");
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "QR generation failed");
    }
  };

  // Basic download of QR canvas only
  const downloadQr = () => {
    const canvas = document.querySelector("#qrCanvas canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${reservation?.reservationId || "pass"}.png`;
    a.click();
  };

  return (
    <div className={BG.pageOverlay}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_45%)]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* HEADER */}
          <motion.div
            variants={SlideDown(0.1)}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
          >
            <h1 className="text-2xl md:text-3xl font-bold">
              Stall Booking (Real-time)
            </h1>
            <p className="text-white/75">
              Select up to 3 stalls → reserve → pay → generate QR
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-100 border border-emerald-300/20">
                AVAILABLE
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-100 border border-amber-300/20">
                RESERVED
              </span>

              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-white/75">User ID</label>
                <input
                  value={userId || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setUserId(Number(v));
                    localStorage.setItem("userId", String(v));
                  }}
                  className="w-28 px-3 py-2 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-white/40"
                  placeholder="userId"
                />
                <button
                  onClick={fetchStalls}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* 🟢 Timer display */}
            {timeLeft !== null && timeLeft > 0 && (
              <div className="mt-2 p-2 rounded bg-yellow-500/20 text-yellow-100 text-sm">
                ⏳ Time left to complete: {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")} minutes
              </div>
            )}
          </motion.div>

          {/* BODY */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: MAP AREA */}
            <motion.div
              variants={SlideLeft(0.2)}
              initial="hidden"
              animate="visible"
              className={`relative lg:col-span-2 rounded-2xl ${BG.cardStrong} shadow-xl overflow-hidden`}
            >
              {/* REAL MAP (Grid) */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Live Stall Map</h2>
                  <span className="text-xs text-white/70">Auto refresh: 2s</span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Hall A */}
                  <div className={`rounded-xl ${BG.card} p-3`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Hall A</div>
                      <div className="text-xs text-white/70">
                        {hallA.length} stalls
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {hallA.map((s) => {
                        const isSelected = selectedStalls.some(
                          (sel) => sel.stallId === s.stallId
                        );
                        return (
                          <button
                            key={s.stallId}
                            onClick={() => toggleStall(s)}
                            disabled={s.status !== "AVAILABLE"}
                            className={[
                              "p-2 rounded-lg border text-xs font-semibold transition",
                              ring(s.status),
                              s.status === "AVAILABLE"
                                ? "bg-emerald-500/15 hover:bg-emerald-500/20 border-emerald-300/20"
                                : "bg-amber-500/15 hover:bg-amber-500/20 border-amber-300/20 opacity-60 cursor-not-allowed",
                              isSelected
                                ? "outline outline-2 outline-white outline-offset-2"
                                : "",
                            ].join(" ")}
                          >
                            {s.stallCode}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hall B */}
                  <div className={`rounded-xl ${BG.card} p-3`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Hall B</div>
                      <div className="text-xs text-white/70">
                        {hallB.length} stalls
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {hallB.map((s) => {
                        const isSelected = selectedStalls.some(
                          (sel) => sel.stallId === s.stallId
                        );
                        return (
                          <button
                            key={s.stallId}
                            onClick={() => toggleStall(s)}
                            disabled={s.status !== "AVAILABLE"}
                            className={[
                              "p-2 rounded-lg border text-xs font-semibold transition",
                              ring(s.status),
                              s.status === "AVAILABLE"
                                ? "bg-emerald-500/15 hover:bg-emerald-500/20 border-emerald-300/20"
                                : "bg-amber-500/15 hover:bg-amber-500/20 border-amber-300/20 opacity-60 cursor-not-allowed",
                              isSelected
                                ? "outline outline-2 outline-white outline-offset-2"
                                : "",
                            ].join(" ")}
                          >
                            {s.stallCode}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading overlay */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center"
                  >
                    <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                      Loading...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* RIGHT: PANEL */}
            <motion.div
              variants={SlideRight(0.2)}
              initial="hidden"
              animate="visible"
              className={`rounded-2xl ${BG.cardStrong} shadow-xl p-5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Booking Panel</h2>
                  <p className="text-sm text-white/75">Step: {step}</p>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/15 border border-red-300/20 text-red-100 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-300/20 text-emerald-100 text-sm">
                  {success}
                </div>
              )}

              <div className="mt-4">
                {selectedStalls.length === 0 ? (
                  <div className="text-white/75">
                    Select up to 3 stalls from the map.
                  </div>
                ) : (
                  <>
                    {/* 🟢 List of selected stalls */}
                    <div className="space-y-2 mb-4">
                      {selectedStalls.map((stall) => (
                        <div
                          key={stall.stallId}
                          className={`p-3 rounded-xl ${BG.card} flex items-center justify-between`}
                        >
                          <div>
                            <span className="font-bold">{stall.stallCode}</span>
                            <span className="ml-2 text-xs text-white/70">
                              {stall.size}
                            </span>
                          </div>
                          <span className="text-sm">
                            Rs {stall.price || (stall.stallCode.startsWith("A") ? 2500 : stall.stallCode.startsWith("B") ? 5000 : 7500)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total Price */}
                    <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-right">
                      <span className="text-lg font-bold">Total: Rs {totalPrice}</span>
                    </div>

                    {/* SELECT step */}
                    {step === "SELECT" && (
                      <motion.div
                        variants={SlideUp(0.1)}
                        initial="hidden"
                        animate="visible"
                        className="mt-4 space-y-3"
                      >
                        <button
                          disabled={selectedStalls.length === 0}
                          onClick={() => setStep("RESERVE")}
                          className={[
                            "w-full py-3 rounded-xl font-semibold border transition",
                            selectedStalls.length > 0
                              ? "bg-emerald-500/90 hover:bg-emerald-500 border-emerald-300/30"
                              : "bg-white/5 text-white/30 border-white/10 cursor-not-allowed",
                          ].join(" ")}
                        >
                          Proceed to Reservation
                        </button>
                      </motion.div>
                    )}

                    {/* RESERVE step */}
                    {step === "RESERVE" && (
                      <motion.div
                        variants={SlideUp(0.1)}
                        initial="hidden"
                        animate="visible"
                        className="mt-4 space-y-3"
                      >
                        <button
                          onClick={reserveStall}
                          className="w-full py-3 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 border border-emerald-300/30 font-semibold"
                        >
                          Confirm Reservation
                        </button>
                        <button
                          onClick={() => setStep("SELECT")}
                          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15"
                        >
                          Back
                        </button>
                      </motion.div>
                    )}

                    {/* PAYMENT step */}
                    {step === "PAY" && (
                      <motion.div
                        variants={SlideUp(0.1)}
                        initial="hidden"
                        animate="visible"
                        className="mt-4 space-y-3"
                      >
                        <div className={`p-3 rounded-xl ${BG.card} text-sm`}>
                          <div className="font-semibold">Reservation Created</div>
                          <div className="text-white/75">
                            Reservation ID: {reservation?.reservationId}
                          </div>
                          <div className="text-white/75">
                            QR ID: {reservation?.qrId}
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm text-white/75">Amount</label>
                          <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-white/40"
                          />
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm text-white/75">
                            Payment Method
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-white/40"
                          >
                            <option value="CARD">CARD</option>
                            <option value="WALLET">WALLET</option>
                            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                            <option value="CASH">CASH</option>
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm text-white/75">
                            Reference Number (optional)
                          </label>
                          <input
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 outline-none focus:border-white/40"
                            placeholder="REF-12345"
                          />
                        </div>

                        <button
                          onClick={createPayment}
                          className="w-full py-3 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 border border-indigo-300/30 font-semibold"
                        >
                          Create Payment
                        </button>
                      </motion.div>
                    )}

                    {/* QR step */}
                    {step === "QR" && (
                      <motion.div
                        variants={SlideUp(0.1)}
                        initial="hidden"
                        animate="visible"
                        className="mt-4 space-y-3"
                      >
                        <div className={`p-3 rounded-xl ${BG.card} text-sm`}>
                          <div className="font-semibold">Payment</div>
                          <div className="text-white/75">
                            Payment ID: {payment?.paymentId}
                          </div>
                          <div className="text-white/75">
                            Status: {payment?.paymentStatus}
                          </div>
                        </div>

                        <button
                          onClick={generateQr}
                          className="w-full py-3 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 border border-emerald-300/30 font-semibold"
                        >
                          Generate QR Pass
                        </button>

                        {qrPass?.qrCode && (
                          <div
                            className={`p-4 rounded-xl ${BG.card} flex flex-col items-center gap-3`}
                          >
                            <div id="qrCanvas">
                              <QRCodeCanvas value={qrPass.qrCode} size={180} />
                            </div>
                            <div className="text-xs text-white/75 text-center break-all">
                              {qrPass.qrCode}
                            </div>

                            <button
                              onClick={downloadQr}
                              className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20"
                            >
                              Download QR (PNG)
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}