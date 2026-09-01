"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Activity, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  RefreshCcw, 
  Clock, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  Calendar,
  Plus,
  Minus,
  TrendingUp,
  ArrowUpDown,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import { AURA_COLORS as SHARED_AURA } from "./system/theme-tokens";

const AURA_COLORS = SHARED_AURA;

const getStatusColor = (pct: number) => {
  if (pct === 0) return "#94A3B8";
  if (pct < 75) return "#EF4444"; // Vivid Red
  if (pct < 80) return "#F59E0B"; // Amber Warning
  if (pct < 90) return "#A855F7"; // Lumina Purple
  return "#10B981"; // Emerald Green
};

const getStatusBg = (pct: number) => {
  if (pct === 0) return "rgba(148, 163, 184, 0.12)";
  if (pct < 75) return "rgba(239, 68, 68, 0.12)";
  if (pct < 80) return "rgba(245, 158, 11, 0.12)";
  if (pct < 90) return "rgba(168, 85, 247, 0.12)";
  return "rgba(16, 185, 129, 0.12)";
};

const getStatusBorder = (pct: number) => {
  if (pct === 0) return "rgba(148, 163, 184, 0.25)";
  if (pct < 75) return "rgba(239, 68, 68, 0.28)";
  if (pct < 80) return "rgba(245, 158, 11, 0.28)";
  if (pct < 90) return "rgba(168, 85, 247, 0.28)";
  return "rgba(16, 185, 129, 0.28)";
};

const getStatusLabel = (pct: number) => {
  if (pct === 0) return "NO DATA";
  if (pct < 75) return "AT RISK";
  if (pct < 80) return "NEEDS ATTENTION";
  if (pct < 90) return "ON TRACK";
  return "EXCELLENT";
};

const getProgressBarGradient = (pct: number) => {
  if (pct < 75) return "linear-gradient(90deg, #F87171 0%, #EF4444 100%)";
  if (pct < 80) return "linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)";
  if (pct < 90) return "linear-gradient(90deg, #C084FC 0%, #A855F7 100%)";
  return "linear-gradient(90deg, #34D399 0%, #10B981 100%)";
};

export default function AuraAttendance({ 
  attendance = [], 
  handleSync, 
  isSyncing = false, 
  isLoading = false,
  timeAgoStr = "",
  showPredictor: externalShowPredictor, 
  setShowPredictor: externalSetShowPredictor, 
  next30Days = [], 
  selectedDates = new Set(), 
  toggleDate, 
  calculatePredictions, 
  predictions, 
  setSelectedDates: _setSelectedDates, 
  setPredictions: _setPredictions,
  studentPortalStatus = "disconnected",
  lastSyncedStr = ""
}: AnyValue) {
  const [filter, setFilter] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<AnyValue | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [skipStepperCount, setSkipStepperCount] = useState<number>(1);
  const [predictorMode, setPredictorMode] = useState<"quick" | "calendar">("quick");
  const [localShowPredictor, setLocalShowPredictor] = useState(false);
  const { activeTheme, stars } = useAuraTheme();

  const isSpConnected = studentPortalStatus === "connected";

  const isPredictorOpen = externalShowPredictor !== undefined ? externalShowPredictor : localShowPredictor;
  const setPredictorOpen = useCallback((val: boolean) => {
    if (externalSetShowPredictor) {
      externalSetShowPredictor(val);
    } else {
      setLocalShowPredictor(val);
    }
  }, [externalSetShowPredictor]);

  // Scroll listener for sticky header
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const onScroll = () => {
      const scrolled = window.scrollY > 180 || (mainEl ? mainEl.scrollTop > 180 : false);
      setIsScrolled(scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (mainEl) mainEl.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (mainEl) mainEl.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Always scroll to top on mount
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {}
  }, []);

  // Handle browser back button when modal is open
  useEffect(() => {
    const handlePopState = () => {
      if (selectedSubject) setSelectedSubject(null);
      if (isPredictorOpen) setPredictorOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedSubject, isPredictorOpen, setPredictorOpen]);

  // Open modal handler with history push
  const handleOpenSubject = useCallback((sub: AnyValue) => {
    if (!sub) return;
    try {
      window.history.pushState({ modal: "subject_detail" }, "");
    } catch {}
    setSelectedSubject(sub);
  }, []);

  const handleCloseSubject = useCallback(() => {
    setSelectedSubject(null);
    if (window.history.state?.modal === "subject_detail") {
      try { window.history.back(); } catch {}
    }
  }, []);

  // Process attendance data with complete null safety
  const processedAttendance = useMemo(() => {
    if (!Array.isArray(attendance) || attendance.length === 0) return [];

    const MONTH_REGEX = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-\s_]?\d{2,4}$/i;

    return attendance.filter((a: AnyValue) => {
      if (!a || typeof a !== "object") return false;
      const code = String(a["Course Code"] || a.courseCode || a.code || "").trim();
      const title = String(a["Course Title"] || a.courseTitle || a.title || "").trim();
      if (MONTH_REGEX.test(code) || MONTH_REGEX.test(title)) return false;
      if (code.toLowerCase().includes('total') || code.toLowerCase().includes('aggregate')) return false;
      return true;
    }).map((a: AnyValue) => {
      const pctStr = a["Attn %"] ?? a.pct ?? a.percentage ?? a.attendancePercentage;
      const parsedPct = parseFloat(String(pctStr)) || 0;
      let conducted = parseInt(String(a["Hours Conducted"] ?? a.conducted ?? a.hoursConducted)) || 0;
      let absent = parseInt(String(a["Hours Absent"] ?? a.absent ?? a.hoursAbsent)) || 0;
      
      if (conducted === 0 && pctStr !== undefined && pctStr !== null && pctStr !== "null") {
        conducted = 30;
        const presentEst = Math.round(conducted * (parsedPct / 100));
        absent = conducted - presentEst;
      }
      
      const attended = parseInt(String(a["Hours Attended"] ?? a.attended ?? a.hoursPresent ?? a.present)) || Math.max(0, conducted - absent);
      const pct = (pctStr !== undefined && pctStr !== null && pctStr !== "null" && !isNaN(parsedPct))
        ? parsedPct
        : (conducted > 0 ? (attended / conducted) * 100 : 100);

      const skipBuffer = Math.max(0, Math.floor((attended - 0.75 * conducted) / 0.75));
      const requiredToPass = Math.max(0, Math.ceil(3 * conducted - 4 * attended));
      
      // Simulation steps [1, 2, 3, 5]
      const simSteps = [1, 2, 3, 5];
      const skipSimulations = simSteps.map((skips) => {
        const nextConducted = conducted + skips;
        const nextPct = nextConducted > 0 ? (attended / nextConducted) * 100 : 0;
        return { skips, nextPct, safe: nextPct >= 75 };
      });

      const attendSimulations = simSteps.map((extra) => {
        const nextConducted = conducted + extra;
        const nextAttended = attended + extra;
        const nextPct = nextConducted > 0 ? (nextAttended / nextConducted) * 100 : 0;
        return { extra, nextPct, safe: nextPct >= 75 };
      });

      // Quick stepper projection
      const stepperNextConducted = conducted + skipStepperCount;
      const stepperNextPct = stepperNextConducted > 0 ? (attended / stepperNextConducted) * 100 : 0;

      return { 
        ...a, 
        courseCode: a["Course Code"] || a.courseCode || a.code || "COURSE",
        courseTitle: a["Course Title"] || a.courseTitle || a.title || a.description || "Subject",
        category: a["Category"] || a.category || a.courseType || "",
        conducted, 
        attended, 
        absent, 
        pct, 
        skipBuffer, 
        requiredToPass,
        skipSimulations,
        attendSimulations,
        stepperNextPct,
        stepperSafe: stepperNextPct >= 75
      };
    }).filter(Boolean);
  }, [attendance, skipStepperCount]);

  const stats = useMemo(() => {
    const totalSubs = processedAttendance.length;
    const totalAttended = processedAttendance.reduce((sum: number, a: AnyValue) => sum + (a?.attended || 0), 0);
    const totalConducted = processedAttendance.reduce((sum: number, a: AnyValue) => sum + (a?.conducted || 0), 0);
    const totalAbsent = processedAttendance.reduce((sum: number, a: AnyValue) => sum + (a?.absent || 0), 0);
    const calculatedAvg = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    const overallAvg = Math.min(100, Math.max(0, calculatedAvg));
    const atRiskList = processedAttendance.filter((a: AnyValue) => (a?.pct || 0) < 75);
    const safeList = processedAttendance.filter((a: AnyValue) => (a?.pct || 0) >= 75);
    const totalSkipsAllowed = safeList.reduce((sum: number, a: AnyValue) => sum + (a?.skipBuffer || 0), 0);
    
    return { 
      totalSubs, 
      totalAttended, 
      totalConducted, 
      totalAbsent, 
      overallAvg, 
      atRiskCount: atRiskList.length,
      safeCount: safeList.length,
      totalSkipsAllowed,
      atRiskList
    };
  }, [processedAttendance]);

  const filteredAttendance = useMemo(() => {
    let result = [...processedAttendance];
    
    // Apply primary filter
    if (filter === "At Risk") {
      result = result.filter((a: AnyValue) => (a?.pct || 0) < 75);
    } else if (filter === "Safe") {
      result = result.filter((a: AnyValue) => (a?.pct || 0) >= 75);
    }

    // Apply sorting
    if (sortOption === "lowest") {
      result.sort((a: AnyValue, b: AnyValue) => (a?.pct || 0) - (b?.pct || 0));
    } else if (sortOption === "highest") {
      result.sort((a: AnyValue, b: AnyValue) => (b?.pct || 0) - (a?.pct || 0));
    } else if (sortOption === "alpha") {
      result.sort((a: AnyValue, b: AnyValue) => (a?.courseTitle || "").localeCompare(b?.courseTitle || ""));
    }

    return result;
  }, [processedAttendance, filter, sortOption]);

  // SVG Radial Ring Metrics
  const ringRadius = 50;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (Math.min(100, Math.max(0, stats.overallAvg)) / 100) * ringCircumference;
  const ringColor = getStatusColor(stats.overallAvg);

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .attendance-container {
          width: 100%;
          max-width: 540px;
          margin: 0 auto;
          padding: 0 16px;
          box-sizing: border-box;
        }

        .sticky-header {
          position: fixed; 
          top: calc(env(safe-area-inset-top, 0px) + 12px); 
          left: 16px; 
          right: 16px; 
          max-width: 508px;
          margin: 0 auto;
          border-radius: 18px;
          background: rgba(14, 10, 24, 0.94); 
          backdrop-filter: blur(24px); 
          -webkit-backdrop-filter: blur(24px);
          padding: 10px 16px; 
          border: 1px solid rgba(168, 85, 247, 0.22);
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          z-index: 100; 
          transform: translateY(-150%); 
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        }
        .sticky-header.visible { transform: translateY(0); }

        .subject-card {
          background: rgba(22, 16, 36, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 14px 16px;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }
        .subject-card:hover {
          transform: translateY(-1.5px);
          border-color: rgba(168, 85, 247, 0.35);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(168, 85, 247, 0.08);
        }
        .subject-card:active {
          transform: scale(0.988);
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 3, 10, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 999999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: modalFadeIn 0.2s ease-out;
        }
        @media (min-width: 640px) {
          .modal-overlay {
            align-items: center;
            padding: 20px;
          }
        }
        .modal-sheet {
          width: 100%;
          max-width: 500px;
          max-height: 88vh;
          background: linear-gradient(165deg, rgba(26, 19, 44, 0.99) 0%, rgba(12, 9, 22, 0.99) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 28px 28px 0 0;
          padding: 20px 20px calc(env(safe-area-inset-bottom, 0px) + 80px);
          overflow-y: auto;
          position: relative;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
          animation: sheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 640px) {
          .modal-sheet {
            border-radius: 24px;
            padding: 24px;
          }
        }

        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}} />

      {/* Sticky Header on Scroll */}
      <div className={`sticky-header ${isScrolled ? 'visible' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ringColor }} />
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Attendance</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 950, color: ringColor }} className="tabular-nums">
            {stats.overallAvg.toFixed(1)}%
          </span>
          {stats.atRiskCount > 0 ? (
            <span style={{ fontSize: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>
              {stats.atRiskCount} RISK
            </span>
          ) : (
            <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>
              ALL SAFE
            </span>
          )}
        </div>
      </div>

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 68px)', 
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)' 
      }}>
        
        <div className="attendance-container">
          
          {/* Header Title & Sync Action */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
            <div>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.24)',
                borderRadius: '100px',
                padding: '2px 8px',
                marginBottom: '6px'
              }}>
                <Sparkles size={11} color="#C084FC" />
                <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#C084FC", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ATTENDANCE
                </span>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, letterSpacing: '-0.8px', lineHeight: 1.1, color: '#fff' }}>
                Attendance
              </h1>
            </div>

            {/* Sync Button & Timestamp */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', paddingTop: '2px' }}>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                aria-label={isSpConnected ? "Sync attendance" : "Reconnect Student Portal"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSpConnected ? 'rgba(168, 85, 247, 0.14)' : 'rgba(245, 158, 11, 0.15)',
                  border: isSpConnected ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  color: isSpConnected ? '#C084FC' : '#F59E0B',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: isSyncing ? 'wait' : 'pointer',
                  transition: 'all 0.18s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                <RefreshCcw size={11} className={isSyncing ? "animate-spin" : ""} color={isSpConnected ? "#C084FC" : "#F59E0B"} />
                <span>{isSpConnected ? (isSyncing ? "Syncing..." : "Sync") : "Reconnect"}</span>
              </button>

              {timeAgoStr && (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '10px', 
                  fontWeight: 600, 
                  color: 'rgba(255, 255, 255, 0.45)'
                }}>
                  <Clock size={10} color="rgba(255, 255, 255, 0.35)" />
                  <span>{timeAgoStr}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compact Offline Status Strip */}
          {!isSpConnected && attendance.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.22)',
              borderRadius: '14px',
              padding: '8px 14px',
              marginBottom: '14px',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} color="#F59E0B" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 700 }}>
                  Offline · Last synced <strong style={{ color: '#F59E0B' }}>{lastSyncedStr || 'recently'}</strong>
                </span>
              </div>
              <button
                onClick={handleSync}
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: 'none',
                  color: '#F59E0B',
                  fontSize: '10.5px',
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Reconnect
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              HERO ATTENDANCE CARD: 79.7% Overall Attendance + Ring + Stat Pills
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(32, 23, 56, 0.88) 0%, rgba(16, 12, 28, 0.88) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(168, 85, 247, 0.22)',
            borderRadius: '22px',
            padding: '18px 20px',
            marginBottom: '14px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(168, 85, 247, 0.06)'
          }}>
            {/* Background ambient glow */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: ringColor,
              filter: 'blur(45px)',
              opacity: 0.16,
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              
              {/* Left Column: Metric Summary & Status Pill */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  background: getStatusBg(stats.overallAvg), 
                  border: `1px solid ${getStatusBorder(stats.overallAvg)}`,
                  padding: '3px 9px', 
                  borderRadius: '100px',
                  marginBottom: '8px'
                }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: ringColor }} />
                  <span style={{ fontSize: '9.5px', fontWeight: 900, color: ringColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {getStatusLabel(stats.overallAvg)}
                  </span>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Overall Attendance
                </div>

                {/* Counter Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '5px 9px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <BookOpen size={11} color="#C084FC" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                      {stats.totalSubs} <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600 }}>Subjects</span>
                    </span>
                  </div>

                  <div 
                    onClick={() => setFilter("At Risk")}
                    style={{
                      background: stats.atRiskCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${stats.atRiskCount > 0 ? 'rgba(239, 68, 68, 0.28)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '10px',
                      padding: '5px 9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <AlertTriangle size={11} color={stats.atRiskCount > 0 ? '#EF4444' : '#10B981'} />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: stats.atRiskCount > 0 ? '#EF4444' : '#10B981' }}>
                      {stats.atRiskCount} <span style={{ color: stats.atRiskCount > 0 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(255, 255, 255, 0.45)', fontWeight: 600 }}>At Risk</span>
                    </span>
                  </div>

                  {stats.totalSkipsAllowed > 0 && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '10px',
                      padding: '5px 9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <ShieldCheck size={11} color="#10B981" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981' }}>
                        {stats.totalSkipsAllowed} <span style={{ color: 'rgba(16, 185, 129, 0.75)', fontWeight: 600 }}>Safe Skips</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Radial Progress Dial */}
              <div style={{ position: 'relative', width: '118px', height: '118px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="118" height="118" viewBox="0 0 118 118" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Track */}
                  <circle
                    cx="59"
                    cy="59"
                    r={ringRadius}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="8"
                  />
                  {/* Glowing Progress Arc */}
                  <circle
                    cx="59"
                    cy="59"
                    r={ringRadius}
                    fill="transparent"
                    stroke={ringColor}
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: `drop-shadow(0 0 6px ${ringColor}50)`
                    }}
                  />
                </svg>

                {/* Centered Percentage */}
                <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '25px', fontWeight: 950, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }} className="tabular-nums">
                    {stats.overallAvg.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', marginTop: '3px' }}>
                    {stats.totalAttended}/{stats.totalConducted}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              AT-RISK ALERT BANNER: Actionable & Distinct
          ══════════════════════════════════════════════════════════════════════ */}
          {stats.atRiskCount > 0 && filter !== "At Risk" && (
            <div 
              onClick={() => setFilter("At Risk")}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.06) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                borderRadius: '15px',
                padding: '11px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '9px', 
                  background: 'rgba(239, 68, 68, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertCircle size={16} color="#EF4444" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                    {stats.atRiskCount} {stats.atRiskCount === 1 ? 'Subject' : 'Subjects'} Below 75%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Tap to review required recovery attendance
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '3px', 
                fontSize: '11px', 
                fontWeight: 900, 
                color: '#EF4444',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '4px 9px',
                borderRadius: '8px',
                flexShrink: 0
              }}>
                <span>View</span>
                <ChevronRight size={12} />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              SKIP PREDICTOR: Premium Student Utility Card
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: '14px' }}>
            {!isPredictorOpen ? (
              <div
                onClick={() => setPredictorOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '15px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '9px', 
                    background: 'rgba(168, 85, 247, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Zap size={15} color="#C084FC" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                      ⚡ Skip & Attendance Predictor
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 600, marginTop: '2px' }}>
                      Simulate missing or attending future classes
                    </div>
                  </div>
                </div>
                <ChevronRight size={15} color="#A855F7" />
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(150deg, rgba(28, 20, 48, 0.92) 0%, rgba(15, 11, 26, 0.92) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.28)',
                borderRadius: '18px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '11px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} color="#C084FC" />
                    <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Skip Predictor
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '2px' }}>
                      <button
                        onClick={() => setPredictorMode("quick")}
                        style={{
                          background: predictorMode === "quick" ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                          border: 'none',
                          color: predictorMode === "quick" ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Stepper
                      </button>
                      <button
                        onClick={() => setPredictorMode("calendar")}
                        style={{
                          background: predictorMode === "calendar" ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                          border: 'none',
                          color: predictorMode === "calendar" ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Calendar
                      </button>
                    </div>

                    <button
                      onClick={() => setPredictorOpen(false)}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.08)', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '24px', 
                        height: '24px', 
                        color: '#fff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer' 
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {predictorMode === "quick" ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: 'rgba(255, 255, 255, 0.04)', 
                      border: '1px solid rgba(255, 255, 255, 0.06)', 
                      borderRadius: '13px', 
                      padding: '9px 12px' 
                    }}>
                      <div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                          Simulate Absences
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#fff', marginTop: '1px' }}>
                          Miss {skipStepperCount} {skipStepperCount === 1 ? 'Class' : 'Classes'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                          onClick={() => setSkipStepperCount(Math.max(1, skipStepperCount - 1))}
                          disabled={skipStepperCount <= 1}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: skipStepperCount <= 1 ? 'not-allowed' : 'pointer',
                            opacity: skipStepperCount <= 1 ? 0.3 : 1
                          }}
                        >
                          <Minus size={12} />
                        </button>

                        <span style={{ fontSize: '16px', fontWeight: 950, color: '#C084FC', minWidth: '22px', textAlign: 'center' }} className="tabular-nums">
                          {skipStepperCount}
                        </span>

                        <button
                          onClick={() => setSkipStepperCount(Math.min(20, skipStepperCount + 1))}
                          disabled={skipStepperCount >= 20}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: skipStepperCount >= 20 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '170px', overflowY: 'auto' }} className="hide-scrollbar">
                      {processedAttendance.map((sub: AnyValue, idx: number) => {
                        const nextPct = sub.stepperNextPct || 0;
                        const isSafe = sub.stepperSafe;
                        const statCol = isSafe ? "#10B981" : "#EF4444";
                        return (
                          <div 
                            key={sub.courseCode || idx} 
                            style={{ 
                              background: 'rgba(0, 0, 0, 0.25)', 
                              borderLeft: `3px solid ${statCol}`, 
                              padding: '7px 9px', 
                              borderRadius: '9px', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center' 
                            }}
                          >
                            <div style={{ minWidth: 0, paddingRight: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sub.courseTitle}
                              </div>
                              <div style={{ fontSize: '9px', fontWeight: 800, color: statCol, marginTop: '1px' }}>
                                {isSafe ? `● Safe (${sub.skipBuffer >= skipStepperCount ? `${sub.skipBuffer - skipStepperCount} skips left` : 'limit'})` : `● Falls Below 75%`}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 950, color: statCol }} className="tabular-nums">
                                {sub.pct.toFixed(1)}% → {nextPct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '5px', paddingBottom: '8px', marginBottom: '8px' }}>
                      {next30Days?.map((d: AnyValue) => {
                        const sel = selectedDates?.has?.(d.iso);
                        const isWknd = [0, 6].includes(d.date.getDay());
                        return (
                          <div
                            key={d.iso}
                            onClick={() => !isWknd && toggleDate && toggleDate(d.iso)}
                            style={{
                              flexShrink: 0,
                              width: '38px',
                              height: '48px',
                              borderRadius: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: sel ? 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${sel ? '#F472B6' : 'rgba(255, 255, 255, 0.08)'}`,
                              cursor: isWknd ? 'not-allowed' : 'pointer',
                              opacity: isWknd ? 0.3 : 1,
                              boxShadow: sel ? '0 0 12px rgba(236, 72, 153, 0.35)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '8px', fontWeight: 900, color: sel ? '#fff' : 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                              {d.dayStr}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 950, color: '#fff', marginTop: '1px' }} className="tabular-nums">
                              {d.dateNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={calculatePredictions}
                      style={{
                        width: '100%',
                        padding: '9px',
                        background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                        borderRadius: '11px',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 950,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(168, 85, 247, 0.25)'
                      }}
                    >
                      Forecast Selected ({selectedDates?.size || 0} dates)
                    </button>

                    {predictions && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {predictions.length === 0 ? (
                          <div style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                            No classes scheduled on selected dates.
                          </div>
                        ) : (
                          predictions.map((p: AnyValue, idx: number) => {
                            const col = getStatusColor(p.projPct);
                            return (
                              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${col}`, padding: '7px 9px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ minWidth: 0, paddingRight: '8px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.title}
                                  </div>
                                  <div style={{ fontSize: '9px', fontWeight: 800, color: col }}>
                                    {p.marginLabel}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <span style={{ fontSize: '12.5px', fontWeight: 950, color: col }} className="tabular-nums">
                                    {(p.projPct || 0).toFixed(1)}%
                                  </span>
                                  <div style={{ fontSize: '8.5px', color: 'rgba(255, 255, 255, 0.45)' }}>was {p.currentPct}%</div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              FILTER & SORT BAR: One-Thumb Ergonomics
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
            
            {/* Primary Filter Tabs */}
            <div style={{ 
              display: 'flex', 
              background: 'rgba(255, 255, 255, 0.04)', 
              border: '1px solid rgba(255, 255, 255, 0.07)', 
              borderRadius: '12px', 
              padding: '3px',
              gap: '3px',
              flex: 1
            }}>
              {[
                { id: "All", label: "All", count: stats.totalSubs },
                { id: "At Risk", label: "At Risk", count: stats.atRiskCount, isRisk: true },
                { id: "Safe", label: "Safe", count: stats.safeCount, isSafe: true }
              ].map(t => {
                const isActive = filter === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      background: isActive 
                        ? (t.isRisk ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.25)')
                        : 'transparent',
                      border: isActive 
                        ? `1px solid ${t.isRisk ? 'rgba(239, 68, 68, 0.38)' : 'rgba(168, 85, 247, 0.38)'}`
                        : '1px solid transparent',
                      color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '9px',
                      padding: '6px 8px',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{t.label}</span>
                    <span style={{ 
                      fontSize: '9.5px', 
                      background: isActive 
                        ? (t.isRisk ? '#EF4444' : '#A855F7')
                        : 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      padding: '1px 5px',
                      borderRadius: '100px',
                      fontWeight: 900
                    }}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Compact Sort Menu Trigger */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: sortOption !== "default" ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${sortOption !== "default" ? 'rgba(168, 85, 247, 0.38)' : 'rgba(255, 255, 255, 0.07)'}`,
                  color: sortOption !== "default" ? '#C084FC' : 'rgba(255, 255, 255, 0.65)',
                  padding: '8px 11px',
                  borderRadius: '11px',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowUpDown size={12} />
                <span>Sort</span>
                <ChevronDown size={11} />
              </button>

              {isSortOpen && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '165px',
                  background: 'rgba(20, 15, 32, 0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '13px',
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 50,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)'
                }}>
                  {[
                    { id: "default", label: "Default Order" },
                    { id: "lowest", label: "Lowest Attendance" },
                    { id: "highest", label: "Highest Attendance" },
                    { id: "alpha", label: "Alphabetical (A-Z)" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortOption(opt.id);
                        setIsSortOpen(false);
                      }}
                      style={{
                        background: sortOption === opt.id ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                        border: 'none',
                        color: sortOption === opt.id ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px',
                        padding: '7px 9px',
                        fontSize: '10.5px',
                        fontWeight: sortOption === opt.id ? 900 : 700,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.id && <CheckCircle2 size={11} color="#C084FC" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              SUBJECT CARDS: Clear Apple/Linear Scannability & Proportions
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {isLoading || (isSyncing && attendance.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="subject-card" style={{ height: '92px', opacity: 0.5, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '80px', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px' }} />
                      <div style={{ width: '60px', height: '14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '100px' }} />
                    </div>
                    <div style={{ width: '65%', height: '16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', marginBottom: '10px' }} />
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px' }} />
                  </div>
                ))}
              </div>
            ) : attendance.length === 0 && !isSpConnected ? (
              <div style={{ 
                padding: '36px 20px', 
                borderRadius: '22px', 
                border: '1px dashed rgba(245, 158, 11, 0.3)', 
                textAlign: 'center', 
                background: 'rgba(245, 158, 11, 0.03)' 
              }}>
                <AlertTriangle size={30} color="#F59E0B" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14.5px', fontWeight: 900, color: '#fff' }}>Student Portal Connection Required</div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px', maxWidth: '300px', margin: '4px auto 14px' }}>
                  Live and cached attendance must originate from the SRM Student Portal. Connect to retrieve your records.
                </div>
                <button
                  onClick={handleSync}
                  style={{
                    background: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  Reconnect Portal
                </button>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div style={{ 
                padding: '30px 20px', 
                borderRadius: '18px', 
                border: '1px dashed rgba(255, 255, 255, 0.12)', 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <CheckCircle2 size={26} color="#A855F7" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff' }}>No subjects in this filter</div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                  {filter === "At Risk" ? "Great job! All your subjects are safely above 75%." : "All courses are within safe boundaries."}
                </div>
              </div>
            ) : (
              filteredAttendance.map((a: AnyValue, i: number) => {
                const statusColor = getStatusColor(a.pct);
                const statusLabel = getStatusLabel(a.pct);
                const isSafe = (a.pct || 0) >= 75;
                const pctClamped = Math.min(100, Math.max(0, a.pct || 0));

                return (
                  <div 
                    key={a.courseCode || i} 
                    className="subject-card"
                    onClick={() => handleOpenSubject(a)}
                  >
                    {/* Top Row: Code, Category & Status Pill */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ 
                          fontSize: '9.5px', 
                          fontWeight: 900, 
                          color: 'rgba(255, 255, 255, 0.75)', 
                          background: 'rgba(255, 255, 255, 0.06)', 
                          padding: '2px 7px', 
                          borderRadius: '5px' 
                        }}>
                          {a.courseCode}
                        </span>
                        {a.category && (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            color: 'rgba(255, 255, 255, 0.45)', 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            padding: '2px 5px', 
                            borderRadius: '5px',
                            textTransform: 'uppercase'
                          }}>
                            {a.category}
                          </span>
                        )}
                      </div>

                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 900, 
                        color: statusColor, 
                        background: getStatusBg(a.pct), 
                        border: `1px solid ${getStatusBorder(a.pct)}`, 
                        padding: '2px 7px', 
                        borderRadius: '100px', 
                        letterSpacing: '0.04em' 
                      }}>
                        ● {statusLabel}
                      </span>
                    </div>

                    {/* Middle Row: Subject Title + Percentage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <h3 style={{ 
                        fontSize: '13.5px', 
                        fontWeight: 800, 
                        color: '#fff', 
                        margin: 0, 
                        textTransform: 'capitalize', 
                        lineHeight: 1.25, 
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {String(a.courseTitle || "").toLowerCase()}
                      </h3>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '20px', fontWeight: 950, color: statusColor, lineHeight: 1 }} className="tabular-nums">
                          {(a.pct || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ 
                      height: '4px', 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      borderRadius: '100px', 
                      position: 'relative', 
                      marginBottom: '8px', 
                      overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        bottom: 0, 
                        width: `${pctClamped}%`, 
                        background: getProgressBarGradient(a.pct), 
                        borderRadius: '100px', 
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
                      }} />
                    </div>

                    {/* Bottom Row: Present/Conducted & Actionable Margin */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '10.5px', 
                      color: 'rgba(255, 255, 255, 0.65)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>
                          Attended <strong style={{ color: '#fff' }} className="tabular-nums">{a.attended}/{a.conducted}</strong>
                        </span>
                        {a.absent > 0 && (
                          <span style={{ color: 'rgba(239, 68, 68, 0.85)' }}>
                            · {a.absent} absent
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {isSafe ? (
                          <span style={{ 
                            fontWeight: 800, 
                            color: a.skipBuffer === 0 ? '#F59E0B' : '#10B981' 
                          }}>
                            {a.skipBuffer === 0 ? "At 75% limit" : `Can skip ${a.skipBuffer}`}
                          </span>
                        ) : (
                          <span style={{ fontWeight: 900, color: '#EF4444' }}>
                            Need +{a.requiredToPass}
                          </span>
                        )}
                        <ChevronRight size={11} color="rgba(255, 255, 255, 0.4)" />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Subject Detail Bottom Sheet Modal
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedSubject && (
        <div className="modal-overlay" onClick={handleCloseSubject}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            
            {/* Sheet Handle */}
            <div style={{ width: '36px', height: '4px', background: 'rgba(255, 255, 255, 0.25)', borderRadius: '100px', margin: '0 auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div>
                <button
                  onClick={handleCloseSubject}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#C084FC',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '6px'
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Back to Attendance</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#C084FC', textTransform: 'uppercase', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '2px 8px', borderRadius: '6px' }}>
                    {selectedSubject.courseCode}
                  </span>
                  {selectedSubject.category && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                      {selectedSubject.category}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 950, color: '#fff', margin: 0, lineHeight: 1.25, textTransform: 'capitalize' }}>
                  {selectedSubject.courseTitle}
                </h2>
              </div>

              <button
                onClick={handleCloseSubject}
                aria-label="Close details"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Dominant Attendance Card */}
            {(() => {
              const safePct = selectedSubject.pct || 0;
              const statusColor = getStatusColor(safePct);
              const statusLabel = getStatusLabel(safePct);
              return (
                <div style={{
                  background: `${statusColor}12`,
                  border: `1px solid ${statusColor}28`,
                  borderRadius: '16px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 900, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CURRENT ATTENDANCE
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 950, color: '#fff', marginTop: '2px', lineHeight: 1 }} className="tabular-nums">
                      {safePct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: statusColor, marginTop: '3px' }}>
                      ● {statusLabel}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 950, color: '#fff' }} className="tabular-nums">
                      {selectedSubject.attended} <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>/ {selectedSubject.conducted}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, marginTop: '2px' }}>
                      {selectedSubject.absent} Hours Absent
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Skip Margin Allowance / Recovery Plan */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '15px',
              padding: '13px 15px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  <ShieldCheck size={15} color="#10B981" />
                ) : (
                  <ShieldAlert size={15} color="#EF4444" />
                )}
                <span style={{ fontSize: '11px', fontWeight: 900, color: (selectedSubject.pct || 0) >= 75 ? '#10B981' : '#EF4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "Skip Margin Allowance" : "Attendance Recovery Plan"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', fontWeight: 700, color: '#fff', lineHeight: 1.45 }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  selectedSubject.skipBuffer === 0 
                    ? "You are exactly at the 75% limit. Any future absence will immediately drop this course into the critical risk zone."
                    : `You can miss up to ${selectedSubject.skipBuffer} more class${selectedSubject.skipBuffer === 1 ? '' : 'es'} and remain safely at or above 75%.`
                ) : (
                  `You must attend the next ${selectedSubject.requiredToPass} consecutive class${selectedSubject.requiredToPass === 1 ? '' : 'es'} without missing any to restore your attendance back to 75%.`
                )}
              </p>
            </div>

            {/* What If Simulation Forecast */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Activity size={12} color="#C084FC" />
                <span style={{ fontSize: '10.5px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "What if you skip upcoming classes?" : "What if you attend upcoming classes?"}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '7px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  (selectedSubject.skipSimulations || []).map((sim: AnyValue) => (
                    <div
                      key={sim.skips}
                      style={{
                        background: sim.safe ? 'rgba(255, 255, 255, 0.03)' : 'rgba(239, 68, 68, 0.08)',
                        border: `1px solid ${sim.safe ? 'rgba(255, 255, 255, 0.06)' : 'rgba(239, 68, 68, 0.25)'}`,
                        borderRadius: '11px',
                        padding: '9px 11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)' }}>
                          Skip {sim.skips} {sim.skips === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '8.5px', fontWeight: 800, color: sim.safe ? '#10B981' : '#EF4444', marginTop: '1px' }}>
                          {sim.safe ? "● Safe" : "● Below 75%"}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: sim.safe ? '#fff' : '#EF4444' }} className="tabular-nums">
                        {(sim.nextPct || 0).toFixed(1)}%
                      </div>
                    </div>
                  ))
                ) : (
                  (selectedSubject.attendSimulations || []).map((sim: AnyValue) => (
                    <div
                      key={sim.extra}
                      style={{
                        background: sim.safe ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${sim.safe ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                        borderRadius: '11px',
                        padding: '9px 11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)' }}>
                          Attend +{sim.extra} {sim.extra === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '8.5px', fontWeight: 800, color: sim.safe ? '#10B981' : '#F59E0B', marginTop: '1px' }}>
                          {sim.safe ? "● Reaches 75%" : "● Recovering"}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: sim.safe ? '#10B981' : '#fff' }} className="tabular-nums">
                        {(sim.nextPct || 0).toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Dismiss Button */}
            <button
              onClick={handleCloseSubject}
              style={{
                width: '100%',
                padding: '11px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '13px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer'
              }}
            >
              Done
            </button>

          </div>
        </div>
      )}

    </AuraBackground>
  );
}
