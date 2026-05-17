"use client";
import { useState, useMemo, useEffect } from "react";
import { Activity, Zap, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

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
};

const getStatusDetails = (pct: number) => {
  if (pct >= 75) return { color: AURA_COLORS.green, label: "SAFE" };
  if (pct >= 65) return { color: AURA_COLORS.amber, label: "WARNING" };
  return { color: AURA_COLORS.red, label: "CRITICAL" };
};

const DutyOrb = ({ label, value, subtext, color, bgTint }: any) => (
  <div style={{ 
    background: bgTint, 
    border: `1px solid ${color}30`,
    borderBottom: `2px solid ${color}`,
    borderRadius: '20px', padding: '16px 12px', minWidth: '85px', flex: 1,
    textAlign: 'center', position: 'relative',
    boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.2)'
  }}>
    <p style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.1em' }}>{label}</p>
    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{value}</div>
    {subtext && <div style={{ fontSize: '9px', fontWeight: 800, color: color, marginTop: '2px' }}>{subtext}</div>}
  </div>
);

const PulsingCore = ({ pct, attended, conducted, color }: any) => {
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
        style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: color, filter: 'blur(20px)', opacity: 0.15 }}
      />
      <svg width="80" height="80" style={{ position: 'relative', zIndex: 1, transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke={color} strokeWidth="8" strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)', filter: `drop-shadow(0 0 8px ${color}80)` }} />
      </svg>
      {/* End Dot */}
      {pct > 0 && (
        <div style={{
          position: 'absolute', left: `${dotX}px`, top: `${dotY}px`,
          width: '8px', height: '8px', borderRadius: '50%', background: '#fff',
          transform: 'translate(-50%, -50%)', zIndex: 2,
          boxShadow: `0 0 12px ${color}, 0 0 8px #fff`
        }} />
      )}
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, color: color, lineHeight: 1 }} className="tabular-nums">{Math.round(pct)}</div>
          <div style={{ fontSize: '8px', fontWeight: 900, color: color }}>%</div>
        </div>
        <div style={{ fontSize: '9px', fontWeight: 800, color: AURA_COLORS.sub, marginTop: '2px' }} className="tabular-nums">{attended}/{conducted}</div>
      </div>
    </div>
  );
};

export default function AuraAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);

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
    return attendance.map((a: any) => {
      const conducted = parseInt(a["Hours Conducted"]) || 0;
      const absent = parseInt(a["Hours Absent"]) || 0;
      const attended = parseInt(a["Hours Attended"]) || Math.max(0, conducted - absent);
      const pct = parseFloat(a["Attn %"]) || (conducted > 0 ? (attended / conducted) * 100 : 0);
      const skipBuffer = Math.max(0, Math.floor((attended - 0.75 * conducted) / 0.75));
      const requiredToPass = Math.max(0, Math.ceil(3 * conducted - 4 * attended));
      return { ...a, conducted, attended, absent, pct, skipBuffer, requiredToPass };
    });
  }, [attendance]);

  const stats = useMemo(() => {
    const totalSubs = processedAttendance.length;
    const totalAttended = processedAttendance.reduce((sum: number, a: any) => sum + a.attended, 0);
    const totalConducted = processedAttendance.reduce((sum: number, a: any) => sum + a.conducted, 0);
    const overallAvg = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    const atRisk = processedAttendance.filter((a: any) => a.pct < 75).length;
    return { totalSubs, overallAvg, atRisk };
  }, [processedAttendance]);

  const filteredAttendance = useMemo(() => {
    let result = [...processedAttendance];
    if (filter === "At Risk") result = result.filter((a: any) => a.pct < 75);
    else if (filter === "Highest") result.sort((a: any, b: any) => b.pct - a.pct);
    else if (filter === "Lowest") result.sort((a: any, b: any) => a.pct - b.pct);
    return result;
  }, [processedAttendance, filter]);

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 0%, #1e1e30 0%, #050508 100%)', minHeight: "100vh", display: "flex", flexDirection: "column", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        
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
        
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .sticky-header {
          position: fixed; top: 72px; left: 16px; right: 16px; border-radius: 24px;
          background: rgba(20,20,35,0.85); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
          padding: 16px 20px; border: 1px solid rgba(191,90,242,0.15);
          display: flex; align-items: center; justify-content: space-between;
          z-index: 100; transform: translateY(-150%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .sticky-header.visible { transform: translateY(0); }
      `}} />

      {/* Animated Aura Blobs */}
      <div className="aura-blob" style={{ background: AURA_COLORS.primary, top: '-200px', left: '-100px' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.cyan, bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />

      {/* Sticky Scroll Header */}
      <div className={`sticky-header ${isScrolled ? 'visible' : ''}`}>
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>Lumina Sync</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: AURA_COLORS.sub }}>AVG <span style={{color: AURA_COLORS.primary}}>{stats.overallAvg.toFixed(1)}%</span></span>
          {stats.atRisk > 0 && <span style={{ fontSize: '10px', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: AURA_COLORS.red, padding: '4px 8px', borderRadius: '100px', fontWeight: 900 }}>{stats.atRisk} AT RISK</span>}
        </div>
      </div>

      <div style={{ flex: 1, padding: "100px 0 140px 0", position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(191,90,242,0.15)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(191,90,242,0.3)', marginBottom: '20px', boxShadow: '0 0 30px rgba(191,90,242,0.3)' }}>
            <Sparkles size={14} color={AURA_COLORS.purple} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: AURA_COLORS.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Aura Mode Active</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: '0 0 24px', letterSpacing: '-2px', lineHeight: 1 }}>
            Lumina <span style={{ color: AURA_COLORS.primary }}>Sync</span>
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
          {["All", "At Risk", "Highest", "Lowest"].map(f => (
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
           {filteredAttendance.map((a: any, i: number) => {
              const { color: statusColor, label: statusLabel } = getStatusDetails(a.pct);

              return (
                <div key={i} className="liquid-card">
                   <div style={{ 
                     position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', 
                     background: `radial-gradient(circle, ${statusColor}15 0%, transparent 70%)`,
                     filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none'
                   }} />

                   <div style={{ position: 'relative', zIndex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                           <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.2)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>
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
    </div>
  );
}
