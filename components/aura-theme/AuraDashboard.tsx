"use client";
import { motion } from "framer-motion";
import { 
  Heart, Sparkles, Home, Award, Activity, 
  MoreHorizontal, User, Zap, Calendar, MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";

const AURA_COLORS = {
  bg: "#08080c",
  card: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  primary: "#FF75C3", // Soft Pink
  secondary: "#8F92FF", // Soft Lavender
  accent: "#94FFD8", // Mint
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.5)",
};

const AuraCard = ({ children, style = {} }: any) => (
  <div style={{ 
    background: AURA_COLORS.card,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${AURA_COLORS.border}`,
    borderRadius: '32px',
    padding: '24px',
    ...style
  }}>
    {children}
  </div>
);

export default function AuraDashboard({ 
  data, avgAtt, avgMarks, firstName, nextClass, 
  onShowStudentInfo, broadcast, renderAcademicIntegrityHub
}: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        .aura-bg {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 10% 20%, rgba(255, 117, 195, 0.05) 0%, transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(143, 146, 255, 0.05) 0%, transparent 40%);
          z-index: 0; pointer-events: none;
        }
        .aura-glow {
          position: absolute; width: 300px; height: 300px;
          background: ${AURA_COLORS.primary}; filter: blur(120px);
          opacity: 0.1; animation: float 10s infinite alternate;
        }
        @keyframes float { from { transform: translate(0, 0); } to { transform: translate(100px, 50px); } }
      `}} />
      <div className="aura-bg" />
      <div className="aura-glow" style={{ top: '10%', left: '10%' }} />

      <main style={{ padding: "60px 24px 120px", position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={14} color={AURA_COLORS.primary} />
                <span style={{ fontSize: "10px", fontWeight: 900, color: AURA_COLORS.primary, textTransform: "uppercase", letterSpacing: "0.4em" }}>ETHER_MODE</span>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                Hello, {firstName || "there"} <span style={{ color: AURA_COLORS.primary }}>✨</span>
              </h1>
            </div>
            <button onClick={onShowStudentInfo} style={{ width: "48px", height: "48px", borderRadius: "50%", background: AURA_COLORS.card, border: `1px solid ${AURA_COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color={AURA_COLORS.secondary} />
            </button>
          </div>
        </div>

        {/* Status Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <AuraCard onClick={() => router.push('/attendance')} style={{ cursor: 'pointer', textAlign: 'center' }}>
             <Activity size={18} color={AURA_COLORS.accent} style={{ marginBottom: '12px', margin: '0 auto' }} />
             <div style={{ fontSize: '28px', fontWeight: 900 }}>{avgAtt}%</div>
             <div style={{ fontSize: '10px', color: AURA_COLORS.sub, marginTop: '4px', fontWeight: 800 }}>STABILITY</div>
          </AuraCard>
          <AuraCard onClick={() => router.push('/marks')} style={{ cursor: 'pointer', textAlign: 'center' }}>
             <Award size={18} color={AURA_COLORS.primary} style={{ marginBottom: '12px', margin: '0 auto' }} />
             <div style={{ fontSize: '28px', fontWeight: 900 }}>{avgMarks}%</div>
             <div style={{ fontSize: '10px', color: AURA_COLORS.sub, marginTop: '4px', fontWeight: 800 }}>PERFORMANCE</div>
          </AuraCard>
        </div>

        {/* Target Card */}
        {nextClass && (
          <AuraCard style={{ marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: `radial-gradient(circle at top right, ${AURA_COLORS.secondary}22, transparent 70%)` }} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Calendar size={14} color={AURA_COLORS.secondary} />
                <span style={{ fontSize: '10px', fontWeight: 900, color: AURA_COLORS.secondary, letterSpacing: '0.1em' }}>UPCOMING_SESSION</span>
             </div>
             <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px' }}>{nextClass.courseTitle}</h2>
             <p style={{ fontSize: '12px', color: AURA_COLORS.sub, margin: 0 }}>Room: {nextClass.roomNo || "TBA"} • {nextClass.startTime}</p>
          </AuraCard>
        )}

        {/* Integrity Hub */}
        {renderAcademicIntegrityHub(true)}

        {/* Broadcast */}
        {broadcast?.active && (
          <AuraCard style={{ marginTop: '32px', background: 'linear-gradient(145deg, rgba(255,117,195,0.05), rgba(143,146,255,0.05))' }}>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <MessageSquare size={18} color={AURA_COLORS.primary} />
                </div>
                <div>
                   <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: AURA_COLORS.sub }}>Bulletin_Intercept</div>
                   <div style={{ fontSize: '13px', lineHeight: 1.4, marginTop: '2px' }}>{broadcast.message}</div>
                </div>
             </div>
          </AuraCard>
        )}

        {/* Bottom Nav */}
        <nav style={{ position: "fixed", bottom: "0", left: "0", right: "0", height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", background: "rgba(8,8,12,0.8)", backdropFilter: "blur(24px)", borderTop: `1px solid ${AURA_COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 1000 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: AURA_COLORS.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Home size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Nexus</span>
          </button>
          <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Award size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Marks</span>
          </button>
          <button onClick={() => router.push('/attendance')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Activity size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Attnd</span>
          </button>
          <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <MoreHorizontal size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>More</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
