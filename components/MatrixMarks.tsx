"use client";
import { ArrowLeft, RefreshCcw, Binary, Zap, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";

const MATRIX_COLORS = {
  bg: "#000000",
  accent: "#facc15",
  dim: "rgba(250, 204, 21, 0.05)",
  text: "#facc15",
  sub: "rgba(250, 204, 21, 0.4)",
  border: "rgba(250, 204, 21, 0.2)",
};

const TestBadge = ({ test, score }: any) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  const sc = score === "Abs" ? 0 : parseFloat(score) || 0;
  
  return (
    <div style={{ 
      background: "rgba(250,204,21,0.03)", 
      border: `1px solid rgba(250,204,21,0.08)`,
      borderRadius: '12px', padding: '12px', minWidth: '80px', flex: 1
    }}>
      <p style={{ fontSize: '8px', fontWeight: 900, color: MATRIX_COLORS.sub, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color: MATRIX_COLORS.accent }}>{score === "Abs" ? "ABS" : sc}</span>
        <span style={{ fontSize: '10px', color: 'rgba(250,204,21,0.1)', fontWeight: 800 }}>/{max}</span>
      </div>
    </div>
  );
};

export default function MatrixMarks({ marks, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: MATRIX_COLORS.bg, minHeight: "100vh", color: MATRIX_COLORS.text, fontFamily: "'JetBrains Mono', monospace", paddingBottom: "120px" }}>
       <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
      `}} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, borderBottom: `1px solid ${MATRIX_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(250,204,21,0.05)", border: `1px solid ${MATRIX_COLORS.border}`, color: MATRIX_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Binary size={14} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: MATRIX_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.4em" }}>ENCRYPTED_SCORES</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(250,204,21,0.05)", border: `1px solid ${MATRIX_COLORS.border}`, color: MATRIX_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           {marks?.map((m: any, i: number) => {
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              
              return (
                <div key={i} style={{ background: "rgba(250,204,21,0.02)", border: `1px solid ${MATRIX_COLORS.border}`, borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(250,204,21,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.01) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', color: MATRIX_COLORS.accent, background: 'rgba(250,204,21,0.08)', padding: '2px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '10px' }}>{m.courseCode || m.code}</div>
                         <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3, textTransform: 'uppercase' }}>{m.title}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '28px', fontWeight: 900, color: MATRIX_COLORS.accent, lineHeight: 1 }}>{scored.toFixed(1)}</div>
                         <div style={{ fontSize: '10px', color: MATRIX_COLORS.sub, marginTop: '4px' }}>/{max}</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', position: 'relative' }}>
                      {m.tests?.map((t: any, j: number) => (
                        <TestBadge key={j} test={t.test} score={t.score} />
                      ))}
                   </div>
                </div>
              );
           })}
        </div>
      </main>
    </div>
  );
}
