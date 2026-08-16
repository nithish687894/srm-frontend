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
  RefreshCcw, 
  Clock, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  Calendar,
  Layers,
  Plus,
  Minus,
  HelpCircle
} from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import { AURA_COLORS as SHARED_AURA } from "./system/theme-tokens";

const AURA_COLORS = SHARED_AURA;

// Safe status helper
const getStatusDetails = (pct: number) => {
  const safePct = typeof pct === "number" && !isNaN(pct) ? pct : 0;
  if (safePct >= 75) {
    return { 
      color: AURA_COLORS.green, 
      label: "SAFE",
      dot: "#34D399",
      bgTint: "rgba(52, 211, 153, 0.10)",
      borderTint: "rgba(52, 211, 153, 0.24)",
      badgeBg: "rgba(52, 211, 153, 0.15)",
      statusText: "Safe & On Track"
    };
  }
  if (safePct >= 65) {
    return { 
      color: AURA_COLORS.amber, 
      label: "WATCH",
      dot: "#FBBF24",
      bgTint: "rgba(251, 191, 36, 0.10)",
      borderTint: "rgba(251, 191, 36, 0.24)",
      badgeBg: "rgba(251, 191, 36, 0.15)",
      statusText: "Needs Attention"
    };
  }
  return { 
    color: AURA_COLORS.red, 
    label: "AT RISK",
    dot: "#FF4B72",
    bgTint: "rgba(255, 75, 114, 0.10)",
    borderTint: "rgba(255, 75, 114, 0.24)",
    badgeBg: "rgba(255, 75, 114, 0.15)",
    statusText: "Critical Risk"
  };
};

export default function AuraAttendance({ 
  attendance = [], 
  handleSync, 
  isSyncing = false, 
  timeAgoStr = "",
  showPredictor: externalShowPredictor, 
  setShowPredictor: externalSetShowPredictor, 
  next30Days = [], 
  selectedDates = new Set(), 
  toggleDate, 
  calculatePredictions, 
  predictions, 
  setSelectedDates, 
  setPredictions
}: AnyValue) {
  const [filter, setFilter] = useState<"All" | "Needs Attention" | "Safe">("All");
  const [selectedSubject, setSelectedSubject] = useState<AnyValue | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [skipStepperCount, setSkipStepperCount] = useState<number>(3);
  const [predictorMode, setPredictorMode] = useState<"quick" | "calendar">("quick");
  const [localShowPredictor, setLocalShowPredictor] = useState(false);
  const { activeTheme, stars } = useAuraTheme();

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
    const parentMain = document.getElementById("attendance-parent-scroll") || document.querySelector('main');
    const onScroll = () => {
      const scrolled = window.scrollY > 160 || (parentMain ? parentMain.scrollTop > 160 : false);
      setIsScrolled(scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (parentMain) parentMain.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (parentMain) parentMain.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Handle browser back button when a modal is open
  useEffect(() => {
    const handlePopState = () => {
      if (selectedSubject) setSelectedSubject(null);
      if (isPredictorOpen) setPredictorOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedSubject, isPredictorOpen, setPredictorOpen]);

  // Open modal handler with history push for browser back support
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

  // Process and compute all attendance stats with complete null safety
  const processedAttendance = useMemo(() => {
    if (!Array.isArray(attendance) || attendance.length === 0) return [];

    return attendance.map((a: AnyValue) => {
      if (!a || typeof a !== "object") return null;

      const pctStr = a["Attn %"] ?? a.pct;
      const parsedPct = parseFloat(String(pctStr)) || 0;
      let conducted = parseInt(String(a["Hours Conducted"] ?? a.conducted)) || 0;
      let absent = parseInt(String(a["Hours Absent"] ?? a.absent)) || 0;
      
      if (conducted === 0 && pctStr !== undefined && pctStr !== null && pctStr !== "null") {
        conducted = 30;
        const presentEst = Math.round(conducted * (parsedPct / 100));
        absent = conducted - presentEst;
      }
      
      const attended = parseInt(String(a["Hours Attended"] ?? a.attended)) || Math.max(0, conducted - absent);
      const pct = (pctStr !== undefined && pctStr !== null && pctStr !== "null" && !isNaN(parsedPct))
        ? parsedPct
        : (conducted > 0 ? (attended / conducted) * 100 : 100);

      const skipBuffer = Math.max(0, Math.floor((attended - 0.75 * conducted) / 0.75));
      const requiredToPass = Math.max(0, Math.ceil(3 * conducted - 4 * attended));
      
      // Compute What-If Simulation steps [1, 2, 3, 5]
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

      // Simulation for quick stepper
      const stepperNextConducted = conducted + skipStepperCount;
      const stepperNextPct = stepperNextConducted > 0 ? (attended / stepperNextConducted) * 100 : 0;

      return { 
        ...a, 
        courseCode: a["Course Code"] || a.courseCode || "COURSE",
        courseTitle: a["Course Title"] || a.courseTitle || a.title || "Subject",
        category: a["Category"] || a.category || "",
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
    const overallAvg = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    const atRiskList = processedAttendance.filter((a: AnyValue) => (a?.pct || 0) < 75);
    const safeList = processedAttendance.filter((a: AnyValue) => (a?.pct || 0) >= 75);
    const totalSkipsAllowed = safeList.reduce((sum: number, a: AnyValue) => sum + (a?.skipBuffer || 0), 0);
    
    // Lowest percentage / primary alert subject
    const sortedByRisk = [...processedAttendance].sort((a: AnyValue, b: AnyValue) => (a?.pct || 0) - (b?.pct || 0));
    const primaryAlertSubject = sortedByRisk.length > 0 ? sortedByRisk[0] : null;

    return { 
      totalSubs, 
      totalAttended, 
      totalConducted, 
      totalAbsent, 
      overallAvg, 
      atRiskCount: atRiskList.length,
      safeCount: safeList.length,
      totalSkipsAllowed,
      primaryAlertSubject
    };
  }, [processedAttendance]);

  const filteredAttendance = useMemo(() => {
    if (filter === "Needs Attention") {
      return processedAttendance.filter((a: AnyValue) => (a?.pct || 0) < 75);
    }
    if (filter === "Safe") {
      return processedAttendance.filter((a: AnyValue) => (a?.pct || 0) >= 75);
    }
    return processedAttendance;
  }, [processedAttendance, filter]);

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .attendance-shell {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          padding: calc(env(safe-area-inset-top, 0px) + 70px) 16px 140px;
          position: relative;
          z-index: 1;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .sticky-command-bar {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 64px);
          left: 16px;
          right: 16px;
          max-width: 680px;
          margin: 0 auto;
          border-radius: 20px;
          background: rgba(12, 10, 20, 0.88);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          padding: 12px 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 99;
          transform: translateY(-160%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 14px 35px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .sticky-command-bar.visible {
          transform: translateY(0);
        }

        .cmd-summary-card {
          background: linear-gradient(145deg, rgba(24, 18, 40, 0.85) 0%, rgba(10, 8, 18, 0.92) 100%);
          border: 1px solid rgba(192, 132, 252, 0.16);
          border-radius: 26px;
          padding: 22px 20px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .cmd-insight-card {
          border-radius: 20px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .cmd-insight-card:active {
          transform: scale(0.99);
        }

        .subject-row-item {
          background: linear-gradient(145deg, rgba(20, 16, 34, 0.75) 0%, rgba(10, 8, 18, 0.88) 100%);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 14px 16px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
          -webkit-tap-highlight-color: transparent;
        }
        .subject-row-item:hover {
          border-color: rgba(192, 132, 252, 0.28);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(192, 132, 252, 0.06);
        }
        .subject-row-item:active {
          transform: scale(0.985);
        }

        .filter-tab-pill {
          padding: 7px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.02em;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        /* Bottom Sheet Modal Styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 3, 8, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 10000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: modalFadeIn 0.22s ease-out;
        }
        @media (min-width: 640px) {
          .modal-overlay {
            align-items: center;
            padding: 20px;
          }
        }

        .modal-sheet {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          background: linear-gradient(155deg, rgba(22, 17, 38, 0.98) 0%, rgba(9, 7, 16, 0.99) 100%);
          border: 1px solid rgba(192, 132, 252, 0.22);
          border-radius: 32px 32px 0 0;
          padding: 20px 22px 36px;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 640px) {
          .modal-sheet {
            border-radius: 28px;
            padding: 24px 26px 28px;
            animation: modalScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.94); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Light Theme Overrides */
        body.theme-light .sticky-command-bar {
          background: rgba(255, 255, 255, 0.92) !important;
          border-color: rgba(88, 61, 145, 0.14) !important;
          box-shadow: 0 10px 28px rgba(88, 61, 145, 0.12) !important;
          color: #17111f !important;
        }
        body.theme-light .cmd-summary-card {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(245, 240, 255, 0.90)) !important;
          border-color: rgba(88, 61, 145, 0.18) !important;
          box-shadow: 0 14px 32px rgba(88, 61, 145, 0.10) !important;
          color: #17111f !important;
        }
        body.theme-light .subject-row-item {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(246, 242, 255, 0.88)) !important;
          border-color: rgba(88, 61, 145, 0.14) !important;
          box-shadow: 0 4px 14px rgba(88, 61, 145, 0.08) !important;
          color: #17111f !important;
        }
        body.theme-light .modal-sheet {
          background: linear-gradient(155deg, rgba(255, 255, 255, 0.98), rgba(248, 244, 255, 0.96)) !important;
          border-color: rgba(88, 61, 145, 0.2) !important;
          color: #17111f !important;
          box-shadow: 0 20px 50px rgba(88, 61, 145, 0.2) !important;
        }
      `}} />

      {/* ─── STICKY MINI HEADER ON SCROLL ─── */}
      <div className={`sticky-command-bar ${isScrolled ? 'visible' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.04em', color: '#fff' }}>
            Attendance
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.sub }}>
            {stats.totalSubs} Subjects
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '15px', fontWeight: 950, color: stats.overallAvg >= 75 ? AURA_COLORS.green : AURA_COLORS.red }} className="tabular-nums">
              {stats.overallAvg.toFixed(1)}%
            </span>
          </div>
          {stats.atRiskCount > 0 ? (
            <span style={{ fontSize: '9.5px', background: 'rgba(255, 75, 114, 0.15)', border: '1px solid rgba(255, 75, 114, 0.3)', color: AURA_COLORS.red, padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>
              {stats.atRiskCount} RISK
            </span>
          ) : (
            <span style={{ fontSize: '9.5px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: AURA_COLORS.green, padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>
              ON TRACK
            </span>
          )}
        </div>
      </div>

      <div className="attendance-shell">
        
        {/* ─── 1. PAGE HEADER & SYNC ACTIONS ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(192, 132, 252, 0.08)', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(192, 132, 252, 0.2)', marginBottom: '6px' }}>
              <Sparkles size={11} color={AURA_COLORS.purple} />
              <span style={{ fontSize: "9px", fontWeight: 800, color: AURA_COLORS.purple, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Academic Command</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 950, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff' }}>
              Attendance
            </h1>
          </div>

          {/* Sync Trigger & Time ago */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              aria-label="Sync attendance records"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '6px 12px',
                borderRadius: '100px',
                color: '#fff',
                fontSize: '10.5px',
                fontWeight: 900,
                cursor: isSyncing ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <RefreshCcw size={11} className={isSyncing ? "animate-spin" : ""} color={AURA_COLORS.primary} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>

            {timeAgoStr && (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: 'rgba(0, 0, 0, 0.25)', 
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '6px 10px', 
                borderRadius: '100px',
                fontSize: '10px', 
                fontWeight: 750, 
                color: AURA_COLORS.subBright
              }}>
                <Clock size={10} color={AURA_COLORS.primary} />
                <span>{timeAgoStr}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. COMPACT OVERALL ATTENDANCE SUMMARY HERO ─── */}
        <div className="cmd-summary-card">
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: stats.overallAvg >= 75 
              ? 'radial-gradient(circle, rgba(52, 211, 153, 0.18) 0%, rgba(0,0,0,0) 70%)'
              : 'radial-gradient(circle, rgba(255, 75, 114, 0.18) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                OVERALL AVERAGE
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span style={{
                  fontSize: '44px',
                  fontWeight: 950,
                  color: stats.overallAvg >= 75 ? '#34D399' : (stats.overallAvg >= 65 ? '#FBBF24' : '#FF4B72'),
                  letterSpacing: '-0.04em',
                  lineHeight: 1
                }} className="tabular-nums">
                  {stats.overallAvg.toFixed(1)}%
                </span>
                
                <span style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 9px',
                  borderRadius: '100px',
                  background: stats.overallAvg >= 75 ? 'rgba(52, 211, 153, 0.14)' : (stats.overallAvg >= 65 ? 'rgba(251, 191, 36, 0.14)' : 'rgba(255, 75, 114, 0.14)'),
                  border: `1px solid ${stats.overallAvg >= 75 ? 'rgba(52, 211, 153, 0.3)' : (stats.overallAvg >= 65 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 75, 114, 0.3)')}`,
                  color: stats.overallAvg >= 75 ? '#34D399' : (stats.overallAvg >= 65 ? '#FBBF24' : '#FF4B72')
                }}>
                  {stats.overallAvg >= 75 ? "● Looking Good" : (stats.overallAvg >= 65 ? "● Watch Margin" : "● At Critical Risk")}
                </span>
              </div>

              <p style={{ margin: '6px 0 0', fontSize: '11.5px', fontWeight: 750, color: AURA_COLORS.subBright }}>
                {stats.totalSubs} Subjects · {stats.atRiskCount > 0 ? `${stats.atRiskCount} Need Attention` : "All Safely Above 75%"}
              </p>
            </div>

            {/* Total Safe Skips Buffer Pill */}
            {stats.totalSkipsAllowed > 0 && (
              <div style={{
                textAlign: 'right',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '8px 12px',
                borderRadius: '16px',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SKIP BUDGET
                </div>
                <div style={{ fontSize: '16px', fontWeight: 950, color: AURA_COLORS.primary, marginTop: '1px' }} className="tabular-nums">
                  +{stats.totalSkipsAllowed} <span style={{ fontSize: '9.5px', fontWeight: 800, color: AURA_COLORS.sub }}>classes</span>
                </div>
              </div>
            )}
          </div>

          {/* 3-Column Aggregated Hours Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.22)', padding: '9px 10px', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CONDUCTED
              </div>
              <div style={{ fontSize: '15px', fontWeight: 950, color: '#fff', marginTop: '2px' }} className="tabular-nums">
                {stats.totalConducted} <span style={{ fontSize: '9px', color: AURA_COLORS.sub }}>hrs</span>
              </div>
            </div>

            <div style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.15)', padding: '9px 10px', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ATTENDED
              </div>
              <div style={{ fontSize: '15px', fontWeight: 950, color: '#34D399', marginTop: '2px' }} className="tabular-nums">
                {stats.totalAttended} <span style={{ fontSize: '9px', color: 'rgba(52, 211, 153, 0.7)' }}>hrs</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 75, 114, 0.06)', border: '1px solid rgba(255, 75, 114, 0.15)', padding: '9px 10px', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#FF4B72', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ABSENT
              </div>
              <div style={{ fontSize: '15px', fontWeight: 950, color: '#FF4B72', marginTop: '2px' }} className="tabular-nums">
                {stats.totalAbsent} <span style={{ fontSize: '9px', color: 'rgba(255, 75, 114, 0.7)' }}>hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. SINGLE ATTENTION / RISK INTELLIGENT INSIGHT ─── */}
        {(() => {
          const subject = stats.primaryAlertSubject;
          if (!subject) return null;

          const isAtRisk = (subject.pct || 0) < 75;
          const isCloseWatch = (subject.pct || 0) >= 75 && (subject.pct || 0) <= 78;

          if (isAtRisk) {
            return (
              <div 
                className="cmd-insight-card"
                onClick={() => handleOpenSubject(subject)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 75, 114, 0.18) 0%, rgba(251, 191, 36, 0.08) 100%)',
                  border: '1px solid rgba(255, 75, 114, 0.32)',
                  boxShadow: '0 8px 24px rgba(255, 75, 114, 0.12)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '12px',
                    background: 'rgba(255, 75, 114, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={17} color="#FF4B72" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FF4B72', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        NEEDS ATTENTION
                      </span>
                      <span style={{ fontSize: '9px', color: AURA_COLORS.sub }}>·</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }} className="tabular-nums">
                        {(subject.pct || 0).toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ margin: '1px 0 0', fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {subject.courseTitle}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '10.5px', fontWeight: 700, color: '#FF87A2' }}>
                      {subject.requiredToPass === 1 ? 'Attend next 1 class to cross 75%' : `Attend next ${subject.requiredToPass} classes to cross 75%`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FF4B72', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                  <span>View</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          }

          if (isCloseWatch) {
            return (
              <div 
                className="cmd-insight-card"
                onClick={() => handleOpenSubject(subject)}
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(192, 132, 252, 0.06) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  boxShadow: '0 8px 24px rgba(251, 191, 36, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '12px',
                    background: 'rgba(251, 191, 36, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Zap size={16} color="#FBBF24" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        WATCHLIST
                      </span>
                      <span style={{ fontSize: '9px', color: AURA_COLORS.sub }}>·</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }} className="tabular-nums">
                        {(subject.pct || 0).toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ margin: '1px 0 0', fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {subject.courseTitle}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '10.5px', fontWeight: 700, color: '#FCD34D' }}>
                      {subject.skipBuffer === 0 ? 'Zero skip buffer — cannot miss next class' : `Closest to 75% limit · Only ${subject.skipBuffer} skip left`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FBBF24', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                  <span>View</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          }

          // Case C: All on track
          return (
            <div 
              className="cmd-insight-card"
              style={{
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(56, 189, 248, 0.05) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                boxShadow: '0 8px 24px rgba(52, 211, 153, 0.08)',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '12px',
                  background: 'rgba(52, 211, 153, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={17} color="#34D399" />
                </div>
                <div>
                  <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    YOU'RE ON TRACK
                  </span>
                  <p style={{ margin: '1px 0 0', fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                    All {stats.totalSubs} subjects are safely above 75%
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── 4. INTERACTIVE SKIP PREDICTOR TOOL (ACCORDION & STEPPER) ─── */}
        <div style={{ marginBottom: '18px' }}>
          {!isPredictorOpen ? (
            <div
              onClick={() => setPredictorOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '10px', background: 'rgba(192, 132, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={14} color={AURA_COLORS.purple} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>
                    ⚡ Skip Predictor
                  </div>
                  <div style={{ fontSize: '10px', color: AURA_COLORS.subBright, fontWeight: 700 }}>
                    See how skipping classes affects your attendance
                  </div>
                </div>
              </div>
              <ChevronRight size={15} color={AURA_COLORS.primary} />
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(145deg, rgba(20, 15, 34, 0.92) 0%, rgba(9, 7, 16, 0.96) 100%)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: '22px',
              padding: '16px',
              boxShadow: '0 14px 35px rgba(0,0,0,0.5)'
            }}>
              {/* Predictor Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={15} color={AURA_COLORS.purple} />
                  <span style={{ fontSize: '12.5px', fontWeight: 950, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Skip Predictor
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px' }}>
                    <button
                      onClick={() => setPredictorMode("quick")}
                      style={{
                        background: predictorMode === "quick" ? 'rgba(192, 132, 252, 0.2)' : 'transparent',
                        border: 'none',
                        color: predictorMode === "quick" ? '#fff' : AURA_COLORS.sub,
                        fontSize: '9.5px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Quick Stepper
                    </button>
                    <button
                      onClick={() => setPredictorMode("calendar")}
                      style={{
                        background: predictorMode === "calendar" ? 'rgba(192, 132, 252, 0.2)' : 'transparent',
                        border: 'none',
                        color: predictorMode === "calendar" ? '#fff' : AURA_COLORS.sub,
                        fontSize: '9.5px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Dates
                    </button>
                  </div>

                  <button
                    onClick={() => setPredictorOpen(false)}
                    style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Mode A: Quick Stepper Simulator */}
              {predictorMode === "quick" ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '12px 14px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase' }}>
                        How many classes to skip?
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginTop: '2px' }}>
                        Simulate {skipStepperCount} {skipStepperCount === 1 ? 'Class' : 'Classes'} Missed
                      </div>
                    </div>

                    {/* Stepper Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setSkipStepperCount(Math.max(1, skipStepperCount - 1))}
                        disabled={skipStepperCount <= 1}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: skipStepperCount <= 1 ? 'not-allowed' : 'pointer',
                          opacity: skipStepperCount <= 1 ? 0.4 : 1
                        }}
                      >
                        <Minus size={14} />
                      </button>

                      <span style={{ fontSize: '18px', fontWeight: 950, color: AURA_COLORS.primary, minWidth: '24px', textAlign: 'center' }} className="tabular-nums">
                        {skipStepperCount}
                      </span>

                      <button
                        onClick={() => setSkipStepperCount(Math.min(20, skipStepperCount + 1))}
                        disabled={skipStepperCount >= 20}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: skipStepperCount >= 20 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Impact list per subject */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }} className="hide-scrollbar">
                    {processedAttendance.map((sub: AnyValue, idx: number) => {
                      const nextPct = sub.stepperNextPct || 0;
                      const isSafe = sub.stepperSafe;
                      return (
                        <div key={sub.courseCode || idx} style={{ background: 'rgba(0, 0, 0, 0.25)', borderLeft: `3px solid ${isSafe ? '#34D399' : '#FF4B72'}`, padding: '8px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ minWidth: 0, paddingRight: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sub.courseTitle}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 800, color: isSafe ? '#34D399' : '#FF4B72' }}>
                              {isSafe ? `● Still Safe (${sub.skipBuffer >= skipStepperCount ? `+${sub.skipBuffer - skipStepperCount} left` : 'at boundary'})` : `● Falls Below 75%`}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: '13px', fontWeight: 950, color: isSafe ? '#fff' : '#FF4B72' }} className="tabular-nums">
                              {sub.pct.toFixed(1)}% → {nextPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Mode B: Specific Dates Selector */
                <div>
                  <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '6px', paddingBottom: '10px', marginBottom: '12px' }}>
                    {next30Days?.map((d: AnyValue) => {
                      const sel = selectedDates?.has?.(d.iso);
                      const isWknd = [0, 6].includes(d.date.getDay());
                      return (
                        <div
                          key={d.iso}
                          onClick={() => !isWknd && toggleDate && toggleDate(d.iso)}
                          style={{
                            flexShrink: 0,
                            width: '42px',
                            height: '54px',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: sel ? 'linear-gradient(135deg, #FF4B72 0%, #FF2D55 100%)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${sel ? '#FF87A2' : 'rgba(255, 255, 255, 0.08)'}`,
                            cursor: isWknd ? 'not-allowed' : 'pointer',
                            opacity: isWknd ? 0.25 : 1,
                            boxShadow: sel ? '0 0 12px rgba(255, 75, 114, 0.4)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '8px', fontWeight: 900, color: sel ? '#fff' : AURA_COLORS.subBright, textTransform: 'uppercase' }}>
                            {d.dayStr}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 950, color: '#fff', marginTop: '2px' }} className="tabular-nums">
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
                      background: `linear-gradient(135deg, ${AURA_COLORS.purple} 0%, ${AURA_COLORS.pink} 100%)`,
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 950,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Forecast Calendar Impact ({selectedDates?.size || 0} dates)
                  </button>

                  {predictions && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {predictions.length === 0 ? (
                        <div style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: AURA_COLORS.sub, fontWeight: 700 }}>
                          No classes scheduled on selected dates.
                        </div>
                      ) : (
                        predictions.map((p: AnyValue, idx: number) => {
                          const details = getStatusDetails(p.projPct);
                          return (
                            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${details.color}`, padding: '8px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ minWidth: 0, paddingRight: '8px' }}>
                                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.title}
                                </div>
                                <div style={{ fontSize: '9.5px', fontWeight: 800, color: details.color }}>
                                  {p.marginLabel}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{ fontSize: '14px', fontWeight: 950, color: details.color }} className="tabular-nums">
                                  {(p.projPct || 0).toFixed(1)}%
                                </span>
                                <div style={{ fontSize: '8.5px', color: AURA_COLORS.sub }}>was {p.currentPct}%</div>
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

        {/* ─── 5. CLEAN COUNT-AWARE FILTER TABS ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 950, color: AURA_COLORS.subBright, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              SUBJECTS
            </span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub }}>
              ({filteredAttendance.length})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(["All", "Needs Attention", "Safe"] as const).map((tab) => {
              const isActive = filter === tab;
              const count = tab === "All" ? stats.totalSubs : (tab === "Needs Attention" ? stats.atRiskCount : stats.safeCount);

              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className="filter-tab-pill"
                  style={{
                    background: isActive ? 'rgba(192, 132, 252, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isActive ? 'rgba(192, 132, 252, 0.35)' : 'rgba(255, 255, 255, 0.07)',
                    color: isActive ? '#fff' : AURA_COLORS.subBright,
                    boxShadow: isActive ? '0 0 14px rgba(192, 132, 252, 0.12)' : 'none'
                  }}
                >
                  {tab === "Needs Attention" ? "Attention" : tab} {count > 0 && <span style={{ opacity: 0.85, marginLeft: '2px' }}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 6. COMPACT SUBJECT ROWS LIST ─── */}
        {filteredAttendance.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '36px 20px',
            textAlign: 'center',
            color: AURA_COLORS.sub
          }}>
            <CheckCircle2 size={28} color="#34D399" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#fff' }}>No subjects in this view</p>
            <p style={{ margin: '4px 0 0', fontSize: '11px' }}>All subjects are comfortably managed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAttendance.map((a: AnyValue, idx: number) => {
              const status = getStatusDetails(a.pct);
              const isTheory = !String(a.category || "").toLowerCase().includes("practical") && !String(a.category || "").toLowerCase().includes("lab");

              return (
                <div
                  key={a.courseCode || idx}
                  className="subject-row-item"
                  onClick={() => handleOpenSubject(a)}
                  style={{
                    borderLeft: `3.5px solid ${status.dot}`
                  }}
                >
                  {/* Top Row: Title, Code, Percentage & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: status.dot,
                          boxShadow: `0 0 8px ${status.dot}`,
                          flexShrink: 0
                        }} />
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 900,
                          color: isTheory ? AURA_COLORS.purple : AURA_COLORS.cyan,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          {a.courseCode}
                        </span>
                        {a.category && (
                          <span style={{
                            fontSize: '8.5px',
                            fontWeight: 800,
                            color: AURA_COLORS.sub,
                            textTransform: 'uppercase',
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {a.category}
                          </span>
                        )}
                      </div>

                      <h3 style={{
                        fontSize: '13.5px',
                        fontWeight: 850,
                        color: '#fff',
                        margin: 0,
                        lineHeight: 1.25,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {String(a.courseTitle || "").toLowerCase()}
                      </h3>
                    </div>

                    {/* Right: Percentage & Tappable Chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '17px',
                          fontWeight: 950,
                          color: status.color,
                          letterSpacing: '-0.02em',
                          lineHeight: 1
                        }} className="tabular-nums">
                          {(a.pct || 0).toFixed(1)}%
                        </span>
                      </div>
                      <ChevronRight size={15} color={AURA_COLORS.subBright} style={{ opacity: 0.7 }} />
                    </div>
                  </div>

                  {/* Middle: Slim Visual Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '4.5px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '100px',
                    overflow: 'hidden',
                    margin: '9px 0 8px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, a.pct || 0))}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${status.color}aa 0%, ${status.color} 100%)`,
                      borderRadius: '100px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* Bottom Row: Present · Absent · Skip Budget */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 750, color: AURA_COLORS.subBright }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span><b style={{ color: '#fff' }}>{a.attended}</b> P</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span><b style={{ color: (a.absent || 0) > 0 ? '#FF87A2' : '#fff' }}>{a.absent}</b> A</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span style={{ fontSize: '10.5px', color: AURA_COLORS.sub }}>{a.conducted} Total</span>
                    </div>

                    <div>
                      {(a.pct || 0) >= 75 ? (
                        <span style={{
                          color: a.skipBuffer === 0 ? '#FBBF24' : '#34D399',
                          fontWeight: 900,
                          fontSize: '11px'
                        }}>
                          {a.skipBuffer === 0 ? "Skip 0 (At Limit)" : `Skip ${a.skipBuffer}`}
                        </span>
                      ) : (
                        <span style={{
                          color: '#FF4B72',
                          fontWeight: 900,
                          fontSize: '11px'
                        }}>
                          Need {a.requiredToPass} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ─── 7. SUBJECT DETAIL VIEW (SLIDE-UP SHEET / MODAL) ─── */}
      {selectedSubject && (
        <div className="modal-overlay" onClick={handleCloseSubject}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            
            {/* Sheet Handle Bar */}
            <div style={{ width: '40px', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '100px', margin: '0 auto 16px' }} />

            {/* Header / Dismiss */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div>
                <button
                  onClick={handleCloseSubject}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: AURA_COLORS.purple,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '8px'
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Back to Attendance</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: AURA_COLORS.purple, textTransform: 'uppercase', background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                    {selectedSubject.courseCode}
                  </span>
                  {selectedSubject.category && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase' }}>
                      {selectedSubject.category}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.25, textTransform: 'capitalize' }}>
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
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Dominant Stat Gauge Row */}
            {(() => {
              const safePct = selectedSubject.pct || 0;
              const status = getStatusDetails(safePct);
              return (
                <div style={{
                  background: status.bgTint,
                  border: `1px solid ${status.borderTint}`,
                  borderRadius: '20px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: status.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CURRENT ATTENDANCE
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 950, color: '#fff', marginTop: '2px', lineHeight: 1 }} className="tabular-nums">
                      {safePct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: status.color, marginTop: '4px' }}>
                      ● {status.statusText}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 950, color: '#fff' }} className="tabular-nums">
                      {selectedSubject.attended} <span style={{ fontSize: '12px', color: AURA_COLORS.sub }}>/ {selectedSubject.conducted}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: AURA_COLORS.subBright, fontWeight: 700, marginTop: '2px' }}>
                      {selectedSubject.absent} Hours Absent
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Skip Budget or Recovery Requirement Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '14px 16px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  <ShieldCheck size={16} color="#34D399" />
                ) : (
                  <ShieldAlert size={16} color="#FF4B72" />
                )}
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: (selectedSubject.pct || 0) >= 75 ? '#34D399' : '#FF4B72', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "Skip Margin Allowance" : "Attendance Recovery Plan"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 750, color: '#fff', lineHeight: 1.45 }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  selectedSubject.skipBuffer === 0 
                    ? "You are exactly at the 75% limit. Any future absence will immediately put this course into the critical risk zone."
                    : `You can miss up to ${selectedSubject.skipBuffer} more class${selectedSubject.skipBuffer === 1 ? '' : 'es'} and remain safely at or above 75%.`
                ) : (
                  `You must attend the next ${selectedSubject.requiredToPass} consecutive class${selectedSubject.requiredToPass === 1 ? '' : 'es'} without missing any to restore your attendance back to 75%.`
                )}
              </p>
            </div>

            {/* "What If You Skip?" Future Simulation Forecast */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Activity size={13} color={AURA_COLORS.primary} />
                <span style={{ fontSize: '11px', fontWeight: 900, color: AURA_COLORS.subBright, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "What if you skip upcoming classes?" : "What if you attend upcoming classes?"}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  (selectedSubject.skipSimulations || []).map((sim: AnyValue) => (
                    <div
                      key={sim.skips}
                      style={{
                        background: sim.safe ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 75, 114, 0.08)',
                        border: `1px solid ${sim.safe ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 75, 114, 0.25)'}`,
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: AURA_COLORS.subBright }}>
                          Skip {sim.skips} {sim.skips === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: sim.safe ? '#34D399' : '#FF4B72', marginTop: '1px' }}>
                          {sim.safe ? "● Safe" : "● Below 75%"}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 950, color: sim.safe ? '#fff' : '#FF4B72' }} className="tabular-nums">
                        {(sim.nextPct || 0).toFixed(1)}%
                      </div>
                    </div>
                  ))
                ) : (
                  (selectedSubject.attendSimulations || []).map((sim: AnyValue) => (
                    <div
                      key={sim.extra}
                      style={{
                        background: sim.safe ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${sim.safe ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: AURA_COLORS.subBright }}>
                          Attend +{sim.extra} {sim.extra === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: sim.safe ? '#34D399' : '#FBBF24', marginTop: '1px' }}>
                          {sim.safe ? "● Reaches 75%" : "● Recovering"}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 950, color: sim.safe ? '#34D399' : '#fff' }} className="tabular-nums">
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
