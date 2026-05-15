"use client";
import { ArrowLeft, RefreshCcw, Activity, Zap, Home, Award, MoreHorizontal, ShieldCheck, ShieldAlert, Coffee } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const AURA_COLORS = {
  bg: "#050508",
  primary: "#FF75C3",
  secondary: "#8F92FF",
  accent: "#94FFD8",
  warning: "#ff3b3b",
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
  card: "rgba(255, 255, 255, 0.02)",
  border: "rgba(255, 255, 255, 0.08)",
};

const DutyOrb = ({ label, value, color }: any) => (
  <div style={{ 
    background: "rgba(255,255,255,0.02)", 
    backdropFilter: 'blur(15px)',
    border: `1px solid rgba(255,255,255,0.06)`,
    borderRadius: '24px', padding: '16px 12px', minWidth: '80px', flex: 1,
    textAlign: 'center'
  }}>
    <p style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.1em' }}>{label}</p>
    <div style={{ fontSize: '18px', fontWeight: 900, color: color || '#fff' }}>{value}</div>
  </div>
);

const PulsingCore = ({ value, color }: any) => {
  const radius = 26;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (value / 100) * circum;
  
  return (
    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: color, filter: 'blur(20px)' }}
      />
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
        <circle cx="40" cy="40" r={radius} fill="transparent" stroke={color} strokeWidth="6" strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 8px ${color}44)` }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{Math.round(value)}</div>
        <div style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub }}>%</div>
      </div>
    </div>
  );
};

export default function AuraAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, height: "100vh", display: "flex", flexDirection: "column", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(140px);
          opacity: 0.12; z-index: 0; pointer-events: none;
          animation: orbit 20s infinite linear;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translate(100px) rotate(0deg); }
          to { transform: rotate(360deg) translate(100px) rotate(-360deg); }
        }

        .liquid-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .floating { animation: floating 6s ease-in-out infinite; }
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}} />

      {/* Animated Aura Blobs */}
      <div className="aura-blob" style={{ background: AURA_COLORS.secondary, top: '-200px', right: '-100px' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.accent, bottom: '-200px', left: '-100px', animationDelay: '-10s' }} />



      <main style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "40px 24px", position: 'relative', zIndex: 1 }}>
        
        {/* Lumina Heading */}
        <div style={{ marginBottom: "50px", textAlign: 'center' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
            <Zap size={12} color={AURA_COLORS.accent} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>Aura Mode Active</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
            Lumina <span style={{ color: AURA_COLORS.accent }}>Sync</span>
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           {attendance.map((a: any, i: number) => {
              const pct = parseFloat(a["Attn %"]) || 0;
              const isCritical = pct < 75;
              const statusColor = isCritical ? AURA_COLORS.warning : AURA_COLORS.accent;
              
              // Calculate buffer (skip logic)
              const conducted = parseInt(a["Hours Conducted"]) || 0;
              const attended = parseInt(a["Hours Attended"]) || 0;
              const skipBuffer = Math.max(0, Math.floor((attended - 0.75 * conducted) / 0.75));

              return (
                <div key={i} className="liquid-card">
                   {/* Performance Halo Background */}
                   <div style={{ 
                     position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', 
                     background: `radial-gradient(circle, ${statusColor}11 0%, transparent 70%)`,
                     filter: 'blur(40px)', zIndex: 0
                   }} />

                   <div style={{ position: 'relative', zIndex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                           <div style={{ fontSize: '9px', color: statusColor, fontWeight: 900, marginBottom: '8px', letterSpacing: '0.05em', background: `${statusColor}11`, padding: '4px 10px', borderRadius: '100px', display: 'inline-block' }}>{a["Course Code"]}</div>
                           <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', textTransform: 'capitalize', lineHeight: 1.3, margin: 0 }}>{a["Course Title"].toLowerCase()}</h3>
                        </div>
                        <PulsingCore value={pct} color={statusColor} />
                     </div>

                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <DutyOrb label="PRESENT" value={a["Hours Attended"]} color={AURA_COLORS.accent} />
                        <DutyOrb label="ABSENT" value={a["Hours Absent"]} color={isCritical ? AURA_COLORS.warning : AURA_COLORS.sub} />
                        <DutyOrb label="BUFFER" value={skipBuffer} color={skipBuffer > 0 ? AURA_COLORS.secondary : AURA_COLORS.sub} />
                     </div>
                     
                     <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {isCritical ? <ShieldAlert size={14} color={AURA_COLORS.warning} /> : <ShieldCheck size={14} color={AURA_COLORS.accent} />}
                        <span style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub, textTransform: 'uppercase' }}>
                          {isCritical ? "CRITICAL: RECOVERY REQUIRED" : "STATUS: OPTIMAL STABILITY"}
                        </span>
                     </div>
                   </div>
                </div>
              );
           })}
        </div>
      </main>

      {/* Aura Bottom Nav - FIXED */}
      <nav style={{ flexShrink: 0, height: "calc(80px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", background: "rgba(5,5,8,0.85)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderTop: `1px solid rgba(255,255,255,0.08)`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 10000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Home size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>HOME</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Award size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>MARK</span>
        </button>
        <button onClick={() => router.push('/attendance')} style={{ background: "none", border: "none", color: AURA_COLORS.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Activity size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>ATTND</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>MORE</span>
        </button>
      </nav>
    </div>
  );
}
