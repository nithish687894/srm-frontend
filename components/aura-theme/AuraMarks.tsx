"use client";
import { ArrowLeft, RefreshCcw, Award, Sparkles, Heart, Binary } from "lucide-react";
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

const PearlBadge = ({ test, score }: any) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.03)", 
      backdropFilter: 'blur(10px)',
      border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: '20px', padding: '14px', minWidth: '90px', flex: 1,
      textAlign: 'center'
    }}>
      <p style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.1em' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>{score}</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.1)', fontWeight: 800 }}>/{max}</span>
      </div>
    </div>
  );
};

export default function AuraMarks({ marks, handleSync, isSyncing }: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: "120px", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(150px);
          opacity: 0.12; z-index: 0; pointer-events: none;
          animation: float 20s infinite alternate;
        }
        @keyframes float { 
          from { transform: translate(-20%, -20%) scale(1); } 
          to { transform: translate(20%, 20%) scale(1.2); } 
        }
        .pearl-shell {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }
      `}} />

      <div className="aura-blob" style={{ background: AURA_COLORS.primary, top: '20%', right: '-10%' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.accent, bottom: '-10%', left: '-10%', animationDelay: '-8s' }} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: `1px solid ${AURA_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Award size={14} color={AURA_COLORS.secondary} />
            <span style={{ fontSize: "11px", fontWeight: 900, color: '#fff', textTransform: "uppercase", letterSpacing: "0.3em" }}>Performance</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px", position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           {marks.map((m: any, i: number) => {
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              
              return (
                <div key={i} className="pearl-shell">
                   <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `radial-gradient(circle at top right, ${AURA_COLORS.primary}11, transparent 70%)` }} />
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.primary, background: 'rgba(255,117,195,0.08)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '10px' }}>{m.courseCode || m.code}</div>
                         <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize', lineHeight: 1.2 }}>{m.title.toLowerCase()}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '32px', fontWeight: 900, color: AURA_COLORS.primary, lineHeight: 1 }}>{scored.toFixed(1)}</div>
                         <div style={{ fontSize: '11px', color: AURA_COLORS.sub, fontWeight: 900, marginTop: '4px' }}>/{max}</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {m.tests?.map((t: any, j: number) => (
                        <PearlBadge key={j} test={t.test} score={t.score} />
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
