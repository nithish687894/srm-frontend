"use client";
import { ArrowLeft, RefreshCcw, Award, Sparkles, TrendingUp, Home, Activity, MoreHorizontal } from "lucide-react";
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

const StardustSparkline = ({ scores }: { scores: number[] }) => {
  if (!scores.length) return null;
  const max = Math.max(...scores, 100);
  const width = 100;
  const height = 30;
  const points = scores.map((s, i) => `${(i / (scores.length - 1)) * width},${height - (s / max) * height}`).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', opacity: 0.5 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={AURA_COLORS.primary} />
          <stop offset="100%" stopColor={AURA_COLORS.accent} />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) => (
        <circle key={i} cx={(i / (scores.length - 1)) * width} cy={height - (s / max) * height} r="2" fill="#fff" />
      ))}
    </svg>
  );
};

const CrystalOrb = ({ test, score }: any) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.02)", 
      backdropFilter: 'blur(15px)',
      border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: '24px', padding: '16px 12px', minWidth: '80px', flex: 1,
      textAlign: 'center'
    }}>
      <p style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.1em' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{score}</span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.1)', fontWeight: 800 }}>/{max}</span>
      </div>
    </div>
  );
};

export default function AuraMarks({ marks, handleSync, isSyncing }: any) {
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
          padding: 32px;
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
      <div className="aura-blob" style={{ background: AURA_COLORS.primary, top: '-200px', left: '-100px' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.secondary, bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(30px)', zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
           <span style={{ fontSize: "11px", fontWeight: 900, color: AURA_COLORS.sub, textTransform: "uppercase", letterSpacing: "0.2em" }}>Official Records</span>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "40px 24px", position: 'relative', zIndex: 1 }}>
        
        {/* Lumina Heading */}
        <div style={{ marginBottom: "50px", textAlign: 'center' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
            <Award size={12} color={AURA_COLORS.primary} />
            <span style={{ fontSize: "10px", fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>Aura Mode Active</span>
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
            Marks <span style={{ color: AURA_COLORS.primary }}>Registry</span>
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           {marks.map((m: any, i: number) => {
              const testScores = m.tests?.map((t: any) => parseFloat(t.score) || 0) || [];
              const totalScored = testScores.reduce((a: number, b: number) => a + b, 0);
              const maxPossible = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              const performancePct = maxPossible > 0 ? (totalScored / maxPossible) * 100 : 0;
              
              return (
                <div key={i} className="liquid-card">
                   <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', 
                     background: `radial-gradient(circle, ${performancePct > 80 ? AURA_COLORS.primary : AURA_COLORS.secondary}11 0%, transparent 70%)`,
                     filter: 'blur(40px)', zIndex: 0
                   }} />
                   
                   <div style={{ position: 'relative', zIndex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ flex: 1, paddingRight: '16px' }}>
                           <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.primary, background: 'rgba(255,117,195,0.05)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>{m.courseCode}</div>
                           <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize', lineHeight: 1.2 }}>{m.title.toLowerCase()}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalScored.toFixed(1)}</div>
                           <div style={{ fontSize: '11px', color: AURA_COLORS.sub, fontWeight: 900, marginTop: '4px' }}>OF {maxPossible}</div>
                        </div>
                     </div>

                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: AURA_COLORS.sub }}>PERFORMANCE</div>
                        <StardustSparkline scores={testScores} />
                     </div>

                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {m.tests?.map((t: any, j: number) => (
                          <CrystalOrb key={j} test={t.test} score={t.score} />
                        ))}
                     </div>
                   </div>
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
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: AURA_COLORS.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Award size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>MARK</span>
        </button>
        <button onClick={() => router.push('/attendance')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Activity size={22} />
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
