"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  RefreshCw,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  MapPin,
  Sparkles,
  Info,
  LogIn,
  LogOut,
  User,
  KeyRound,
  CalendarCheck,
  X,
  Lock,
  Building2,
  Coffee,
  Coins,
  QrCode,
  Calendar,
  ArrowRight
} from "lucide-react";
import QRCode from "qrcode";
import { signInGrideeWithGoogle } from "@/lib/grideeFirebase";

interface GrideeSession {
  accessToken: string;
  user: {
    id?: string;
    userId?: string;
    email?: string;
    name?: string;
  };
}

export default function SrmParkingToolPage() {
  const router = useRouter();

  // Session & Authentication
  const [session, setSession] = useState<GrideeSession | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<"email" | "token" | "google">("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginToken, setLoginToken] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Live Wallet Balance
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Active Digital Gate Pass (QR Code)
  const [activeQrPass, setActiveQrPass] = useState<{
    bookingId: string;
    vehicleNumber: string;
    zoneName: string;
    slotShift: string;
    qrDataUrl: string;
  } | null>(null);

  // Helper for 12-hour formatting
  const formatTo12H = (time24: string) => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // Zone & Spot Selection
  const [activeZone, setActiveZone] = useState<"TP" | "JAVA">("TP");

  // Schedule & Timing State
  const [scheduleMode, setScheduleMode] = useState<"PRESET" | "CUSTOM">("PRESET");
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [selectedShift, setSelectedShift] = useState<string>("MORNING");
  const [customStartTime, setCustomStartTime] = useState<string>("09:00");
  const [customDurationHours, setCustomDurationHours] = useState<number>(2);
  const [customEndTime, setCustomEndTime] = useState<string>("");

  // Real Spots & Bookings
  const [realSpots, setRealSpots] = useState<any[] | null>(null);
  const [spotsLoading, setSpotsLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Comprehensive Schedule Details Calculation
  const scheduleDetails = useMemo(() => {
    const isToday = selectedDate === todayStr;
    const isTomorrow = selectedDate === tomorrowStr;
    const dateLabel = isToday
      ? "Today"
      : isTomorrow
      ? "Tomorrow"
      : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" });

    const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    if (scheduleMode === "PRESET") {
      let startH = "08:00";
      let endH = "12:30";
      let durationHours = 4.5;
      let label = "Morning Shift";

      if (selectedShift === "AFTERNOON") {
        startH = "12:30";
        endH = "17:30";
        durationHours = 5;
        label = "Afternoon Shift";
      } else if (selectedShift === "FULL_DAY") {
        startH = "08:00";
        endH = "17:30";
        durationHours = 9.5;
        label = "Full Day Shift";
      }

      const checkInTime = new Date(`${selectedDate}T${startH}:00.000+05:30`).toISOString();
      const checkOutTime = new Date(`${selectedDate}T${endH}:00.000+05:30`).toISOString();
      const costCoins = Math.ceil(durationHours * 5);

      return {
        mode: "PRESET",
        date: selectedDate,
        dateLabel,
        formattedDate,
        startH,
        endH,
        formattedStart: formatTo12H(startH),
        formattedEnd: formatTo12H(endH),
        durationHours,
        durationLabel: `${durationHours} hrs`,
        label,
        checkInTime,
        checkOutTime,
        costCoins,
      };
    } else {
      const [sh, sm] = (customStartTime || "09:00").split(":").map((v) => parseInt(v, 10) || 0);
      const totalStartMins = sh * 60 + sm;
      const totalEndMins = totalStartMins + Math.round(customDurationHours * 60);

      const eh = Math.floor(totalEndMins / 60) % 24;
      const em = totalEndMins % 60;
      const computedEndH = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
      const effectiveEndH = customEndTime || computedEndH;

      const checkInTime = new Date(`${selectedDate}T${customStartTime}:00.000+05:30`).toISOString();
      const checkOutTime = new Date(`${selectedDate}T${effectiveEndH}:00.000+05:30`).toISOString();
      const costCoins = Math.max(5, Math.ceil(customDurationHours * 5));

      return {
        mode: "CUSTOM",
        date: selectedDate,
        dateLabel,
        formattedDate,
        startH: customStartTime,
        endH: effectiveEndH,
        formattedStart: formatTo12H(customStartTime),
        formattedEnd: formatTo12H(effectiveEndH),
        durationHours: customDurationHours,
        durationLabel: `${customDurationHours} hr${customDurationHours > 1 ? "s" : ""}`,
        label: `Custom: ${formatTo12H(customStartTime)} - ${formatTo12H(effectiveEndH)}`,
        checkInTime,
        checkOutTime,
        costCoins,
      };
    }
  }, [scheduleMode, selectedDate, selectedShift, customStartTime, customDurationHours, customEndTime, todayStr, tomorrowStr]);

  // Live zone breakdown
  const tpSpotData = useMemo(() => {
    if (!realSpots || !Array.isArray(realSpots)) return null;
    return realSpots.find((s: any) => s.spot?.id === "ps5" || s.spot?.zoneName?.includes("TP")) || null;
  }, [realSpots]);

  const javaSpotData = useMemo(() => {
    if (!realSpots || !Array.isArray(realSpots)) return null;
    return realSpots.find((s: any) => s.spot?.id === "ps6" || s.spot?.zoneName?.includes("Java")) || null;
  }, [realSpots]);

  // Countdown to 18:30 IST (Booking open time)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Local storage vehicle numbers quick vault
  const [savedVehicles, setSavedVehicles] = useState<{ id: string; label: string; plate: string }[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [newLabel, setNewLabel] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load session & remembered email from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gridee_nexus_session");
      if (stored) {
        setSession(JSON.parse(stored));
      }
      const remembered = localStorage.getItem("gridee_nexus_last_email");
      if (remembered) {
        setLoginEmail(remembered);
      }
    } catch (e) {
      console.error("Failed loading session", e);
    }
  }, []);

  // Fetch real spots when authenticated
  const fetchRealSpots = async (token: string, customStart?: string, customEnd?: string) => {
    try {
      setSpotsLoading(true);
      const s = customStart || scheduleDetails.checkInTime;
      const e = customEnd || scheduleDetails.checkOutTime;
      const q = s && e ? `?startTime=${encodeURIComponent(s)}&endTime=${encodeURIComponent(e)}` : "";
      const res = await fetch(`/api/gridee/spots${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.spots) {
          setRealSpots(data.spots);
        }
      }
    } catch (e) {
      console.warn("Could not fetch authenticated spots", e);
    } finally {
      setSpotsLoading(false);
    }
  };

  // Fetch user bookings when authenticated
  const fetchUserBookings = async (token: string, userId: string) => {
    try {
      const res = await fetch(`/api/gridee/my-bookings?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.bookings) {
          setMyBookings(data.bookings);
          if (data.bookings.length > 0 && !activeQrPass) {
            const first = data.bookings[0];
            const bId = first.bookingId || first.id || first.ticketId || "ACTIVE";
            const vNum = first.vehicleNumber || selectedVehicle || "TN01NIT111";
            const zName = first.zoneName || "SRM Campus Parking";
            const sShift = first.slotId || "ACTIVE";
            const qrStr = `GRIDEE:BOOKING:${bId}:${vNum}`;
            QRCode.toDataURL(qrStr, { width: 280, margin: 1 })
              .then((url) => {
                setActiveQrPass({
                  bookingId: bId,
                  vehicleNumber: vNum,
                  zoneName: zName,
                  slotShift: sShift,
                  qrDataUrl: url,
                });
              })
              .catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch user bookings", e);
    }
  };

  // Fetch live wallet balance
  const fetchUserWallet = async (token: string, userId: string) => {
    try {
      const res = await fetch(`/api/gridee/wallet?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.balance === "number") {
          setWalletBalance(data.balance);
        }
      }
    } catch (e) {
      console.warn("Could not fetch user wallet", e);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchRealSpots(session.accessToken);
      const uId = session.user?.id || session.user?.userId;
      if (uId) {
        fetchUserBookings(session.accessToken, uId);
        fetchUserWallet(session.accessToken, uId);
      }

      // Auto-populate registered vehicle
      const vNums = (session.user as any)?.vehicleNumbers;
      if (Array.isArray(vNums) && vNums.length > 0) {
        const plate = vNums[0];
        setSelectedVehicle(plate);
        setSavedVehicles((prev) => {
          if (!prev.some((v) => v.plate === plate)) {
            return [{ id: "gridee_reg", label: "Registered Vehicle", plate }, ...prev];
          }
          return prev;
        });
      }
    }
  }, [session]);

  // Load saved vehicles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("srm_nexus_saved_vehicles");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedVehicles(parsed);
        if (parsed.length > 0 && !selectedVehicle) {
          setSelectedVehicle(parsed[0].plate);
        }
      }
    } catch (e) {
      console.error("Failed reading localStorage", e);
    }
  }, []);

  const saveVehiclesToLocal = (vehicles: typeof savedVehicles) => {
    setSavedVehicles(vehicles);
    try {
      localStorage.setItem("srm_nexus_saved_vehicles", JSON.stringify(vehicles));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    const item = {
      id: Date.now().toString(),
      label: newLabel.trim() || "My Vehicle",
      plate: newPlate.trim().toUpperCase(),
    };
    const updated = [...savedVehicles, item];
    saveVehiclesToLocal(updated);
    if (!selectedVehicle) setSelectedVehicle(item.plate);
    setNewLabel("");
    setNewPlate("");
    setShowAddModal(false);
  };

  const handleDeleteVehicle = (id: string) => {
    const updated = savedVehicles.filter((v) => v.id !== id);
    saveVehiclesToLocal(updated);
  };

  const handleCopyPlate = (plate: string, id: string) => {
    navigator.clipboard.writeText(plate);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 18:30 IST Countdown Calculation
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(18, 30, 0, 0);

      if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = Math.max(0, target.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine active shift based on current hour
  const currentShiftId = useMemo(() => {
    const now = new Date();
    const timeInMins = now.getHours() * 60 + now.getMinutes();
    const morningStart = 8 * 60;
    const afternoonStart = 12 * 60 + 30;
    const dayEnd = 17 * 60 + 30;

    if (timeInMins >= morningStart && timeInMins < afternoonStart) return "MORNING";
    if (timeInMins >= afternoonStart && timeInMins <= dayEnd) return "AFTERNOON";
    if (timeInMins >= morningStart && timeInMins <= dayEnd) return "FULL_DAY";
    return null;
  }, []);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const idToken = await signInGrideeWithGoogle();
      const res = await fetch("/api/gridee/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "google", idToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || "Gridee authentication failed.");
        return;
      }
      const newSession: GrideeSession = {
        accessToken: data.accessToken,
        user: data.user,
      };
      setSession(newSession);
      localStorage.setItem("gridee_nexus_session", JSON.stringify(newSession));
      setShowLoginModal(false);
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setLoginError("Gridee's developer only allows Email & Password authentication for Web. Please use your Gridee Email & Password below.");
        setLoginMode("email");
      } else {
        setLoginError(err.message || "Google Sign-In failed or popup was closed.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Email / Token Sign-In Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const payload = loginMode === "email"
        ? { mode: "email", email: loginEmail.trim(), password: loginPassword }
        : { mode: "token", accessToken: loginToken.trim() };

      const res = await fetch("/api/gridee/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        let msg = data.error || "Login failed. Check your credentials.";
        if (msg === "INVALID_LOGIN_CREDENTIALS" || msg.includes("INVALID_LOGIN_CREDENTIALS")) {
          msg = "Incorrect email or password. Please verify your Gridee account credentials.";
        } else if (msg.includes("TOO_MANY_ATTEMPTS")) {
          msg = "Too many failed attempts. Please wait a moment and try again.";
        } else if (msg.includes("INVALID_EMAIL")) {
          msg = "Please enter a valid email address.";
        }
        setLoginError(msg);
        return;
      }

      const newSession: GrideeSession = {
        accessToken: data.accessToken,
        user: data.user,
      };

      setSession(newSession);
      localStorage.setItem("gridee_nexus_session", JSON.stringify(newSession));
      if (loginEmail) {
        localStorage.setItem("gridee_nexus_last_email", loginEmail.trim());
      }
      setShowLoginModal(false);
      setLoginPassword("");
      setLoginToken("");
    } catch (err: any) {
      setLoginError(err.message || "Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setRealSpots(null);
    setMyBookings([]);
    localStorage.removeItem("gridee_nexus_session");
  };

  // Handle In-App Booking Submission
  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) {
      setShowLoginModal(true);
      return;
    }

    const userId = session.user?.id || session.user?.userId || "user_current";
    const plate = selectedVehicle.trim();

    if (!plate) {
      setBookingError("Please select or enter a vehicle plate number.");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const { checkInTime, checkOutTime, date, costCoins, label } = scheduleDetails;

      const res = await fetch("/api/gridee/book", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          vehicleNumber: plate,
          bookingDate: date,
          checkInTime,
          checkOutTime,
          slotId: scheduleMode === "PRESET" ? selectedShift : "CUSTOM",
          spotId: activeZone === "TP" ? "ps5" : "ps6",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error?.includes("Insufficient wallet coins") || data.error?.includes("Insufficient funds")) {
          setBookingError(`Gridee requires ${costCoins} coins (₹${costCoins}) to reserve this slot. Your current balance is ${walletBalance ?? 0} coins. Please top up your wallet in your Gridee account to finalize.`);
        } else {
          setBookingError(data.error || "Booking was not accepted by Gridee.");
        }
        return;
      }

      const bId = data.booking?.bookingId || data.booking?.id || data.booking?.ticketId || "CONFIRMED";
      setBookingSuccess(`Slot booked successfully! Reference: ${bId}`);

      // Generate Gate Entry QR Code Pass
      const qrData = `GRIDEE:BOOKING:${bId}:${plate}:${activeZone}`;
      try {
        const qrUrl = await QRCode.toDataURL(qrData, { width: 280, margin: 1 });
        setActiveQrPass({
          bookingId: bId,
          vehicleNumber: plate,
          zoneName: activeZone === "TP" ? "Tech Park (TP Avenue)" : "Java Ground",
          slotShift: label,
          qrDataUrl: qrUrl,
        });
      } catch (qrErr) {
        console.error("QR Generation error", qrErr);
      }

      fetchRealSpots(session.accessToken);
      fetchUserBookings(session.accessToken, userId);
      fetchUserWallet(session.accessToken, userId);
    } catch (err: any) {
      setBookingError(err.message || "Failed to submit booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{
      background: "#09090F",
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      color: "#F7F5FA",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Top Header */}
      <header style={{
        padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 14px",
        maxWidth: "760px",
        width: "100%",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => router.push("/tools")}
              style={{
                background: "#12121A",
                border: "1px solid #292532",
                color: "#F7F5FA",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Back to tools"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <p style={{ margin: "0 0 2px", color: "#60A5FA", fontSize: "10.5px", fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                SRM Campus Utility
              </p>
              <h1 style={{ fontSize: "22px", fontWeight: 850, margin: 0, letterSpacing: "-0.03em" }}>
                Campus Parking (Gridee)
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {session ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {walletBalance !== null && (
                  <span style={{ fontSize: "11px", color: "#FBBF24", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.25)", padding: "4px 8px", borderRadius: "6px", fontWeight: 750, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Coins size={13} />
                    <span>{walletBalance} Coins</span>
                  </span>
                )}
                <span style={{ fontSize: "11px", color: "#10B981", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "4px 8px", borderRadius: "6px", fontWeight: 750 }}>
                  {session.user?.name ? session.user.name.split(" ")[0] : (session.user?.email ? session.user.email.split("@")[0] : "Connected")}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out from Gridee"
                  style={{
                    background: "#12121A",
                    border: "1px solid #292532",
                    color: "#EF4444",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  background: "#2563EB",
                  border: "none",
                  color: "#FFF",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 750,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
              >
                <LogIn size={13} />
                <span>Sign In Gridee</span>
              </button>
            )}

            {session && (
              <button
                onClick={() => fetchRealSpots(session.accessToken)}
                disabled={spotsLoading}
                style={{
                  background: "#12121A",
                  border: "1px solid #292532",
                  color: "#B8B2C2",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: spotsLoading ? "default" : "pointer"
                }}
              >
                <RefreshCw size={13} className={spotsLoading ? "animate-spin" : ""} />
                <span>{spotsLoading ? "Syncing…" : "Refresh"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: "8px 16px 120px",
        maxWidth: "760px",
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        {/* UNAUTHENTICATED STATE: Clear Auth Gate Card */}
        {!session ? (
          <section style={{
            background: "#12121A",
            border: "1px solid #292532",
            borderRadius: "16px",
            padding: "24px 20px",
            textAlign: "center"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.25)",
              color: "#60A5FA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px"
            }}>
              <Lock size={22} />
            </div>

            <h2 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 6px", color: "#F7F5FA" }}>
              Authentication Required for Live Slots
            </h2>

            <p style={{ fontSize: "12.5px", color: "#9C96A7", margin: "0 auto 18px", maxWidth: "420px", lineHeight: 1.5 }}>
              SRM Kattankulathur requires an active Gridee session to unlock real-time <strong>Tech Park (TP)</strong> and <strong>Java Ground</strong> slot availability and validate bookings.
            </p>

            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: "#2563EB",
                color: "#FFF",
                border: "none",
                padding: "10px 24px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)"
              }}
            >
              <LogIn size={15} />
              <span>Sign In to Unlock TP & Java Slots</span>
            </button>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "16px", fontSize: "11px", color: "#8F8998" }}>
              <span>🏢 Tech Park (TP) Parking</span>
              <span>•</span>
              <span>☕ Java Ground Parking</span>
            </div>
          </section>
        ) : (
          /* AUTHENTICATED STATE: Full TP & Java Zones Hub */
          <>
            {/* ACTIVE DIGITAL PARKING PASS (GATE QR) */}
            {activeQrPass && (
              <section style={{
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(16, 185, 129, 0.12) 100%)",
                border: "1.5px solid rgba(37, 99, 235, 0.4)",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                position: "relative",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <QrCode size={18} color="#60A5FA" />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 850, color: "#F7F5FA", letterSpacing: "-0.02em" }}>
                    Digital Campus Gate Pass (Scan QR)
                  </h3>
                </div>

                <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#9C96A7" }}>
                  Scan this QR at the SRM Kattankulathur gate barrier scanner to check in
                </p>

                {/* QR Code Container */}
                <div style={{
                  background: "#FFFFFF",
                  padding: "12px",
                  borderRadius: "14px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px"
                }}>
                  <img
                    src={activeQrPass.qrDataUrl}
                    alt="Entry QR Code"
                    style={{ width: "190px", height: "190px", display: "block" }}
                  />
                </div>

                {/* Pass Details Pill Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  width: "100%",
                  maxWidth: "340px",
                  marginBottom: "14px"
                }}>
                  <div style={{ background: "rgba(18, 18, 26, 0.7)", border: "1px solid #292532", borderRadius: "8px", padding: "8px 10px", textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "#8F8998", textTransform: "uppercase", fontWeight: 700 }}>Vehicle Plate</p>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 850, color: "#F7F5FA" }}>{activeQrPass.vehicleNumber}</p>
                  </div>
                  <div style={{ background: "rgba(18, 18, 26, 0.7)", border: "1px solid #292532", borderRadius: "8px", padding: "8px 10px", textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "#8F8998", textTransform: "uppercase", fontWeight: 700 }}>Zone Ground</p>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 850, color: "#60A5FA" }}>{activeQrPass.zoneName}</p>
                  </div>
                  <div style={{ background: "rgba(18, 18, 26, 0.7)", border: "1px solid #292532", borderRadius: "8px", padding: "8px 10px", textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "#8F8998", textTransform: "uppercase", fontWeight: 700 }}>Shift / Timing</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 800, color: "#F7F5FA" }}>{activeQrPass.slotShift}</p>
                  </div>
                  <div style={{ background: "rgba(18, 18, 26, 0.7)", border: "1px solid #292532", borderRadius: "8px", padding: "8px 10px", textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "#8F8998", textTransform: "uppercase", fontWeight: 700 }}>Pass Status</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 850, color: "#10B981" }}>READY TO SCAN</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <a
                    href={activeQrPass.qrDataUrl}
                    download={`SRM_Parking_Pass_${activeQrPass.bookingId}.png`}
                    style={{
                      background: "#2563EB",
                      color: "#FFF",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 750,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>Save Pass Image</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveQrPass(null)}
                    style={{
                      background: "#1E1E28",
                      border: "1px solid #292532",
                      color: "#B8B2C2",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </section>
            )}

            {/* Zone Selector: TP vs Java Ground */}
            <section style={{
              background: "#12121A",
              border: "1px solid #292532",
              borderRadius: "14px",
              padding: "14px 16px"
            }}>
              <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 750, color: "#8F8998", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Campus Parking Ground
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveZone("TP")}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: activeZone === "TP" ? "1.5px solid #2563EB" : "1px solid #292532",
                    background: activeZone === "TP" ? "rgba(37, 99, 235, 0.15)" : "#0E0E15",
                    color: activeZone === "TP" ? "#FFF" : "#B8B2C2",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textAlign: "left"
                  }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: activeZone === "TP" ? "#2563EB" : "#1E1E28", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: activeZone === "TP" ? "#FFF" : "#F7F5FA" }}>Tech Park (TP)</p>
                      {tpSpotData && (
                        <span style={{ fontSize: "10px", fontWeight: 750, color: "#10B981", background: "rgba(16, 185, 129, 0.15)", padding: "1px 6px", borderRadius: "4px" }}>
                          {tpSpotData.availableCapacity} Free
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#8F8998" }}>
                      {tpSpotData ? `${tpSpotData.availableCapacity} / ${tpSpotData.spot?.capacity || 300} Spots (${tpSpotData.bookedCount} Parked)` : "Near TP & Main Building"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveZone("JAVA")}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: activeZone === "JAVA" ? "1.5px solid #2563EB" : "1px solid #292532",
                    background: activeZone === "JAVA" ? "rgba(37, 99, 235, 0.15)" : "#0E0E15",
                    color: activeZone === "JAVA" ? "#FFF" : "#B8B2C2",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textAlign: "left"
                  }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: activeZone === "JAVA" ? "#2563EB" : "#1E1E28", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
                    <Coffee size={16} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: activeZone === "JAVA" ? "#FFF" : "#F7F5FA" }}>Java Ground</p>
                      {javaSpotData && (
                        <span style={{ fontSize: "10px", fontWeight: 750, color: "#10B981", background: "rgba(16, 185, 129, 0.15)", padding: "1px 6px", borderRadius: "4px" }}>
                          {javaSpotData.availableCapacity} Free
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#8F8998" }}>
                      {javaSpotData ? `${javaSpotData.availableCapacity} / ${javaSpotData.spot?.capacity || 500} Spots (${javaSpotData.bookedCount} Parked)` : "Behind Java Canteen & Mech"}
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* Live Campus Ground Status & Metrics (Real Backend Data) */}
            {(() => {
              const activeSpot = activeZone === "TP" ? tpSpotData : javaSpotData;
              const freeSpots = activeSpot ? activeSpot.availableCapacity : (activeZone === "TP" ? 292 : 494);
              const totalCap = activeSpot?.spot?.capacity || (activeZone === "TP" ? 300 : 500);
              const booked = activeSpot ? activeSpot.bookedCount : (activeZone === "TP" ? 8 : 6);
              const pctUsed = Math.round((booked / totalCap) * 100);
              const rate = activeSpot?.spot?.bookingRate || 5;

              return (
                <section style={{
                  background: "#12121A",
                  border: "1px solid #292532",
                  borderRadius: "14px",
                  padding: "18px 20px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Car size={16} color="#60A5FA" />
                      <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
                        {activeZone === "TP" ? "Tech Park (TP Avenue STEP Area)" : "Java Ground Parking Area"}
                      </h2>
                    </div>
                    <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 750, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "3px 8px", borderRadius: "6px" }}>
                      Status: Open & Available
                    </span>
                  </div>

                  {/* Real Metrics Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginBottom: "12px"
                  }}>
                    <div style={{ background: "#0E0E15", border: "1px solid #292532", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: "#8F8998", textTransform: "uppercase", fontWeight: 750 }}>Free Capacity</p>
                      <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 850, color: "#10B981" }}>{freeSpots}</p>
                      <span style={{ fontSize: "9.5px", color: "#8F8998" }}>of {totalCap} spots</span>
                    </div>

                    <div style={{ background: "#0E0E15", border: "1px solid #292532", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: "#8F8998", textTransform: "uppercase", fontWeight: 750 }}>Occupied</p>
                      <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 850, color: "#60A5FA" }}>{booked}</p>
                      <span style={{ fontSize: "9.5px", color: "#8F8998" }}>{pctUsed}% occupancy</span>
                    </div>

                    <div style={{ background: "#0E0E15", border: "1px solid #292532", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: "#8F8998", textTransform: "uppercase", fontWeight: 750 }}>Hourly Rate</p>
                      <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 850, color: "#FBBF24" }}>₹{rate}</p>
                      <span style={{ fontSize: "9.5px", color: "#8F8998" }}>per shift / hr</span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "11px", color: "#8F8998", lineHeight: 1.5 }}>
                    {activeZone === "TP"
                      ? "📍 TP Avenue STEP Area — Barrier scanner located near Tech Park entrance."
                      : "📍 Java Ground Area — Barrier scanner located behind Java Canteen & Mechanical block."}
                  </p>
                </section>
              );
            })()}

            {/* Direct In-App Booking Console */}
            <section style={{
              background: "#12121A",
              border: "1px solid #292532",
              borderRadius: "14px",
              padding: "18px 20px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <CalendarCheck size={16} color="#60A5FA" />
                <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
                  Book Slot (Nexus In-App)
                </h2>
              </div>

              <form onSubmit={handleBookSlot} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Selected Ground Indicator */}
                <div style={{
                  background: "#0E0E15",
                  border: "1px solid #292532",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span style={{ fontSize: "11.5px", color: "#8F8998", fontWeight: 750, textTransform: "uppercase" }}>
                    Selected Ground
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#10B981" }}>
                    {activeZone === "TP" ? "Tech Park (TP Avenue)" : "Java Ground"}
                  </span>
                </div>

                {/* Live Wallet & Cost Indicator */}
                <div style={{
                  background: "#0E0E15",
                  border: "1px solid #292532",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Coins size={14} color="#FBBF24" />
                    <span style={{ fontSize: "11.5px", color: "#8F8998", fontWeight: 700, textTransform: "uppercase" }}>
                      Gridee Wallet
                    </span>
                    <strong style={{ fontSize: "12.5px", color: "#FBBF24", fontWeight: 800 }}>
                      {walletBalance !== null ? `${walletBalance} Coins` : "Loading..."}
                    </strong>
                  </div>
                  <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 750, background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                    Cost: {scheduleDetails.costCoins} Coins (₹{scheduleDetails.costCoins})
                  </span>
                </div>

                {/* Schedule & Timing Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 750, color: "#8F8998", textTransform: "uppercase" }}>
                      <Clock size={13} color="#60A5FA" />
                      <span>Select Parking Schedule</span>
                    </label>
                    <span style={{ fontSize: "10.5px", color: "#60A5FA", fontWeight: 700 }}>
                      Rate: ₹5/hr
                    </span>
                  </div>

                  {/* Date Picker Row */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: "8px",
                        border: selectedDate === todayStr ? "1px solid #2563EB" : "1px solid #292532",
                        background: selectedDate === todayStr ? "#2563EB" : "#0E0E15",
                        color: selectedDate === todayStr ? "#FFF" : "#B8B2C2",
                        fontSize: "12px",
                        fontWeight: 750,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Calendar size={13} />
                      <span>Today</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDate(tomorrowStr)}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: "8px",
                        border: selectedDate === tomorrowStr ? "1px solid #2563EB" : "1px solid #292532",
                        background: selectedDate === tomorrowStr ? "#2563EB" : "#0E0E15",
                        color: selectedDate === tomorrowStr ? "#FFF" : "#B8B2C2",
                        fontSize: "12px",
                        fontWeight: 750,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Calendar size={13} />
                      <span>Tomorrow</span>
                    </button>

                    <div style={{ position: "relative" }}>
                      <input
                        type="date"
                        min={todayStr}
                        value={selectedDate}
                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                        style={{
                          background: "#0E0E15",
                          border: "1px solid #292532",
                          borderRadius: "8px",
                          padding: "7px 10px",
                          fontSize: "12px",
                          color: "#FFF",
                          fontWeight: 700,
                          outline: "none",
                          cursor: "pointer"
                        }}
                      />
                    </div>
                  </div>

                  {/* Mode Switch: Presets vs Custom */}
                  <div style={{
                    display: "flex",
                    background: "#09090F",
                    border: "1px solid #292532",
                    borderRadius: "8px",
                    padding: "3px"
                  }}>
                    <button
                      type="button"
                      onClick={() => setScheduleMode("PRESET")}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background: scheduleMode === "PRESET" ? "#1E1B4B" : "transparent",
                        color: scheduleMode === "PRESET" ? "#A5B4FC" : "#8F8998",
                        fontSize: "11px",
                        fontWeight: 750,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      College Shifts
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode("CUSTOM")}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background: scheduleMode === "CUSTOM" ? "#1E1B4B" : "transparent",
                        color: scheduleMode === "CUSTOM" ? "#A5B4FC" : "#8F8998",
                        fontSize: "11px",
                        fontWeight: 750,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      Custom Hours & Time
                    </button>
                  </div>

                  {/* Sub-view: College Shift Presets */}
                  {scheduleMode === "PRESET" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                      {[
                        { id: "MORNING", label: "Morning", time: "08:00 - 12:30" },
                        { id: "AFTERNOON", label: "Afternoon", time: "12:30 - 17:30" },
                        { id: "FULL_DAY", label: "Full Day", time: "08:00 - 17:30" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedShift(s.id)}
                          style={{
                            padding: "9px 6px",
                            borderRadius: "8px",
                            border: selectedShift === s.id ? "1px solid #2563EB" : "1px solid #292532",
                            background: selectedShift === s.id ? "#2563EB" : "#0E0E15",
                            color: selectedShift === s.id ? "#FFF" : "#B8B2C2",
                            fontSize: "12px",
                            fontWeight: 750,
                            cursor: "pointer",
                            textAlign: "center"
                          }}
                        >
                          <div>{s.label}</div>
                          <div style={{ fontSize: "9.5px", opacity: 0.85, marginTop: "2px" }}>{s.time}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Sub-view: Custom Hours & Duration */
                    <div style={{
                      background: "#0E0E15",
                      border: "1px solid #292532",
                      borderRadius: "10px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}>
                      {/* Check-In Start Time */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#8F8998" }}>
                            CHECK-IN TIME
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#60A5FA" }}>
                            {formatTo12H(customStartTime)}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                          {[
                            { label: "Now", time: `${String(new Date().getHours()).padStart(2, "0")}:${String(Math.floor(new Date().getMinutes() / 15) * 15).padStart(2, "0")}` },
                            { label: "08:30 AM", time: "08:30" },
                            { label: "09:30 AM", time: "09:30" },
                            { label: "11:00 AM", time: "11:00" },
                            { label: "01:30 PM", time: "13:30" },
                          ].map((t, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCustomStartTime(t.time);
                                setCustomEndTime("");
                              }}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: customStartTime === t.time ? "1px solid #2563EB" : "1px solid #292532",
                                background: customStartTime === t.time ? "#2563EB" : "#12121A",
                                color: customStartTime === t.time ? "#FFF" : "#8F8998",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              {t.label}
                            </button>
                          ))}
                          <input
                            type="time"
                            value={customStartTime}
                            onChange={(e) => {
                              setCustomStartTime(e.target.value);
                              setCustomEndTime("");
                            }}
                            style={{
                              background: "#12121A",
                              border: "1px solid #292532",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              color: "#FFF",
                              fontWeight: 700,
                              outline: "none"
                            }}
                          />
                        </div>
                      </div>

                      {/* Duration Chips */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#8F8998" }}>
                            DURATION
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#10B981" }}>
                            {customDurationHours} hr{customDurationHours > 1 ? "s" : ""} (₹{customDurationHours * 5})
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                          {[1, 2, 3, 4, 5].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                setCustomDurationHours(h);
                                setCustomEndTime("");
                              }}
                              style={{
                                padding: "6px 4px",
                                borderRadius: "6px",
                                border: customDurationHours === h && !customEndTime ? "1px solid #10B981" : "1px solid #292532",
                                background: customDurationHours === h && !customEndTime ? "rgba(16, 185, 129, 0.15)" : "#12121A",
                                color: customDurationHours === h && !customEndTime ? "#10B981" : "#B8B2C2",
                                fontSize: "11px",
                                fontWeight: 750,
                                cursor: "pointer",
                                textAlign: "center"
                              }}
                            >
                              <div>{h} hr</div>
                              <div style={{ fontSize: "9px", opacity: 0.8 }}>₹{h * 5}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Reservation Summary Card */}
                  <div style={{
                    background: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid rgba(37, 99, 235, 0.25)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={13} color="#60A5FA" />
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#F7F5FA" }}>
                          {scheduleDetails.formattedStart}
                        </span>
                        <ArrowRight size={12} color="#8F8998" />
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#F7F5FA" }}>
                          {scheduleDetails.formattedEnd}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8F8998", fontWeight: 650 }}>
                          ({scheduleDetails.durationLabel})
                        </span>
                      </div>
                      <span style={{ fontSize: "12.5px", fontWeight: 850, color: "#FBBF24" }}>
                        {scheduleDetails.costCoins} Coins (₹{scheduleDetails.costCoins})
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10.5px", color: "#8F8998" }}>
                      <span>Date: <strong style={{ color: "#E2E8F0" }}>{scheduleDetails.formattedDate}</strong></span>
                      {walletBalance !== null && (
                        <span>
                          Wallet Balance: <strong style={{ color: walletBalance >= scheduleDetails.costCoins ? "#10B981" : "#EF4444" }}>{walletBalance} Coins</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Selector */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 750, color: "#8F8998", marginBottom: "6px", textTransform: "uppercase" }}>
                    Vehicle Plate Number
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TN 19 AX 1234"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        background: "#0E0E15",
                        border: "1px solid #292532",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#FFF",
                        outline: "none"
                      }}
                    />

                    {savedVehicles.length > 0 && (
                      <select
                        onChange={(e) => e.target.value && setSelectedVehicle(e.target.value)}
                        style={{
                          background: "#0E0E15",
                          border: "1px solid #292532",
                          borderRadius: "8px",
                          padding: "9px 10px",
                          fontSize: "12px",
                          color: "#60A5FA",
                          fontWeight: 700,
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="">Quick Pick</option>
                        {savedVehicles.map((v) => (
                          <option key={v.id} value={v.plate}>
                            {v.label} ({v.plate})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Alerts */}
                {bookingError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", padding: "10px", fontSize: "12px", color: "#EF4444" }}>
                    {bookingError}
                  </div>
                )}

                {bookingSuccess && (
                  <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "10px", fontSize: "12px", color: "#10B981" }}>
                    {bookingSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookingLoading}
                  style={{
                    background: "#2563EB",
                    border: "none",
                    color: "#FFF",
                    padding: "11px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: bookingLoading ? "default" : "pointer",
                    marginTop: "4px"
                  }}
                >
                  {bookingLoading ? "Processing Reservation…" : "Confirm & Reserve Slot"}
                </button>
              </form>
            </section>

            {/* My Active Bookings from Backend */}
            {myBookings && myBookings.length > 0 && (
              <section style={{
                background: "#12121A",
                border: "1px solid #292532",
                borderRadius: "14px",
                padding: "18px 20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
                    Your Active Reservations
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {myBookings.map((b: any, idx: number) => {
                    const bId = b.bookingId || b.id || b.ticketId || `BK-${idx + 1}`;
                    const vNum = b.vehicleNumber || selectedVehicle || "Registered Vehicle";
                    const zName = b.parkingLotName || b.zoneName || "SRM Campus Ground";
                    const sShift = b.slotId || b.shift || "Active";
                    return (
                      <div
                        key={bId}
                        style={{
                          background: "#0E0E15",
                          border: "1px solid #292532",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px"
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "10px", fontWeight: 750, color: "#10B981", background: "rgba(16, 185, 129, 0.12)", padding: "2px 6px", borderRadius: "4px" }}>
                            CONFIRMED
                          </span>
                          <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 800, color: "#F7F5FA" }}>
                            {vNum} • {zName}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#8F8998" }}>
                            Ref #{bId} • Shift: {sShift}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const qrStr = `GRIDEE:BOOKING:${bId}:${vNum}`;
                            QRCode.toDataURL(qrStr, { width: 280, margin: 1 })
                              .then((url) => {
                                setActiveQrPass({
                                  bookingId: bId,
                                  vehicleNumber: vNum,
                                  zoneName: zName,
                                  slotShift: sShift,
                                  qrDataUrl: url,
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              })
                              .catch(() => {});
                          }}
                          style={{
                            background: "#2563EB",
                            border: "none",
                            color: "#FFF",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 750,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer"
                          }}
                        >
                          <QrCode size={13} />
                          <span>View Gate QR</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* 18:30 Rush Countdown */}
        <section style={{
          background: "#12121A",
          border: "1px solid #292532",
          borderRadius: "14px",
          padding: "18px 20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={16} color="#60A5FA" />
              <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
                18:30 Booking Window Countdown
              </h2>
            </div>
            <span style={{ fontSize: "11px", color: "#8F8998", fontWeight: 700 }}>
              Daily 6:30 PM Rush
            </span>
          </div>

          <p style={{ margin: "0 0 14px", fontSize: "12.5px", color: "#9C96A7", lineHeight: 1.45 }}>
            Advance slot reservations for tomorrow open at 6:30 PM. Slots fill up quickly, so have your vehicle plate ready.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            textAlign: "center"
          }}>
            <div style={{ background: "#0E0E15", border: "1px solid #292532", borderRadius: "10px", padding: "12px 6px" }}>
              <span className="tabular-nums" style={{ fontSize: "24px", fontWeight: 850, color: "#60A5FA" }}>
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <p style={{ margin: "4px 0 0", fontSize: "10px", fontWeight: 750, color: "#8F8998", textTransform: "uppercase" }}>
                Hours
              </p>
            </div>
            <div style={{ background: "#0E0E15", border: "1px solid #292532", borderRadius: "10px", padding: "12px 6px" }}>
              <span className="tabular-nums" style={{ fontSize: "24px", fontWeight: 850, color: "#60A5FA" }}>
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <p style={{ margin: "4px 0 0", fontSize: "10px", fontWeight: 750, color: "#8F8998", textTransform: "uppercase" }}>
                Minutes
              </p>
            </div>
            <div style={{ background: "#0E0E15", border: "1px solid #292532", borderRadius: "10px", padding: "12px 6px" }}>
              <span className="tabular-nums" style={{ fontSize: "24px", fontWeight: 850, color: "#60A5FA" }}>
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <p style={{ margin: "4px 0 0", fontSize: "10px", fontWeight: 750, color: "#8F8998", textTransform: "uppercase" }}>
                Seconds
              </p>
            </div>
          </div>
        </section>

        {/* Vehicle Plate Fast-Copy Vault */}
        <section style={{
          background: "#12121A",
          border: "1px solid #292532",
          borderRadius: "14px",
          padding: "18px 20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
                Vehicle Plates Fast-Copy
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#8F8998" }}>
                Save your registration numbers locally for 1-click copy during the booking rush.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: "#2563EB",
                border: "none",
                color: "#FFF",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: 750,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer"
              }}
            >
              <Plus size={13} />
              <span>Add</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {savedVehicles.map((v) => (
              <div
                key={v.id}
                style={{
                  background: "#0E0E15",
                  border: "1px solid #292532",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "11.5px", fontWeight: 650, color: "#8F8998" }}>{v.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 800, color: "#F7F5FA", letterSpacing: "0.04em" }}>{v.plate}</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => handleCopyPlate(v.plate, v.id)}
                    style={{
                      background: copiedId === v.id ? "rgba(16, 185, 129, 0.15)" : "#1E1E28",
                      border: `1px solid ${copiedId === v.id ? "#10B981" : "#292532"}`,
                      color: copiedId === v.id ? "#10B981" : "#60A5FA",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 750,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {copiedId === v.id ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === v.id ? "Copied!" : "Copy"}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8F8998",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    aria-label="Delete plate"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddModal && (
            <form onSubmit={handleAddVehicle} style={{ marginTop: "12px", background: "#0E0E15", border: "1px solid #292532", borderRadius: "10px", padding: "14px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 750, color: "#F7F5FA" }}>Add Vehicle Plate</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <input
                  type="text"
                  placeholder="Label (e.g. My Activa)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "6px", padding: "8px 10px", fontSize: "12px", color: "#FFF", outline: "none" }}
                />
                <input
                  type="text"
                  required
                  placeholder="Plate (e.g. TN 19 AX 1234)"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "6px", padding: "8px 10px", fontSize: "12px", color: "#FFF", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "transparent", border: "1px solid #292532", color: "#8F8998", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: "#2563EB", border: "none", color: "#FFF", padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 750, cursor: "pointer" }}
                >
                  Save Plate
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Official Rules & Policies */}
        <section style={{
          background: "#12121A",
          border: "1px solid #292532",
          borderRadius: "14px",
          padding: "18px 20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <ShieldCheck size={16} color="#60A5FA" />
            <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
              SRM Campus Parking Rules
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#B8B2C2", lineHeight: 1.5 }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ color: "#60A5FA", fontWeight: 800 }}>•</span>
              <span><strong>90-Minute Grace Period:</strong> You must check in within 90 minutes of your shift starting time. After 90 minutes, no-show status triggers.</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ color: "#60A5FA", fontWeight: 800 }}>•</span>
              <span><strong>QR Code Check-in:</strong> Present the digital booking QR in the Gridee app to security/boom barrier scanners upon entering Kattankulathur gate.</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ color: "#60A5FA", fontWeight: 800 }}>•</span>
              <span><strong>1 Booking per Student:</strong> Gridee restricts concurrent reservations to 1 active booking per user ID.</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ color: "#60A5FA", fontWeight: 800 }}>•</span>
              <span><strong>Late Checkout Grace:</strong> A 10-minute grace window is provided at checkout before overtime penalty escalation begins.</span>
            </div>
          </div>
        </section>
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#12121A",
            border: "1px solid #292532",
            borderRadius: "16px",
            maxWidth: "400px",
            width: "100%",
            padding: "24px",
            position: "relative"
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "#8F8998",
                cursor: "pointer"
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <User size={20} color="#60A5FA" />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#F7F5FA" }}>
                Connect Gridee Account
              </h3>
            </div>

            <p style={{ fontSize: "12px", color: "#8F8998", margin: "0 0 16px" }}>
              Sign in with your Gridee credentials to unlock real-time TP & Java slots and book directly in Nexus.
            </p>

            {/* Mode Switcher */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px", background: "#0E0E15", padding: "4px", borderRadius: "8px", border: "1px solid #292532" }}>
              <button
                type="button"
                onClick={() => setLoginMode("email")}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer",
                  background: loginMode === "email" ? "#2563EB" : "transparent",
                  color: loginMode === "email" ? "#FFF" : "#8F8998"
                }}
              >
                Email & Password (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("token")}
                style={{
                  flex: 0.6,
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer",
                  background: loginMode === "token" ? "#2563EB" : "transparent",
                  color: loginMode === "token" ? "#FFF" : "#8F8998"
                }}
              >
                Direct Token
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {loginMode === "email" ? (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#8F8998", marginBottom: "4px" }}>
                      Gridee Account Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{ width: "100%", background: "#0E0E15", border: "1px solid #292532", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "#FFF", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#8F8998", marginBottom: "4px" }}>
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{ width: "100%", background: "#0E0E15", border: "1px solid #292532", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "#FFF", outline: "none" }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#8F8998", marginBottom: "4px" }}>
                    Bearer Token / JWT
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Paste Gridee Bearer access token here..."
                    value={loginToken}
                    onChange={(e) => setLoginToken(e.target.value)}
                    style={{ width: "100%", background: "#0E0E15", border: "1px solid #292532", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#FFF", outline: "none" }}
                  />
                </div>
              )}

              {loginError && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", padding: "8px 10px", fontSize: "11.5px", color: "#EF4444" }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  background: "#2563EB",
                  color: "#FFF",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: loginLoading ? "default" : "pointer",
                  marginTop: "4px"
                }}
              >
                {loginLoading ? "Authenticating with Gridee…" : "Sign In & Connect"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
