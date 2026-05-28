"use client";
import { useState, useMemo } from "react";
import { RefreshCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const COSMOS_COLORS = {
  bg: "#0A061F",
  primary: "#1A75FF", // Blue
  secondary: "#00FF88", // Vibrant Green
  purple: "#7c3aed", // Purple
  cyan: "#00f0ff", // Neon Cyan
  accent: "#d946ef", // Pink
  red: "#EF4444", // Red
  amber: "#f59e0b", // Amber
  text: "#ffffff",
  sub: "#8E92B2",
  card: "linear-gradient(180deg, rgba(35, 38, 80, 0.45) 0%, rgba(15, 16, 40, 0.45) 100%)",
  border: "rgba(255, 255, 255, 0.06)",
};

const getStatusColor = (pct: number) => {
  if (pct === 0) return COSMOS_COLORS.sub;
  if (pct < 40) return COSMOS_COLORS.red;
  if (pct < 65) return COSMOS_COLORS.amber;
  if (pct < 80) return COSMOS_COLORS.primary;
  return COSMOS_COLORS.secondary;
};

const getStatusLabel = (pct: number) => {
  if (pct === 0) return "NO DATA";
  if (pct < 40) return "AT RISK";
  if (pct < 65) return "STABLE";
  if (pct < 80) return "GOOD";
  return "EXCELLENT";
};

const CosmicTestBadge = ({ test, score }: AnyValue) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  
  const isUploaded = score !== undefined && score !== null && score !== "";
  const sc = score === "Abs" ? 0 : (parseFloat(score) || 0);
  const pct = (isUploaded && max > 0) ? (sc / max) * 100 : 0;
  
  const isWeak = isUploaded && pct < 50;
  const statusColor = isWeak ? COSMOS_COLORS.red : COSMOS_COLORS.cyan;

  return (
    <div style={{ 
      background: "rgba(10, 12, 38, 0.6)", 
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isWeak ? "rgba(239, 68, 68, 0.2)" : "rgba(26, 117, 255, 0.15)"}`,
      borderRadius: '16px', 
      padding: '12px 14px', 
      minWidth: '90px', 
      flex: 1,
      textAlign: 'center',
      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
      transition: "transform 0.2s"
    }}>
      <p style={{ fontSize: '8.5px', fontWeight: 800, color: COSMOS_COLORS.sub, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontSize: '18px', fontWeight: 900, color: score === "Abs" ? COSMOS_COLORS.red : (isUploaded ? '#fff' : COSMOS_COLORS.sub) }}>
            {score === "Abs" ? "ABS" : (isUploaded ? sc : "--")}
          </span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>/{max}</span>
        </div>
        <div style={{ fontSize: '8.5px', fontWeight: 800, color: statusColor, marginTop: '2px' }}>
          {isUploaded ? `${pct.toFixed(0)}%` : "N/A"}
        </div>
      </div>
    </div>
  );
};

export default function CosmosMarks({ marks, handleSync, isSyncing }: AnyValue) {
  const router = useRouter();
  const [filter, setFilter] = useState("All");

  const processedMarks = useMemo(() => {
    if (!marks || !marks.length) return [];
    return marks.map((m: AnyValue) => {
      const tests = m.tests || [];
      const totalScored = tests.reduce((s: number, t: AnyValue) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0);
      const maxPossible = tests.reduce((s: number, t: AnyValue) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0);
      const pct = maxPossible > 0 ? (totalScored / maxPossible) * 100 : 0;
      
      let bestTest = null;
      let weakestTest = null;
      if (tests.length > 0) {
        const sorted = [...tests].filter(t => t.score !== "Abs" && t.score !== "").sort((a, b) => {
          const aPct = (parseFloat(a.score) || 0) / (parseFloat((a.test || "T/100").split('/')[1]) || 100);
          const bPct = (parseFloat(b.score) || 0) / (parseFloat((b.test || "T/100").split('/')[1]) || 100);
          return bPct - aPct;
        });
        if (sorted.length > 0) {
          bestTest = sorted[0];
          weakestTest = sorted[sorted.length - 1];
        }
      }

      return {
        ...m,
        totalScored, maxPossible, pct, bestTest, weakestTest
      };
    });
  }, [marks]);

  const stats = useMemo(() => {
    const totalSubs = processedMarks.length;
    const totalS = processedMarks.reduce((a: number, b: AnyValue) => a + b.totalScored, 0);
    const totalM = processedMarks.reduce((a: number, b: AnyValue) => a + b.maxPossible, 0);
    const overallAvg = totalM > 0 ? (totalS / totalM) * 100 : 0;
    const atRisk = processedMarks.filter((m: AnyValue) => m.pct > 0 && m.pct < 40).length;
    return { totalSubs, overallAvg, atRisk };
  }, [processedMarks]);

  const filteredMarks = useMemo(() => {
    let result = [...processedMarks];
    if (filter === "At Risk") {
      result = result.filter((m: AnyValue) => m.pct > 0 && m.pct < 40);
    } else if (filter === "Lowest Score") {
      result.sort((a: AnyValue, b: AnyValue) => {
        if (a.pct === 0 && b.pct !== 0) return 1;
        if (b.pct === 0 && a.pct !== 0) return -1;
        return a.pct - b.pct;
      });
    } else if (filter === "Highest Score") {
      result.sort((a: AnyValue, b: AnyValue) => {
        if (a.pct === 0 && b.pct !== 0) return 1;
        if (b.pct === 0 && a.pct !== 0) return -1;
        return b.pct - a.pct;
      });
    } else if (filter === "Alphabetical") {
      result.sort((a: AnyValue, b: AnyValue) => (a.title || "").localeCompare(b.title || ""));
    }
    return result;
  }, [processedMarks, filter]);

  // SVG Gauge Calculations
  const radius = 35;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.overallAvg / 100) * circumference;

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", color: COSMOS_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "16px", paddingBottom: "140px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .cosmos-glass-card {
          background: ${COSMOS_COLORS.card};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${COSMOS_COLORS.border};
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media(hover: hover) {
          .cosmos-glass-card:hover {
            border-color: rgba(26, 117, 255, 0.25);
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
          }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 24px" }}>
        <button 
          onClick={() => router.back()} 
          style={{ 
            width: "40px", 
            height: "40px", 
            borderRadius: "12px", 
            background: "rgba(255,255,255,0.04)", 
            border: "1px solid rgba(255,255,255,0.06)", 
            color: COSMOS_COLORS.primary, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>Marks Registry</h1>
          <span style={{ fontSize: "10px", color: COSMOS_COLORS.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Academic Intelligence</span>
        </div>
        <button 
          onClick={handleSync} 
          style={{ 
            width: "40px", 
            height: "40px", 
            borderRadius: "12px", 
            background: "rgba(255,255,255,0.04)", 
            border: "1px solid rgba(255,255,255,0.06)", 
            color: "#fff", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Aggregated Performance Panel */}
      {stats.totalSubs > 0 && (
        <div className="cosmos-glass-card" style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* SVG Circular Gauge */}
            <div style={{ position: "relative", width: "90px", height: "90px", display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0 }}>
              <svg width="90" height="90" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                <circle cx="45" cy="45" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
                <circle 
                  cx="45" cy="45" r={radius} fill="transparent" 
                  stroke={COSMOS_COLORS.primary} strokeWidth={strokeWidth} 
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-out", filter: `drop-shadow(0 0 4px ${COSMOS_COLORS.primary}80)` }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "15px", fontWeight: 900, color: "#fff" }}>{stats.overallAvg.toFixed(0)}%</span>
                <span style={{ fontSize: "7px", color: COSMOS_COLORS.sub, fontWeight: 800, textTransform: "uppercase" }}>AVG</span>
              </div>
            </div>

            {/* Performance text details */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "9px", fontWeight: 800, color: COSMOS_COLORS.cyan, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>Cosmic Performance</div>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#fff", margin: 0 }}>
                {stats.overallAvg.toFixed(1)}% <span style={{ fontSize: "12px", color: COSMOS_COLORS.sub, fontWeight: 700 }}>Average Success</span>
              </h2>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#fff" }}>{stats.totalSubs}</div>
                  <div style={{ fontSize: "8px", color: COSMOS_COLORS.sub, textTransform: "uppercase", fontWeight: 700 }}>Modules</div>
                </div>
                {stats.atRisk > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: COSMOS_COLORS.red }}>{stats.atRisk}</div>
                    <div style={{ fontSize: "8px", color: COSMOS_COLORS.red, textTransform: "uppercase", fontWeight: 700 }}>At Risk</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort / Filter pills */}
      <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "24px", paddingBottom: "4px" }}>
        {["All", "At Risk", "Lowest Score", "Highest Score", "Alphabetical"].map(f => (
          <button 
            key={f} onClick={() => setFilter(f)}
            style={{ 
              background: filter === f ? "rgba(26,117,255,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter === f ? COSMOS_COLORS.primary : "rgba(255,255,255,0.06)"}`,
              color: filter === f ? "#fff" : COSMOS_COLORS.sub,
              padding: "8px 16px", 
              borderRadius: "999px", 
              fontSize: "11px", 
              fontWeight: 800,
              whiteSpace: "nowrap", 
              cursor: "pointer", 
              transition: "all 0.2s ease"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Subject cards grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredMarks.map((m: AnyValue, i: number) => {
          const statusColor = getStatusColor(m.pct);
          const statusLabel = getStatusLabel(m.pct);
          
          if (!m.tests || m.tests.length === 0) {
            return (
              <div key={i} className="cosmos-glass-card" style={{ padding: "20px", borderStyle: "dashed", opacity: 0.6, textAlign: "center" }}>
                <div style={{ fontSize: "9px", fontWeight: 900, color: COSMOS_COLORS.primary, background: "rgba(26,117,255,0.08)", padding: "4px 10px", borderRadius: "100px", display: "inline-block", marginBottom: "8px" }}>{m.courseCode || m.code}</div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{m.title}</h3>
                <div style={{ fontSize: "11px", color: COSMOS_COLORS.sub, fontWeight: 600 }}>Assessments not published yet</div>
              </div>
            );
          }

          return (
            <div key={i} className="cosmos-glass-card" style={{ padding: "20px" }}>
              {/* Card Top: Code and Status Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ fontSize: "9px", fontWeight: 900, color: COSMOS_COLORS.sub, background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: "8px" }}>{m.courseCode || m.code}</div>
                <div style={{ fontSize: "9px", fontWeight: 900, color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30`, padding: "4px 10px", borderRadius: "8px", letterSpacing: "0.05em" }}>{statusLabel}</div>
              </div>

              {/* Card Title & Success score */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "16px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.3, flex: 1 }}>{m.title}</h3>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "2px", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "20px", fontWeight: 950, color: COSMOS_COLORS.cyan, lineHeight: 1 }}>{m.totalScored.toFixed(1)}</span>
                    <span style={{ fontSize: "11px", color: COSMOS_COLORS.sub, fontWeight: 700 }}>/{m.maxPossible}</span>
                  </div>
                  <div style={{ fontSize: "9px", fontWeight: 800, color: statusColor, marginTop: "4px" }}>{m.pct.toFixed(0)}% Health</div>
                </div>
              </div>

              {/* Progress Slider track */}
              <div style={{ height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "99px", overflow: "hidden", marginBottom: "20px", position: "relative" }}>
                <div style={{ 
                  height: "100%", 
                  background: `linear-gradient(90deg, ${COSMOS_COLORS.primary}, ${COSMOS_COLORS.cyan})`, 
                  width: `${m.pct}%`,
                  boxShadow: `0 0 8px ${COSMOS_COLORS.cyan}80`,
                  transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)"
                }} />
              </div>

              {/* Tests Grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                {m.tests?.map((t: AnyValue, j: number) => (
                  <CosmicTestBadge key={j} test={t.test} score={t.score} />
                ))}
              </div>

              {/* Summary Advice Banner */}
              {(m.bestTest || m.weakestTest) && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(26,117,255,0.03)", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(26,117,255,0.06)" }}>
                  {m.bestTest && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12px" }}>🔥</span>
                      <span style={{ fontSize: "10px", color: COSMOS_COLORS.sub, fontWeight: 700 }}>BEST: <strong style={{ color: "#fff" }}>{(m.bestTest.test || "T").split('/')[0]} · {m.bestTest.score}/{(m.bestTest.test || "/100").split('/')[1]}</strong></span>
                    </div>
                  )}
                  {m.weakestTest && m.weakestTest !== m.bestTest && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12px" }}>⚠️</span>
                      <span style={{ fontSize: "10px", color: COSMOS_COLORS.sub, fontWeight: 700 }}>WEAK: <strong style={{ color: "#fff" }}>{(m.weakestTest.test || "T").split('/')[0]} · {m.weakestTest.score}/{(m.weakestTest.test || "/100").split('/')[1]}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
