"use client";
import { ArrowLeft, RefreshCcw, Award, Sparkles, Heart, Binary, TrendingUp } from "lucide-react";
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
      textAlign: 'center', boxShadow: 'inset 0 0 15px rgba(255,255,255,0.02)'
    }}>
      <p style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.1em' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff', textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>{score}</span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.1)', fontWeight: 800 }}>/{max}</span>
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
        
        .aura-stardust {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-image: radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)),
                            radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
                            radial-gradient(1px 1px at 50px 160px, #ddd, rgba(0,0,0,0));
          background-size: 200px 200px;
          opacity: 0.1; pointer-events: none; z-index: 0;
        }

        .lustre-gem {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 44px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        .lustre-gem:hover { border-color: rgba(255, 117, 195, 0.3); transform: translateY(-5px); }
      `}} />

      <div className="aura-stardust" />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,8,0.7)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: `1px solid ${AURA_COLORS.border}` }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: AURA_COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Award size={14} color={AURA_COLORS.secondary} />
            <span style={{ fontSize: "11px", fontWeight: 900, color: '#fff', textTransform: "uppercase", letterSpacing: "0.2em" }}>Crystal Logs</span>
          </div>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px", position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           {marks.map((m: any, i: number) => {
              const testScores = m.tests?.map((t: any) => parseFloat(t.score) || 0) || [];
              const totalScored = testScores.reduce((a: number, b: number) => a + b, 0);
              const maxPossible = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              const performancePct = maxPossible > 0 ? (totalScored / maxPossible) * 100 : 0;
              
              return (
                <div key={i} className="lustre-gem">
                   {/* Prismatic Background Glow */}
                   <div style={{ 
                     position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', 
                     background: `radial-gradient(circle, ${performancePct > 80 ? AURA_COLORS.primary : AURA_COLORS.secondary}11 0%, transparent 70%)`,
                     filter: 'blur(40px)', zIndex: 0
                   }} />
                   
                   <div style={{ position: 'relative', zIndex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ flex: 1, paddingRight: '16px' }}>
                           <div style={{ fontSize: '9px', fontWeight: 900, color: AURA_COLORS.primary, background: 'rgba(255,117,195,0.05)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>{m.courseCode || m.code}</div>
                           <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'capitalize', lineHeight: 1.2 }}>{m.title.toLowerCase()}</h3>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                              <TrendingUp size={12} color={AURA_COLORS.accent} />
                              <span style={{ fontSize: '10px', color: AURA_COLORS.sub, fontWeight: 700 }}>Trajectory Status</span>
                           </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: '36px', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>{totalScored.toFixed(1)}</div>
                           <div style={{ fontSize: '12px', color: AURA_COLORS.sub, fontWeight: 900, marginTop: '6px' }}>OF {maxPossible}</div>
                        </div>
                     </div>

                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: AURA_COLORS.sub }}>PERFORMANCE_CURVE</div>
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
    </div>
  );
}
