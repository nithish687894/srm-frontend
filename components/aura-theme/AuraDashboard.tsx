"use client";
import { 
  Sparkles, Activity, Award, Calendar, Compass, User, Zap, Coffee, ChevronRight, Fingerprint
} from "lucide-react";
import { useRouter } from "next/navigation";

const AURA = {
  bg: "#050508",
  cyan: "#00E5FF",    // Attendance
  pink: "#FF2D55",    // Academic
  amber: "#FF9500",   // Warnings
  emerald: "#34C759", // Success
  purple: "#BF5AF2",  // AI
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
};

export default function AuraDashboard({ 
  data, avgAtt, avgMarks, firstName, nextClass, 
  onShowStudentInfo, broadcast, renderAcademicIntegrityHub,
  upcomingEvents
}: any) {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div style={{ 
      background: 'radial-gradient(circle at 50% 0%, #1e1e30 0%, #050508 100%)', 
      minHeight: "100%", display: "flex", flexDirection: "column", 
      color: AURA.text, fontFamily: "'Plus Jakarta Sans', sans-serif", 
      position: 'relative'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        
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
        
        .premium-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02), 0 20px 40px rgba(0,0,0,0.4);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.05), 0 30px 50px rgba(0,0,0,0.5);
        }
        .premium-card:active { transform: scale(0.98); }
        
        .ai-border {
          position: absolute; inset: 0; border-radius: inherit;
          padding: 1px;
          background: linear-gradient(45deg, transparent, rgba(191,90,242,0.3), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: border-breathe 4s ease-in-out infinite;
        }
        
        @keyframes border-breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .floating { animation: floating 6s ease-in-out infinite; }
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.4) 50%, #fff 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}} />

      {/* SVG Noise Texture */}
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.04, pointerEvents: 'none' }}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)"/>
      </svg>

      {/* Cinematic Blur Orbs */}
      <div className="aura-blob" style={{ background: AURA.purple, top: '-10%', left: '-10%' }} />
      <div className="aura-blob" style={{ background: AURA.cyan, bottom: '20%', right: '-10%', animationDelay: '-5s' }} />
      <div className="aura-blob" style={{ background: AURA.pink, top: '40%', right: '-20%', animationDelay: '-10s' }} />

      <main style={{ flex: 1, padding: "120px 24px 140px", position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ONE Large AI Hero Card */}
        <div className="premium-card" style={{ padding: '32px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
            <div style={{ padding: '8px 16px', background: 'rgba(191,90,242,0.1)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(191,90,242,0.2)' }}>
              <Sparkles size={14} color={AURA.purple} className="floating" />
              <span style={{ fontSize: "10px", fontWeight: 900, color: AURA.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lumina OS v2.0</span>
            </div>
            <div style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, letterSpacing: '0.05em' }}>SYSTEM ACTIVE</div>
          </div>
          
          <h1 style={{ fontSize: "32px", fontWeight: 900, margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1.1, color: '#ffffff', position: 'relative', zIndex: 2 }}>
            {getGreeting()},<br/><span className="shimmer-text">{firstName || "Explorer"}</span>
          </h1>
          
          {/* Daily Briefing Insight */}
          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
              Your academic trajectory is stable. You have <strong style={{color: AURA.cyan}}>{avgAtt}%</strong> attendance and <strong style={{color: AURA.pink}}>{avgMarks}%</strong> academic score. {nextClass ? `Your next session is ${nextClass.courseTitle}.` : "No active sessions today."} Keep up the momentum.
            </p>
          </div>
        </div>

        {/* Analytics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div onClick={() => router.push('/attendance')} className="premium-card" style={{ padding: '24px', borderRadius: '32px', cursor: 'pointer' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '16px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Activity size={18} color={AURA.cyan} />
                </div>
                <ChevronRight size={16} color={AURA.sub} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{avgAtt}%</div>
             <div style={{ fontSize: '11px', color: AURA.sub, marginTop: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance</div>
          </div>

          <div onClick={() => router.push('/marks')} className="premium-card" style={{ padding: '24px', borderRadius: '32px', cursor: 'pointer' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '16px', background: 'rgba(255, 45, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Award size={18} color={AURA.pink} />
                </div>
                <ChevronRight size={16} color={AURA.sub} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{avgMarks}%</div>
             <div style={{ fontSize: '11px', color: AURA.sub, marginTop: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic</div>
          </div>
        </div>

        {/* Current Schedule */}
        {nextClass ? (
          <div className="premium-card" style={{ padding: '24px', borderRadius: '32px', position: 'relative' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: AURA.emerald, boxShadow: `0 0 10px ${AURA.emerald}` }} />
                   <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: AURA.emerald, letterSpacing: '0.1em' }}>Active Session</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: AURA.sub, padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{nextClass.startTime}</div>
             </div>
             <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2 }}>{nextClass.courseTitle}</h2>
             <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: AURA.sub, fontWeight: 700 }}>
                <span style={{color: '#fff'}}>Room {nextClass.roomNo}</span>
                <span style={{ opacity: 0.3 }}>•</span>
                <span>ID {nextClass.courseCode}</span>
             </div>
          </div>
        ) : (
          <div className="premium-card" style={{ padding: '32px 24px', borderRadius: '32px', textAlign: 'center' }}>
             <Coffee size={28} color={AURA.sub} style={{ margin: '0 auto 16px' }} />
             <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>System Rest Active</div>
             <div style={{ fontSize: '12px', fontWeight: 600, color: AURA.sub, marginTop: '4px' }}>No further sessions scheduled for today.</div>
          </div>
        )}

        {/* Official Hub Integration */}
        {renderAcademicIntegrityHub && renderAcademicIntegrityHub("aura")}

        {/* Holographic Identity Passport */}
        <button 
          onClick={onShowStudentInfo} 
          className="premium-card" 
          style={{ 
            width: '100%', padding: '24px', borderRadius: '32px', 
            display: 'flex', flexDirection: 'column', gap: '20px', 
            textAlign: 'left', position: 'relative', overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          {/* Holographic Glare */}
          <div 
            style={{ 
              position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', 
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              transform: 'skewX(-20deg)', pointerEvents: 'none',
              animation: 'shimmer 6s infinite'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                   <Fingerprint size={24} color={AURA.text} />
                </div>
                <div>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>Identity Passport</div>
                   <div style={{ fontSize: '10px', color: AURA.emerald, fontWeight: 800, letterSpacing: '0.05em' }}>VERIFIED_CORE</div>
                </div>
             </div>
             <Compass size={20} color={AURA.sub} />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                <div style={{ fontSize: '9px', fontWeight: 900, color: AURA.sub, marginBottom: '4px', letterSpacing: '0.05em' }}>ID_TOKEN</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }} className="tabular-nums">{data?.profile?.["Registration Number"] || "LOCKED"}</div>
             </div>
          </div>
        </button>

        {/* Strategic Timeline */}
        <section style={{ marginTop: '16px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingLeft: '8px' }}>
              <Zap size={18} color={AURA.amber} className="floating" />
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Strategic Timeline</h3>
           </div>
           
           <div style={{ position: 'relative', paddingLeft: upcomingEvents?.length > 0 ? '32px' : '0' }}>
              {/* Vertical Glowing Progress Line */}
              {upcomingEvents?.length > 0 && (
                 <div style={{ 
                    position: 'absolute', left: '15px', top: '24px', bottom: '24px', width: '2px', 
                    background: `linear-gradient(to bottom, ${AURA.purple}, transparent)`, 
                    opacity: 0.5, borderRadius: '2px' 
                 }} />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {upcomingEvents?.length > 0 ? (
                    upcomingEvents.map((event: any, idx: number) => (
                       <div key={idx} className="premium-card" style={{ 
                          display: 'flex', alignItems: 'center', gap: '16px', 
                          padding: '16px', borderRadius: '24px', position: 'relative'
                       }}>
                          {/* Timeline Dot */}
                          <div style={{ position: 'absolute', left: '-21px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', background: AURA.purple, boxShadow: `0 0 10px ${AURA.purple}` }} />
                          
                          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                             <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{event.dateNum}</span>
                             <span style={{ fontSize: '8px', fontWeight: 900, color: AURA.sub }}>{event.monthLabel.split(' ')[0].toUpperCase()}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                             <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{event.event}</div>
                             <div style={{ fontSize: '11px', fontWeight: 700, color: AURA.sub, marginTop: '2px' }}>{event.weekdayLabel}</div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="premium-card" style={{ padding: '32px 24px', borderRadius: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                       <div className="floating" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: AURA.cyan, boxShadow: `0 0 20px ${AURA.cyan}`, animation: 'border-breathe 2s infinite' }} />
                       </div>
                       <div>
                          <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>All Systems Clear</div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: AURA.sub, marginTop: '4px' }}>No immediate academic threats detected.</div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}
