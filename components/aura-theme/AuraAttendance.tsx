"use client";
import { ArrowLeft, RefreshCcw, Activity, Zap, Home, Award, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const AURA_COLORS = {
  bg: "#050508",
  primary: "#FF75C3",
  secondary: "#8F92FF",
  accent: "#94FFD8",
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
  card: "rgba(255, 255, 255, 0.02)",
  border: "rgba(255, 255, 255, 0.08)",
};

const PulsingCore = ({ value, color }: any) => {
  const radius = 26;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (value / 100) * circum;
  
  return (
    <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: color, filter: 'blur(15px)' }}
      />
      <svg width="70" height="70" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
        <circle cx="35" cy="35" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
        <circle cx="35" cy="35" r={radius} fill="transparent" stroke={color} strokeWidth="6" strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 5px ${color})` }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{Math.round(value)}</div>
        <div style={{ fontSize: '7px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase' }}>%</div>
      </div>
    </div>
  );
};

export default function AuraAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: "140px", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        
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
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
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

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(30px)', zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
           <span style={{ fontSize: "11px", fontWeight: 900, color: AURA_COLORS.sub, textTransform: "uppercase", letterSpacing: "0.2em" }}>Active Registry</span>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "40px 24px", position: 'relative', zIndex: 1 }}>
        
        {/* Lumina Heading */}
        <div style={{ marginBottom: "50px", textAlign: 'center' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
            <Activity size={12} color={AURA_COLORS.accent} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>Aura Mode Active</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
            Lumina <span style={{ color: AURA_COLORS.accent }}>Sync</span>
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {attendance.map((a: any, i: number) => {
              const pct = parseFloat(a["Attn %"]) || 0;
              const isCritical = pct < 75;
              const statusColor = isCritical ? "#ff3b3b" : AURA_COLORS.accent;
              
              return (
                <div key={i} className="liquid-card">
                   <div style={{ flex: 1, paddingRight: '20px' }}>
                      <div style={{ fontSize: '9px', color: isCritical ? '#ff3b3b' : AURA_COLORS.secondary, fontWeight: 900, marginBottom: '6px', letterSpacing: '0.05em' }}>{a["Course Code"]}</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', textTransform: 'capitalize', lineHeight: 1.3 }}>{a["Course Title"].toLowerCase()}</div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: AURA_COLORS.accent }} />
                            <span style={{ fontSize: '10px', color: AURA_COLORS.sub, fontWeight: 800 }}>{a["Hours Attended"]} PRESENT</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ fontSize: '10px', color: AURA_COLORS.sub, fontWeight: 800 }}>{a["Hours Absent"]} ABSENT</span>
                         </div>
                      </div>
                   </div>
                   <PulsingCore value={pct} color={statusColor} />
                </div>
              );
           })}
        </div>
      </main>

      {/* Aura Bottom Nav */}
      <nav style={{ position: "fixed", bottom: "0", left: "0", right: "0", height: "calc(80px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", background: "rgba(5,5,8,0.7)", backdropFilter: "blur(30px)", borderTop: `1px solid rgba(255,255,255,0.05)`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 1000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>HOME</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Award size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>MARK</span>
        </button>
        <button onClick={() => router.push('/attendance')} style={{ background: "none", border: "none", color: AURA_COLORS.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Activity size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>ATTND</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>MORE</span>
        </button>
      </nav>
    </div>
  );
}
