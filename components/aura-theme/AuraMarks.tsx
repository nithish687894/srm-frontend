"use client";
import { ArrowLeft, RefreshCcw, Award, Sparkles, Heart } from "lucide-react";
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

const TestPill = ({ test, score }: any) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.02)", 
      border: `1px solid rgba(255,255,255,0.05)`,
      borderRadius: '16px', padding: '12px', minWidth: '85px', flex: 1
    }}>
      <p style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{score}</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.1)', fontWeight: 800 }}>/{max}</span>
      </div>
    </div>
  );
};

export default function AuraMarks({ marks, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: "120px" }}>
      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(8,8,12,0.8)', backdropFilter: 'blur(24px)', zIndex: 100, borderBottom: `1px solid ${AURA_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Award size={14} color={AURA_COLORS.secondary} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: AURA_COLORS.sub, textTransform: "uppercase", letterSpacing: "0.4em" }}>PERFORMANCE_LOG</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           {marks.map((m: any, i: number) => {
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              
              return (
                <div key={i} style={{ 
                  background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, 
                  borderRadius: '32px', padding: '24px', position: 'relative', overflow: 'hidden' 
                }}>
                   <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${AURA_COLORS.primary}11, transparent 70%)` }} />
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.primary, background: 'rgba(255,117,195,0.05)', padding: '4px 10px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>{m.courseCode || m.code}</div>
                         <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize' }}>{m.title.toLowerCase()}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '28px', fontWeight: 900, color: AURA_COLORS.primary }}>{scored.toFixed(1)}</div>
                         <div style={{ fontSize: '11px', color: AURA_COLORS.sub, fontWeight: 800 }}>/{max}</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {m.tests?.map((t: any, j: number) => (
                        <TestPill key={j} test={t.test} score={t.score} />
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
