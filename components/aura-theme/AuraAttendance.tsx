"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Activity, Zap, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import ContextNotesBanner from "@/components/ContextNotesBanner";
import { AURA_COLORS as SHARED_AURA } from "./system/theme-tokens";

const AURA_COLORS = SHARED_AURA;

const getStatusDetails = (pct: number) => {
  if (pct >= 75) return { color: AURA_COLORS.green, label: "SAFE" };
  if (pct >= 65) return { color: AURA_COLORS.amber, label: "WARNING" };
  return { color: AURA_COLORS.red, label: "CRITICAL" };
};

const DutyOrb = ({ label, value, subtext, color, bgTint }: AnyValue) => (
  <div style={{ 
    background: "rgba(0, 0, 0, 0.25)", 
    backdropFilter: 'blur(20px)',
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: '20px', 
    padding: '16px 12px', 
    minWidth: '95px', 
    flex: 1,
    textAlign: 'center', 
    position: 'relative',
    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        background: color, 
        boxShadow: `0 0 10px ${color}` 
      }} />
      <p style={{ fontSize: '11px', fontWeight: 900, color: AURA_COLORS.subBright, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <div style={{ fontSize: '26px', fontWeight: 950, color: '#fff', textShadow: `0 0 12px ${color}20` }} className="tabular-nums">{value}</div>
      {subtext && (
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 800, 
          color: color, 
          background: `${color}15`,
          padding: '3px 10px',
          borderRadius: '100px',
          border: `1px solid ${color}25`,
          marginTop: '4px',
          maxWidth: '120px',
          whiteSpace: 'normal',
          lineHeight: 1.2
        }} className="tabular-nums">
          {subtext}
        </div>
      )}
    </div>
  </div>
);

const PulsingCore = ({ pct, attended, conducted, color }: AnyValue) => {
  const radius = 28;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (pct / 100) * circum;
  
  // Calculate the dot position on the ring
  const angle = (pct / 100) * 360;
  const dotX = 40 + radius * Math.cos((angle - 90) * (Math.PI / 180));
  const dotY = 40 + radius * Math.sin((angle - 90) * (Math.PI / 180));

  return (
    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: color, filter: 'blur(20px)', opacity: 0.3 }}
      />
      <svg width="80" height="80" style={{ position: 'relative', zIndex: 1, transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke={color} strokeWidth="6" strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)', filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 3px ${color})` }} />
      </svg>
      {/* End Dot */}
      {pct > 0 && (
        <div style={{
          position: 'absolute', left: `${dotX}px`, top: `${dotY}px`,
          width: '10px', height: '10px', borderRadius: '50%', background: '#fff',
          transform: 'translate(-50%, -50%)', zIndex: 2,
          boxShadow: `0 0 10px ${color}, 0 0 5px #fff`
        }} />
      )}
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', lineHeight: 1 }} className="tabular-nums">{Math.round(pct)}</div>
          <div style={{ fontSize: '8px', fontWeight: 900, color: color, marginLeft: '1px' }}>%</div>
        </div>
        <div style={{ fontSize: '9px', fontWeight: 800, color: AURA_COLORS.subBright, marginTop: '2px' }} className="tabular-nums">{attended}/{conducted}</div>
      </div>
    </div>
  );
};

export default function AuraAttendance({ 
  attendance, handleSync, isSyncing,
  showPredictor, setShowPredictor, next30Days, selectedDates, toggleDate, 
  calculatePredictions, predictions, setSelectedDates, setPredictions
}: AnyValue) {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);
  const { activeTheme, stars } = useAuraTheme();

  useEffect(() => {
    const parentMain = document.getElementById("attendance-parent-scroll") || document.querySelector('main');
    const onScroll = () => {
      const scrolled = window.scrollY > 180 || (parentMain ? parentMain.scrollTop > 180 : false);
      setIsScrolled(scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (parentMain) parentMain.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (parentMain) parentMain.removeEventListener('scroll', onScroll);
    };
  }, []);

  const processedAttendance = useMemo(() => {
    if (!attendance || !attendance.length) return [];
    return attendance.map((a: AnyValue) => {
      const pctStr = a["Attn %"] || a.pct;
      const parsedPct = parseFloat(pctStr) || 0;
      let conducted = parseInt(a["Hours Conducted"] || a.conducted) || 0;
      let absent = parseInt(a["Hours Absent"] || a.absent) || 0;
      
      if (conducted === 0 && pctStr !== undefined && pctStr !== null && pctStr !== "null") {
        conducted = 30;
        const presentEst = Math.round(conducted * (parsedPct / 100));
        absent = conducted - presentEst;
      }
      
      const attended = parseInt(a["Hours Attended"] || a.attended) || Math.max(0, conducted - absent);
      const pct = pctStr !== undefined && pctStr !== null && pctStr !== "null"
        ? parsedPct
        : (conducted > 0 ? (attended / conducted) * 100 : 100);
      const skipBuffer = Math.max(0, Math.floor((attended - 0.75 * conducted) / 0.75));
      const requiredToPass = Math.max(0, Math.ceil(3 * conducted - 4 * attended));
      return { ...a, conducted, attended, absent, pct, skipBuffer, requiredToPass };
    });
  }, [attendance]);

  const stats = useMemo(() => {
    const totalSubs = processedAttendance.length;
    const totalAttended = processedAttendance.reduce((sum: number, a: AnyValue) => sum + a.attended, 0);
    const totalConducted = processedAttendance.reduce((sum: number, a: AnyValue) => sum + a.conducted, 0);
    const overallAvg = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    const atRisk = processedAttendance.filter((a: AnyValue) => a.pct < 75).length;
    return { totalSubs, overallAvg, atRisk };
  }, [processedAttendance]);

  const filteredAttendance = useMemo(() => {
    let result = [...processedAttendance];
    if (filter === "At Risk") result = result.filter((a: AnyValue) => a.pct < 75);
    else if (filter === "Highest") result.sort((a: AnyValue, b: AnyValue) => b.pct - a.pct);
    else if (filter === "Lowest") result.sort((a: AnyValue, b: AnyValue) => a.pct - b.pct);
    return result;
  }, [processedAttendance, filter]);

  // Celebrate perfect 100% attendance subjects with a premium double-cannon confetti blast!
  useEffect(() => {
    if (processedAttendance && processedAttendance.length > 0) {
      const hasPerfectAttendance = processedAttendance.some((a: AnyValue) => a.pct >= 100);
      if (hasPerfectAttendance) {
        const duration = 2.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: AnyValue = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          
          confetti({ 
            ...defaults, 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#00E5FF', '#BF5AF2', '#FF2D55', '#34C759', '#FF9500']
          });
          confetti({ 
            ...defaults, 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#00E5FF', '#BF5AF2', '#FF2D55', '#34C759', '#FF9500']
          });
        }, 250);

        return () => clearInterval(interval);
      }
    }
  }, [processedAttendance]);

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .floating { animation: floating 6s ease-in-out infinite; }
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .sticky-header {
          position: fixed; top: 72px; left: 16px; right: 16px; border-radius: 24px;
          background: rgba(10, 8, 16, 0.85); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
          padding: 16px 20px; border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex; align-items: center; justify-content: space-between;
          z-index: 100; transform: translateY(-150%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .sticky-header.visible { transform: translateY(0); }

        .attendance-page {
          color: var(--text-main);
        }
        .attendance-page .aura-card,
        .attendance-page .liquid-card {
          background: linear-gradient(145deg, rgba(18, 14, 30, 0.90), rgba(8, 7, 14, 0.92));
          border: 1px solid rgba(216, 180, 254, 0.12);
          box-shadow: 0 18px 42px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        body.theme-light .attendance-page {
          color: #17111f;
        }
        body.theme-light .attendance-page .aura-card,
        body.theme-light .attendance-page .liquid-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(243,238,255,0.90)) !important;
          border: 1px solid rgba(88, 61, 145, 0.18) !important;
          box-shadow: 0 18px 38px rgba(88,61,145,0.12), inset 0 1px 0 rgba(255,255,255,0.86) !important;
          color: #17111f !important;
        }
        body.theme-light .sticky-header {
          background: linear-gradient(135deg, rgba(255,255,255,0.88), rgba(243,238,255,0.82)) !important;
          border-color: rgba(88,61,145,0.16) !important;
          box-shadow: 0 12px 30px rgba(46,32,74,0.14), inset 0 1px 0 rgba(255,255,255,0.72) !important;
        }
        body.theme-light .sticky-header .sticky-title {
          color: #1f1830 !important;
        }
        body.theme-light .sticky-header .sticky-avg {
          color: rgba(31,24,48,0.58) !important;
        }
        body.theme-light .attendance-page [style*="color: #fff"],
        body.theme-light .attendance-page [style*="color: '#fff'"],
        body.theme-light .attendance-page [style*="color: #ffffff"],
        body.theme-light .attendance-page [style*="color: '#ffffff'"] {
          color: #17111f !important;
        }
        body.theme-light .attendance-page [style*="rgba(0,0,0,0.25)"],
        body.theme-light .attendance-page [style*="rgba(0, 0, 0, 0.25)"],
        body.theme-light .attendance-page [style*="rgba(0,0,0,0.2)"] {
          background: rgba(88,61,145,0.07) !important;
          border-color: rgba(88,61,145,0.12) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.62) !important;
        }
        body.theme-light .attendance-page [style*="rgba(255,255,255,0.03)"],
        body.theme-light .attendance-page [style*="rgba(255, 255, 255, 0.02)"],
        body.theme-light .attendance-page [style*="rgba(255, 255, 255, 0.04)"],
        body.theme-light .attendance-page [style*="rgba(255, 255, 255, 0.06)"] {
          background: rgba(88,61,145,0.06) !important;
          border-color: rgba(88,61,145,0.12) !important;
        }
        body.theme-light .attendance-page [style*="rgba(22, 16, 36"],
        body.theme-light .attendance-page [style*="rgba(10, 8, 20"] {
          background: linear-gradient(145deg, rgba(255,255,255,0.94), rgba(243,238,255,0.90)) !important;
          border-color: rgba(88,61,145,0.18) !important;
        }
        body.theme-light .attendance-page [style*="var(--text-muted)"],
        body.theme-light .attendance-page [style*="AURA_COLORS.sub"] {
          color: rgba(23,17,31,0.58) !important;
        }
        body.theme-light .attendance-page button {
          color: inherit;
        }
        .attendance-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          padding: 0 24px;
          width: 100%;
        }
        .attendance-stats-grid > * {
          min-width: 0 !important;
        }
        .attendance-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 430px) {
          .attendance-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            padding: 0 18px;
          }
          .attendance-stats-grid > :last-child {
            grid-column: 1 / -1;
          }
          .attendance-filter-row {
            padding: 0 18px;
          }
        }
      `}} />

      {/* Sticky Scroll Header */}
      <div className={`sticky-header ${isScrolled ? 'visible' : ''}`}>
        <span className="sticky-title" style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Lumina Sync</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="sticky-avg" style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.sub }}>AVG <span style={{color: AURA_COLORS.primary}}>{stats.overallAvg.toFixed(1)}%</span></span>
          {stats.atRisk > 0 && <span style={{ fontSize: '10px', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: AURA_COLORS.red, padding: '4px 8px', borderRadius: '100px', fontWeight: 900 }}>{stats.atRisk} AT RISK</span>}
        </div>
      </div>

      <div className="attendance-page" style={{ flex: 1, padding: "100px 0 140px 0", position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(192, 132, 252, 0.08)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(192, 132, 252, 0.18)', marginBottom: '20px', boxShadow: '0 0 20px rgba(192, 132, 252, 0.06)' }}>
            <Sparkles size={14} color={AURA_COLORS.purple} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: AURA_COLORS.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lumina Mode Active</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: '0 0 24px', letterSpacing: '-2px', lineHeight: 1 }}>
            Lumina <span style={{ color: AURA_COLORS.primary }}>Sync</span>
          </h1>

          <div style={{ maxWidth: "600px", margin: "0 auto 24px" }} className="px-4">
            <ContextNotesBanner page="attendance" />
          </div>

          {/* Summary Strip - High Contrast Glowing Cards restored */}
          <div className="attendance-stats-grid">
             <div className="aura-card" style={{ flex: '0 0 auto', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden' }}>
                <Activity size={24} color={AURA_COLORS.cyan} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px' }}>Total Subjects</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{stats.totalSubs}</div>
             </div>
             <div className="aura-card" style={{ flex: '0 0 auto', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden' }}>
                <TrendingUp size={24} color={AURA_COLORS.primary} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px' }}>Average Attendance</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{stats.overallAvg.toFixed(1)}%</div>
             </div>
             <div className="aura-card" style={{ flex: '0 0 auto', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden' }}>
                <AlertTriangle size={24} color={stats.atRisk > 0 ? AURA_COLORS.red : AURA_COLORS.purple} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px' }}>At Risk</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: stats.atRisk > 0 ? AURA_COLORS.red : '#fff' }} className="tabular-nums">{stats.atRisk} <span style={{ fontSize: '14px', fontWeight: 700, color: AURA_COLORS.sub }}>Subjects</span></div>
             </div>
          </div>
        </div>

        {/* Sort and Filter Bar */}
        <div className="attendance-filter-row">
          {["All", "At Risk", "Highest", "Lowest"].map(f => (
            <button 
              key={f} onClick={() => setFilter(f)}
              style={{ 
                background: filter === f ? 'rgba(192, 132, 252, 0.12)' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                color: filter === f ? AURA_COLORS.primary : AURA_COLORS.sub,
                boxShadow: filter === f ? '0 0 15px rgba(192, 132, 252, 0.08)' : 'none',
                padding: '8px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: 800,
                whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease',
                WebkitTapHighlightColor: 'transparent', outline: 'none'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Lumina Attendance Predictor Panel */}
        {!showPredictor ? (
          <div
            onClick={() => setShowPredictor(true)}
            style={{
              background: "linear-gradient(135deg, rgba(192, 132, 252, 0.2) 0%, rgba(0, 229, 255, 0.12) 100%)",
              backdropFilter: "blur(35px) saturate(180%)",
              border: "1px solid rgba(192, 132, 252, 0.3)",
              borderRadius: "28px",
              padding: "24px",
              margin: "0 24px 24px 24px",
              cursor: "pointer",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 15px 30px rgba(192, 132, 252, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(192, 132, 252, 0.3) 0%, rgba(0, 229, 255, 0.18) 100%)";
              e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.45)";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 20px 40px rgba(192, 132, 252, 0.15), 0 0 20px rgba(192, 132, 252, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(192, 132, 252, 0.2) 0%, rgba(0, 229, 255, 0.12) 100%)";
              e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 15px 30px rgba(192, 132, 252, 0.1)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                <Zap size={20} color={AURA_COLORS.purple} className="floating" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "#ffffff",
                    margin: "0 0 2px",
                  }}
                >
                  Lumina Skip Predictor
                </h3>
                <p
                  style={{
                    fontSize: "11px",
                    color: AURA_COLORS.subBright,
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  Forecast attendance margins before skipping
                </p>
              </div>
            </div>
            <ChevronRight size={16} color={AURA_COLORS.primary} />
          </div>
        ) : (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(22, 16, 36, 0.75) 0%, rgba(10, 8, 20, 0.65) 100%)",
              backdropFilter: "blur(35px) saturate(210%)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "28px",
              padding: "24px",
              margin: "0 24px 24px 24px",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 20px 40px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 950,
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  Lumina Skip Predictor
                </h3>
                <p
                  style={{
                    fontSize: "11px",
                    color: AURA_COLORS.subBright,
                    margin: "4px 0 0",
                    fontWeight: 700,
                  }}
                >
                  Select dates you plan to skip
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {predictions && (
                  <button
                    onClick={() => {
                      setSelectedDates(new Set());
                      setPredictions(null);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: AURA_COLORS.primary,
                      cursor: "pointer",
                      fontSize: "10px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em"
                    }}
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowPredictor(false);
                    setSelectedDates(new Set());
                    setPredictions(null);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Date Strip */}
            <div
              className="hide-scrollbar"
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "8px",
                paddingBottom: "16px",
                marginBottom: "18px",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {next30Days?.map((d: AnyValue) => {
                const sel = selectedDates.has(d.iso);
                const isWknd = [0, 6].includes(d.date.getDay());
                return (
                  <div
                    key={d.iso}
                    onClick={() => !isWknd && toggleDate(d.iso)}
                    style={{
                      flexShrink: 0,
                      width: "48px",
                      height: "64px",
                      borderRadius: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: sel ? `linear-gradient(135deg, ${AURA_COLORS.red} 0%, rgba(255, 45, 85, 0.95) 100%)` : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${
                        sel ? '#ff6b8b' : "rgba(255, 255, 255, 0.12)"
                      }`,
                      cursor: isWknd ? "not-allowed" : "pointer",
                      opacity: isWknd ? 0.25 : 1,
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: sel ? `0 0 15px ${AURA_COLORS.red}60, inset 0 1px 0 rgba(255, 255, 255, 0.2)` : "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        color: sel ? "#ffffff" : AURA_COLORS.subBright,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "4px"
                      }}
                    >
                      {d.dayStr}
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        color: "#ffffff",
                        fontWeight: 900,
                      }}
                      className="tabular-nums"
                    >
                      {d.dateNum}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={calculatePredictions}
              style={{
                width: "100%",
                padding: "16px",
                background: `linear-gradient(135deg, ${AURA_COLORS.purple} 0%, ${AURA_COLORS.primary} 100%)`,
                borderRadius: "16px",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 950,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 25px rgba(192, 132, 252, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(192, 132, 252, 0.45), 0 0 15px rgba(0, 229, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(192, 132, 252, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
              }}
            >
              Run Skip Forecast
            </button>

            {/* Predictions Display */}
            {predictions && (
              <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px", textAlign: 'left' }}>
                <h4
                  style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    color: AURA_COLORS.subBright,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 4px",
                  }}
                >
                  Forecast Results
                </h4>
                {predictions.length === 0 ? (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "16px",
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: AURA_COLORS.sub,
                      fontWeight: 600
                    }}
                  >
                    No skipped sessions on selected days.
                  </div>
                ) : (
                  predictions.map((p: AnyValue, idx: number) => {
                    const details = getStatusDetails(p.projPct);
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(0,0,0,0.25)",
                          border: `1px solid rgba(255, 255, 255, 0.05)`,
                          borderLeft: `3px solid ${details.color}`,
                          borderRadius: "16px",
                          padding: "14px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: "16px" }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 800,
                              color: "#ffffff",
                              marginBottom: "4px",
                              textTransform: "capitalize"
                            }}
                          >
                            {(p.title || "").toLowerCase()}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: details.color,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em"
                            }}
                          >
                            {p.marginLabel}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: details.color }} className="tabular-nums">
                              {p.projPct.toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ fontSize: "9px", color: AURA_COLORS.sub, fontWeight: 700, marginTop: '2px' }}>
                            Current: {p.currentPct}%
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 24px' }}>
           {filteredAttendance.map((a: AnyValue, i: number) => {
              const { color: statusColor, label: statusLabel } = getStatusDetails(a.pct);

            return (
              <div 
                key={i} 
                className="liquid-card"
                style={{
                  padding: '28px',
                  borderRadius: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 35px ${statusColor}0a, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                 <div style={{ position: 'relative', zIndex: 1 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div style={{ flex: 1, paddingRight: '20px' }}>
                         <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, background: 'rgba(192, 132, 252, 0.06)', border: '1px solid rgba(192, 132, 252, 0.15)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>
                           {a["Course Code"]}
                         </div>
                         <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', textTransform: 'capitalize', lineHeight: 1.3, margin: 0 }}>
                           {a["Course Title"]?.toLowerCase()}
                         </h3>
                      </div>
                      <PulsingCore pct={a.pct} attended={a.attended} conducted={a.conducted} color={statusColor} />
                   </div>

                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <DutyOrb label="PRESENT" value={a.attended} color={AURA_COLORS.green} bgTint="rgba(52,199,89,0.08)" />
                      <DutyOrb label="ABSENT" value={a.absent} color={AURA_COLORS.red} bgTint="rgba(255,45,85,0.08)" />
                      <DutyOrb 
                        label="BUFFER" 
                        value={a.pct >= 75 ? a.skipBuffer : a.requiredToPass} 
                        subtext={a.pct >= 75 ? (a.skipBuffer === 1 ? `Can miss 1 more` : `Can miss ${a.skipBuffer} more`) : (a.requiredToPass === 1 ? `Attend next 1` : `Attend next ${a.requiredToPass}`)} 
                        color={AURA_COLORS.amber} 
                        bgTint="rgba(255,149,0,0.08)" 
                      />
                   </div>
                   
                   <div style={{ 
                     marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', 
                     background: `${statusColor}15`, borderRadius: '16px', border: `1px solid ${statusColor}30` 
                   }}>
                      {a.pct >= 75 ? <ShieldCheck size={14} color={statusColor} /> : <ShieldAlert size={14} color={statusColor} />}
                      <span style={{ fontSize: '10px', fontWeight: 800, color: statusColor, textTransform: 'uppercase' }}>
                        {a.pct >= 75 ? `SAFE · Can miss ${a.skipBuffer} more classes` : (a.pct >= 65 ? `WARNING · Attend next ${a.requiredToPass} to stay safe` : `CRITICAL · Attend next ${a.requiredToPass} to recover`)}
                      </span>
                   </div>
                 </div>
              </div>
            );
         })}
      </div>
    </div>
  </AuraBackground>
);
}
