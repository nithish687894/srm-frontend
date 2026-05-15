"use client";
import { motion } from "framer-motion";
import { 
  Heart, Sparkles, Home, Award, Activity, 
  MoreHorizontal, User, Zap, Calendar, MessageSquare,
  Compass, Globe, Coffee
} from "lucide-react";
import { useRouter } from "next/navigation";

const AURA_COLORS = {
  bg: "#050508",
  primary: "#FF75C3", // Soft Pink
  secondary: "#8F92FF", // Soft Lavender
  accent: "#94FFD8", // Mint
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
};

export default function AuraDashboard({ 
  data, avgAtt, avgMarks, firstName, nextClass, 
  onShowStudentInfo, broadcast, renderAcademicIntegrityHub
}: any) {
  const router = useRouter();

  return (
    <div style={{ background: AURA_COLORS.bg, minHeight: "100vh", color: AURA_COLORS.text, fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
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
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .liquid-card:active { transform: scale(0.98); }
        
        .floating { animation: floating 6s ease-in-out infinite; }
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(148, 255, 216, 0.4); }
          70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(148, 255, 216, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(148, 255, 216, 0); }
        }
      `}} />

      {/* Animated Aura Blobs */}
      <div className="aura-blob" style={{ background: AURA_COLORS.primary, top: '-200px', left: '-100px' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.secondary, bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />
      <div className="aura-blob" style={{ background: AURA_COLORS.accent, top: '40%', right: '-300px', animationDelay: '-10s' }} />

      <main style={{ padding: "80px 24px 140px", position: 'relative', zIndex: 1 }}>
        
        {/* Aesthetic Greeting Section */}
        <div style={{ marginBottom: "50px", textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
              <Sparkles size={12} color={AURA_COLORS.primary} />
              <span style={{ fontSize: "10px", fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>Aura Mode Active</span>
            </div>
            <h1 style={{ fontSize: "42px", fontWeight: 900, margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
              Lumina <span style={{ color: AURA_COLORS.primary }}>Space</span>
            </h1>
            <p style={{ fontSize: '14px', color: AURA_COLORS.sub, marginTop: '12px', fontWeight: 600 }}>
              Welcome back, {firstName || "Explorer"} ✨
            </p>
          </motion.div>
        </div>

        {/* Main Interface Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div onClick={() => router.push('/attendance')} className="liquid-card" style={{ padding: '32px 20px', borderRadius: '40px', textAlign: 'center' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(148, 255, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Activity size={20} color={AURA_COLORS.accent} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{avgAtt}%</div>
             <div style={{ fontSize: '10px', color: AURA_COLORS.sub, marginTop: '4px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Attendance</div>
          </div>

          <div onClick={() => router.push('/marks')} className="liquid-card" style={{ padding: '32px 20px', borderRadius: '40px', textAlign: 'center' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 117, 195, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Award size={20} color={AURA_COLORS.primary} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{avgMarks}%</div>
             <div style={{ fontSize: '10px', color: AURA_COLORS.sub, marginTop: '4px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Academic</div>
          </div>
        </div>

        {/* Dynamic Highlight Card */}
        {nextClass ? (
          <div className="liquid-card" style={{ padding: '32px', borderRadius: '40px', marginBottom: '32px', position: 'relative' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: AURA_COLORS.secondary }} />
                   <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: AURA_COLORS.sub }}>Current Schedule</span>
                </div>
                <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>{nextClass.startTime}</div>
             </div>
             <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2 }}>{nextClass.courseTitle}</h2>
             <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: AURA_COLORS.sub, fontWeight: 700 }}>
                <span>Room {nextClass.roomNo}</span>
                <span style={{ opacity: 0.3 }}>•</span>
                <span>ID {nextClass.courseCode}</span>
             </div>
          </div>
        ) : (
          <div className="liquid-card" style={{ padding: '40px', borderRadius: '40px', textAlign: 'center', marginBottom: '32px' }}>
             <Coffee size={32} color={AURA_COLORS.sub} style={{ margin: '0 auto 16px' }} />
             <div style={{ fontSize: '14px', fontWeight: 700, color: AURA_COLORS.sub }}>System Rest: No Active Classes</div>
          </div>
        )}

        {/* Official Hub Integration */}
        {renderAcademicIntegrityHub("aura")}

        {/* Lumina ID Passport */}
        <button 
          onClick={onShowStudentInfo} 
          className="liquid-card" 
          style={{ 
            width: '100%', padding: '32px', borderRadius: '44px', 
            display: 'flex', flexDirection: 'column', gap: '24px', 
            marginTop: '32px', textAlign: 'left', position: 'relative',
            background: 'rgba(255, 255, 255, 0.02)', overflow: 'hidden'
          }}
        >
          {/* Holographic Shimmer */}
          <motion.div 
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ 
              position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', 
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
              skewX: '-20deg', pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'linear-gradient(135deg, #FF75C3, #8F92FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(255, 117, 195, 0.2)' }}>
                   <User size={24} color="#fff" />
                </div>
                <div>
                   <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>Identity Registry</div>
                   <div style={{ fontSize: '11px', color: AURA_COLORS.sub, fontWeight: 700 }}>LUMINA_PASSPORT_ACTIVE</div>
                </div>
             </div>
             <Compass size={20} color={AURA_COLORS.primary} className="floating" />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                <div style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, marginBottom: '4px' }}>ID_TOKEN</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{data?.profile?.["Registration Number"] || "LOCKED"}</div>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                <div style={{ fontSize: '8px', fontWeight: 900, color: AURA_COLORS.sub, marginBottom: '4px' }}>ACCESS_LEVEL</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: AURA_COLORS.primary }}>STUDENT_CORE</div>
             </div>
          </div>
        </button>

        <section style={{ marginTop: '40px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 117, 195, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Zap size={16} color={AURA_COLORS.primary} className="floating" />
              </div>
              <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Strategic Timeline</h3>
           </div>
           
           <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '28px', 
              padding: '40px 24px', 
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
           }}>
              <div className="floating" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(148, 255, 216, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(148, 255, 216, 0.2)' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: AURA_COLORS.accent, boxShadow: `0 0 15px ${AURA_COLORS.accent}`, animation: 'pulse 2s infinite' }} />
              </div>
              <div>
                 <div style={{ fontSize: '10px', fontWeight: 900, color: '#fff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>All Systems Clear</div>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: AURA_COLORS.sub, marginTop: '4px' }}>No immediate academic threats detected.</div>
              </div>
           </div>
        </section>

      </main>

      {/* Aura Bottom Nav - FIXED OUTSIDE MAIN */}
      <nav style={{ position: "fixed", bottom: "0", left: "0", right: "0", height: "calc(80px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", background: "rgba(5,5,8,0.85)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderTop: `1px solid rgba(255,255,255,0.08)`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 10000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: AURA_COLORS.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Home size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>HOME</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Award size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>MARK</span>
        </button>
        <button onClick={() => router.push('/attendance')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <Activity size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>ATTND</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: AURA_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900 }}>MORE</span>
        </button>
      </nav>
    </div>
  );
}
