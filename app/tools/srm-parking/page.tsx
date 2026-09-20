"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Info
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

export default function SrmParkingToolPage() {
  const router = useRouter();

  const [lotData, setLotData] = useState<ParkingLotData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch live lot data from proxy route
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

  useEffect(() => {
    fetchStatus();
    // Refresh every 45s
    const interval = setInterval(fetchStatus, 45000);
    return () => clearInterval(interval);
  }, []);

  // Load saved vehicles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("srm_nexus_saved_vehicles");
      if (stored) {
        setSavedVehicles(JSON.parse(stored));
      } else {
        // Preset sample
        setSavedVehicles([
          { id: "1", label: "Two Wheeler (Bike)", plate: "TN 19 AX 0000" }
        ]);
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
      // Target today at 18:30
      const target = new Date();
      target.setHours(18, 30, 0, 0);

      // If already past 18:30 today, count down to tomorrow 18:30
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

  const totalSpots = lotData?.totalSpots ?? 10;
  const availableSpots = lotData?.availableSpots ?? 0;
  const isFull = availableSpots === 0;

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                {isLive ? "Live Server Connected" : "Cached State"}
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
              {isFull ? "LOT CURRENTLY FULL" : `${availableSpots} SPOTS AVAILABLE`}
            </span>
          </div>

          {/* Big Spot Numbers */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "44px", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: isFull ? "#EF4444" : "#10B981" }}>
              {availableSpots}
            </span>
            <span style={{ fontSize: "18px", color: "#8F8998", fontWeight: 700 }}>
              / {totalSpots} spots available
            </span>
          </div>

          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#B8B2C2", display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={14} color="#60A5FA" />
            <span>SRM Kattankulathur Campus • Potheri, Chennai</span>
          </p>

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

        {/* 2. Daily 18:30 Booking Rush Countdown */}
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

        {/* 3. Fixed Shift Slots Breakdown */}
        <section style={{
          background: "#12121A",
          border: "1px solid #292532",
          borderRadius: "14px",
          padding: "18px 20px"
        }}>
          <h2 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 12px", color: "#F7F5FA" }}>
            Campus Fixed Parking Shifts
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { id: "MORNING", name: "Morning Shift", time: "08:00 AM – 12:30 PM", desc: "Best for morning theory & lab classes" },
              { id: "AFTERNOON", name: "Afternoon Shift", time: "12:30 PM – 05:30 PM", desc: "For post-lunch batch and afternoon lab sessions" },
              { id: "FULL_DAY", name: "Full Day Parking", time: "08:00 AM – 05:30 PM", desc: "Covers entire working day & day orders 1–5" },
            ].map((shift) => {
              const isActive = currentShiftId === shift.id;
              return (
                <div
                  key={shift.id}
                  style={{
                    background: isActive ? "rgba(37, 99, 235, 0.08)" : "#0E0E15",
                    border: `1px solid ${isActive ? "#2563EB" : "#292532"}`,
                    borderRadius: "10px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 750, color: "#F7F5FA" }}>
                        {shift.name}
                      </p>
                      {isActive && (
                        <span style={{
                          background: "#2563EB",
                          color: "#FFF",
                          fontSize: "9.5px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase"
                        }}>
                          Current Shift
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#8F8998" }}>
                      {shift.desc}
                    </p>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 750, color: "#60A5FA", whiteSpace: "nowrap" }}>
                    {shift.time}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Vehicle Plate Quick Vault (For 1-Tap Copy when booking) */}
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

        {/* 5. Launch Official Gridee App */}
        <section style={{
          background: "#12121A",
          border: "1px solid #292532",
          borderRadius: "14px",
          padding: "18px 20px"
        }}>
          <h2 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 4px", color: "#F7F5FA" }}>
            Book & Check-in via Gridee
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#9C96A7" }}>
            Slots and QR check-in are validated at the boom barrier via the Gridee app.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <a
              href="https://play.google.com/store/apps/details?id=com.gridee.parking"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#0E0E15",
                border: "1px solid #292532",
                borderRadius: "10px",
                padding: "12px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#F7F5FA"
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 750 }}>Android App</p>
                <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#8F8998" }}>Google Play Store</p>
              </div>
              <ExternalLink size={14} color="#60A5FA" />
            </a>

            <a
              href="https://apps.apple.com/in/app/grideeapp/id6757460398"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#0E0E15",
                border: "1px solid #292532",
                borderRadius: "10px",
                padding: "12px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#F7F5FA"
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 750 }}>iOS App</p>
                <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "#8F8998" }}>Apple App Store</p>
              </div>
              <ExternalLink size={14} color="#60A5FA" />
            </a>
          </div>
        </section>

        {/* 6. Official Rules & Policies */}
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
    </div>
  );
}
