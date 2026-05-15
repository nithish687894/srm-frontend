"use client";
import { ArrowLeft, RefreshCcw, Award, Activity, Heart, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const AURA_COLORS = {
  bg: "#08080c",
  card: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  primary: "#FF75C3",
  secondary: "#8F92FF",
  accent: "#94FFD8",
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.5)",
};

export default function AuraAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: "120px" }}>
      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(8,8,12,0.8)', backdropFilter: 'blur(24px)', zIndex: 100, borderBottom: `1px solid ${AURA_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Activity size={14} color={AURA_COLORS.accent} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: AURA_COLORS.sub, textTransform: "uppercase", letterSpacing: "0.4em" }}>STABILITY_LOG</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           {attendance.map((a: any, i: number) => {
              const pct = parseFloat(a["Attn %"]) || 0;
              const isCritical = pct < 75;
              
              return (
                <div key={i} style={{ 
                  background: AURA_COLORS.card, 
                  border: `1px solid ${isCritical ? 'rgba(255, 59, 59, 0.1)' : AURA_COLORS.border}`, 
                  borderRadius: '24px', padding: '20px',
                  position: 'relative', overflow: 'hidden'
                }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', color: isCritical ? '#ff3b3b' : AURA_COLORS.secondary, fontWeight: 900, marginBottom: '4px' }}>{a["Course Code"]}</div>
                         <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>{a["Course Title"].toLowerCase()}</div>
                         <div style={{ fontSize: '11px', color: AURA_COLORS.sub, marginTop: '12px' }}>
                            {a["Hours Attended"]} Present • {a["Hours Absent"]} Absent
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '24px', fontWeight: 900, color: isCritical ? '#ff3b3b' : AURA_COLORS.accent }}>{pct}%</div>
                         <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: isCritical ? '#ff3b3b' : AURA_COLORS.accent }} />
                         </div>
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      </main>
    </div>
  );
}
