"use client";
import { ArrowLeft, RefreshCcw, Activity, ShieldAlert, Binary, Terminal, Sparkles, Zap } from "lucide-react";
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
      {/* Outer Pulse */}
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
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: "120px", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        
        .aura-liquid-bg {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 50% -20%, ${AURA_COLORS.secondary}15 0%, transparent 50%),
                      radial-gradient(circle at 0% 100%, ${AURA_COLORS.primary}10 0%, transparent 40%);
          z-index: 0; pointer-events: none;
        }

        .pulsing-shell {
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
          transition: all 0.4s ease;
        }
        .pulsing-shell::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
          transition: 0.5s;
        }
        .pulsing-shell:hover::before { left: 100%; }
      `}} />

      <div className="aura-liquid-bg" />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: `1px solid ${AURA_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Zap size={14} color={AURA_COLORS.accent} />
            <span style={{ fontSize: "11px", fontWeight: 900, color: '#fff', textTransform: "uppercase", letterSpacing: "0.2em" }}>Energy Registry</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px", position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {attendance.map((a: any, i: number) => {
              const pct = parseFloat(a["Attn %"]) || 0;
              const isCritical = pct < 75;
              const statusColor = isCritical ? "#ff3b3b" : AURA_COLORS.accent;
              
              return (
                <div key={i} className="pulsing-shell">
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
    </div>
  );
}
