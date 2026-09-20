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
  Coffee
} from "lucide-react";
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
  const [loginMode, setLoginMode] = useState<"google" | "email" | "token">("google");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginToken, setLoginToken] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Zone & Spot Selection
  const [activeZone, setActiveZone] = useState<"TP" | "JAVA">("TP");
  const [selectedShift, setSelectedShift] = useState<string>("MORNING");
  const [selectedSpotId, setSelectedSpotId] = useState<string>("TP-01");

  // Real Spots & Bookings
  const [realSpots, setRealSpots] = useState<any[] | null>(null);
  const [spotsLoading, setSpotsLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

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

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gridee_nexus_session");
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed loading session", e);
    }
  }, []);

  // Fetch real spots when authenticated
  const fetchRealSpots = async (token: string) => {
    try {
      setSpotsLoading(true);
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
        }
      }
    } catch (e) {
      console.warn("Could not fetch user bookings", e);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchRealSpots(session.accessToken);
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

  // Update default slot selection when zone changes
  useEffect(() => {
    setSelectedSpotId(`${activeZone}-01`);
  }, [activeZone]);

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
      setLoginError(err.message || "Google Sign-In failed or popup was closed.");
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
          parkingSpotId: selectedSpotId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBookingError(data.error || "Booking was not accepted by Gridee.");
        return;
      }

      setBookingSuccess(`Slot booked successfully! Reference: ${data.booking?.bookingId || data.booking?.id || "CONFIRMED"}`);
      fetchRealSpots(session.accessToken);
      fetchUserBookings(session.accessToken, userId);
    } catch (err: any) {
      setBookingError(err.message || "Failed to submit booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  // 10 spots for TP, 10 spots for Java
  const currentSlots = Array.from({ length: 10 }).map((_, index) => {
    const num = index + 1;
    const label = `${activeZone}-${num < 10 ? "0" + num : num}`;
    return {
      id: label,
      number: num,
      zone: activeZone,
    };
  });

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
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: activeZone === "TP" ? "#FFF" : "#F7F5FA" }}>Tech Park (TP)</p>
                    <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#8F8998" }}>Near TP & Main Building</p>
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
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: activeZone === "JAVA" ? "#FFF" : "#F7F5FA" }}>Java Ground</p>
                    <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#8F8998" }}>Behind Java Canteen & Mech</p>
                  </div>
                </button>
              </div>
            </section>

            {/* Visual Slots Grid for the Active Zone */}
            <section style={{
              background: "#12121A",
              border: "1px solid #292532",
              borderRadius: "14px",
              padding: "18px 20px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Car size={16} color="#60A5FA" />
                  <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#F7F5FA" }}>
                    {activeZone === "TP" ? "Tech Park (TP) Bays" : "Java Ground Bays"}
                  </h2>
                </div>
                <span style={{ fontSize: "11.5px", color: "#10B981", fontWeight: 750, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "3px 8px", borderRadius: "6px" }}>
                  Selected: {selectedSpotId}
                </span>
              </div>

              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#8F8998" }}>
                Select a slot bay below for your reservation:
              </p>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: "8px"
              }}>
                {currentSlots.map((slot) => {
                  const isSelected = selectedSpotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSpotId(slot.id)}
                      style={{
                        background: isSelected ? "rgba(37, 99, 235, 0.18)" : "#0E0E15",
                        border: `1.5px solid ${isSelected ? "#2563EB" : "#292532"}`,
                        borderRadius: "10px",
                        padding: "12px 8px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        position: "relative"
                      }}
                    >
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: isSelected ? "#2563EB" : "#1E1E28",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isSelected ? "#FFF" : "#60A5FA"
                      }}>
                        <Car size={16} />
                      </div>
                      <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 800, color: isSelected ? "#FFF" : "#F7F5FA" }}>
                        {slot.id}
                      </p>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: isSelected ? "#60A5FA" : "#10B981" }}>
                        {isSelected ? "Selected" : "Available"}
                      </span>
                      {isSelected && (
                        <div style={{ position: "absolute", top: "4px", right: "6px" }}>
                          <CheckCircle2 size={13} color="#60A5FA" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

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
                {/* Target Bay Indicator */}
                <div style={{
                  background: "#0E0E15",
                  border: "1px solid #292532",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span style={{ fontSize: "11.5px", color: "#8F8998", fontWeight: 700, textTransform: "uppercase" }}>
                    Target Bay
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#10B981" }}>
                    {activeZone === "TP" ? "Tech Park" : "Java Ground"} • {selectedSpotId}
                  </span>
                </div>

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
                  {bookingLoading ? "Processing Booking…" : `Confirm & Book ${selectedSpotId}`}
                </button>
              </form>
            </section>
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

            {/* Google One-Tap Action */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loginLoading}
              style={{
                width: "100%",
                background: "#FFF",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                fontSize: "13px",
                fontWeight: 750,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: loginLoading ? "default" : "pointer",
                marginBottom: "14px"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#292532" }} />
              <span style={{ fontSize: "11px", color: "#8F8998", textTransform: "uppercase" }}>or sign in with email</span>
              <div style={{ flex: 1, height: "1px", background: "#292532" }} />
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px", background: "#0E0E15", padding: "4px", borderRadius: "8px", border: "1px solid #292532" }}>
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
