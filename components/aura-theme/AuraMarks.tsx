"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Award, Sparkles, AlertTriangle, TrendingUp, Activity, Flame } from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import AuraCard from "./ui/AuraCard";
import { AURA_COLORS as SHARED_AURA } from "./system/theme-tokens";

const AURA_COLORS = SHARED_AURA;

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

const getProgressBarGradient = (pct: number) => {
  if (pct < 40) return `linear-gradient(90deg, rgba(255, 107, 139, 0.4) 0%, ${AURA_COLORS.red} 100%)`;
  if (pct < 65) return `linear-gradient(90deg, rgba(251, 191, 36, 0.4) 0%, ${AURA_COLORS.amber} 100%)`;
  if (pct < 80) return `linear-gradient(90deg, rgba(56, 189, 248, 0.4) 0%, ${AURA_COLORS.cyan} 100%)`;
  return `linear-gradient(90deg, rgba(167, 139, 250, 0.4) 0%, ${AURA_COLORS.purple} 100%)`;
};

const CrystalOrb = ({ test, score, tests }: AnyValue) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  
  const isUploaded = score !== undefined && score !== null && score !== "";
  const sc = score === "Abs" ? 0 : (parseFloat(score) || 0);
  const pct = (isUploaded && max > 0) ? (sc / max) * 100 : 0;
  
  const statusColor = getStatusColor(pct);
  
  return (
    <div style={{ 
      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)", 
      backdropFilter: 'blur(20px)',
      border: "1px solid rgba(255, 255, 255, 0.05)",
      borderRadius: '20px', 
      padding: '16px 12px', 
      minWidth: '95px', 
      flex: 1,
      textAlign: 'center', 
      position: 'relative',
      boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px ${isUploaded ? statusColor + '0a' : 'transparent'}`,
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isUploaded && (
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: statusColor, 
            boxShadow: `0 0 8px ${statusColor}` 
          }} />
        )}
        <p style={{ fontSize: '11px', fontWeight: 900, color: AURA_COLORS.subBright, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontSize: '22px', fontWeight: 950, color: score === "Abs" ? AURA_COLORS.red : (isUploaded ? '#fff' : AURA_COLORS.sub), textShadow: isUploaded ? `0 0 10px ${statusColor}18` : 'none' }} className="tabular-nums">
            {score === "Abs" ? "ABS" : (isUploaded ? (sc % 1 === 0 ? sc.toFixed(0) : sc.toFixed(1)) : "--")}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>/{max}</span>
        </div>
        {isUploaded ? (
          <div style={{ 
            fontSize: '10px', 
            fontWeight: 900, 
            color: statusColor, 
            background: `${statusColor}12`,
            padding: '3px 8px',
            borderRadius: '100px',
            border: `1px solid ${statusColor}20`,
            marginTop: '2px'
          }} className="tabular-nums">
            {pct.toFixed(0)}%
          </div>
        ) : (
          <div style={{ 
            fontSize: '10px', 
            fontWeight: 900, 
            color: AURA_COLORS.sub, 
            background: 'rgba(255,255,255,0.02)',
            padding: '3px 8px',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.04)',
            marginTop: '2px' 
          }} className="tabular-nums">
            N/A
          </div>
        )}
      </div>
    </div>
  );
};

export default function AuraMarks({ marks, handleSync, isSyncing }: AnyValue) {
  const [filter, setFilter] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);
  const { activeTheme, stars } = useAuraTheme();

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

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sticky-header {
          position: fixed; top: 72px; left: 16px; right: 16px; border-radius: 24px;
          background: rgba(10, 8, 16, 0.85); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
          padding: 16px 20px; border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex; align-items: center; justify-content: space-between;
          z-index: 100; transform: translateY(-150%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .sticky-header.visible { transform: translateY(0); }
      `}} />

      <div className={`sticky-header ${isScrolled ? 'visible' : ''}`}>
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Marks Registry</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.sub }}>AVG <span style={{color: AURA_COLORS.purple}}>{stats.overallAvg.toFixed(1)}%</span></span>
          {stats.atRisk > 0 && <span style={{ fontSize: '10px', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: AURA_COLORS.red, padding: '4px 8px', borderRadius: '100px', fontWeight: 900 }}>{stats.atRisk} AT RISK</span>}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, paddingTop: '100px', paddingBottom: '140px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(192, 132, 252, 0.08)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(192, 132, 252, 0.18)', marginBottom: '20px', boxShadow: '0 0 20px rgba(192, 132, 252, 0.06)' }}>
            <Sparkles size={14} color={AURA_COLORS.purple} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: AURA_COLORS.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Aura Mode Active</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: '0 0 24px', letterSpacing: '-2px', lineHeight: 1 }}>
            Marks <span style={{ color: AURA_COLORS.purple }}>Registry</span>
          </h1>

          <div className="hide-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '0 24px', scrollSnapType: 'x mandatory' }}>
             <div className="premium-card" style={{ flex: '0 0 auto', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(56, 189, 248, 0.05)' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.08)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <Activity size={24} color={AURA_COLORS.cyan} style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Total Subjects</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', position: 'relative', zIndex: 1 }} className="tabular-nums">{stats.totalSubs}</div>
             </div>
             <div className="premium-card" style={{ flex: '0 0 auto', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(192, 132, 252, 0.05)' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(192, 132, 252, 0.08)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <TrendingUp size={24} color={AURA_COLORS.purple} style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Overall Average</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', position: 'relative', zIndex: 1 }} className="tabular-nums">{stats.overallAvg.toFixed(1)}%</div>
             </div>
             <div className="premium-card" style={{ flex: '0 0 auto', borderRadius: '24px', padding: '20px', minWidth: '150px', textAlign: 'left', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 20px 40px rgba(0,0,0,0.5), 0 0 20px ${stats.atRisk > 0 ? 'rgba(255, 107, 139, 0.08)' : 'rgba(192, 132, 252, 0.05)'}` }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: stats.atRisk > 0 ? 'rgba(255, 107, 139, 0.08)' : 'rgba(192, 132, 252, 0.05)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <AlertTriangle size={24} color={stats.atRisk > 0 ? AURA_COLORS.red : AURA_COLORS.purple} style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }} />
                <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '8px', position: 'relative', zIndex: 1 }}>At Risk</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: stats.atRisk > 0 ? AURA_COLORS.red : '#fff', position: 'relative', zIndex: 1 }} className="tabular-nums">{stats.atRisk} <span style={{ fontSize: '14px', fontWeight: 700, color: AURA_COLORS.sub }}>Subjects</span></div>
             </div>
          </div>
        </div>

        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 24px', marginBottom: '24px' }}>
          {["All", "At Risk", "Lowest Score", "Highest Score", "Alphabetical"].map(f => (
            <button 
              key={f} onClick={() => setFilter(f)}
              style={{ 
                background: filter === f ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.3) 0%, rgba(255, 94, 126, 0.15) 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: filter === f ? '1px solid rgba(192, 132, 252, 0.6)' : '1px solid rgba(255, 255, 255, 0.06)',
                color: filter === f ? '#ffffff' : AURA_COLORS.subBright,
                boxShadow: filter === f ? '0 8px 24px rgba(192, 132, 252, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                padding: '8px 18px', borderRadius: '100px', fontSize: '11px', fontWeight: 900,
                whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                WebkitTapHighlightColor: 'transparent', outline: 'none'
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

        {/* Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 24px' }}>
           {filteredMarks.map((m: AnyValue, i: number) => {
              const statusColor = getStatusColor(m.pct);
              const statusLabel = getStatusLabel(m.pct);
              
               if (!m.tests || m.tests.length === 0) {
                  return (
                    <div key={i} className="liquid-card" style={{ padding: '28px', borderRadius: '32px', border: '1px dashed rgba(255, 255, 255, 0.15)', textAlign: 'center', opacity: 0.6 }}>
                       <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.purple, background: 'rgba(192,132,252,0.05)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>{m.courseCode || m.code}</div>
                       <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 12px', textTransform: 'capitalize', lineHeight: 1.2 }}>{m.title?.toLowerCase()}</h3>
                       <div style={{ fontSize: '12px', fontWeight: 600, color: AURA_COLORS.sub }}>Marks not uploaded yet</div>
                    </div>
                  );
               }

               return (
                <div 
                  key={i} 
                  className="liquid-card"
                  style={{
                    padding: '28px',
                    borderRadius: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 35px ${statusColor}12, inset 0 1px 0 rgba(255,255,255,0.03)`,
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
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
                     {/* Row 1: Code and Badge */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: '100px' }}>{m.courseCode || m.code}</div>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: statusColor, background: `${statusColor}12`, border: `1px solid ${statusColor}22`, padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.1em' }}>{statusLabel}</div>
                     </div>
                     
                     {/* Row 2: Name and Total */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize', lineHeight: 1.3, flex: 1 }}>{m.title?.toLowerCase()}</h3>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                           <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                              <span style={{ fontSize: '28px', fontWeight: 950, color: statusColor, lineHeight: 1, textShadow: `0 0 15px ${statusColor}22` }} className="tabular-nums">{m.totalScored.toFixed(1)}</span>
                              <span style={{ fontSize: '12px', color: AURA_COLORS.sub, fontWeight: 800 }}>/{m.maxPossible}</span>
                           </div>
                           <div style={{ fontSize: '10px', fontWeight: 900, color: statusColor, background: `${statusColor}12`, border: `1px solid ${statusColor}22`, padding: '4px 10px', borderRadius: '100px' }}>{m.pct.toFixed(0)}%</div>
                        </div>
                     </div>

                     {/* Row 3: Progress Bar */}
                     <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', position: 'relative', marginBottom: '24px', overflow: 'visible', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}>
                        <div style={{ 
                           position: 'absolute', left: 0, top: 0, bottom: 0, 
                           width: `${m.pct}%`, 
                           background: getProgressBarGradient(m.pct), 
                           borderRadius: '6px', transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                           boxShadow: `0 0 12px ${statusColor}40`
                        }}>
                           <div style={{ 
                             position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)', 
                             width: '10px', height: '10px', borderRadius: '50%', background: '#fff', 
                             boxShadow: `0 0 14px ${statusColor}, 0 0 4px #fff` 
                           }} />
                        </div>
                     </div>
                     
                     {/* Divider */}
                     <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 -24px 24px' }} />

                     {/* Test Score Boxes */}
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                        {m.tests?.map((t: AnyValue, j: number) => (
                           <CrystalOrb key={j} test={t.test} score={t.score} tests={m.tests} />
                        ))}
                     </div>

                     {/* Footer */}
                     {(m.bestTest || m.weakestTest) && (
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.01)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          {m.bestTest && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <Flame size={12} color={AURA_COLORS.purple} />
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
    </AuraBackground>
  );
}
