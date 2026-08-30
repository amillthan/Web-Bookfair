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

  // ✅ User's existing reservations
  const [userReservations, setUserReservations] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

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

  // ✅ Fetch user's existing reservations
  const fetchUserReservations = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await api.get(`/api/reservations/user/${userId}`);
      const data = unwrap(res);
      setUserReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch user reservations:", e?.response?.data?.message || e.message);
    }
  };

  // ✅ Cancel a reservation
  const cancelReservation = async (resId) => {
    if (cancellingId) return;
    const confirmed = window.confirm(
      `Are you sure you want to cancel Reservation #${resId}?\nThis will free up ALL stalls and cannot be undone.`
    );
    if (!confirmed) return;

    setCancellingId(resId);
    setApiError("");
    try {
      await api.delete(`/api/reservations/${resId}`);
      await fetchStalls();
      await fetchUserReservations();
    } catch (e) {
      setApiError(
        e?.response?.data?.message ||
        JSON.stringify(e?.response?.data) ||
        e.message ||
        "Cancel failed"
      );
    } finally {
      setCancellingId(null);
    }
  };

  // ✅ Cancel a SINGLE stall from a reservation
  const [cancellingStallKey, setCancellingStallKey] = useState(null);

  const cancelSingleStall = async (resId, stallId, stallCode) => {
    if (cancellingStallKey) return;
    const confirmed = window.confirm(
      `Are you sure you want to cancel stall ${stallCode} from Reservation #${resId}?\nThis will free up this stall and cannot be undone.`
    );
    if (!confirmed) return;

    setCancellingStallKey(`${resId}-${stallId}`);
    setApiError("");
    try {
      await api.delete(`/api/reservations/${resId}/stalls/${stallId}`);
      await fetchStalls();
      await fetchUserReservations();
    } catch (e) {
      setApiError(
        e?.response?.data?.message ||
        JSON.stringify(e?.response?.data) ||
        e.message ||
        "Cancel stall failed"
      );
    } finally {
      setCancellingStallKey(null);
    }
  };

  useEffect(() => {
    fetchStalls();
    fetchUserReservations();
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

      // 🆕 Save user genres to database upon successful payment
      const userId = Number(localStorage.getItem("userId"));
      const allGenres = [...new Set(Object.values(stallGenres).flat())];
      if (userId && allGenres.length > 0) {
        await saveUserGenres(userId, allGenres);
      }

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
  const saveUserGenres = async (userId, genres) => {
    try {
      await api.post("/api/user-genres/replace", {
        userId: Number(userId),
        genres: genres,
      });
      console.log("✅ User genres saved to database");
      return true;
    } catch (e) {
      console.error("⚠️ Failed to save user genres:", e?.response?.data?.message || e.message);
      // Don't throw - this is a secondary operation
      return false;
    }
  };

  const generateQr = async () => {
    if (loading) return;
    if (!reservationId) return alert("Reservation not found.");

    setLoading(true);
    setApiError("");

    try {
      const res = await api.post("/api/checkout/generate-qr", { reservationId: Number(reservationId) });
      const data = unwrap(res) ?? res.data;
      setCheckoutRes({ qr: data });

      // 🆕 Save user genres to database after successful QR generation
      const userId = Number(localStorage.getItem("userId"));
      const allGenres = [...new Set(Object.values(stallGenres).flat())];
      if (userId && allGenres.length > 0) {
        await saveUserGenres(userId, allGenres);
      }

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

  // 🆕 Enhanced download QR with error handling
  const downloadQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) {
      setApiError("QR code canvas not found. Please try generating the QR code again.");
      return;
    }

    try {
      const link = document.createElement("a");
      const qrId = checkoutRes?.qr?.qrId || "pass";
      link.download = `qr-${qrId}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`✅ QR code downloaded: qr-${qrId}.png`);
    } catch (err) {
      console.error("❌ Error downloading QR code:", err);
      setApiError("Failed to download QR code. Please try again.");
    }
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

  // 🆕 Get display message for current step
  const getStepMessage = () => {
    if (activeStep === 0) return "📍 Select stalls and their genres";
    if (activeStep === 1) return "🎯 Choose genres for your stalls";
    if (activeStep === 2) return "💳 Proceed with payment";
    if (activeStep === 3) return "🎁 Generate your QR code";
    if (activeStep === 4) return "✅ Booking complete! Your genres have been saved";
    return "";
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
          className="text-[11px] fill-gray-800 font-medium pointer-events-none"
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
    <div className="p-6">
      <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            DB stalls loaded: <span className="font-semibold">{stallsFromDb.length}</span>
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
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
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
          className="font-sans border border-gray-200 rounded-lg bg-white w-full overflow-auto"
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
          <text x="600" y="" className="text-3xl font-bold fill-gray-800">
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
              className="text-xs fill-gray-700 font-medium"
            >
              GATE
            </text>
            <text
              x={leftCentre.x}
              y={leftCentre.y - leftRadius - 3}
              textAnchor="middle"
              className="text-lg font-bold fill-gray-700"
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
              className="text-xs fill-gray-700 font-medium"
            >
              GATE
            </text>
            <text
              x={rightCentre.x}
              y={rightCentre.y - rightRadius - 15}
              textAnchor="middle"
              className="text-lg font-bold fill-gray-700"
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
              className="text-lg font-bold fill-gray-700"
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
              className="text-xs fill-gray-700 font-medium"
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
              className="text-lg font-bold fill-gray-700"
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
              className="text-xs fill-gray-700 font-medium"
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
            className="text-xs fill-gray-700 font-medium"
          >
            MAIN GATE
          </text>
        </svg>

        {/* DETAILS SECTION – unchanged */}
        {selectedStalls.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Selected Stalls ({selectedStalls.length}/3)
            </h3>
            <div className="space-y-6 mb-6">
              {selectedStallsDetails.map((stall) => (
                <div
                  key={stall.code}
                  className="p-4 bg-white rounded border border-gray-200 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div><span className="font-medium">Stall Code:</span> {stall.code}</div>
                    <div><span className="font-medium">Type:</span> <span className="capitalize">{stall.type}</span></div>
                    <div><span className="font-medium">Price:</span> Rs {stall.price}</div>
                    <div><span className="font-medium">Status:</span> <span className={stall.status === "AVAILABLE" ? "text-blue-600 font-semibold" : "text-gray-600 font-semibold"}>{stall.status}</span></div>
                  </div>
                  {activeStep === 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">Select genres for {stall.code}:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {genres.map((genre) => (
                          <label key={genre} className="flex items-center space-x-2 text-gray-700 text-sm">
                            <input
                              type="checkbox"
                              checked={(stallGenres[stall.code] || []).includes(genre)}
                              onChange={() => handleGenreToggle(stall.code, genre)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{genre}</span>
                          </label>
                        ))}
                      </div>
                      {stallGenres[stall.code]?.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">Selected: {stallGenres[stall.code].join(", ")}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mb-4 text-right text-lg font-semibold text-gray-800">Total: Rs {totalPrice}</div>
            {activeStep === 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={reserveStall} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"> {loading ? "Reserving..." : "Reserve Stalls"} </button>
              </div>
            )}
            {activeStep === 2 && (
              <>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Step 3: Payment</h4>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="CARD">Card</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>

                </div>
                <p className="text-sm text-gray-600 mb-4">Amount to pay: Rs {totalPrice}</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowPaymentModal(true)} disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"> {loading ? "Processing..." : "Proceed to Payment"} </button>
                </div>
              </>
            )}
            {activeStep === 3 && (
              <>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Step 4: Generate QR Code</h4>
                <p className="text-sm text-gray-600 mb-4">Payment successful! Now generate your QR code.</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={generateQr} disabled={loading} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"> {loading ? "Generating..." : "Generate QR Code"} </button>
                </div>
              </>
            )}
            {activeStep === 4 && checkoutRes?.qr?.qrCode && (
              <>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">✅ QR Code Generated Successfully</h4>
                <div className="flex flex-col items-center p-6 bg-green-50 rounded-lg border border-green-200 space-y-4">
                  <p className="text-sm text-gray-600 text-center">Your booking QR code is ready. Download it to access your stalls.</p>
                  <div className="p-4 bg-white rounded border border-gray-200">
                    <QRCodeCanvas
                      value={checkoutRes.qr.qrCode}
                      size={256}
                      level="H"
                      includeMargin={true}
                      ref={qrCanvasRef}
                    />
                  </div>
                  <div className="text-center space-y-2 w-full">
                    <p className="text-sm font-medium text-gray-700">QR ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{checkoutRes.qr.qrId}</span></p>
                    <p className="text-xs text-gray-500">Show this QR code at the gate for entry</p>
                  </div>
                  <button
                    onClick={downloadQr}
                    className="mt-2 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                  >
                    📥 Download QR Code
                  </button>
                  <p className="text-xs text-gray-500 text-center">Your genres have been saved to your profile</p>
                  <div className="mt-4 p-3 rounded bg-blue-50 border border-blue-200 w-full">
                    <p className="text-xs text-blue-700"><strong>📚 Genre Preferences Saved:</strong></p>
                    <p className="text-xs text-blue-600 mt-1">{[...new Set(Object.values(stallGenres).flat())].join(", ") || "No genres selected"}</p>
                  </div>
                </div>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={clearAll} disabled={loading} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60">Clear All</button>
            </div>
          </div>
        )}

        {/* ================= MY RESERVATIONS SECTION ================= */}
        {userReservations.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                📋 My Reservations ({userReservations.length})
              </h3>
              <button
                onClick={fetchUserReservations}
                className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition"
                type="button"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-4">
              {userReservations.map((reservation) => (
                <div
                  key={reservation.reservationId}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">
                        Reservation #{reservation.reservationId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {reservation.stalls?.length || 0} stall(s)
                      </span>
                      {reservation.reservationDate && (
                        <span className="text-xs text-gray-500">
                          {new Date(reservation.reservationDate).toLocaleDateString("en-LK", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    {/* Stalls with individual cancel buttons */}
                    {reservation.stalls && reservation.stalls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reservation.stalls.map((stall) => {
                          let bgColor = "bg-green-100 text-green-800 border-green-200";
                          if (stall.stallCode?.startsWith("B")) bgColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
                          else if (stall.stallCode?.startsWith("C")) bgColor = "bg-purple-100 text-purple-800 border-purple-200";
                          const stallKey = `${reservation.reservationId}-${stall.stallId}`;
                          const isCancelling = cancellingStallKey === stallKey;
                          return (
                            <span
                              key={stall.stallId}
                              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-medium border ${bgColor}`}
                            >
                              {stall.stallCode} ({stall.size || "—"})
                              <button
                                onClick={() => cancelSingleStall(reservation.reservationId, stall.stallId, stall.stallCode)}
                                disabled={isCancelling}
                                className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={`Cancel stall ${stall.stallCode}`}
                              >
                                {isCancelling ? "…" : "✕"}
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {reservation.qrId && (
                      <p className="text-xs text-gray-500">
                        QR ID: <span className="font-mono">{reservation.qrId}</span>
                      </p>
                    )}

                    {/* Cancel ALL button */}
                    <div className="flex justify-end pt-2 border-t border-gray-200">
                      <button
                        onClick={() => cancelReservation(reservation.reservationId)}
                        disabled={cancellingId === reservation.reservationId}
                        className="px-4 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {cancellingId === reservation.reservationId
                          ? "Cancelling..."
                          : "Cancel All Stalls"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal – unchanged */}
      {selectedStalls.length > 0 && showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Payment Gateway</h3>
            <p className="mb-2 text-gray-700">Total Amount: <span className="font-semibold">Rs {totalPrice}</span></p>
            <p className="mb-4 text-gray-700">Method: <span className="font-semibold">{selectedPaymentMethod}</span></p>
            {selectedPaymentMethod === "CARD" && (
              <div className="space-y-3">
                <input type="text" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
                <input type="text" placeholder="Expiry Date (MM/YY)" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
                <input type="password" placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
              </div>
            )}
            {selectedPaymentMethod === "PAYPAL" && (
              <div className="space-y-3">
                <input type="email" placeholder="PayPal Email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" type="button" disabled={loading}>Cancel</button>
              <button onClick={processPayment} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"> {loading ? "Processing..." : "Complete Payment"} </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StallMap;