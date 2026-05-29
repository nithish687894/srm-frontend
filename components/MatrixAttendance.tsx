"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeft, RefreshCcw, Activity, Shield, Binary } from "lucide-react";
import { useRouter } from "next/navigation";

const MATRIX_COLORS = {
  bg: "#000000",
  accent: "#a8c200",
  dim: "rgba(168, 194, 0, 0.05)",
  text: "#a8c200",
  sub: "rgba(168, 194, 0, 0.4)",
  border: "rgba(168, 194, 0, 0.2)",
};

export default function MatrixAttendance({ attendance, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: MATRIX_COLORS.bg, minHeight: "100vh", color: MATRIX_COLORS.text, fontFamily: "'JetBrains Mono', monospace", paddingBottom: "120px" }}>
       <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
      `}} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, borderBottom: `1px solid ${MATRIX_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(168, 194, 0, 0.05)", border: `1px solid ${MATRIX_COLORS.border}`, color: MATRIX_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Activity size={14} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: MATRIX_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.4em" }}>STABILITY_LOG</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(168, 194, 0, 0.05)", border: `1px solid ${MATRIX_COLORS.border}`, color: MATRIX_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           {attendance?.map((course: any, i: number) => {
              const pct = parseFloat(course["Attn %"]) || 0;
              const isCritical = pct < 75;
              
              return (
                <div key={i} style={{ background: "rgba(168,194,0,0.02)", border: `1px solid ${isCritical ? 'rgba(255,59,59,0.3)' : MATRIX_COLORS.border}`, borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(168,194,0,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(168,194,0,0.01) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', color: MATRIX_COLORS.accent, background: 'rgba(168,194,0,0.08)', padding: '2px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '10px' }}>{course["Course Code"]}</div>
                         <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3, textTransform: 'uppercase' }}>{course["Course Title"]}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '28px', fontWeight: 900, color: isCritical ? '#ff3b3b' : MATRIX_COLORS.accent, lineHeight: 1 }}>{pct}%</div>
                         <div style={{ fontSize: '10px', color: MATRIX_COLORS.sub, marginTop: '4px' }}>STABILITY</div>
                      </div>
                   </div>

                   <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: isCritical ? '#ff3b3b' : MATRIX_COLORS.accent, boxShadow: `0 0 10px ${isCritical ? '#ff3b3b' : MATRIX_COLORS.accent}` }} />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', position: 'relative' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                         <div style={{ fontSize: '8px', color: MATRIX_COLORS.sub, textTransform: 'uppercase', marginBottom: '4px' }}>Conducted</div>
                         <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{course["Hours Conducted"]}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                         <div style={{ fontSize: '8px', color: MATRIX_COLORS.sub, textTransform: 'uppercase', marginBottom: '4px' }}>Attended</div>
                         <div style={{ fontSize: '14px', fontWeight: 900, color: MATRIX_COLORS.accent }}>{course["Hours Attended"]}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                         <div style={{ fontSize: '8px', color: MATRIX_COLORS.sub, textTransform: 'uppercase', marginBottom: '4px' }}>Absent</div>
                         <div style={{ fontSize: '14px', fontWeight: 900, color: '#ff3b3b' }}>{course["Hours Absent"]}</div>
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
