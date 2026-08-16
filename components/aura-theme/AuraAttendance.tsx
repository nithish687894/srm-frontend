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
  BarChart3,
  BookOpen
} from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import { AURA_COLORS } from "./system/theme-tokens";

const AURA = AURA_COLORS;

// Safe status helper
const getStatusDetails = (pct: number) => {
  const safePct = typeof pct === "number" && !isNaN(pct) ? pct : 0;
  if (safePct >= 75) {
    return { 
      color: "#34C759", 
      label: "SAFE",
      dot: "#34C759",
      bgTint: "rgba(52, 199, 89, 0.10)",
      borderTint: "rgba(52, 199, 89, 0.25)",
      badgeBg: "rgba(52, 199, 89, 0.15)",
      statusText: "Safe & On Track"
    };
  }
  if (safePct >= 65) {
    return { 
      color: "#FF9500", 
      label: "WATCH",
      dot: "#FF9500",
      bgTint: "rgba(255, 149, 0, 0.10)",
      borderTint: "rgba(255, 149, 0, 0.25)",
      badgeBg: "rgba(255, 149, 0, 0.15)",
      statusText: "Needs Attention"
    };
  }
  return { 
    color: "#FF2D55", 
    label: "AT RISK",
    dot: "#FF2D55",
    bgTint: "rgba(255, 45, 85, 0.10)",
    borderTint: "rgba(255, 45, 85, 0.25)",
    badgeBg: "rgba(255, 45, 85, 0.15)",
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
    
    // Sort by lowest percentage to surface alert
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

  const avgColor = stats.overallAvg >= 75 ? "#34C759" : (stats.overallAvg >= 65 ? "#FF9500" : "#FF2D55");

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .attendance-page-layout {
          flex: 1;
          padding: calc(env(safe-area-inset-top, 0px) + 72px) 24px 110px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
          min-width: 0;
          overflow-x: clip;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .sticky-command-bar {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 64px);
          left: 16px;
          right: 16px;
          max-width: 960px;
          margin: 0 auto;
          border-radius: 24px;
          background: rgba(12, 10, 20, 0.88);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          padding: 12px 20px;
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

        .today-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        .subject-card-item {
          padding: 18px 20px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 10px;
          -webkit-tap-highlight-color: transparent;
        }
        .subject-card-item:hover {
          border-color: rgba(191, 90, 242, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .subject-card-item:active {
          transform: scale(0.985);
        }

        .filter-tab-pill {
          padding: 8px 16px;
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

        /* Bottom Sheet Modal */
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
          max-width: 580px;
          max-height: 90vh;
          background: linear-gradient(155deg, rgba(22, 17, 38, 0.98) 0%, rgba(9, 7, 16, 0.99) 100%);
          border: 1px solid rgba(191, 90, 242, 0.25);
          border-radius: 32px 32px 0 0;
          padding: 24px 26px 36px;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 640px) {
          .modal-sheet {
            border-radius: 28px;
            padding: 28px;
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

        @media (max-width: 480px) {
          .attendance-page-layout {
            padding: 96px 16px 110px;
            gap: 20px;
          }
          .today-stats-grid {
            gap: 8px !important;
          }
        }

        /* Light Theme Overrides */
        body.theme-light .sticky-command-bar {
          background: rgba(255, 255, 255, 0.92) !important;
          border-color: rgba(88, 61, 145, 0.14) !important;
          box-shadow: 0 10px 28px rgba(88, 61, 145, 0.12) !important;
          color: #17111f !important;
        }
        body.theme-light .subject-card-item {
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
          <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.04em', color: AURA.text }}>
            Attendance
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: AURA.sub }}>
            {stats.totalSubs} Subjects
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 950, color: avgColor }} className="tabular-nums">
              {stats.overallAvg.toFixed(1)}%
            </span>
          </div>
          {stats.atRiskCount > 0 ? (
            <span style={{ fontSize: '9.5px', background: 'rgba(255, 45, 85, 0.15)', border: '1px solid rgba(255, 45, 85, 0.3)', color: '#FF2D55', padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>
              {stats.atRiskCount} RISK
            </span>
          ) : (
            <span style={{ fontSize: '9.5px', background: 'rgba(52, 199, 89, 0.15)', border: '1px solid rgba(52, 199, 89, 0.3)', color: '#34C759', padding: '3px 8px', borderRadius: '100px', fontWeight: 900 }}>
              ON TRACK
            </span>
          )}
        </div>
      </div>

      <main className="attendance-page-layout">

        {/* ─── 1. ATTENDANCE COMMAND CENTER (Matching Home Page Today Command Center) ─── */}
        <div className="premium-card" style={{ padding: '28px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className="ai-border" />

          {/* Header Badge Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
            <div style={{ padding: '6px 14px', background: 'rgba(191, 90, 242, 0.1)', border: '1px solid rgba(191, 90, 242, 0.2)', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color={AURA.purple} />
              <span style={{ fontSize: "10px", fontWeight: 900, color: AURA.purple, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Academic Command</span>
            </div>

            {/* Sync & Timestamp Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  padding: '6px 14px',
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
                <RefreshCcw size={11} className={isSyncing ? "animate-spin" : ""} color={AURA.primary} />
                <span>{isSyncing ? "Syncing..." : "Sync"}</span>
              </button>

              {timeAgoStr && (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  background: 'rgba(0, 0, 0, 0.25)', 
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '6px 12px', 
                  borderRadius: '100px',
                  fontSize: '10.5px', 
                  fontWeight: 750, 
                  color: AURA.subBright
                }}>
                  <Clock size={11} color={AURA.primary} />
                  <span>{timeAgoStr}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Attendance Headline & Dominant Metric */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 2, flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: AURA.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                OVERALL ATTENDANCE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{
                  fontSize: '44px',
                  fontWeight: 950,
                  color: avgColor,
                  letterSpacing: '-0.04em',
                  lineHeight: 1
                }} className="tabular-nums">
                  {stats.overallAvg.toFixed(1)}%
                </span>
                
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  background: stats.overallAvg >= 75 ? 'rgba(52, 199, 89, 0.12)' : (stats.overallAvg >= 65 ? 'rgba(255, 149, 0, 0.12)' : 'rgba(255, 45, 85, 0.12)'),
                  border: `1px solid ${stats.overallAvg >= 75 ? 'rgba(52, 199, 89, 0.3)' : (stats.overallAvg >= 65 ? 'rgba(255, 149, 0, 0.3)' : 'rgba(255, 45, 85, 0.3)')}`,
                  color: avgColor
                }}>
                  {stats.overallAvg >= 75 ? "● Looking Good" : (stats.overallAvg >= 65 ? "● Watch Margin" : "● At Critical Risk")}
                </span>
              </div>

              <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: 750, color: AURA.subBright }}>
                {stats.totalSubs} Registered Subjects · {stats.atRiskCount > 0 ? `${stats.atRiskCount} Require Attention` : "All Safely Above 75% Target"}
              </p>
            </div>

            {/* Total Safe Skips Buffer Pill */}
            {stats.totalSkipsAllowed > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px 16px',
                borderRadius: '20px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '9.5px', fontWeight: 900, color: AURA.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SKIP BUDGET
                </div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: AURA.primary, marginTop: '2px' }} className="tabular-nums">
                  +{stats.totalSkipsAllowed} <span style={{ fontSize: '10px', fontWeight: 800, color: AURA.sub }}>classes</span>
                </div>
              </div>
            )}
          </div>

          {/* 3-Item Stats Grid (Identical to Dashboard's Today Stats Grid) */}
          <div className="today-stats-grid">
            {/* Safe Subjects Card */}
            <div style={{ 
              background: 'rgba(52, 199, 89, 0.08)', 
              border: '1px solid rgba(52, 199, 89, 0.2)', 
              borderRadius: '20px', 
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={13} color="#34C759" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#34C759', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 950, color: '#ffffff', lineHeight: 1 }} className="tabular-nums">
                {stats.safeCount} <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Subjects</span>
              </div>
            </div>

            {/* Attendance Risk Card */}
            <div style={{ 
              background: stats.atRiskCount > 0 ? 'rgba(255, 45, 85, 0.08)' : 'rgba(52, 199, 89, 0.08)', 
              border: stats.atRiskCount > 0 ? '1px solid rgba(255, 45, 85, 0.2)' : '1px solid rgba(52, 199, 89, 0.2)', 
              borderRadius: '20px', 
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={13} color={stats.atRiskCount > 0 ? '#FF2D55' : '#34C759'} />
                <span style={{ fontSize: '10px', fontWeight: 900, color: stats.atRiskCount > 0 ? '#FF2D55' : '#34C759', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stats.atRiskCount > 0 ? "Risk" : "No Risk"}
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 950, color: '#ffffff', lineHeight: 1 }} className="tabular-nums">
                {stats.atRiskCount} <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Subject{stats.atRiskCount === 1 ? '' : 's'}</span>
              </div>
            </div>

            {/* Total Conducted Hours Card */}
            <div style={{ 
              background: 'rgba(191, 90, 242, 0.08)', 
              border: '1px solid rgba(191, 90, 242, 0.2)', 
              borderRadius: '20px', 
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BarChart3 size={13} color={AURA.purple} />
                <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.purple, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hours</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 950, color: '#ffffff', lineHeight: 1 }} className="tabular-nums">
                {stats.totalAttended} <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>/ {stats.totalConducted}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. SINGLE INTELLIGENT ATTENTION / WATCHLIST BANNER ─── */}
        {(() => {
          const subject = stats.primaryAlertSubject;
          if (!subject) return null;

          const isAtRisk = (subject.pct || 0) < 75;
          const isCloseWatch = (subject.pct || 0) >= 75 && (subject.pct || 0) <= 78;

          if (isAtRisk) {
            return (
              <div 
                onClick={() => handleOpenSubject(subject)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 45, 85, 0.12) 0%, rgba(191, 90, 242, 0.06) 100%)',
                  border: '1px solid rgba(255, 45, 85, 0.3)',
                  boxShadow: '0 8px 24px rgba(255, 45, 85, 0.12)',
                  borderRadius: '24px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '14px',
                    background: 'rgba(255, 45, 85, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={18} color="#FF2D55" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#FF2D55', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        NEEDS ATTENTION
                      </span>
                      <span style={{ fontSize: '9px', color: AURA.sub }}>•</span>
                      <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#fff' }} className="tabular-nums">
                        {(subject.pct || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                      {subject.courseTitle}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#FF87A2', marginTop: '1px' }}>
                      {subject.requiredToPass === 1 ? 'Attend next 1 class to recover above 75%' : `Attend next ${subject.requiredToPass} classes to recover above 75%`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FF2D55', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                  <span>View</span>
                  <ChevronRight size={15} />
                </div>
              </div>
            );
          }

          if (isCloseWatch) {
            return (
              <div 
                onClick={() => handleOpenSubject(subject)}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.12) 0%, rgba(191, 90, 242, 0.06) 100%)',
                  border: '1px solid rgba(255, 149, 0, 0.3)',
                  boxShadow: '0 8px 24px rgba(255, 149, 0, 0.1)',
                  borderRadius: '24px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '14px',
                    background: 'rgba(255, 149, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Zap size={18} color="#FF9500" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#FF9500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        WATCHLIST
                      </span>
                      <span style={{ fontSize: '9px', color: AURA.sub }}>•</span>
                      <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#fff' }} className="tabular-nums">
                        {(subject.pct || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                      {subject.courseTitle}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#FCD34D', marginTop: '1px' }}>
                      {subject.skipBuffer === 0 ? 'Zero skip buffer — cannot miss next class' : `Closest to threshold • Only ${subject.skipBuffer} skip left`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FF9500', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                  <span>View</span>
                  <ChevronRight size={15} />
                </div>
              </div>
            );
          }

          // All on track
          return (
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(0, 229, 255, 0.04) 100%)',
                border: '1px solid rgba(52, 199, 89, 0.25)',
                boxShadow: '0 8px 24px rgba(52, 199, 89, 0.08)',
                borderRadius: '24px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '14px',
                background: 'rgba(52, 199, 89, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={18} color="#34C759" />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#34C759', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  YOU'RE ON TRACK
                </span>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginTop: '1px' }}>
                  All {stats.totalSubs} subjects are safely above 75%
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── 3. INTERACTIVE SKIP PREDICTOR CARD ─── */}
        <div>
          {!isPredictorOpen ? (
            <div
              onClick={() => setPredictorOpen(true)}
              className="premium-card"
              style={{
                borderRadius: '24px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '14px', 
                  background: 'rgba(191, 90, 242, 0.12)', 
                  border: '1px solid rgba(191, 90, 242, 0.2)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Zap size={18} color={AURA.purple} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>
                    ⚡ Skip Predictor
                  </div>
                  <div style={{ fontSize: '11px', color: AURA.subBright, fontWeight: 700, marginTop: '1px' }}>
                    See how skipping classes affects your attendance
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color={AURA.purple} />
            </div>
          ) : (
            <div className="premium-card" style={{
              borderRadius: '28px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color={AURA.purple} />
                  <span style={{ fontSize: '13px', fontWeight: 950, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Skip Predictor
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '2px' }}>
                    <button
                      onClick={() => setPredictorMode("quick")}
                      style={{
                        background: predictorMode === "quick" ? 'rgba(191, 90, 242, 0.2)' : 'transparent',
                        border: 'none',
                        color: predictorMode === "quick" ? '#fff' : AURA.sub,
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Stepper
                    </button>
                    <button
                      onClick={() => setPredictorMode("calendar")}
                      style={{
                        background: predictorMode === "calendar" ? 'rgba(191, 90, 242, 0.2)' : 'transparent',
                        border: 'none',
                        color: predictorMode === "calendar" ? '#fff' : AURA.sub,
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Calendar
                    </button>
                  </div>

                  <button
                    onClick={() => setPredictorOpen(false)}
                    style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Mode A: Stepper */}
              {predictorMode === "quick" ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '18px', padding: '14px 16px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: AURA.sub, textTransform: 'uppercase' }}>
                        Simulate Absences
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginTop: '2px' }}>
                        Miss {skipStepperCount} {skipStepperCount === 1 ? 'Class' : 'Classes'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setSkipStepperCount(Math.max(1, skipStepperCount - 1))}
                        disabled={skipStepperCount <= 1}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '12px',
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
                        <Minus size={15} />
                      </button>

                      <span style={{ fontSize: '20px', fontWeight: 950, color: AURA.primary, minWidth: '28px', textAlign: 'center' }} className="tabular-nums">
                        {skipStepperCount}
                      </span>

                      <button
                        onClick={() => setSkipStepperCount(Math.min(20, skipStepperCount + 1))}
                        disabled={skipStepperCount >= 20}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: skipStepperCount >= 20 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Impact list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }} className="hide-scrollbar">
                    {processedAttendance.map((sub: AnyValue, idx: number) => {
                      const nextPct = sub.stepperNextPct || 0;
                      const isSafe = sub.stepperSafe;
                      return (
                        <div key={sub.courseCode || idx} style={{ background: 'rgba(0, 0, 0, 0.25)', borderLeft: `3.5px solid ${isSafe ? '#34C759' : '#FF2D55'}`, padding: '10px 12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ minWidth: 0, paddingRight: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sub.courseTitle}
                            </div>
                            <div style={{ fontSize: '9.5px', fontWeight: 800, color: isSafe ? '#34C759' : '#FF2D55', marginTop: '1px' }}>
                              {isSafe ? `● Still Safe (${sub.skipBuffer >= skipStepperCount ? `+${sub.skipBuffer - skipStepperCount} left` : 'at boundary'})` : `● Falls Below 75%`}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: 950, color: isSafe ? '#fff' : '#FF2D55' }} className="tabular-nums">
                              {sub.pct.toFixed(1)}% → {nextPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Mode B: Calendar */
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
                            width: '44px',
                            height: '56px',
                            borderRadius: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: sel ? 'linear-gradient(135deg, #FF2D55 0%, #FF75C3 100%)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${sel ? '#FF87A2' : 'rgba(255, 255, 255, 0.08)'}`,
                            cursor: isWknd ? 'not-allowed' : 'pointer',
                            opacity: isWknd ? 0.25 : 1,
                            boxShadow: sel ? '0 0 14px rgba(255, 45, 85, 0.4)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '8.5px', fontWeight: 900, color: sel ? '#fff' : AURA.subBright, textTransform: 'uppercase' }}>
                            {d.dayStr}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 950, color: '#fff', marginTop: '2px' }} className="tabular-nums">
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
                      padding: '12px',
                      background: `linear-gradient(135deg, ${AURA.purple} 0%, ${AURA.pink} 100%)`,
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 950,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(191, 90, 242, 0.25)'
                    }}
                  >
                    Forecast Calendar Impact ({selectedDates?.size || 0} dates)
                  </button>

                  {predictions && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {predictions.length === 0 ? (
                        <div style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: AURA.sub, fontWeight: 700 }}>
                          No classes scheduled on selected dates.
                        </div>
                      ) : (
                        predictions.map((p: AnyValue, idx: number) => {
                          const details = getStatusDetails(p.projPct);
                          return (
                            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${details.color}`, padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ minWidth: 0, paddingRight: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.title}
                                </div>
                                <div style={{ fontSize: '9.5px', fontWeight: 800, color: details.color }}>
                                  {p.marginLabel}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{ fontSize: '15px', fontWeight: 950, color: details.color }} className="tabular-nums">
                                  {(p.projPct || 0).toFixed(1)}%
                                </span>
                                <div style={{ fontSize: '9px', color: AURA.sub }}>was {p.currentPct}%</div>
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

        {/* ─── 4. SUBJECTS HEADER & COUNT TABS ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 950, color: AURA.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Enrolled Courses
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: AURA.sub }}>
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
                    background: isActive ? 'rgba(191, 90, 242, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isActive ? 'rgba(191, 90, 242, 0.35)' : 'rgba(255, 255, 255, 0.07)',
                    color: isActive ? '#fff' : AURA.subBright,
                    boxShadow: isActive ? '0 0 14px rgba(191, 90, 242, 0.15)' : 'none'
                  }}
                >
                  {tab === "Needs Attention" ? "Attention" : tab} {count > 0 && <span style={{ opacity: 0.85, marginLeft: '3px' }}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 5. COMPACT SUBJECT CARDS (Matching Home Page Aesthetic) ─── */}
        {filteredAttendance.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '40px 20px',
            textAlign: 'center',
            color: AURA.sub
          }}>
            <CheckCircle2 size={32} color="#34C759" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>No subjects in this view</div>
            <div style={{ fontSize: '11.5px', marginTop: '4px' }}>All subjects are comfortably managed.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredAttendance.map((a: AnyValue, idx: number) => {
              const status = getStatusDetails(a.pct);
              const isTheory = !String(a.category || "").toLowerCase().includes("practical") && !String(a.category || "").toLowerCase().includes("lab");

              return (
                <div
                  key={a.courseCode || idx}
                  className="subject-card-item"
                  onClick={() => handleOpenSubject(a)}
                  style={{
                    borderLeft: `4px solid ${status.dot}`
                  }}
                >
                  {/* Top Row: Category, Code, Title & Attendance % */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{
                          width: '7.5px',
                          height: '7.5px',
                          borderRadius: '50%',
                          background: status.dot,
                          boxShadow: `0 0 8px ${status.dot}`,
                          flexShrink: 0
                        }} />
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 900,
                          color: isTheory ? AURA.purple : AURA.cyan,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          {a.courseCode}
                        </span>
                        {a.category && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: AURA.sub,
                            textTransform: 'uppercase',
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}>
                            {a.category}
                          </span>
                        )}
                      </div>

                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: 900,
                        color: AURA.text,
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

                    {/* Right: Percentage & Chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 950,
                        color: status.color,
                        letterSpacing: '-0.02em',
                        lineHeight: 1
                      }} className="tabular-nums">
                        {(a.pct || 0).toFixed(1)}%
                      </span>
                      <ChevronRight size={16} color={AURA.subBright} style={{ opacity: 0.7 }} />
                    </div>
                  </div>

                  {/* Middle: Progress Bar with 75% Threshold Marker */}
                  <div style={{
                    width: '100%',
                    height: '5px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '100px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, a.pct || 0))}%`,
                      height: '100%',
                      background: status.color,
                      borderRadius: '100px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* Bottom Row: Present · Absent · Skip Budget */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 750, color: AURA.subBright }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span><b style={{ color: '#fff' }}>{a.attended}</b> P</span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span><b style={{ color: (a.absent || 0) > 0 ? '#FF87A2' : '#fff' }}>{a.absent}</b> A</span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span style={{ fontSize: '11px', color: AURA.sub }}>{a.conducted} Total</span>
                    </div>

                    <div>
                      {(a.pct || 0) >= 75 ? (
                        <span style={{
                          color: a.skipBuffer === 0 ? '#FF9500' : '#34C759',
                          fontWeight: 900,
                          fontSize: '11.5px'
                        }}>
                          {a.skipBuffer === 0 ? "Skip 0 (Limit)" : `Skip ${a.skipBuffer}`}
                        </span>
                      ) : (
                        <span style={{
                          color: '#FF2D55',
                          fontWeight: 900,
                          fontSize: '11.5px'
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

      </main>

      {/* ─── 6. SUBJECT DETAIL SHEET (Matching Home Page Glass Dialogs) ─── */}
      {selectedSubject && (
        <div className="modal-overlay" onClick={handleCloseSubject}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            
            {/* Sheet Handle */}
            <div style={{ width: '42px', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '100px', margin: '0 auto 18px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
              <div>
                <button
                  onClick={handleCloseSubject}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: AURA.purple,
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
                  <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.purple, textTransform: 'uppercase', background: 'rgba(191, 90, 242, 0.1)', border: '1px solid rgba(191, 90, 242, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                    {selectedSubject.courseCode}
                  </span>
                  {selectedSubject.category && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: AURA.sub, textTransform: 'uppercase' }}>
                      {selectedSubject.category}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 950, color: '#fff', margin: 0, lineHeight: 1.25, textTransform: 'capitalize' }}>
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

            {/* Attendance Status Card */}
            {(() => {
              const safePct = selectedSubject.pct || 0;
              const status = getStatusDetails(safePct);
              return (
                <div style={{
                  background: status.bgTint,
                  border: `1px solid ${status.borderTint}`,
                  borderRadius: '22px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '18px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: status.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CURRENT ATTENDANCE
                    </div>
                    <div style={{ fontSize: '38px', fontWeight: 950, color: '#fff', marginTop: '2px', lineHeight: 1 }} className="tabular-nums">
                      {safePct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: status.color, marginTop: '4px' }}>
                      ● {status.statusText}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 950, color: '#fff' }} className="tabular-nums">
                      {selectedSubject.attended} <span style={{ fontSize: '13px', color: AURA.sub }}>/ {selectedSubject.conducted}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: AURA.subBright, fontWeight: 700, marginTop: '2px' }}>
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
              borderRadius: '20px',
              padding: '16px 18px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  <ShieldCheck size={17} color="#34C759" />
                ) : (
                  <ShieldAlert size={17} color="#FF2D55" />
                )}
                <span style={{ fontSize: '12px', fontWeight: 900, color: (selectedSubject.pct || 0) >= 75 ? '#34C759' : '#FF2D55', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "Skip Margin Allowance" : "Attendance Recovery Plan"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 750, color: '#fff', lineHeight: 1.45 }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  selectedSubject.skipBuffer === 0 
                    ? "You are exactly at the 75% limit. Any future absence will immediately put this course into the critical risk zone."
                    : `You can miss up to ${selectedSubject.skipBuffer} more class${selectedSubject.skipBuffer === 1 ? '' : 'es'} and remain safely at or above 75%.`
                ) : (
                  `You must attend the next ${selectedSubject.requiredToPass} consecutive class${selectedSubject.requiredToPass === 1 ? '' : 'es'} without missing any to restore your attendance back to 75%.`
                )}
              </p>
            </div>

            {/* What If Simulation Forecast */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Activity size={14} color={AURA.primary} />
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: AURA.subBright, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {(selectedSubject.pct || 0) >= 75 ? "What if you skip upcoming classes?" : "What if you attend upcoming classes?"}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {(selectedSubject.pct || 0) >= 75 ? (
                  (selectedSubject.skipSimulations || []).map((sim: AnyValue) => (
                    <div
                      key={sim.skips}
                      style={{
                        background: sim.safe ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 45, 85, 0.08)',
                        border: `1px solid ${sim.safe ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 45, 85, 0.25)'}`,
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: AURA.subBright }}>
                          Skip {sim.skips} {sim.skips === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: sim.safe ? '#34C759' : '#FF2D55', marginTop: '1px' }}>
                          {sim.safe ? "● Safe" : "● Below 75%"}
                        </div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 950, color: sim.safe ? '#fff' : '#FF2D55' }} className="tabular-nums">
                        {(sim.nextPct || 0).toFixed(1)}%
                      </div>
                    </div>
                  ))
                ) : (
                  (selectedSubject.attendSimulations || []).map((sim: AnyValue) => (
                    <div
                      key={sim.extra}
                      style={{
                        background: sim.safe ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${sim.safe ? 'rgba(52, 199, 89, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: AURA.subBright }}>
                          Attend +{sim.extra} {sim.extra === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: sim.safe ? '#34C759' : '#FF9500', marginTop: '1px' }}>
                          {sim.safe ? "● Reaches 75%" : "● Recovering"}
                        </div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 950, color: sim.safe ? '#34C759' : '#fff' }} className="tabular-nums">
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
                padding: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '11.5px',
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
