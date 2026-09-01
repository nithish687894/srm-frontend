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
  if (pct < 75) return "rgba(239, 68, 68, 0.25)";
  if (pct < 80) return "rgba(245, 158, 11, 0.25)";
  if (pct < 90) return "rgba(168, 85, 247, 0.25)";
  return "rgba(16, 185, 129, 0.25)";
};

const getStatusLabel = (pct: number) => {
  if (pct === 0) return "NO DATA";
  if (pct < 75) return "AT RISK";
  if (pct < 80) return "WATCH";
  if (pct < 90) return "SAFE";
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
      const scrolled = window.scrollY > 200 || (mainEl ? mainEl.scrollTop > 200 : false);
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
  const ringRadius = 54;
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
          max-width: 580px;
          margin: 0 auto;
          padding: 0 16px;
          box-sizing: border-box;
        }

        .sticky-header {
          position: fixed; 
          top: calc(env(safe-area-inset-top, 0px) + 12px); 
          left: 16px; 
          right: 16px; 
          max-width: 548px;
          margin: 0 auto;
          border-radius: 20px;
          background: rgba(15, 11, 26, 0.92); 
          backdrop-filter: blur(24px); 
          -webkit-backdrop-filter: blur(24px);
          padding: 10px 16px; 
          border: 1px solid rgba(168, 85, 247, 0.2);
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          z-index: 100; 
          transform: translateY(-150%); 
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        }
        .sticky-header.visible { transform: translateY(0); }

        .subject-card {
          background: rgba(22, 17, 36, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 16px 18px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }
        .subject-card:hover {
          transform: translateY(-2px);
          border-color: rgba(168, 85, 247, 0.35);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.1);
        }
        .subject-card:active {
          transform: scale(0.985);
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
          max-width: 520px;
          max-height: 88vh;
          background: linear-gradient(165deg, rgba(26, 19, 44, 0.99) 0%, rgba(12, 9, 22, 0.99) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 28px 28px 0 0;
          padding: 20px 22px calc(env(safe-area-inset-bottom, 0px) + 80px);
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
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Attendance Hub</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: ringColor }} className="tabular-nums">
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
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)' 
      }}>
        
        <div className="attendance-container">
          
          {/* Header Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles size={13} color="#C084FC" />
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#C084FC", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Lumina Attendance
                </span>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, letterSpacing: '-1px', lineHeight: 1.1, color: '#fff' }}>
                Attendance <span style={{ color: "#A855F7" }}>Hub</span>
              </h1>
            </div>

            {/* Sync Trigger & Last Synced Status */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                aria-label={isSpConnected ? "Sync attendance" : "Reconnect Student Portal"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSpConnected ? 'rgba(168, 85, 247, 0.12)' : 'rgba(245, 158, 11, 0.15)',
                  border: isSpConnected ? '1px solid rgba(168, 85, 247, 0.28)' : '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  color: isSpConnected ? '#C084FC' : '#F59E0B',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: isSyncing ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
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
                  fontWeight: 700, 
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  <Clock size={10} color="rgba(255, 255, 255, 0.4)" />
                  <span>{timeAgoStr}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compact Offline Status Strip (Goal 2: Replaces bulky warning box) */}
          {!isSpConnected && attendance.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.22)',
              borderRadius: '14px',
              padding: '8px 14px',
              marginBottom: '16px',
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
              GOAL 1: Primary Hero Attendance Dial & Metrics Card
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(32, 23, 56, 0.85) 0%, rgba(16, 12, 28, 0.85) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(168, 85, 247, 0.22)',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(168, 85, 247, 0.08)'
          }}>
            {/* Background ambient glow */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: ringColor,
              filter: 'blur(50px)',
              opacity: 0.15,
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              
              {/* Left Column: Metric Summary & Status Pill */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: getStatusBg(stats.overallAvg), 
                  border: `1px solid ${getStatusBorder(stats.overallAvg)}`,
                  padding: '4px 10px', 
                  borderRadius: '100px',
                  marginBottom: '10px'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ringColor }} />
                  <span style={{ fontSize: '10px', fontWeight: 900, color: ringColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {getStatusLabel(stats.overallAvg)}
                  </span>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Overall Average
                </div>

                {/* Counter Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <BookOpen size={12} color="#C084FC" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                      {stats.totalSubs} <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600 }}>Subjects</span>
                    </span>
                  </div>

                  <div 
                    onClick={() => setFilter("At Risk")}
                    style={{
                      background: stats.atRiskCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${stats.atRiskCount > 0 ? 'rgba(239, 68, 68, 0.28)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '12px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <AlertTriangle size={12} color={stats.atRiskCount > 0 ? '#EF4444' : '#10B981'} />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: stats.atRiskCount > 0 ? '#EF4444' : '#10B981' }}>
                      {stats.atRiskCount} <span style={{ color: stats.atRiskCount > 0 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(255, 255, 255, 0.45)', fontWeight: 600 }}>At Risk</span>
                    </span>
                  </div>

                  {stats.totalSkipsAllowed > 0 && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <ShieldCheck size={12} color="#10B981" />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981' }}>
                        {stats.totalSkipsAllowed} <span style={{ color: 'rgba(16, 185, 129, 0.75)', fontWeight: 600 }}>Skips Safe</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Radial Progress Dial */}
              <div style={{ position: 'relative', width: '128px', height: '128px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Track */}
                  <circle
                    cx="64"
                    cy="64"
                    r={ringRadius}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="9"
                  />
                  {/* Glowing Progress Arc */}
                  <circle
                    cx="64"
                    cy="64"
                    r={ringRadius}
                    fill="transparent"
                    stroke={ringColor}
                    strokeWidth="9"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: `drop-shadow(0 0 8px ${ringColor}60)`
                    }}
                  />
                </svg>

                {/* Centered Percentage */}
                <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '26px', fontWeight: 950, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }} className="tabular-nums">
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
              GOAL 3: Actionable At Risk Banner
          ══════════════════════════════════════════════════════════════════════ */}
          {stats.atRiskCount > 0 && filter !== "At Risk" && (
            <div 
              onClick={() => setFilter("At Risk")}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(220, 38, 38, 0.08) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  background: 'rgba(239, 68, 68, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <AlertCircle size={18} color="#EF4444" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                    {stats.atRiskCount} {stats.atRiskCount === 1 ? 'Subject' : 'Subjects'} Below 75%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>
                    Tap to review required recovery attendance
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '11px', 
                fontWeight: 900, 
                color: '#EF4444',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '5px 10px',
                borderRadius: '8px'
              }}>
                <span>View</span>
                <ChevronRight size={13} />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              GOAL 4: Interactive Student Utility — Skip Predictor
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: '16px' }}>
            {!isPredictorOpen ? (
              <div
                onClick={() => setPredictorOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '10px', 
                    background: 'rgba(168, 85, 247, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Zap size={16} color="#C084FC" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                      ⚡ Skip & Attendance Predictor
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 600 }}>
                      Simulate missing or attending future classes
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} color="#A855F7" />
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(150deg, rgba(28, 20, 48, 0.9) 0%, rgba(15, 11, 26, 0.9) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '20px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={15} color="#C084FC" />
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {predictorMode === "quick" ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: 'rgba(255, 255, 255, 0.04)', 
                      border: '1px solid rgba(255, 255, 255, 0.06)', 
                      borderRadius: '14px', 
                      padding: '10px 14px' 
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                          Simulate Absences
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginTop: '1px' }}>
                          Miss {skipStepperCount} {skipStepperCount === 1 ? 'Class' : 'Classes'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setSkipStepperCount(Math.max(1, skipStepperCount - 1))}
                          disabled={skipStepperCount <= 1}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
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
                          <Minus size={13} />
                        </button>

                        <span style={{ fontSize: '18px', fontWeight: 950, color: '#C084FC', minWidth: '24px', textAlign: 'center' }} className="tabular-nums">
                          {skipStepperCount}
                        </span>

                        <button
                          onClick={() => setSkipStepperCount(Math.min(20, skipStepperCount + 1))}
                          disabled={skipStepperCount >= 20}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: skipStepperCount >= 20 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }} className="hide-scrollbar">
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
                              padding: '8px 10px', 
                              borderRadius: '10px', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center' 
                            }}
                          >
                            <div style={{ minWidth: 0, paddingRight: '8px' }}>
                              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sub.courseTitle}
                              </div>
                              <div style={{ fontSize: '9px', fontWeight: 800, color: statCol, marginTop: '1px' }}>
                                {isSafe ? `● Safe (${sub.skipBuffer >= skipStepperCount ? `${sub.skipBuffer - skipStepperCount} skips left` : 'limit'})` : `● Falls Below 75%`}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ fontSize: '13px', fontWeight: 950, color: statCol }} className="tabular-nums">
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
                              width: '40px',
                              height: '50px',
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: sel ? 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${sel ? '#F472B6' : 'rgba(255, 255, 255, 0.08)'}`,
                              cursor: isWknd ? 'not-allowed' : 'pointer',
                              opacity: isWknd ? 0.3 : 1,
                              boxShadow: sel ? '0 0 12px rgba(236, 72, 153, 0.4)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '8px', fontWeight: 900, color: sel ? '#fff' : 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                              {d.dayStr}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 950, color: '#fff', marginTop: '2px' }} className="tabular-nums">
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
                        padding: '10px',
                        background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                        borderRadius: '12px',
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
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {predictions.length === 0 ? (
                          <div style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                            No classes scheduled on selected dates.
                          </div>
                        ) : (
                          predictions.map((p: AnyValue, idx: number) => {
                            const col = getStatusColor(p.projPct);
                            return (
                              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${col}`, padding: '8px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ minWidth: 0, paddingRight: '8px' }}>
                                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.title}
                                  </div>
                                  <div style={{ fontSize: '9px', fontWeight: 800, color: col }}>
                                    {p.marginLabel}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <span style={{ fontSize: '13px', fontWeight: 950, color: col }} className="tabular-nums">
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
              GOAL 6: Simplified Segmented Filter Strip (All | At Risk | Safe | Sort)
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
            
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
                        ? `1px solid ${t.isRisk ? 'rgba(239, 68, 68, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`
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
                  border: `1px solid ${sortOption !== "default" ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.07)'}`,
                  color: sortOption !== "default" ? '#C084FC' : 'rgba(255, 255, 255, 0.65)',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowUpDown size={12} />
                <span>Sort</span>
                <ChevronDown size={12} />
              </button>

              {isSortOpen && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '170px',
                  background: 'rgba(20, 15, 32, 0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '14px',
                  padding: '6px',
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
                        padding: '8px 10px',
                        fontSize: '11px',
                        fontWeight: sortOption === opt.id ? 900 : 700,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.id && <CheckCircle2 size={12} color="#C084FC" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              GOAL 5: Redesigned Streamlined Subject Cards
          ══════════════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isLoading || (isSyncing && attendance.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="subject-card" style={{ height: '98px', opacity: 0.5, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ width: '80px', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px' }} />
                      <div style={{ width: '60px', height: '14px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '100px' }} />
                    </div>
                    <div style={{ width: '65%', height: '16px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', marginBottom: '12px' }} />
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '100px' }} />
                  </div>
                ))}
              </div>
            ) : attendance.length === 0 && !isSpConnected ? (
              <div style={{ 
                padding: '36px 20px', 
                borderRadius: '24px', 
                border: '1px dashed rgba(245, 158, 11, 0.3)', 
                textAlign: 'center', 
                background: 'rgba(245, 158, 11, 0.03)' 
              }}>
                <AlertTriangle size={32} color="#F59E0B" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>Student Portal Connection Required</div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px', maxWidth: '320px', margin: '4px auto 14px' }}>
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
                padding: '32px 20px', 
                borderRadius: '20px', 
                border: '1px dashed rgba(255, 255, 255, 0.12)', 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <CheckCircle2 size={28} color="#A855F7" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>No subjects in this filter</div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ 
                          fontSize: '9.5px', 
                          fontWeight: 900, 
                          color: 'rgba(255, 255, 255, 0.75)', 
                          background: 'rgba(255, 255, 255, 0.06)', 
                          padding: '2px 8px', 
                          borderRadius: '6px' 
                        }}>
                          {a.courseCode}
                        </span>
                        {a.category && (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            color: 'rgba(255, 255, 255, 0.45)', 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            padding: '2px 6px', 
                            borderRadius: '6px',
                            textTransform: 'uppercase'
                          }}>
                            {a.category}
                          </span>
                        )}
                      </div>

                      <span style={{ 
                        fontSize: '9.5px', 
                        fontWeight: 900, 
                        color: statusColor, 
                        background: getStatusBg(a.pct), 
                        border: `1px solid ${getStatusBorder(a.pct)}`, 
                        padding: '2px 8px', 
                        borderRadius: '100px', 
                        letterSpacing: '0.06em' 
                      }}>
                        ● {statusLabel}
                      </span>
                    </div>

                    {/* Middle Row: Subject Title + Percentage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                      <h3 style={{ 
                        fontSize: '14.5px', 
                        fontWeight: 850, 
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
                        <span style={{ fontSize: '22px', fontWeight: 950, color: statusColor, lineHeight: 1 }} className="tabular-nums">
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
                      marginBottom: '10px', 
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>
                          Attended: <strong style={{ color: '#fff' }} className="tabular-nums">{a.attended}/{a.conducted}</strong>
                        </span>
                        {a.absent > 0 && (
                          <span style={{ color: 'rgba(239, 68, 68, 0.85)' }}>
                            ({a.absent} absent)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                        <ChevronRight size={12} color="rgba(255, 255, 255, 0.4)" />
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
                <h2 style={{ fontSize: '18px', fontWeight: 950, color: '#fff', margin: 0, lineHeight: 1.25, textTransform: 'capitalize' }}>
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
                <X size={15} />
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
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 900, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CURRENT ATTENDANCE
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 950, color: '#fff', marginTop: '2px', lineHeight: 1 }} className="tabular-nums">
                      {safePct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: statusColor, marginTop: '3px' }}>
                      ● {statusLabel}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 950, color: '#fff' }} className="tabular-nums">
                      {selectedSubject.attended} <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>/ {selectedSubject.conducted}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, marginTop: '2px' }}>
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
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  <ShieldCheck size={16} color="#10B981" />
                ) : (
                  <ShieldAlert size={16} color="#EF4444" />
                )}
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: (selectedSubject.pct || 0) >= 75 ? '#10B981' : '#EF4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "Skip Margin Allowance" : "Attendance Recovery Plan"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#fff', lineHeight: 1.45 }}>
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
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                <Activity size={13} color="#C084FC" />
                <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "What if you skip upcoming classes?" : "What if you attend upcoming classes?"}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  (selectedSubject.skipSimulations || []).map((sim: AnyValue) => (
                    <div
                      key={sim.skips}
                      style={{
                        background: sim.safe ? 'rgba(255, 255, 255, 0.03)' : 'rgba(239, 68, 68, 0.08)',
                        border: `1px solid ${sim.safe ? 'rgba(255, 255, 255, 0.06)' : 'rgba(239, 68, 68, 0.25)'}`,
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)' }}>
                          Skip {sim.skips} {sim.skips === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: sim.safe ? '#10B981' : '#EF4444', marginTop: '1px' }}>
                          {sim.safe ? "● Safe" : "● Below 75%"}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 950, color: sim.safe ? '#fff' : '#EF4444' }} className="tabular-nums">
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
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)' }}>
                          Attend +{sim.extra} {sim.extra === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: sim.safe ? '#10B981' : '#F59E0B', marginTop: '1px' }}>
                          {sim.safe ? "● Reaches 75%" : "● Recovering"}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 950, color: sim.safe ? '#10B981' : '#fff' }} className="tabular-nums">
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
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
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
