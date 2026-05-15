"use client";
import { ArrowLeft, RefreshCcw, Activity, ShieldAlert, Binary, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";

const HACKER_COLORS = {
  bg: "#050705",
  accent: "#00ff41",
  dim: "rgba(0, 255, 65, 0.05)",
  text: "#00ff41",
  sub: "rgba(0, 255, 65, 0.4)",
  border: "rgba(0, 255, 65, 0.2)",
};

export default function HackerAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: HACKER_COLORS.bg, minHeight: "100vh", color: HACKER_COLORS.text, fontFamily: "'JetBrains Mono', monospace", paddingBottom: "120px" }}>
       <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
        .log-entry:hover { background: rgba(0, 255, 65, 0.08) !important; }
      `}} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,7,5,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, borderBottom: `1px solid ${HACKER_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(0,255,65,0.05)", border: `1px solid ${HACKER_COLORS.border}`, color: HACKER_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Activity size={14} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: HACKER_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.4em" }}>STABILITY_LOGS</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(0,255,65,0.05)", border: `1px solid ${HACKER_COLORS.border}`, color: HACKER_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: HACKER_COLORS.border, border: `1px solid ${HACKER_COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', background: 'rgba(0,255,65,0.1)', padding: '12px 16px', fontSize: '9px', fontWeight: 900, color: HACKER_COLORS.sub }}>
              <span>MODULE_REGISTRY</span>
              <span style={{ textAlign: 'right' }}>INDEX</span>
           </div>
           
           {attendance.map((a: any, i: number) => {
              const pct = parseFloat(a["Attn %"]) || 0;
              const isCritical = pct < 75;
              
              return (
                <div key={i} className="log-entry" style={{ display: 'grid', gridTemplateColumns: '1fr 60px', background: '#050705', padding: '16px', transition: '0.2s' }}>
                   <div>
                      <div style={{ fontSize: '9px', color: isCritical ? '#ff3b3b' : HACKER_COLORS.sub, marginBottom: '4px' }}>[{a["Course Code"]}] {isCritical && "!!_CRITICAL_FAILURE_!!"}</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>{a["Course Title"]}</div>
                      <div style={{ fontSize: '10px', color: HACKER_COLORS.sub, marginTop: '8px' }}>
                         PRESENT: {a["Hours Attended"]} | ABSENT: {a["Hours Absent"]} | TOTAL: {a["Hours Conducted"]}
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: isCritical ? '#ff3b3b' : HACKER_COLORS.accent }}>{pct}%</div>
                      {isCritical && <ShieldAlert size={12} color="#ff3b3b" style={{ marginTop: '4px' }} />}
                   </div>
                </div>
              );
           })}
        </div>

        {attendance.length === 0 && (
          <div style={{ padding: '80px 20px', textAlign: 'center', opacity: 0.3 }}>
             <Terminal size={48} style={{ margin: '0 auto 16px' }} />
             <div style={{ fontSize: '12px' }}>NO DATA IN REGISTRY</div>
          </div>
        )}
      </main>
    </div>
  );
}
