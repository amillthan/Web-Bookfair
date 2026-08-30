import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

// ✅ unwrap helper (supports both {data:{...}} and direct body)
const unwrap = (res) => {
  const body = res?.data;
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
};

const steps = [
  { key: "selectStall", label: "Select Stalls" },
  { key: "selectGenres", label: "Select Genres" },
  { key: "payment", label: "Payment" },
  { key: "qr", label: "QR Generated" },
];

const Stepper = ({ activeIndex = 0 }) => (
  <div className="mb-6">
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((s, idx) => {
        const done = idx < activeIndex;
        const active = idx === activeIndex;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div
              className={[
                "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold",
                done ? "bg-emerald-600 text-white" : "",
                active ? "bg-blue-600 text-white" : "",
                !done && !active ? "bg-gray-200 text-gray-700" : "",
              ].join(" ")}
            >
              {done ? "✓" : idx + 1}
            </div>
            <div className="text-sm font-medium text-gray-800">{s.label}</div>
            {idx !== steps.length - 1 && (
              <div className="w-10 h-[2px] bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const StallMap = () => {
  // -----------------------------
  // STALL NUMBERS – optimized for octagon shapes
  // -----------------------------
  // Left Hall (Hall A) – 52 stalls: 20 small, 12 medium, 20 large
  const leftSmall = [
    ...Array.from({ length: 20 }, (_, i) => `A${i + 1}`), // A1–A20
  ]; // total 20
  const leftMedium = [
    ...Array.from({ length: 12 }, (_, i) => `B${i + 1}`),   // B1–B12
  ]; // total 12
  const leftLarge = [
    ...Array.from({ length: 20 }, (_, i) => `C${i + 1}`), // C1–C20
  ]; // total 20
  const leftStallDoors = [...leftSmall, ...leftMedium, ...leftLarge]; // 20+12+20 = 52

  // Right Hall (Hall B) – 32 stalls: 10 small, 9 medium, 13 large
  const rightSmall = [
    ...Array.from({ length: 10 }, (_, i) => `A${i + 21}`), // A21–A31
  ]; // total 10
  const rightMedium = [
    ...Array.from({ length: 9 }, (_, i) => `B${i + 13}`),  // B13–B21
  ]; // total 9
  const rightLarge = [
    ...Array.from({ length: 13 }, (_, i) => `C${i + 21}`), // C21–C33
  ]; // total 13
  const rightStallDoors = [...rightSmall, ...rightMedium, ...rightLarge]; // 10+9+13 = 32

  // Hall C and Hall D – unchanged (30 stalls each)
  const hallCSmall = Array.from({ length: 10 }, (_, i) => `A${i + 31}`); // A31–A40
  const hallCMedium = Array.from({ length: 10 }, (_, i) => `B${i + 22}`); // B22–B31
  const hallCLarge = Array.from({ length: 10 }, (_, i) => `C${i + 34}`); // C34–C43

  const hallDSmall = Array.from({ length: 10 }, (_, i) => `A${i + 41}`); // A41–A50
  const hallDMedium = Array.from({ length: 10 }, (_, i) => `B${i + 32}`); // B32–B41
  const hallDLarge = Array.from({ length: 10 }, (_, i) => `C${i + 44}`); // C44–C53

  // -----------------------------
  // API STATE
  // -----------------------------
  const [stallsFromDb, setStallsFromDb] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // results
  const [reservationId, setReservationId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [checkoutRes, setCheckoutRes] = useState(null); // {qr: {...}}

  // -----------------------------
  // UI STATE
  // -----------------------------
  const [selectedStalls, setSelectedStalls] = useState([]);
  const [stallGenres, setStallGenres] = useState({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CARD");
  const [activeStep, setActiveStep] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Payment modal fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  // QR download ref
  const qrCanvasRef = useRef(null);

  // Timer for 30‑minute hold
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const timerRef = useRef(null);

  // Hover states for gates
  const [mainGateHovered, setMainGateHovered] = useState(false);
  const [leftGateHovered, setLeftGateHovered] = useState(false);
  const [rightGateHovered, setRightGateHovered] = useState(false);
  const [hallCGateHovered, setHallCGateHovered] = useState(false);
  const [hallDGateHovered, setHallDGateHovered] = useState(false);

  // Spray hover state (unused, kept for compatibility)
  const [sprayHovered, setSprayHovered] = useState(false);

  const genres = [
    "Fiction",
    "Non-fiction",
    "Mystery",
    "Science Fiction",
    "Fantasy",
    "Biography",
    "History",
    "Thriller",
    "Horror",
    "Self-help",
    "Poetry",
  ];

  // -----------------------------
  // API CLIENT (JWT)
  // -----------------------------
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return instance;
  }, []);

  // -----------------------------
  // FETCH STALLS
  // -----------------------------
  const fetchStalls = async () => {
    setApiError("");
    try {
      const res = await api.get("/api/stalls");
      const data = unwrap(res);
      setStallsFromDb(Array.isArray(data) ? data : []);
    } catch (e) {
      setApiError(e?.response?.data?.message || e.message || "Failed to load stalls");
    }
  };

  useEffect(() => {
    fetchStalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map stallCode => db record
  const stallByCode = useMemo(() => {
    const m = new Map();
    for (const s of stallsFromDb) {
      if (s?.stallCode) m.set(s.stallCode, s);
    }
    return m;
  }, [stallsFromDb]);

  // Reserved stalls set (from DB)
  const reservedStalls = useMemo(() => {
    const set = new Set();
    for (const s of stallsFromDb) {
      if (s?.stallCode && String(s?.status).toUpperCase() === "RESERVED") {
        set.add(s.stallCode);
      }
    }
    return set;
  }, [stallsFromDb]);

  // -----------------------------
  // STALL SIZES
  // -----------------------------
  const SIZE = { small: 30, medium: 40, large: 50 };

  // -----------------------------
  // OCTAGON helper
  // -----------------------------
  const octagonPoints = (cx, cy, radius) => {
    const angles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
    return angles
      .map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        return `${x},${y}`;
      })
      .join(" ");
  };

  // -----------------------------
  // GRID LAYOUT – optimized row counts
  // -----------------------------
  const cellPitch = 56;

  // LEFT HALL (Hall A) – 8 rows, total 52 stalls
  const leftCentre = { x: 400, y: 320 };
  const leftRadius = 250;
  const leftRowCols = [4, 6, 8, 8, 8, 8, 6, 4]; // sum = 52
  const leftRows = leftRowCols.length;
  const leftGridHeight = leftRows * cellPitch;
  const leftStartY = leftCentre.y - leftGridHeight / 2; // 320 - 224 = 96

  let leftStallIndex = 0;
  const leftStalls = [];
  for (let row = 0; row < leftRows; row++) {
    const colsInRow = leftRowCols[row];
    const rowY = leftStartY + row * cellPitch + (cellPitch - 56) / 2; // center the cell vertically
    const rowWidth = colsInRow * cellPitch;
    const startX = leftCentre.x - rowWidth / 2;

    for (let col = 0; col < colsInRow; col++) {
      const door = leftStallDoors[leftStallIndex];
      if (!door) break;

      const cellX = startX + col * cellPitch;

      let size;
      if (door.startsWith("A")) size = SIZE.small;
      else if (door.startsWith("B")) size = SIZE.medium;
      else size = SIZE.large;

      const rectX = cellX + (cellPitch - size) / 2;
      const rectY = rowY + (cellPitch - size) / 2;

      leftStalls.push({ door, rectX, rectY, size });
      leftStallIndex++;
    }
  }

  // RIGHT HALL (Hall B) – 6 rows, total 32 stalls
  const rightCentre = { x: 950, y: 320 };
  const rightRadius = 200;
  const rightRowCols = [4, 6, 6, 6, 6, 4]; // sum = 32
  const rightRows = rightRowCols.length;
  const rightGridHeight = rightRows * cellPitch;
  const rightStartY = rightCentre.y - rightGridHeight / 2; // 320 - 168 = 152

  let rightStallIndex = 0;
  const rightStalls = [];
  for (let row = 0; row < rightRows; row++) {
    const colsInRow = rightRowCols[row];
    const rowY = rightStartY + row * cellPitch + (cellPitch - 56) / 2;
    const rowWidth = colsInRow * cellPitch;
    const startX = rightCentre.x - rowWidth / 2;

    for (let col = 0; col < colsInRow; col++) {
      const door = rightStallDoors[rightStallIndex];
      if (!door) break;

      const cellX = startX + col * cellPitch;

      let size;
      if (door.startsWith("A")) size = SIZE.small;
      else if (door.startsWith("B")) size = SIZE.medium;
      else size = SIZE.large;

      const rectX = cellX + (cellPitch - size) / 2;
      const rectY = rowY + (cellPitch - size) / 2;

      rightStalls.push({ door, rectX, rectY, size });
      rightStallIndex++;
    }
  }

  // Hall C and Hall D – unchanged (vertical rectangles, 3 columns, 10 rows)
  const hallCStartX = 315;
  const hallCTopY = 620;
  const hallCRows = 10;
  const hallCStalls = [];
  for (let row = 0; row < hallCRows; row++) {
    const door = hallCSmall[row];
    const x = hallCStartX;
    const y = hallCTopY + row * cellPitch;
    hallCStalls.push({
      door,
      rectX: x + (cellPitch - SIZE.small) / 2,
      rectY: y + (cellPitch - SIZE.small) / 2,
      size: SIZE.small,
    });
  }
  for (let row = 0; row < hallCRows; row++) {
    const door = hallCMedium[row];
    const x = hallCStartX + cellPitch;
    const y = hallCTopY + row * cellPitch;
    hallCStalls.push({
      door,
      rectX: x + (cellPitch - SIZE.medium) / 2,
      rectY: y + (cellPitch - SIZE.medium) / 2,
      size: SIZE.medium,
    });
  }
  for (let row = 0; row < hallCRows; row++) {
    const door = hallCLarge[row];
    const x = hallCStartX + 2 * cellPitch;
    const y = hallCTopY + row * cellPitch;
    hallCStalls.push({
      door,
      rectX: x + (cellPitch - SIZE.large) / 2,
      rectY: y + (cellPitch - SIZE.large) / 2,
      size: SIZE.large,
    });
  }

  const hallDStartX = 868;
  const hallDTopY = 620;
  const hallDStalls = [];
  for (let row = 0; row < hallCRows; row++) {
    const door = hallDSmall[row];
    const x = hallDStartX;
    const y = hallDTopY + row * cellPitch;
    hallDStalls.push({
      door,
      rectX: x + (cellPitch - SIZE.small) / 2,
      rectY: y + (cellPitch - SIZE.small) / 2,
      size: SIZE.small,
    });
  }
  for (let row = 0; row < hallCRows; row++) {
    const door = hallDMedium[row];
    const x = hallDStartX + cellPitch;
    const y = hallDTopY + row * cellPitch;
    hallDStalls.push({
      door,
      rectX: x + (cellPitch - SIZE.medium) / 2,
      rectY: y + (cellPitch - SIZE.medium) / 2,
      size: SIZE.medium,
    });
  }
  for (let row = 0; row < hallCRows; row++) {
    const door = hallDLarge[row];
    const x = hallDStartX + 2 * cellPitch;
    const y = hallDTopY + row * cellPitch;
    hallDStalls.push({
      door,
      rectX: x + (cellPitch - SIZE.large) / 2,
      rectY: y + (cellPitch - SIZE.large) / 2,
      size: SIZE.large,
    });
  }

  // -----------------------------
  // Timer management (unchanged)
  // -----------------------------
  const startTimer = (minutes = 30) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const expiry = Date.now() + minutes * 60 * 1000;
    setTimeLeft(minutes * 60);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setApiError("Reservation time expired. Please select stalls again.");
          setReservationId(null);
          setSelectedStalls([]);
          setStallGenres({});
          setActiveStep(0);
          setTimeLeft(null);
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
    return () => stopTimer();
  }, []);

  // -----------------------------
  // UI handlers (unchanged)
  // -----------------------------
  const resetPaymentFields = () => {
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setPaypalEmail("");
  };

  const handleStallClick = async (door) => {
    if (reservedStalls.has(door) || loading) return;

    setSelectedStalls((prev) => {
      let newSelection;
      if (prev.includes(door)) {
        newSelection = prev.filter((d) => d !== door);
        setStallGenres((prevGenres) => {
          const updated = { ...prevGenres };
          delete updated[door];
          return updated;
        });
      } else {
        if (prev.length >= 3) {
          alert("You can select a maximum of 3 stalls.");
          return prev;
        }
        newSelection = [...prev, door];
        setStallGenres((prevGenres) => ({
          ...prevGenres,
          [door]: [],
        }));
      }
      return newSelection;
    });

    if (activeStep === 0) {
      setActiveStep(1);
      setReservationId(null);
      setPaymentId(null);
      setCheckoutRes(null);
      stopTimer();
      resetPaymentFields();
    } else if (activeStep > 0 && activeStep !== 4) {
      setActiveStep(1);
      setReservationId(null);
      setPaymentId(null);
      setCheckoutRes(null);
      stopTimer();
      resetPaymentFields();
    }
  };

  const handleGenreToggle = (stallCode, genre) => {
    setStallGenres((prev) => {
      const current = prev[stallCode] || [];
      const updated = current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre];
      return {
        ...prev,
        [stallCode]: updated,
      };
    });
  };

  // -----------------------------
  // Stall details for selected stalls
  // -----------------------------
  const selectedStallsDetails = useMemo(() => {
    return selectedStalls
      .map((code) => {
        let type = "small";
        if (code.startsWith("B")) type = "medium";
        else if (code.startsWith("C")) type = "large";

        const priceMap = { small: 2500, medium: 5000, large: 7500 };
        const price = priceMap[type];

        const db = stallByCode.get(code);
        const status = db?.status
          ? String(db.status).toUpperCase()
          : reservedStalls.has(code)
            ? "RESERVED"
            : "AVAILABLE";

        return {
          code,
          type,
          price,
          status,
          stallId: db?.stallId ?? null,
        };
      })
      .filter((d) => d.status === "AVAILABLE");
  }, [selectedStalls, stallByCode, reservedStalls]);

  const totalPrice = useMemo(() => {
    return selectedStallsDetails.reduce((sum, s) => sum + s.price, 0);
  }, [selectedStallsDetails]);

  // -----------------------------
  // STEP: Reserve (unchanged)
  // -----------------------------
  const reserveStall = async () => {
    if (loading) return;
    if (selectedStallsDetails.length === 0)
      return alert("No available stalls selected.");

    const userId = Number(localStorage.getItem("userId"));
    if (!userId) return alert("Login required. userId missing in localStorage.");

    const missingGenres = selectedStallsDetails.filter(
      (s) => !stallGenres[s.code] || stallGenres[s.code].length === 0
    );
    if (missingGenres.length > 0) {
      return alert(
        `Please select at least one genre for stall(s): ${missingGenres
          .map((s) => s.code)
          .join(", ")}`
      );
    }

    setLoading(true);
    setApiError("");

    try {
      const stallIds = selectedStallsDetails.map((s) => s.stallId);
      const stallGenresList = selectedStallsDetails.map((s) => ({
        stallId: s.stallId,
        genres: stallGenres[s.code] || [],
      }));
      const allGenres = [...new Set(stallGenresList.flatMap((sg) => sg.genres))];

      const res = await api.post("/api/checkout/reserve", {
        userId: Number(userId),
        stallIds,
        genres: allGenres,
        stallGenres: stallGenresList,
      });

      const data = unwrap(res) ?? res.data;
      const rid = data?.reservationId ?? res.data?.reservationId;

      if (!rid) throw new Error("reservationId not returned from backend");
      setReservationId(rid);
      startTimer(30);
      setActiveStep(2);
    } catch (e) {
      setApiError(
        e?.response?.data?.message ||
        JSON.stringify(e?.response?.data) ||
        e.message ||
        "Reserve failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // STEP: Pay (unchanged)
  // -----------------------------
  const processPayment = async () => {
    if (loading) return;
    if (!reservationId) return alert("Reservation not found.");

    const detailsObj =
      selectedPaymentMethod === "CARD"
        ? { cardNumber, expiry, cvv }
        : selectedPaymentMethod === "PAYPAL"
          ? { paypalEmail }
          : { note: "Cash payment at stall" };

    if (selectedPaymentMethod === "CARD") {
      if (!cardNumber || cardNumber.length < 8) return alert("Enter valid card number");
      if (!expiry) return alert("Enter expiry date");
      if (!cvv || cvv.length < 3) return alert("Enter valid CVV");
    }
    if (selectedPaymentMethod === "PAYPAL") {
      if (!paypalEmail) return alert("Enter PayPal email");
    }

    const method = selectedPaymentMethod === "PAYPAL" ? "WALLET" : selectedPaymentMethod;

    setLoading(true);
    setApiError("");

    try {
      const res = await api.post("/api/checkout/pay", {
        reservationId: Number(reservationId),
        amount: Number(totalPrice),
        paymentMethod: method,
        paymentDetails: JSON.stringify(detailsObj),
      });

      const data = unwrap(res) ?? res.data;
      const pid = data?.paymentId ?? res.data?.paymentId;

      setPaymentId(pid ?? null);
      setShowPaymentModal(false);
      setActiveStep(3);
    } catch (e) {
      setApiError(
        e?.response?.data?.message ||
        JSON.stringify(e?.response?.data) ||
        e.message ||
        "Payment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // STEP: Generate QR (unchanged)
  // -----------------------------
  const generateQr = async () => {
    if (loading) return;
    if (!reservationId) return alert("Reservation not found.");

    setLoading(true);
    setApiError("");

    try {
      const res = await api.post("/api/checkout/generate-qr", { reservationId: Number(reservationId) });
      const data = unwrap(res) ?? res.data;
      setCheckoutRes({ qr: data });

      await fetchStalls();
      stopTimer();
      setActiveStep(4);
    } catch (e) {
      setApiError(
        e?.response?.data?.message ||
        JSON.stringify(e?.response?.data) ||
        e.message ||
        "QR generation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Download QR (unchanged)
  // -----------------------------
  const downloadQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qr-${checkoutRes?.qr?.qrId || "pass"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const clearAll = () => {
    setSelectedStalls([]);
    setStallGenres({});
    setReservationId(null);
    setPaymentId(null);
    setCheckoutRes(null);
    setApiError("");
    setActiveStep(0);
    setShowPaymentModal(false);
    stopTimer();
    resetPaymentFields();
  };

  // Combined hover state for main gate (now includes Hall C & D)
  const isMainGateGreen = mainGateHovered || leftGateHovered || rightGateHovered || hallCGateHovered || hallDGateHovered;

  // Helper to render a single stall (reduces duplication)
  const renderStall = (door, rectX, rectY, size) => {
    const isReserved = reservedStalls.has(door);
    const isSelected = selectedStalls.includes(door) && !isReserved;
    let fillColor = "rgba(187, 247, 208, 0.7)";
    if (isReserved) fillColor = "rgba(254, 202, 202, 0.8)";
    else if (isSelected) fillColor = "rgba(255, 165, 0, 0.5)";
    let strokeClass = isReserved ? "stroke-gray-600" : "stroke-blue-500";
    let hoverClass = !isReserved && !loading ? "hover:fill-blue-200" : "";
    return (
      <g
        key={door}
        onClick={() => handleStallClick(door)}
        className={!isReserved && !loading ? "cursor-pointer" : ""}
      >
        <rect
          x={rectX}
          y={rectY}
          width={size}
          height={size}
          fill={fillColor}
          className={`${strokeClass} stroke-1 transition-colors ${hoverClass}`}
          rx="4"
        />
        <text
          x={rectX + size / 2}
          y={rectY + size / 2 + 4}
          textAnchor="middle"
          className="text-[11px] fill-white font-medium pointer-events-none"
        >
          {door}
        </text>
      </g>
    );
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-8 bg-slate-900/50 rounded-xl shadow-lg w-full max-w-6xl mx-auto border border-slate-800/50">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            DB stalls loaded: <span className="font-semibold text-slate-200">{stallsFromDb.length}</span>
          </p>
          <button
            onClick={fetchStalls}
            className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            type="button"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {apiError && (
          <div className="mb-4 p-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {apiError}
          </div>
        )}

        <Stepper activeIndex={activeStep} />

        {timeLeft !== null && timeLeft > 0 && (
          <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 text-sm font-medium">
            ⏳ Time left to complete payment: {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")} minutes
          </div>
        )}

        <svg
          width="1400"
          height="1250"
          viewBox="0 0 1400 1250"
          className="font-sans border border-slate-700/50 rounded-lg bg-slate-800/30 w-full overflow-auto"
        >
          {/* 🛣️ ROADS – gray base */}
          <path d="M 700,1190 L 700,900 L 505,900" stroke="#ccc5c5" strokeWidth="40" fill="none" />
          <path d="M 700,1190 L 700,900 L 846,900" stroke="#ccc5c5" strokeWidth="40" fill="none" />
          <path d="M 700,1190 L 700,320 L 652,320" stroke="#ccc5c5" strokeWidth="40" fill="none" />
          <path d="M 700,1190 L 700,320 L 748,320" stroke="#ccc5c5" strokeWidth="40" fill="none" />

          {/* 🛣️ White dashed center lines on straight roads */}
          <path d="M 700,1190 L 700,900 L 505,900" stroke="white" strokeWidth="2" fill="none" strokeDasharray="10,10" />
          <path d="M 700,1190 L 700,900 L 846,900" stroke="white" strokeWidth="2" fill="none" strokeDasharray="10,10" />
          <path d="M 700,1190 L 700,320 L 652,320" stroke="white" strokeWidth="2" fill="none" strokeDasharray="10,10" />
          <path d="M 700,1190 L 700,320 L 748,320" stroke="white" strokeWidth="2" fill="none" strokeDasharray="10,10" />

          {/* 💧 Water pond */}
          <circle cx="700" cy="620" r="60" fill="lightblue" stroke="blue" strokeWidth="1" />

          {/* Detailed top‑view lotus flower */}
          <g transform="translate(700, 620)">
            <defs>
              {/* gradients for petals */}
              <linearGradient id="petalOuter" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f9c1d9" />
                <stop offset="100%" stopColor="#f48fb1" />
              </linearGradient>
              <linearGradient id="petalMiddle" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd9e6" />
                <stop offset="100%" stopColor="#faa0b5" />
              </linearGradient>
              <linearGradient id="petalInner" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffe4f0" />
                <stop offset="100%" stopColor="#ffb6c1" />
              </linearGradient>
              <radialGradient id="centerCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffdb7c" />
                <stop offset="70%" stopColor="#f1c40f" />
                <stop offset="100%" stopColor="#d4a017" />
              </radialGradient>
            </defs>

            {/* === OUTER RING (16 petals) === */}
            {/* each petal is a path with a curved tip and subtle veins */}
            <g opacity="0.9">
              {/* generate 16 petals rotated 22.5° apart */}
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(0)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(22.5)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(45)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(67.5)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(90)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(112.5)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(135)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(157.5)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(180)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(202.5)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(225)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(247.5)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(270)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(292.5)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(315)" />
              <path d="M 0,-18 Q 4,-24 8,-18 Q 10,-12 4,-10 Q 0,-9 -4,-10 Q -10,-12 -8,-18 Q -4,-24 0,-18" fill="url(#petalOuter)" stroke="#d4a5b5" strokeWidth="0.8" transform="rotate(337.5)" />
            </g>

            {/* === MIDDLE RING (12 petals, rotated 15°) === */}
            <g opacity="0.95">
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(0)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(30)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(60)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(90)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(120)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(150)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(180)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(210)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(240)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(270)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(300)" />
              <path d="M 0,-13 Q 3,-18 6,-13 Q 8,-8 3,-6 Q 0,-5 -3,-6 Q -8,-8 -6,-13 Q -3,-18 0,-13" fill="url(#petalMiddle)" stroke="#d4a5b5" strokeWidth="0.6" transform="rotate(330)" />
            </g>

            {/* === INNER RING (8 petals, rotated 22.5°) === */}
            <g>
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(0)" />
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(45)" />
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(90)" />
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(135)" />
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(180)" />
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(225)" />
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(270)" />
              <path d="M 0,-8 Q 2,-12 4,-8 Q 5,-4 2,-3 Q 0,-2 -2,-3 Q -5,-4 -4,-8 Q -2,-12 0,-8" fill="url(#petalInner)" stroke="#d4a5b5" strokeWidth="0.5" transform="rotate(315)" />
            </g>

            {/* === CENTER (detailed stamen) === */}
            {/* main core */}
            <circle cx="0" cy="0" r="4" fill="url(#centerCore)" stroke="#b8860b" strokeWidth="0.8" />
            {/* inner ring of pollen dots */}
            <circle cx="-1.5" cy="-1.5" r="0.7" fill="#ffdb7c" stroke="#d4a017" strokeWidth="0.3" />
            <circle cx="1.5" cy="-1.5" r="0.7" fill="#ffdb7c" stroke="#d4a017" strokeWidth="0.3" />
            <circle cx="1.5" cy="1.5" r="0.7" fill="#ffdb7c" stroke="#d4a017" strokeWidth="0.3" />
            <circle cx="-1.5" cy="1.5" r="0.7" fill="#ffdb7c" stroke="#d4a017" strokeWidth="0.3" />
            {/* central cluster */}
            <circle cx="0" cy="0" r="1.2" fill="#ffeb99" stroke="#b8860b" strokeWidth="0.5" />
            <circle cx="-0.5" cy="-0.5" r="0.4" fill="#ffcc33" />
            <circle cx="0.5" cy="-0.5" r="0.4" fill="#ffcc33" />
            <circle cx="0" cy="0.7" r="0.4" fill="#ffcc33" />
            {/* tiny filaments (thin lines) */}
            <line x1="-2" y1="-2" x2="-3" y2="-3" stroke="#d4a017" strokeWidth="0.5" opacity="0.6" />
            <line x1="2" y1="-2" x2="3" y2="-3" stroke="#d4a017" strokeWidth="0.5" opacity="0.6" />
            <line x1="2" y1="2" x2="3" y2="3" stroke="#d4a017" strokeWidth="0.5" opacity="0.6" />
            <line x1="-2" y1="2" x2="-3" y2="3" stroke="#d4a017" strokeWidth="0.5" opacity="0.6" />
          </g>

          {/* 🛣️ Ring road around pond – gray base */}
          <circle cx="700" cy="620" r="90" stroke="#ccc5c5" strokeWidth="40" fill="none" />

          {/* 🛣️ White dashed center line on ring road */}
          <circle cx="700" cy="620" r="90" stroke="white" strokeWidth="2" fill="none" strokeDasharray="10,10" />

          {/* Stall Map text */}
          <text x="600" y="" className="text-3xl font-bold fill-slate-200">
            Stall Map
          </text>

          {/* Main rectangle covering all four halls */}
          <rect
            x="130"
            y="40"
            width="1040"
            height="1160"
            fill="transparent"
            className="stroke-blue-500 stroke-2"
            rx="12"
            onMouseEnter={() => setMainGateHovered(true)}
            onMouseLeave={() => setMainGateHovered(false)}
          />

          {/* ========== LEFT HALL (Hall A) ========== */}
          <g
            onMouseEnter={() => setLeftGateHovered(true)}
            onMouseLeave={() => setLeftGateHovered(false)}
          >
            <polygon
              points={octagonPoints(leftCentre.x, leftCentre.y, leftRadius - 6)}
              fill="transparent"
              className="stroke-blue-500 stroke-2"
            />
            <polygon
              points={octagonPoints(leftCentre.x, leftCentre.y, leftRadius + 6)}
              fill="transparent"
              className="stroke-blue-500 stroke-2"
            />
            <rect
              x={leftCentre.x + leftRadius - 10}
              y={leftCentre.y - 25}
              width="12"
              height="50"
              fill={leftGateHovered ? "#4ade80" : "#ef4444"}
              className="stroke-amber-900 stroke-1"
              rx="4"
            />
            <text
              x={leftCentre.x + leftRadius + 15}
              y={leftCentre.y}
              textAnchor="start"
              className="text-xs fill-slate-300 font-medium"
            >
              GATE
            </text>
            <text
              x={leftCentre.x}
              y={leftCentre.y - leftRadius - 3}
              textAnchor="middle"
              className="text-lg font-bold fill-slate-200"
            >
              Hall A
            </text>

            {leftStalls.map(({ door, rectX, rectY, size }) =>
              renderStall(door, rectX, rectY, size)
            )}
          </g>

          {/* ========== RIGHT HALL (Hall B) ========== */}
          <g
            onMouseEnter={() => setRightGateHovered(true)}
            onMouseLeave={() => setRightGateHovered(false)}
          >
            <polygon
              points={octagonPoints(rightCentre.x, rightCentre.y, rightRadius - 6)}
              fill="transparent"
              className="stroke-blue-500 stroke-2"
            />
            <polygon
              points={octagonPoints(rightCentre.x, rightCentre.y, rightRadius + 6)}
              fill="transparent"
              className="stroke-blue-500 stroke-2"
            />
            <rect
              x={rightCentre.x - rightRadius - 2}
              y={rightCentre.y - 25}
              width="12"
              height="50"
              fill={rightGateHovered ? "#4ade80" : "#ef4444"}
              className="stroke-amber-900 stroke-1"
              rx="4"
            />
            <text
              x={rightCentre.x - rightRadius - 20}
              y={rightCentre.y}
              textAnchor="end"
              className="text-xs fill-slate-300 font-medium"
            >
              GATE
            </text>
            <text
              x={rightCentre.x}
              y={rightCentre.y - rightRadius - 15}
              textAnchor="middle"
              className="text-lg font-bold fill-slate-200"
            >
              Hall B
            </text>

            {rightStalls.map(({ door, rectX, rectY, size }) =>
              renderStall(door, rectX, rectY, size)
            )}
          </g>

          {/* ========== HALL C (left rectangle) ========== */}
          <g
            onMouseEnter={() => setHallCGateHovered(true)}
            onMouseLeave={() => setHallCGateHovered(false)}
          >
            <rect
              x={hallCStartX - 10}
              y={hallCTopY - 10}
              width={3 * cellPitch + 20}
              height={hallCRows * cellPitch + 20}
              fill="transparent"
              className="stroke-blue-500 stroke-2"
              rx="8"
            />
            <text
              x={hallCStartX + (3 * cellPitch) / 2}
              y={hallCTopY - 20}
              textAnchor="middle"
              className="text-lg font-bold fill-slate-200"
            >
              Hall C
            </text>
            {/* Gate on right side of Hall C */}
            <rect
              x={hallCStartX - 10 + (3 * cellPitch + 20)} // right edge of border
              y={hallCTopY - 10 + (hallCRows * cellPitch + 20) / 2 - 25}
              width="12"
              height="50"
              fill={hallCGateHovered ? "#4ade80" : "#ef4444"}
              className="stroke-amber-900 stroke-1"
              rx="4"
            />
            <text
              x={hallCStartX - 10 + (3 * cellPitch + 20) + 15}
              y={hallCTopY - 10 + (hallCRows * cellPitch + 20) / 2}
              textAnchor="start"
              className="text-xs fill-slate-300 font-medium"
            >
              GATE
            </text>
            {hallCStalls.map(({ door, rectX, rectY, size }) =>
              renderStall(door, rectX, rectY, size)
            )}
          </g>

          {/* ========== HALL D (right rectangle) ========== */}
          <g
            onMouseEnter={() => setHallDGateHovered(true)}
            onMouseLeave={() => setHallDGateHovered(false)}
          >
            <rect
              x={hallDStartX - 10}
              y={hallDTopY - 10}
              width={3 * cellPitch + 20}
              height={hallCRows * cellPitch + 20}
              fill="transparent"
              className="stroke-blue-500 stroke-2"
              rx="8"
            />
            <text
              x={hallDStartX + (3 * cellPitch) / 2}
              y={hallDTopY - 20}
              textAnchor="middle"
              className="text-lg font-bold fill-slate-200"
            >
              Hall D
            </text>
            {/* Gate on left side of Hall D */}
            <rect
              x={hallDStartX - 10 - 12} // left of border
              y={hallDTopY - 10 + (hallCRows * cellPitch + 20) / 2 - 25}
              width="12"
              height="50"
              fill={hallDGateHovered ? "#4ade80" : "#ef4444"}
              className="stroke-amber-900 stroke-1"
              rx="4"
            />
            <text
              x={hallDStartX - 10 - 20}
              y={hallDTopY - 10 + (hallCRows * cellPitch + 20) / 2}
              textAnchor="end"
              className="text-xs fill-slate-300 font-medium"
            >
              GATE
            </text>
            {hallDStalls.map(({ door, rectX, rectY, size }) =>
              renderStall(door, rectX, rectY, size)
            )}
          </g>

          {/* Main gate at bottom */}
          <rect
            x={700 - 20}
            y={1190}
            width="40"
            height="10"
            fill={isMainGateGreen ? "#4ade80" : "#ef4444"}
            className="stroke-amber-900 stroke-1"
            rx="4"
          />
          <text
            x={700}
            y={1215}
            textAnchor="middle"
            className="text-xs fill-slate-300 font-medium"
          >
            MAIN GATE
          </text>
        </svg>

        {/* DETAILS SECTION – unchanged */}
        {selectedStalls.length > 0 && (
          <div className="mt-8 p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <h3 className="text-xl font-semibold text-slate-100 mb-3">
              Selected Stalls ({selectedStalls.length}/3)
            </h3>
            <div className="space-y-6 mb-6">
              {selectedStallsDetails.map((stall) => (
                <div
                  key={stall.code}
                  className="p-4 bg-slate-700/30 rounded border border-slate-700/50 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div><span className="font-medium text-slate-300">Stall Code:</span> <span className="text-slate-100">{stall.code}</span></div>
                    <div><span className="font-medium text-slate-300">Type:</span> <span className="capitalize text-slate-100">{stall.type}</span></div>
                    <div><span className="font-medium text-slate-300">Price:</span> <span className="text-slate-100">Rs {stall.price}</span></div>
                    <div><span className="font-medium text-slate-300">Status:</span> <span className={stall.status === "AVAILABLE" ? "text-green-400 font-semibold" : "text-slate-400 font-semibold"}>{stall.status}</span></div>
                  </div>
                  {activeStep === 1 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <p className="text-sm font-medium text-slate-300 mb-2">Select genres for {stall.code}:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {genres.map((genre) => (
                          <label key={genre} className="flex items-center space-x-2 text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              checked={(stallGenres[stall.code] || []).includes(genre)}
                              onChange={() => handleGenreToggle(stall.code, genre)}
                              className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{genre}</span>
                          </label>
                        ))}
                      </div>
                      {stallGenres[stall.code]?.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">Selected: {stallGenres[stall.code].join(", ")}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4 text-right text-lg font-semibold text-slate-100">Total: Rs {totalPrice}</div>
            {activeStep === 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={reserveStall} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"> {loading ? "Reserving..." : "Reserve Stalls"} </button>
              </div>
            )}
            {activeStep === 2 && (
              <>
                <h4 className="text-lg font-semibold text-slate-100 mb-2">Step 3: Payment</h4>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                  <select value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="w-full p-2 border border-slate-600 rounded-md bg-slate-700/50 text-slate-100 focus:ring-blue-500 focus:border-blue-500">
                    <option value="CARD">Card</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>
                  <p className="mt-2 text-xs text-slate-400">Note: PAYPAL is sent as WALLET to match backend PaymentMethod enum.</p>
                </div>
                <p className="text-sm text-slate-300 mb-4">Amount to pay: Rs {totalPrice}</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowPaymentModal(true)} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"> {loading ? "Processing..." : "Proceed to Payment"} </button>
                </div>
              </>
            )}
            {activeStep === 3 && (
              <>
                <h4 className="text-lg font-semibold text-slate-100 mb-2">Step 4: Generate QR Code</h4>
                <p className="text-sm text-slate-400 mb-4">Payment successful! Now generate your QR code.</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={generateQr} disabled={loading} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"> {loading ? "Generating..." : "Generate QR Code"} </button>
                </div>
              </>
            )}
            {activeStep === 4 && checkoutRes?.qr?.qrCode && (
              <>
                <h4 className="text-lg font-semibold text-slate-100 mb-2">QR Code Generated</h4>
                <div className="flex flex-col items-center">
                  <QRCodeCanvas value={checkoutRes.qr.qrCode} size={200} includeMargin ref={qrCanvasRef} />
                  <p className="mt-4 text-sm text-slate-400">QR ID: {checkoutRes.qr.qrId}</p>
                  <button onClick={downloadQr} className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Download QR Code</button>
                </div>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={clearAll} disabled={loading} className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-60">Clear All</button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal – unchanged */}
      {selectedStalls.length > 0 && showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border border-slate-700/50">
            <h3 className="text-xl font-semibold mb-4 text-slate-100">Payment Gateway</h3>
            <p className="mb-2 text-slate-300">Total Amount: <span className="font-semibold text-slate-100">Rs {totalPrice}</span></p>
            <p className="mb-4 text-slate-300">Method: <span className="font-semibold text-slate-100">{selectedPaymentMethod}</span></p>
            {selectedPaymentMethod === "CARD" && (
              <div className="space-y-3">
                <input type="text" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full p-2 border border-slate-600 rounded bg-slate-700/50 text-slate-100 placeholder-slate-500" />
                <input type="text" placeholder="Expiry Date (MM/YY)" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full p-2 border border-slate-600 rounded bg-slate-700/50 text-slate-100 placeholder-slate-500" />
                <input type="password" placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-full p-2 border border-slate-600 rounded bg-slate-700/50 text-slate-100 placeholder-slate-500" />
              </div>
            )}
            {selectedPaymentMethod === "PAYPAL" && (
              <div className="space-y-3">
                <input type="email" placeholder="PayPal Email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} className="w-full p-2 border border-slate-600 rounded bg-slate-700/50 text-slate-100 placeholder-slate-500" />
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600" type="button" disabled={loading}>Cancel</button>
              <button onClick={processPayment} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"> {loading ? "Processing..." : "Complete Payment"} </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StallMap;
