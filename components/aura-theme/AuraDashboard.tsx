"use client";
import React, { useMemo } from "react";
import { 
  Sparkles, Activity, Award, Compass, User, Zap, Coffee, ChevronRight, Fingerprint
} from "lucide-react";
import { useRouter } from "next/navigation";
import { WhatIfCalculator } from "./WhatIfCalculator";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import { AURA_COLORS } from "./system/theme-tokens";

const AURA = AURA_COLORS;

export default function AuraDashboard({ 
  data, avgAtt, avgMarks, firstName, nextClass, targetClasses,
  onShowStudentInfo, broadcast, renderAcademicIntegrityHub,
  upcomingEvents, marks
}: AnyValue) {
  const router = useRouter();
  const { activeTheme, stars } = useAuraTheme();

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ai-border {
          position: absolute; inset: 0; border-radius: inherit;
          padding: 1px;
          background: linear-gradient(45deg, transparent, rgba(192, 132, 252, 0.18), transparent);
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
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      <main style={{ flex: 1, padding: "120px 24px 140px", position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ONE Large AI Hero Card */}
        <div className="premium-card" style={{ padding: '32px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
            <div style={{ padding: '8px 16px', background: 'rgba(192, 132, 252, 0.08)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 12px rgba(192, 132, 252, 0.1)' }}>
              <Sparkles size={14} color={AURA.purple} className="floating" />
              <span style={{ fontSize: "10px", fontWeight: 900, color: AURA.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SRM Nexus v2.6</span>
            </div>
            <div style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, letterSpacing: '0.05em' }}>SYSTEM ACTIVE</div>
          </div>
          
          <h1 style={{ fontSize: "32px", fontWeight: 900, margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1.1, color: '#ffffff', position: 'relative', zIndex: 2 }}>
            {activeTheme.greeting},<br/><span className="shimmer-text">{firstName || "Explorer"}</span>
          </h1>
          
          {/* Daily Briefing Insight */}
          <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', position: 'relative', zIndex: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
              Your academic trajectory is stable. You have <strong style={{color: AURA.cyan, fontWeight: 900}}>{avgAtt}%</strong> attendance and <strong style={{color: AURA.pink, fontWeight: 900}}>{avgMarks}%</strong> academic score. {nextClass ? `Your next session is ${nextClass.courseTitle}.` : "No active sessions today."} Keep up the momentum.
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
             <div style={{ fontSize: '11px', color: AURA.subBright, marginTop: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Attendance</div>
          </div>

          <div onClick={() => router.push('/marks')} className="premium-card" style={{ padding: '24px', borderRadius: '32px', cursor: 'pointer' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '16px', background: 'rgba(255, 45, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Award size={18} color={AURA.pink} />
                </div>
                <ChevronRight size={16} color={AURA.subBright} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }} className="tabular-nums">{avgMarks}%</div>
             <div style={{ fontSize: '11px', color: AURA.subBright, marginTop: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Academic</div>
          </div>
        </div>



        {/* What-If Grade Calculator */}
        {marks && <WhatIfCalculator marks={marks} />}

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
            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)'
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

          <div style={{ display: 'flex', alignItems: 'center', zIndex: 2, justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                   <Fingerprint size={24} color={AURA.text} />
                </div>
                <div>
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>Identity Passport</div>
                   <div style={{ fontSize: '10px', color: AURA.pink, fontWeight: 900, letterSpacing: '0.08em' }}>✓ VERIFIED_CORE</div>
                </div>
             </div>
             <Compass size={20} color={AURA.sub} />
          </div>

          <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
             <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', flex: 1 }}>
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
                    upcomingEvents.map((event: AnyValue, idx: number) => (
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
                       <div className="floating" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0, 229, 255, 0.15)' }}>
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

    </AuraBackground>
  );
}
