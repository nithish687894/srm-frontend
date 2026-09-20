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
  X
} from "lucide-react";

interface ParkingSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface ParkingLotData {
  id: string;
  name: string;
  organizationName: string;
  locationName: string;
  address: string;
  totalSpots: number;
  availableSpots: number;
  active: boolean;
  bookingPolicy: {
    bookingMode: string;
    advanceBookingDays: number;
    nextDayBookingOpenTime: string;
    fixedSlots: ParkingSlot[];
    noShowGraceMinutes: number;
    lateCheckoutGracePeriodMinutes: number;
    welcomeBonusAmount?: number;
  };
}

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

  const [lotData, setLotData] = useState<ParkingLotData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Authenticated User Session
  const [session, setSession] = useState<GrideeSession | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<"email" | "token">("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginToken, setLoginToken] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Authenticated real spots & bookings
  const [realSpots, setRealSpots] = useState<any[] | null>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Booking Form State
  const [selectedShift, setSelectedShift] = useState<string>("MORNING");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  // Countdown to 18:30 IST (Booking open time)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Local storage vehicle numbers quick vault
  const [savedVehicles, setSavedVehicles] = useState<{ id: string; label: string; plate: string }[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load session from localStorage
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem("gridee_nexus_session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
      }
    } catch (e) {
      console.error("Failed loading Gridee session", e);
    }
  }, []);

  // Fetch live lot data
  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/gridee");
      if (res.ok) {
        const json = await res.json();
        if (json.lot) {
          setLotData(json.lot);
          setIsLive(json.isLive ?? false);
          setLastUpdated(json.lastUpdated ? new Date(json.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "");
        }
      }
    } catch (err) {
      console.error("Failed to fetch parking status", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch real spots if authenticated
  const fetchAuthenticatedSpots = async (token: string) => {
    try {
      const res = await fetch("/api/gridee/spots", {
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
    }
  };

  // Fetch user bookings if authenticated
  const fetchUserBookings = async (token: string, userId: string) => {
    try {
      const res = await fetch(`/api/gridee/my-bookings?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.bookings) {
          setMyBookings(data.bookings);
        }
      }
    } catch (e) {
      console.warn("Could not fetch user bookings", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      fetchAuthenticatedSpots(session.accessToken);
      const uId = session.user?.id || session.user?.userId;
      if (uId) {
        fetchUserBookings(session.accessToken, uId);
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
      } else {
        const sample = [{ id: "1", label: "Two Wheeler (Bike)", plate: "TN 19 AX 0000" }];
        setSavedVehicles(sample);
        setSelectedVehicle("TN 19 AX 0000");
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

  // Handle Login Submission
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
      const res = await fetch("/api/gridee/book", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          vehicleNumber: plate,
          slotId: selectedShift,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBookingError(data.error || "Booking was not accepted by Gridee.");
        return;
      }

      setBookingSuccess(`Slot booked successfully! Booking Reference: ${data.booking?.bookingId || data.booking?.id || "CONFIRMED"}`);
      fetchAuthenticatedSpots(session.accessToken);
      fetchUserBookings(session.accessToken, userId);
    } catch (err: any) {
      setBookingError(err.message || "Failed to submit booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  const totalSpots = lotData?.totalSpots ?? 10;
  // If authenticated spots are available, use length of available spots; otherwise use public lotData count
  const liveSpotCount = realSpots !== null ? realSpots.length : (lotData?.availableSpots ?? 0);
  const isFull = liveSpotCount === 0;

  return (
    <div style={{
      background: "#09090F",
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      color: "#F7F5FA",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Top Bar */}
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "#10B981", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "4px 8px", borderRadius: "6px", fontWeight: 700 }}>
                  {session.user?.email ? session.user.email.split("@")[0] : "Logged In"}
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

            <button
              onClick={fetchStatus}
              disabled={refreshing}
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
                cursor: refreshing ? "default" : "pointer"
              }}
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Syncing…" : "Refresh"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
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
        {/* Account Authentication Banner if not signed in */}
        {!session && (
          <div style={{
            background: "rgba(37, 99, 235, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.25)",
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={16} color="#60A5FA" />
              <p style={{ margin: 0, fontSize: "12.5px", color: "#D1CBD7" }}>
                <strong>Sign in to unlock live spot numbers</strong> and book parking directly from Nexus.
              </p>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: "#2563EB",
                color: "#FFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: 750,
                cursor: "pointer"
              }}
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* 1. Live Parking Status Card */}
        <section style={{
          background: "#12121A",
          border: `1px solid ${isFull ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
          borderRadius: "14px",
          padding: "20px",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Header & Badges */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isLive ? "#10B981" : "#F59E0B",
                boxShadow: isLive ? "0 0 10px #10B981" : "none"
              }} />
              <span style={{ fontSize: "11px", fontWeight: 750, color: isLive ? "#10B981" : "#F59E0B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {session ? "Authenticated Live Feed" : (isLive ? "Public Server Connected" : "Cached State")}
              </span>
              {lastUpdated && (
                <span style={{ fontSize: "11px", color: "#8F8998" }}>• Updated {lastUpdated}</span>
              )}
            </div>

            <span style={{
              background: isFull ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              color: isFull ? "#EF4444" : "#10B981",
              border: `1px solid ${isFull ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "11.5px",
              fontWeight: 800,
              letterSpacing: "0.04em"
            }}>
              {isFull ? "LOT CURRENTLY FULL" : `${liveSpotCount} SPOTS AVAILABLE`}
            </span>
          </div>

          {/* Big Spot Numbers */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "44px", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: isFull ? "#EF4444" : "#10B981" }}>
              {liveSpotCount}
            </span>
            <span style={{ fontSize: "18px", color: "#8F8998", fontWeight: 700 }}>
              / {totalSpots} spots available
            </span>
          </div>

          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#B8B2C2", display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={14} color="#60A5FA" />
            <span>SRM Kattankulathur Campus • Potheri, Chennai</span>
          </p>

          {/* Real Spots list if unlocked via auth */}
          {session && realSpots && realSpots.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 750, color: "#60A5FA", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
                Unlocked Spots ({realSpots.length})
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {realSpots.map((sp: any, i: number) => (
                  <span
                    key={sp.id || i}
                    style={{
                      background: "#1E1E28",
                      border: "1px solid #292532",
                      color: "#F7F5FA",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "6px"
                    }}
                  >
                    Spot {sp.spotNumber || sp.name || (i + 1)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Info bar */}
          <div style={{
            background: "#0E0E15",
            borderRadius: "10px",
            padding: "12px 14px",
            border: "1px solid #292532",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <div style={{ fontSize: "12px", color: "#8F8998", display: "flex", alignItems: "center", gap: "6px" }}>
              <Info size={14} color="#60A5FA" />
              <span>Next Day Booking Opens Daily at <strong>18:30 IST (6:30 PM)</strong></span>
            </div>
            <span style={{ fontSize: "11.5px", color: "#60A5FA", fontWeight: 700 }}>
              1 Day Advance
            </span>
          </div>
        </section>

        {/* 2. Direct In-App Booking Console */}
        <section style={{
          background: "#12121A",
          border: "1px solid #292532",
          borderRadius: "14px",
          padding: "18px 20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <CalendarCheck size={16} color="#60A5FA" />
            <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
              Book Parking Slot (Nexus In-App)
            </h2>
          </div>

          <form onSubmit={handleBookSlot} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Shift Picker */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 750, color: "#8F8998", marginBottom: "6px", textTransform: "uppercase" }}>
                Select Parking Shift
              </label>
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
                      padding: "8px 6px",
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
                    <div style={{ fontSize: "9.5px", opacity: 0.8, marginTop: "2px" }}>{s.time}</div>
                  </button>
                ))}
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
                background: session ? "#2563EB" : "#1E1E28",
                border: session ? "none" : "1px solid #292532",
                color: "#FFF",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: bookingLoading ? "default" : "pointer",
                marginTop: "4px"
              }}
            >
              {bookingLoading ? "Processing Booking…" : (session ? "Confirm & Book Slot Now" : "Sign In to Book Slot")}
            </button>
          </form>
        </section>

        {/* 3. Daily 18:30 Booking Rush Countdown */}
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

          {/* Digital Clock Grid */}
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

        {/* 4. Vehicle Plate Quick Vault */}
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

        {/* 5. Official Rules & Policies */}
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
              Sign in with your Gridee credentials to unlock real-time live spots and book directly in Nexus.
            </p>

            {/* Mode Switcher */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", background: "#0E0E15", padding: "4px", borderRadius: "8px", border: "1px solid #292532" }}>
              <button
                type="button"
                onClick={() => setLoginMode("email")}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer",
                  background: loginMode === "email" ? "#2563EB" : "transparent",
                  color: loginMode === "email" ? "#FFF" : "#8F8998"
                }}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("token")}
                style={{
                  flex: 1,
                  padding: "6px",
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
                  marginTop: "6px"
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
