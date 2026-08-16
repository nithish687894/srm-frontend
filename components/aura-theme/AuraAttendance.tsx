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
  TrendingUp,
  Award
} from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import { AURA_COLORS as SHARED_AURA } from "./system/theme-tokens";

const AURA_COLORS = SHARED_AURA;

const getStatusColor = (pct: number) => {
  if (pct === 0) return AURA_COLORS.sub;
  if (pct < 75) return AURA_COLORS.red;
  if (pct < 80) return AURA_COLORS.amber;
  return AURA_COLORS.purple;
};

const getStatusLabel = (pct: number) => {
  if (pct === 0) return "NO DATA";
  if (pct < 75) return "AT RISK";
  if (pct < 80) return "WATCH";
  if (pct < 90) return "SAFE";
  return "EXCELLENT";
};

const getProgressBarGradient = (pct: number) => {
  if (pct < 75) return `linear-gradient(90deg, rgba(255, 107, 139, 0.4) 0%, ${AURA_COLORS.red} 100%)`;
  if (pct < 80) return `linear-gradient(90deg, rgba(251, 191, 36, 0.4) 0%, ${AURA_COLORS.amber} 100%)`;
  return `linear-gradient(90deg, rgba(167, 139, 250, 0.4) 0%, ${AURA_COLORS.purple} 100%)`;
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
  const [filter, setFilter] = useState<string>("All");
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
    
    // Primary alert subject
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
    let result = [...processedAttendance];
    if (filter === "At Risk") {
      result = result.filter((a: AnyValue) => (a?.pct || 0) < 75);
    } else if (filter === "Safe") {
      result = result.filter((a: AnyValue) => (a?.pct || 0) >= 75);
    } else if (filter === "Lowest Attendance") {
      result.sort((a: AnyValue, b: AnyValue) => (a?.pct || 0) - (b?.pct || 0));
    } else if (filter === "Highest Attendance") {
      result.sort((a: AnyValue, b: AnyValue) => (b?.pct || 0) - (a?.pct || 0));
    } else if (filter === "Alphabetical") {
      result.sort((a: AnyValue, b: AnyValue) => (a?.courseTitle || "").localeCompare(b?.courseTitle || ""));
    }
    return result;
  }, [processedAttendance, filter]);

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .attendance-stats-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          padding: 0 24px;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 24px;
        }
        .attendance-stat-card {
          min-width: 0;
          border-radius: 24px;
          padding: 20px;
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        .attendance-stat-icon {
          margin-bottom: 14px;
          position: relative;
          z-index: 1;
        }
        .attendance-stat-label {
          font-size: 10px;
          font-weight: 800;
          color: ${AURA_COLORS.sub};
          text-transform: uppercase;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        .attendance-stat-value {
          font-size: 30px;
          font-weight: 900;
          color: #fff;
          position: relative;
          z-index: 1;
          line-height: 1;
        }
        .attendance-stat-unit {
          font-size: 12px;
          font-weight: 750;
          color: ${AURA_COLORS.sub};
          margin-left: 3px;
        }

        @media (max-width: 500px) {
          .attendance-stats-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            padding: 0 16px;
          }
          .attendance-stats-strip > :last-child {
            grid-column: 1 / -1;
          }
          .attendance-stat-card {
            padding: 16px;
            border-radius: 20px;
          }
          .attendance-stat-icon {
            width: 20px;
            height: 20px;
            margin-bottom: 10px;
          }
          .attendance-stat-label {
            font-size: 9px;
            margin-bottom: 6px;
          }
          .attendance-stat-value {
            font-size: 26px;
          }
        }

        .attendance-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 24px;
          margin-bottom: 20px;
        }
        @media (max-width: 500px) {
          .attendance-filter-row {
            padding: 0 16px;
          }
        }

        .sticky-header {
          position: fixed; top: 72px; left: 16px; right: 16px; border-radius: 24px;
          background: rgba(10, 8, 16, 0.85); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
          padding: 14px 20px; border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex; align-items: center; justify-content: space-between;
          z-index: 100; transform: translateY(-150%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .sticky-header.visible { transform: translateY(0); }

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

        /* Light Theme Overrides */
        body.theme-light .sticky-header {
          background: linear-gradient(135deg, rgba(255,255,255,0.86), rgba(243,238,255,0.82));
          border-color: rgba(88,61,145,0.16);
          box-shadow: 0 12px 30px rgba(46,32,74,0.14), inset 0 1px 0 rgba(255,255,255,0.72);
        }
        body.theme-light .modal-sheet {
          background: linear-gradient(155deg, rgba(255, 255, 255, 0.98), rgba(248, 244, 255, 0.96)) !important;
          border-color: rgba(88, 61, 145, 0.2) !important;
          color: #17111f !important;
          box-shadow: 0 20px 50px rgba(88, 61, 145, 0.2) !important;
        }
      `}} />

      {/* Sticky Header on Scroll */}
      <div className={`sticky-header ${isScrolled ? 'visible' : ''}`}>
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Attendance Hub</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.sub }}>
            AVG <span style={{ color: getStatusColor(stats.overallAvg) }}>{stats.overallAvg.toFixed(1)}%</span>
          </span>
          {stats.atRiskCount > 0 && (
            <span style={{ fontSize: '10px', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: AURA_COLORS.red, padding: '4px 8px', borderRadius: '100px', fontWeight: 900 }}>
              {stats.atRiskCount} AT RISK
            </span>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)', paddingBottom: '110px' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '0 16px' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(192, 132, 252, 0.08)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(192, 132, 252, 0.18)', marginBottom: '16px', boxShadow: '0 0 20px rgba(192, 132, 252, 0.06)' }}>
            <Sparkles size={14} color={AURA_COLORS.purple} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: AURA_COLORS.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lumina Attendance</span>
          </div>

          <h1 style={{ fontSize: "40px", fontWeight: 900, margin: '0 0 12px', letterSpacing: '-2px', lineHeight: 1 }}>
            Attendance <span style={{ color: AURA_COLORS.purple }}>Hub</span>
          </h1>

          {/* Sync Trigger & Time */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
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
                padding: '6px 12px', 
                borderRadius: '100px',
                fontSize: '10.5px', 
                fontWeight: 750, 
                color: AURA_COLORS.subBright
              }}>
                <Clock size={11} color={AURA_COLORS.primary} />
                <span>{timeAgoStr}</span>
              </div>
            )}
          </div>

          {/* 3-Stat Hero Strip (Identical to Marks Page) */}
          <div className="hide-scrollbar attendance-stats-strip">
            <div className="premium-card attendance-stat-card" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.05)' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.08)', filter: 'blur(20px)', pointerEvents: 'none' }} />
              <Activity size={24} color={AURA_COLORS.cyan} className="attendance-stat-icon" />
              <div className="attendance-stat-label">Total Subjects</div>
              <div className="attendance-stat-value tabular-nums">{stats.totalSubs}</div>
            </div>

            <div className="premium-card attendance-stat-card" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(192, 132, 252, 0.05)' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.08)', filter: 'blur(20px)', pointerEvents: 'none' }} />
              <TrendingUp size={24} color={getStatusColor(stats.overallAvg)} className="attendance-stat-icon" />
              <div className="attendance-stat-label">Overall Average</div>
              <div className="attendance-stat-value tabular-nums" style={{ color: getStatusColor(stats.overallAvg) }}>
                {stats.overallAvg.toFixed(1)}%
              </div>
            </div>

            <div className="premium-card attendance-stat-card" style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.5), 0 0 20px ${stats.atRiskCount > 0 ? 'rgba(255, 107, 139, 0.08)' : 'rgba(192, 132, 252, 0.05)'}` }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: stats.atRiskCount > 0 ? 'rgba(255, 107, 139, 0.08)' : 'rgba(192, 132, 252, 0.05)', filter: 'blur(20px)', pointerEvents: 'none' }} />
              <AlertTriangle size={24} color={stats.atRiskCount > 0 ? AURA_COLORS.red : AURA_COLORS.purple} className="attendance-stat-icon" />
              <div className="attendance-stat-label">At Risk</div>
              <div className="attendance-stat-value tabular-nums" style={{ color: stats.atRiskCount > 0 ? AURA_COLORS.red : '#fff' }}>
                {stats.atRiskCount}<span className="attendance-stat-unit">Subjects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skip Predictor Accordion Strip */}
        <div style={{ padding: '0 24px', marginBottom: '20px' }}>
          {!isPredictorOpen ? (
            <div
              onClick={() => setPredictorOpen(true)}
              className="liquid-card"
              style={{
                borderRadius: '24px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                border: '1px solid rgba(255, 255, 255, 0.06)'
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
                  <Zap size={18} color={AURA_COLORS.purple} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>
                    ⚡ Skip Predictor
                  </div>
                  <div style={{ fontSize: '11px', color: AURA_COLORS.subBright, fontWeight: 700, marginTop: '1px' }}>
                    Calculate how skipping classes affects your attendance
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color={AURA_COLORS.purple} />
            </div>
          ) : (
            <div className="liquid-card" style={{
              borderRadius: '28px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '1px solid rgba(191, 90, 242, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color={AURA_COLORS.purple} />
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
                        color: predictorMode === "quick" ? '#fff' : AURA_COLORS.sub,
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
                        color: predictorMode === "calendar" ? '#fff' : AURA_COLORS.sub,
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

              {predictorMode === "quick" ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '18px', padding: '14px 16px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase' }}>
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

                      <span style={{ fontSize: '20px', fontWeight: 950, color: AURA_COLORS.primary, minWidth: '28px', textAlign: 'center' }} className="tabular-nums">
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }} className="hide-scrollbar">
                    {processedAttendance.map((sub: AnyValue, idx: number) => {
                      const nextPct = sub.stepperNextPct || 0;
                      const isSafe = sub.stepperSafe;
                      const statCol = isSafe ? AURA_COLORS.purple : AURA_COLORS.red;
                      return (
                        <div key={sub.courseCode || idx} style={{ background: 'rgba(0, 0, 0, 0.25)', borderLeft: `3.5px solid ${statCol}`, padding: '10px 12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ minWidth: 0, paddingRight: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sub.courseTitle}
                            </div>
                            <div style={{ fontSize: '9.5px', fontWeight: 800, color: statCol, marginTop: '1px' }}>
                              {isSafe ? `● Still Safe (${sub.skipBuffer >= skipStepperCount ? `+${sub.skipBuffer - skipStepperCount} left` : 'at boundary'})` : `● Falls Below 75%`}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: 950, color: statCol }} className="tabular-nums">
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
                          <span style={{ fontSize: '8.5px', fontWeight: 900, color: sel ? '#fff' : AURA_COLORS.subBright, textTransform: 'uppercase' }}>
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
                      background: `linear-gradient(135deg, ${AURA_COLORS.purple} 0%, ${AURA_COLORS.pink} 100%)`,
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
                        <div style={{ padding: '10px', textAlign: 'center', fontSize: '11px', color: AURA_COLORS.sub, fontWeight: 700 }}>
                          No classes scheduled on selected dates.
                        </div>
                      ) : (
                        predictions.map((p: AnyValue, idx: number) => {
                          const col = getStatusColor(p.projPct);
                          return (
                            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${col}`, padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ minWidth: 0, paddingRight: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.title}
                                </div>
                                <div style={{ fontSize: '9.5px', fontWeight: 800, color: col }}>
                                  {p.marginLabel}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{ fontSize: '15px', fontWeight: 950, color: col }} className="tabular-nums">
                                  {(p.projPct || 0).toFixed(1)}%
                                </span>
                                <div style={{ fontSize: '9px', color: AURA_COLORS.sub }}>was {p.currentPct}%</div>
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

        {/* Filter Pills (Identical to Marks Registry) */}
        <div className="attendance-filter-row">
          {["All", "At Risk", "Safe", "Lowest Attendance", "Highest Attendance", "Alphabetical"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              style={{ 
                background: filter === f ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.3) 0%, rgba(255, 94, 126, 0.15) 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: filter === f ? '1px solid rgba(192, 132, 252, 0.6)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: filter === f ? '#ffffff' : AURA_COLORS.subBright,
                boxShadow: filter === f ? '0 8px 24px rgba(192, 132, 252, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                padding: '8px 18px', 
                borderRadius: '100px', 
                fontSize: '11px', 
                fontWeight: 900,
                whiteSpace: 'nowrap', 
                cursor: 'pointer', 
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                WebkitTapHighlightColor: 'transparent', 
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Cards Grid (Identical to Marks Registry) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 24px' }}>
          {filteredAttendance.length === 0 ? (
            <div className="liquid-card" style={{ padding: '36px', borderRadius: '32px', border: '1px dashed rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
              <CheckCircle2 size={32} color={AURA_COLORS.purple} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>No courses in this filter</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: AURA_COLORS.sub, marginTop: '4px' }}>All subjects are comfortably managed.</div>
            </div>
          ) : (
            filteredAttendance.map((a: AnyValue, i: number) => {
              const statusColor = getStatusColor(a.pct);
              const statusLabel = getStatusLabel(a.pct);

              return (
                <div 
                  key={a.courseCode || i} 
                  className="liquid-card"
                  onClick={() => handleOpenSubject(a)}
                  style={{
                    padding: '24px 28px',
                    borderRadius: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 35px ${statusColor}12, inset 0 1px 0 rgba(255,255,255,0.03)`,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer'
                  }}
                >
                  {/* Dynamic glow orb inside card */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-30px', 
                    right: '-30px', 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    background: statusColor, 
                    filter: 'blur(45px)', 
                    opacity: 0.06, 
                    pointerEvents: 'none',
                    zIndex: 0
                  }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Row 1: Code, Category, and Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: '100px' }}>
                          {a.courseCode}
                        </div>
                        {a.category && (
                          <div style={{ fontSize: '8.5px', fontWeight: 800, color: AURA_COLORS.sub, background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>
                            {a.category}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: 900, color: statusColor, background: `${statusColor}12`, border: `1px solid ${statusColor}22`, padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.1em' }}>
                        {statusLabel}
                      </div>
                    </div>

                    {/* Row 2: Course Name and Attendance % */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize', lineHeight: 1.3, flex: 1 }}>
                        {String(a.courseTitle || "").toLowerCase()}
                      </h3>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '28px', fontWeight: 950, color: statusColor, lineHeight: 1, textShadow: `0 0 15px ${statusColor}22` }} className="tabular-nums">
                            {(a.pct || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Progress Bar */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', position: 'relative', marginBottom: '16px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}>
                      <div style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        bottom: 0, 
                        width: `${Math.min(100, Math.max(0, a.pct || 0))}%`, 
                        background: getProgressBarGradient(a.pct), 
                        borderRadius: '6px', 
                        transition: 'width 0.6s ease' 
                      }} />
                    </div>

                    {/* Row 4: Stats breakdown (Present / Absent / Skip Margin) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: AURA_COLORS.subBright, fontWeight: 750 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span><b style={{ color: '#fff' }}>{a.attended}</b> P</span>
                        <span style={{ opacity: 0.35 }}>·</span>
                        <span><b style={{ color: (a.absent || 0) > 0 ? AURA_COLORS.red : '#fff' }}>{a.absent}</b> A</span>
                        <span style={{ opacity: 0.35 }}>·</span>
                        <span style={{ color: AURA_COLORS.sub }}>{a.conducted} Total</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(a.pct || 0) >= 75 ? (
                          <span style={{ color: a.skipBuffer === 0 ? AURA_COLORS.amber : '#34D399', fontWeight: 900 }}>
                            {a.skipBuffer === 0 ? "Skip 0 (At Limit)" : `Can skip ${a.skipBuffer}`}
                          </span>
                        ) : (
                          <span style={{ color: AURA_COLORS.red, fontWeight: 900 }}>
                            Need {a.requiredToPass} more
                          </span>
                        )}
                        <ChevronRight size={14} color={AURA_COLORS.sub} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Subject Detail Bottom Sheet Modal */}
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
                  <span style={{ fontSize: '10px', fontWeight: 900, color: AURA_COLORS.purple, textTransform: 'uppercase', background: 'rgba(191, 90, 242, 0.1)', border: '1px solid rgba(191, 90, 242, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                    {selectedSubject.courseCode}
                  </span>
                  {selectedSubject.category && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase' }}>
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

            {/* Dominant Attendance Card */}
            {(() => {
              const safePct = selectedSubject.pct || 0;
              const statusColor = getStatusColor(safePct);
              const statusLabel = getStatusLabel(safePct);
              return (
                <div style={{
                  background: `${statusColor}10`,
                  border: `1px solid ${statusColor}25`,
                  borderRadius: '22px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '18px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CURRENT ATTENDANCE
                    </div>
                    <div style={{ fontSize: '38px', fontWeight: 950, color: '#fff', marginTop: '2px', lineHeight: 1 }} className="tabular-nums">
                      {safePct.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: statusColor, marginTop: '4px' }}>
                      ● {statusLabel}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 950, color: '#fff' }} className="tabular-nums">
                      {selectedSubject.attended} <span style={{ fontSize: '13px', color: AURA_COLORS.sub }}>/ {selectedSubject.conducted}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: AURA_COLORS.subBright, fontWeight: 700, marginTop: '2px' }}>
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
                  <ShieldCheck size={17} color="#34D399" />
                ) : (
                  <ShieldAlert size={17} color={AURA_COLORS.red} />
                )}
                <span style={{ fontSize: '12px', fontWeight: 900, color: (selectedSubject.pct || 0) >= 75 ? '#34D399' : AURA_COLORS.red, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                <Activity size={14} color={AURA_COLORS.primary} />
                <span style={{ fontSize: '11.5px', fontWeight: 900, color: AURA_COLORS.subBright, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                        <div style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.subBright }}>
                          Skip {sim.skips} {sim.skips === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: sim.safe ? '#34D399' : AURA_COLORS.red, marginTop: '1px' }}>
                          {sim.safe ? "● Safe" : "● Below 75%"}
                        </div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 950, color: sim.safe ? '#fff' : AURA_COLORS.red }} className="tabular-nums">
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
                        <div style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.subBright }}>
                          Attend +{sim.extra} {sim.extra === 1 ? 'class' : 'classes'}
                        </div>
                        <div style={{ fontSize: '9.5px', fontWeight: 800, color: sim.safe ? '#34D399' : AURA_COLORS.amber, marginTop: '1px' }}>
                          {sim.safe ? "● Reaches 75%" : "● Recovering"}
                        </div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 950, color: sim.safe ? '#34D399' : '#fff' }} className="tabular-nums">
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
