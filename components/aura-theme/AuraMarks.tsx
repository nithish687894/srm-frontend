"use client";
import { useState, useMemo, useEffect } from "react";
import { Award, Sparkles, AlertTriangle, TrendingUp, Activity, Flame } from "lucide-react";

const AURA_COLORS = {
  bg: "#050508",
  primary: "#FF75C3", // Pink
  secondary: "#8F92FF", // Lavender
  purple: "#BF5AF2", // Purple
  cyan: "#00E5FF", // Cyan
  accent: "#94FFD8", // Mint
  red: "#FF2D55", // Red
  amber: "#FF9500", // Amber
  green: "#34C759", // Green
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
  card: "rgba(255, 255, 255, 0.02)",
  border: "rgba(255, 255, 255, 0.08)",
};

const getStatusColor = (pct: number) => {
  if (pct === 0) return AURA_COLORS.sub;
  if (pct < 40) return AURA_COLORS.red;
  if (pct < 65) return AURA_COLORS.amber;
  if (pct < 80) return AURA_COLORS.cyan;
  return AURA_COLORS.purple;
};

const getStatusLabel = (pct: number) => {
  if (pct === 0) return "NO DATA";
  if (pct < 40) return "AT RISK";
  if (pct < 65) return "AVERAGE";
  if (pct < 80) return "GOOD";
  return "STRONG";
};

const CrystalOrb = ({ test, score, tests }: any) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  
  // If score is empty or null, it's not uploaded yet
  const isUploaded = score !== undefined && score !== null && score !== "";
  const sc = score === "Abs" ? 0 : (parseFloat(score) || 0);
  const pct = (isUploaded && max > 0) ? (sc / max) * 100 : 0;
  
  // Strict binary color logic: Below 50% is weak (red), above is normal (purple/pink)
  const isWeak = isUploaded && pct < 50;
  const borderColor = isWeak ? AURA_COLORS.red : AURA_COLORS.purple;
  const percentColor = isWeak ? AURA_COLORS.red : AURA_COLORS.primary; // primary is Pink
  
  // Use a dark translucent inset to match the glassmorphism theme
  const bgTint = isWeak ? "rgba(255,45,85,0.08)" : "rgba(0,0,0,0.25)"; 

  return (
    <div style={{ 
      background: bgTint, 
      backdropFilter: 'blur(15px)',
      border: `1px solid ${isWeak ? "rgba(255,45,85,0.2)" : "rgba(191,90,242,0.15)"}`,
      borderBottom: `2px solid ${isUploaded ? borderColor : "rgba(255,255,255,0.05)"}`,
      borderRadius: '20px', padding: '16px 12px', minWidth: '85px', flex: 1,
      textAlign: 'center', position: 'relative',
      boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.2)'
    }}>
      <p style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.1em' }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontSize: '18px', fontWeight: 900, color: score === "Abs" ? AURA_COLORS.red : (isUploaded ? '#fff' : AURA_COLORS.sub) }} className="tabular-nums">
            {score === "Abs" ? "ABS" : (isUploaded ? sc.toFixed(1) : "--")}
          </span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>/{max}</span>
        </div>
        <div style={{ fontSize: '9px', fontWeight: 800, color: isUploaded ? percentColor : AURA_COLORS.sub, marginTop: '2px' }} className="tabular-nums">
          {isUploaded ? `${pct.toFixed(0)}%` : "N/A"}
        </div>
      </div>
    </div>
  );
};

export default function AuraMarks({ marks, handleSync, isSyncing }: any) {
  const [filter, setFilter] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);

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

  const processedMarks = useMemo(() => {
    if (!marks || !marks.length) return [];
    return marks.map((m: any) => {
      const tests = m.tests || [];
      const totalScored = tests.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0);
      const maxPossible = tests.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0);
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
    const totalS = processedMarks.reduce((a: number, b: any) => a + b.totalScored, 0);
    const totalM = processedMarks.reduce((a: number, b: any) => a + b.maxPossible, 0);
    const overallAvg = totalM > 0 ? (totalS / totalM) * 100 : 0;
    const atRisk = processedMarks.filter((m: any) => m.pct > 0 && m.pct < 40).length;
    return { totalSubs, overallAvg, atRisk };
  }, [processedMarks]);

  const filteredMarks = useMemo(() => {
    let result = [...processedMarks];
    if (filter === "At Risk") {
      result = result.filter((m: any) => m.pct > 0 && m.pct < 40);
    } else if (filter === "Lowest Score") {
      result.sort((a: any, b: any) => {
        if (a.pct === 0 && b.pct !== 0) return 1;
        if (b.pct === 0 && a.pct !== 0) return -1;
        return a.pct - b.pct;
      });
    } else if (filter === "Highest Score") {
      result.sort((a: any, b: any) => {
        if (a.pct === 0 && b.pct !== 0) return 1;
        if (b.pct === 0 && a.pct !== 0) return -1;
        return b.pct - a.pct;
      });
    } else if (filter === "Alphabetical") {
      result.sort((a: any, b: any) => (a.title || "").localeCompare(b.title || ""));
    }
    return result;
  }, [processedMarks, filter]);

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 0%, #1e1e30 0%, #050508 100%)', minHeight: "100%", display: "flex", flexDirection: "column", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');
        
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(140px);
          opacity: 0.15; z-index: 0; pointer-events: none;
          animation: orbit 20s infinite linear;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translate(100px) rotate(0deg); }
          to { transform: rotate(360deg) translate(100px) rotate(-360deg); }
        }

        .liquid-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(191, 90, 242, 0.45);
          box-shadow: inset 0 0 20px rgba(191, 90, 242, 0.05), 0 20px 40px rgba(0,0,0,0.4);
          border-radius: 32px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .floating { animation: floating 6s ease-in-out infinite; }
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .sticky-header {
          position: fixed; top: 72px; left: 16px; right: 16px; border-radius: 24px;
          background: rgba(20,20,35,0.85); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
          padding: 16px 20px; border: 1px solid rgba(191,90,242,0.15);
          display: flex; align-items: center; justify-content: space-between;
          z-index: 100; transform: translateY(-150%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .sticky-header.visible { transform: translateY(0); }
        
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}} />

      {/* Animated Aura Blobs */}
      <div className="aura-blob" style={{ background: AURA_COLORS.primary, top: '-200px', left: '-100px' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.cyan, bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />

      {/* Sticky Scroll Header */}
      <div className={`sticky-header ${isScrolled ? 'visible' : ''}`}>
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Marks Registry</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.sub }}>AVG <span style={{color: AURA_COLORS.primary}}>{stats.overallAvg.toFixed(1)}%</span></span>
          {stats.atRisk > 0 && <span style={{ fontSize: '10px', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: AURA_COLORS.red, padding: '4px 8px', borderRadius: '100px', fontWeight: 900 }}>{stats.atRisk} AT RISK</span>}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, paddingTop: '100px', paddingBottom: '24px' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(191,90,242,0.15)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(191,90,242,0.3)', marginBottom: '20px', boxShadow: '0 0 30px rgba(191,90,242,0.3)' }}>
            <Sparkles size={14} color={AURA_COLORS.purple} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: AURA_COLORS.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Aura Mode Active</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: '0 0 24px', letterSpacing: '-2px', lineHeight: 1 }}>
            Marks <span style={{ color: AURA_COLORS.primary }}>Registry</span>
          </h1>

          {/* Summary Strip */}
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '0 24px', scrollSnapType: 'x mandatory' }}>
             <div style={{ flex: '0 0 auto', background: '#1A1628', border: '1px solid rgba(191,90,242,0.45)', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <Activity size={24} color={AURA_COLORS.cyan} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px' }}>Total Subjects</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{stats.totalSubs}</div>
             </div>
             <div style={{ flex: '0 0 auto', background: '#1A1628', border: '1px solid rgba(191,90,242,0.45)', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <TrendingUp size={24} color={AURA_COLORS.primary} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px' }}>Overall Average</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{stats.overallAvg.toFixed(1)}%</div>
             </div>
             <div style={{ flex: '0 0 auto', background: '#1A1628', border: `1px solid rgba(191,90,242,0.45)`, borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <AlertTriangle size={24} color={stats.atRisk > 0 ? AURA_COLORS.red : AURA_COLORS.purple} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px' }}>At Risk</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: stats.atRisk > 0 ? AURA_COLORS.red : '#fff' }} className="tabular-nums">{stats.atRisk} <span style={{ fontSize: '14px', fontWeight: 700, color: AURA_COLORS.sub }}>Subjects</span></div>
             </div>
          </div>
        </div>

        {/* Sort and Filter Bar */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 24px', marginBottom: '24px' }}>
          {["All", "At Risk", "Lowest Score", "Highest Score", "Alphabetical"].map(f => (
            <button 
              key={f} onClick={() => setFilter(f)}
              style={{ 
                background: filter === f ? 'rgba(191,90,242,0.15)' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(191,90,242,0.4)' : 'rgba(191,90,242,0.1)'}`,
                color: filter === f ? AURA_COLORS.primary : AURA_COLORS.sub,
                boxShadow: filter === f ? '0 0 15px rgba(191,90,242,0.2)' : 'none',
                padding: '8px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: 800,
                whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s ease',
                WebkitTapHighlightColor: 'transparent', outline: 'none'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 24px' }}>
           {filteredMarks.map((m: any, i: number) => {
              const statusColor = getStatusColor(m.pct);
              const statusLabel = getStatusLabel(m.pct);
              
              if (!m.tests || m.tests.length === 0) {
                 return (
                   <div key={i} className="liquid-card" style={{ padding: '24px', borderStyle: 'dashed', textAlign: 'center', opacity: 0.6 }}>
                      <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.primary, background: 'rgba(255,117,195,0.05)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>{m.courseCode || m.code}</div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 12px', textTransform: 'capitalize', lineHeight: 1.2 }}>{m.title?.toLowerCase()}</h3>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: AURA_COLORS.sub }}>Marks not uploaded yet</div>
                   </div>
                 );
              }

              return (
                <div key={i} className="liquid-card">
                   <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', 
                     background: `radial-gradient(circle, ${statusColor}15 0%, transparent 70%)`,
                     filter: 'blur(30px)', zIndex: 0, pointerEvents: 'none'
                   }} />
                   
                   <div style={{ position: 'relative', zIndex: 1 }}>
                     {/* Row 1: Code and Badge */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '100px' }}>{m.courseCode || m.code}</div>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30`, padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.1em' }}>{statusLabel}</div>
                     </div>
                     
                     {/* Row 2: Name and Total */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize', lineHeight: 1.3, flex: 1 }}>{m.title?.toLowerCase()}</h3>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                           <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                              <span style={{ fontSize: '24px', fontWeight: 900, color: AURA_COLORS.primary, lineHeight: 1 }} className="tabular-nums">{m.totalScored.toFixed(1)}</span>
                              <span style={{ fontSize: '12px', color: AURA_COLORS.sub, fontWeight: 800 }}>/{m.maxPossible}</span>
                           </div>
                           <div style={{ fontSize: '10px', fontWeight: 900, color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30`, padding: '4px 10px', borderRadius: '100px' }}>{m.pct.toFixed(0)}%</div>
                        </div>
                     </div>

                     {/* Row 3: Progress Bar */}
                     <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', marginBottom: '24px' }}>
                        <div style={{ 
                          position: 'absolute', left: 0, top: 0, bottom: 0, 
                          width: `${m.pct}%`, 
                          background: `linear-gradient(90deg, ${AURA_COLORS.purple}, ${AURA_COLORS.primary})`, 
                          borderRadius: '4px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' 
                        }}>
                           <div style={{ 
                             position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)', 
                             width: '8px', height: '8px', borderRadius: '50%', background: '#fff', 
                             boxShadow: `0 0 12px ${AURA_COLORS.primary}, 0 0 8px #fff` 
                           }} />
                        </div>
                     </div>
                     
                     {/* Divider */}
                     <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 -24px 24px' }} />

                     {/* Test Score Boxes */}
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                        {m.tests?.map((t: any, j: number) => (
                          <CrystalOrb key={j} test={t.test} score={t.score} tests={m.tests} />
                        ))}
                     </div>

                     {/* Footer */}
                     {(m.bestTest || m.weakestTest) && (
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(191,90,242,0.03)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(191,90,242,0.08)' }}>
                          {m.bestTest && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <Flame size={12} color={AURA_COLORS.primary} />
                               <span style={{ fontSize: '10px', color: AURA_COLORS.sub, fontWeight: 700 }}>BEST: <strong style={{color: '#fff'}}>{(m.bestTest.test || "T").split('/')[0]} · {m.bestTest.score}/{(m.bestTest.test || "/100").split('/')[1]}</strong></span>
                            </div>
                          )}
                          {m.weakestTest && m.weakestTest !== m.bestTest && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <AlertTriangle size={12} color={AURA_COLORS.red} />
                               <span style={{ fontSize: '10px', color: AURA_COLORS.sub, fontWeight: 700 }}>WEAK: <strong style={{color: '#fff'}}>{(m.weakestTest.test || "T").split('/')[0]} · {m.weakestTest.score}/{(m.weakestTest.test || "/100").split('/')[1]}</strong></span>
                            </div>
                          )}
                       </div>
                     )}
                   </div>
                </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}
