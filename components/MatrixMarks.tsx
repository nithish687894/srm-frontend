"use client";
import { useMemo } from "react";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MatrixMarks({ marks, handleSync, isSyncing }: any) {
  const router = useRouter();

  // Process overall analytics
  const { totalScored, totalMax, avgPct } = useMemo(() => {
    const rawMarks = Array.isArray(marks) ? marks : [];
    const scored = rawMarks.reduce((s: number, m: any) => s + (m.tests?.reduce((a: number, t: any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
    const max = rawMarks.reduce((s: number, m: any) => s + (m.tests?.reduce((a: number, t: any) => a + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0), 0);
    const pct = max > 0 ? (scored / max) * 100 : 0;
    return { totalScored: scored, totalMax: max, avgPct: pct };
  }, [marks]);

  // SVG Circular progress ring config
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgPct / 100) * circumference;

  return (
    <div style={{ background: "#000000", minHeight: "100vh", color: "#ffffff", fontFamily: "'Inter', sans-serif", paddingBottom: "120px", position: "relative", overflowX: "hidden" }}>
       <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@700;900&display=swap');
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .card-matrix {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media(hover: hover) {
          .card-matrix:hover {
            border-color: rgba(168, 194, 0, 0.25) !important;
            box-shadow: inset 0 0 30px rgba(168, 194, 0, 0.08), 0 15px 35px rgba(0,0,0,0.5) !important;
            transform: translateY(-2px);
          }
        }
        
        .btn-matrix {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-matrix:active {
          transform: scale(0.92);
        }
      `}} />

      {/* GIANT BACKDROP WATERMARK */}
      <div style={{ 
        position: 'fixed', 
        bottom: '80px', 
        left: '20px', 
        fontSize: '80px', 
        fontWeight: 900, 
        color: 'rgba(255, 255, 255, 0.012)', 
        pointerEvents: 'none', 
        letterSpacing: '-0.04em',
        userSelect: 'none',
        zIndex: 0
      }}>
        MARKS_REGISTRY
      </div>

      <header style={{ 
        padding: "60px 24px 20px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        position: 'sticky', 
        top: 0, 
        background: 'rgba(0,0,0,0.95)', 
        backdropFilter: 'blur(20px)', 
        zIndex: 100, 
        borderBottom: '1px solid #222' 
      }}>
        <button 
          onClick={() => router.back()} 
          className="btn-matrix"
          style={{ 
            width: "44px", 
            height: "44px", 
            borderRadius: "14px", 
            background: "#1c1c1c", 
            border: "1px solid #333", 
            color: "#ffffff", 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#a8c200', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '2px' }}>
            ACADEMIC RECORD
          </div>
          <span style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
            MARKS
          </span>
        </div>
        <button 
          onClick={handleSync} 
          className="btn-matrix"
          style={{ 
            width: "44px", 
            height: "44px", 
            borderRadius: "14px", 
            background: "#1c1c1c", 
            border: "1px solid #333", 
            color: "#ffffff", 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px", position: "relative", zIndex: 1 }}>
        
        {/* OVERALL PERFORMANCE ANALYTICS */}
        {totalMax > 0 && (
          <div 
            style={{ 
              background: "#1c1c1c", 
              border: '1px solid rgba(168,194,0,0.2)', 
              borderRadius: '28px', 
              padding: '28px 24px', 
              marginBottom: '32px',
              boxShadow: 'inset 0 0 25px rgba(168, 194, 0, 0.05), 0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
             <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                
                {/* SVG Circular Progress Ring */}
                <div style={{ position: 'relative', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                      {/* Background Track */}
                      <circle
                         cx="55"
                         cy="55"
                         r={radius}
                         fill="transparent"
                         stroke="rgba(255,255,255,0.03)"
                         strokeWidth={strokeWidth}
                      />
                      {/* Glowing Fill Track */}
                      <circle
                         cx="55"
                         cy="55"
                         r={radius}
                         fill="transparent"
                         stroke="#a8c200"
                         strokeWidth={strokeWidth}
                         strokeDasharray={circumference}
                         strokeDashoffset={strokeDashoffset}
                         strokeLinecap="round"
                         style={{ 
                           transition: 'stroke-dashoffset 1s ease-out',
                           filter: 'drop-shadow(0 0 5px rgba(168, 194, 0, 0.5))'
                         }}
                      />
                   </svg>
                   {/* Center Text inside Ring */}
                   <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: '#a8c200', fontFamily: "'JetBrains Mono', monospace" }}>{avgPct.toFixed(0)}%</span>
                      <span style={{ fontSize: '7.5px', color: '#666', fontWeight: 900, letterSpacing: '0.05em', marginTop: '2px' }}>SUCCESS</span>
                   </div>
                </div>

                {/* Performance Text Details */}
                <div style={{ flex: 1 }}>
                   <span style={{ fontSize: '9px', fontWeight: 900, color: '#a8c200', letterSpacing: '0.25em' }}>OVERALL PERFORMANCE</span>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px', marginBottom: '8px' }}>
                      <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{totalScored.toFixed(1)}</h1>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.6)' }}>/{totalMax.toFixed(0)}</span>
                   </div>
                   <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(168,194,0,0.08)', border: '1px solid rgba(168,194,0,0.15)', color: '#a8c200', fontSize: '9px', fontWeight: 900, padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.02em' }}>
                      ACADEMIC EFFICIENCY
                   </div>
                </div>
             </div>

             {/* Performance Legend Strip */}
             <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid #2b2b2b', borderRadius: '16px', padding: '10px 14px', marginTop: '24px' }}>
                <span style={{ fontSize: '8px', fontWeight: 900, color: '#555', letterSpacing: '0.1em' }}>LEGEND:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a8c200' }} />
                   <span style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>GOOD (≥80%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                   <span style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>OK (50-79%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b3b' }} />
                   <span style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>LOW (&lt;50%)</span>
                </div>
             </div>
          </div>
        )}

        {/* SUBJECT CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
           {marks?.map((m: any, i: number) => {
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              const subjectPct = max > 0 ? (scored / max) * 100 : 0;

              // Subject status configuration
              const subjectStatusText = subjectPct < 50 ? "LOW" : subjectPct >= 80 ? "EXCELLENT" : "STABLE";
              const subjectStatusColor = subjectPct < 50 ? "#ff3b3b" : subjectPct >= 80 ? "#a8c200" : "#ffffff";
              const subjectStatusBg = subjectPct < 50 ? "rgba(255,59,59,0.08)" : subjectPct >= 80 ? "rgba(168,194,0,0.08)" : "rgba(255,255,255,0.04)";
              
              return (
                <div 
                  key={i} 
                  className="card-matrix"
                  style={{ 
                    background: "#1c1c1c", 
                    border: '1px solid #333', 
                    borderRadius: '28px', 
                    padding: '24px', 
                    position: 'relative', 
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 25px rgba(255,255,255,0.01), 0 10px 30px rgba(0,0,0,0.3)'
                  }}
                >
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', position: 'relative' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ 
                           fontSize: '9.5px', 
                           color: '#a8c200', 
                           background: 'rgba(168,194,0,0.1)', 
                           padding: '4px 10px', 
                           borderRadius: '8px', 
                           display: 'inline-block', 
                           marginBottom: '12px', 
                           fontWeight: 900,
                           fontFamily: "'JetBrains Mono', monospace",
                           letterSpacing: '0.05em'
                         }}>{m.courseCode || m.code}</div>
                         <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{m.title}</h3>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                         <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 900, color: '#a8c200', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{scored.toFixed(1)}</span>
                            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 800 }}>/{max}</span>
                         </div>
                         <div style={{ fontSize: '8px', fontWeight: 900, color: subjectStatusColor, background: subjectStatusBg, border: `1px solid ${subjectStatusColor}30`, padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.05em', marginTop: '8px' }}>
                           {subjectStatusText}
                         </div>
                      </div>
                   </div>

                   {/* Thicker Progress Bar with Right End Percentage Text */}
                   {max > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0 22px' }}>
                         <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ width: `${subjectPct}%`, height: '100%', background: '#a8c200', boxShadow: '0 0 8px #a8c200', borderRadius: '3px' }} />
                         </div>
                         <span style={{ fontSize: '11px', fontWeight: 900, color: '#a8c200', minWidth: '32px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{subjectPct.toFixed(0)}%</span>
                      </div>
                   )}

                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', position: 'relative' }}>
                      {m.tests?.map((t: any, j: number) => {
                        const parts = (t.test || "T/100").split('/');
                        const label = parts[0];
                        const maxScore = parseFloat(parts[1]) || 100;
                        const scoreVal = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                        const pct = maxScore > 0 ? (scoreVal / maxScore) * 100 : 0;
                        
                        // Status config: Green for high, White for normal, Red for weak
                        const dotColor = t.score === "Abs" || pct < 50 ? "#ff3b3b" : pct >= 80 ? "#a8c200" : "#ffffff";
                        const pillText = t.score === "Abs" || pct < 50 ? "LOW" : pct >= 80 ? "GOOD" : "OK";
                        const pillBg = t.score === "Abs" || pct < 50 ? "rgba(255, 59, 59, 0.08)" : pct >= 80 ? "rgba(168, 194, 0, 0.08)" : "rgba(255, 255, 255, 0.04)";
                        const pillBorder = t.score === "Abs" || pct < 50 ? "rgba(255, 59, 59, 0.15)" : pct >= 80 ? "rgba(168, 194, 0, 0.15)" : "rgba(255, 255, 255, 0.08)";

                        return (
                          <div 
                            key={j} 
                            style={{ 
                              background: "rgba(255, 255, 255, 0.02)", 
                              border: `1px solid #2b2b2b`,
                              borderRadius: '18px', 
                              padding: '14px 16px', 
                              minWidth: '90px', 
                              flex: 1,
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              minHeight: '80px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <p style={{ fontSize: '8.5px', fontWeight: 900, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                              
                              {/* Glowing Status Pill */}
                              <div style={{ 
                                fontSize: '7px', 
                                fontWeight: 900, 
                                color: dotColor, 
                                background: pillBg, 
                                border: `1px solid ${pillBorder}`, 
                                padding: '2px 6px', 
                                borderRadius: '6px',
                                letterSpacing: '0.05em'
                              }}>
                                {pillText}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
                              <span style={{ fontSize: '20px', fontWeight: 900, color: t.score === "Abs" ? "#ff3b3b" : '#ffffff' }}>{t.score === "Abs" ? "ABS" : scoreVal}</span>
                              <span style={{ fontSize: '10px', color: '#444', fontWeight: 800 }}>/{maxScore}</span>
                            </div>

                            {/* Mini test progress bar */}
                            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden', marginTop: '10px', position: 'relative' }}>
                               <div style={{ width: `${pct}%`, height: '100%', background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              );
           })}
        </div>
      </main>
    </div>
  );
}
