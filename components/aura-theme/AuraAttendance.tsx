"use client";
import { ArrowLeft, RefreshCcw, Activity, ShieldAlert, Binary, Terminal, Sparkles } from "lucide-react";
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

const CircularGauge = ({ value, size = 60, color }: any) => {
  const radius = (size / 2) - 4;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (value / 100) * circum;
  
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', fontSize: '12px', fontWeight: 900, color: '#fff' }}>{Math.round(value)}</div>
    </div>
  );
};

export default function AuraAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: "120px", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        .aura-blob {
          position: fixed; width: 500px; height: 500px;
          border-radius: 50%; filter: blur(120px);
          opacity: 0.1; z-index: 0; pointer-events: none;
          animation: drift 15s infinite alternate;
        }
        @keyframes drift { from { transform: translate(-10%, -10%); } to { transform: translate(10%, 10%); } }
        .cloud-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 24px;
          transition: all 0.3s ease;
        }
      `}} />

      <div className="aura-blob" style={{ background: AURA_COLORS.secondary, top: '-10%', right: '-10%' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.primary, bottom: '-10%', left: '-10%', animationDelay: '-5s' }} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: `1px solid ${AURA_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Sparkles size={14} color={AURA_COLORS.accent} />
            <span style={{ fontSize: "11px", fontWeight: 900, color: '#fff', textTransform: "uppercase", letterSpacing: "0.2em" }}>Sync Status</span>
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
                <div key={i} className="cloud-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ flex: 1, paddingRight: '16px' }}>
                      <div style={{ fontSize: '10px', color: isCritical ? '#ff3b3b' : AURA_COLORS.sub, fontWeight: 900, marginBottom: '4px' }}>{a["Course Code"]}</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', textTransform: 'capitalize', lineHeight: 1.3 }}>{a["Course Title"].toLowerCase()}</div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                         <div style={{ fontSize: '10px', color: AURA_COLORS.sub }}>P: {a["Hours Attended"]}</div>
                         <div style={{ fontSize: '10px', color: AURA_COLORS.sub }}>A: {a["Hours Absent"]}</div>
                      </div>
                   </div>
                   <CircularGauge value={pct} color={statusColor} />
                </div>
              );
           })}
        </div>
      </main>
    </div>
  );
}
