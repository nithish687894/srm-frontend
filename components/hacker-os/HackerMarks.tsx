"use client";
import { ArrowLeft, RefreshCcw, Binary, Zap, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";

const HACKER_COLORS = {
  bg: "#050705",
  accent: "#00ff41",
  dim: "rgba(0, 255, 65, 0.05)",
  text: "#00ff41",
  sub: "rgba(0, 255, 65, 0.4)",
  border: "rgba(0, 255, 65, 0.2)",
};

const TestBadge = ({ test, score }: any) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  const sc = score === "Abs" ? 0 : parseFloat(score) || 0;
  
  return (
    <div style={{ 
      background: "rgba(0,255,65,0.03)", 
      border: `1px solid rgba(0,255,65,0.08)`,
      borderRadius: '8px', padding: '10px', minWidth: '80px', flex: 1
    }}>
      <p style={{ fontSize: '8px', fontWeight: 900, color: HACKER_COLORS.sub, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '16px', fontWeight: 900, color: HACKER_COLORS.accent }}>{score === "Abs" ? "ABS" : sc}</span>
        <span style={{ fontSize: '9px', color: 'rgba(0,255,65,0.1)', fontWeight: 800 }}>/{max}</span>
      </div>
    </div>
  );
};

export default function HackerMarks({ marks, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: HACKER_COLORS.bg, minHeight: "100vh", color: HACKER_COLORS.text, fontFamily: "'JetBrains Mono', monospace", paddingBottom: "120px" }}>
       <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
      `}} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,7,5,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, borderBottom: `1px solid ${HACKER_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(0,255,65,0.05)", border: `1px solid ${HACKER_COLORS.border}`, color: HACKER_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Binary size={14} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: HACKER_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.4em" }}>ENCRYPTED_SCORES</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(0,255,65,0.05)", border: `1px solid ${HACKER_COLORS.border}`, color: HACKER_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {marks.map((m: any, i: number) => {
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              
              return (
                <div key={i} style={{ background: "rgba(0,255,65,0.03)", border: `1px solid ${HACKER_COLORS.border}`, borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(0,255,65,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.02) 1px, transparent 1px)', backgroundSize: '15px 15px', pointerEvents: 'none' }} />
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', color: HACKER_COLORS.accent, background: 'rgba(0,255,65,0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>{m.courseCode || m.code}</div>
                         <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3, textTransform: 'uppercase' }}>{m.title}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '24px', fontWeight: 900, color: HACKER_COLORS.accent, lineHeight: 1 }}>{scored.toFixed(1)}</div>
                         <div style={{ fontSize: '10px', color: HACKER_COLORS.sub, marginTop: '4px' }}>/{max}</div>
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

           {marks.length === 0 && (
             <div style={{ padding: '80px 20px', textAlign: 'center', opacity: 0.3 }}>
                <Terminal size={48} style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: '12px' }}>NO RECORDS DECRYPTED</div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
