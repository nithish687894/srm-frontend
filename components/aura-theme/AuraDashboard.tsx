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
  upcomingEvents, marks,
  tomorrowSkipStats, totalSafeSkips, nextRiskyClassText, marksTargetBrief,
  safeSubjectsCount, riskySubjectsCount
}: AnyValue) {
  const router = useRouter();
  const { activeTheme, stars } = useAuraTheme();

  const getSubjectName = (courseCode: string, fallbackTitle?: string) => {
    if (!courseCode) return fallbackTitle || "";
    const attList = data?.attendance || 
                    data?.academia?.attendance || 
                    data?.studentPortal?.attendance || [];
    const found = attList.find((c: any) => (c["Course Code"] || c.courseCode) === courseCode);
    if (found) {
      const title = found["Course Title"] || found.courseTitle || found.courseName;
      if (title) return title;
    }
    return fallbackTitle || courseCode;
  };

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
        
        {/* Demo Mode Warning Banner */}
        {(() => {
          const isDemo = data?.profile?.["Name"] === "AURA NEBULA DEMO" || 
                         data?.profile?.["Registration Number"] === "RA2311003010999" || 
                         (typeof window !== "undefined" && localStorage.getItem("userEmail")?.toLowerCase()?.includes("demo"));
          if (!isDemo) return null;
          return (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 45, 85, 0.15) 0%, rgba(191, 90, 242, 0.1) 100%)',
              border: '1.5px solid rgba(255, 45, 85, 0.3)',
              boxShadow: '0 8px 32px rgba(255, 45, 85, 0.15)',
              borderRadius: '24px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              position: 'relative',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={16} color="#FF2D55" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#ff2d55', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Mode Active</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginTop: '2px' }}>Viewing sample dashboard. Connect your portal for real sync.</span>
                </div>
              </div>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("userEmail");
                  } catch {}
                  window.location.href = "/";
                }}
                style={{
                  background: '#FF2D55',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(255, 45, 85, 0.3)',
                  flexShrink: 0
                }}
              >
                Connect
              </button>
            </div>
          );
        })()}

        {/* ONE Large AI Hero Card */}
        <div className="premium-card" style={{ padding: '32px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
            <div style={{ padding: '8px 16px', background: 'rgba(192, 132, 252, 0.08)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 12px rgba(192, 132, 252, 0.1)' }}>
              <Sparkles size={14} color={AURA.purple} className="floating" />
              <span style={{ fontSize: "10px", fontWeight: 900, color: AURA.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lumina Sync v2.6</span>
            </div>
            <div style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, letterSpacing: '0.05em' }}>SYSTEM ACTIVE</div>
          </div>
          
          <h1 style={{ fontSize: "32px", fontWeight: 900, margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1.1, color: '#ffffff', position: 'relative', zIndex: 2 }}>
            {activeTheme.greeting},<br/><span className="shimmer-text">{firstName || "Explorer"}</span>
          </h1>
          
          {/* Daily Briefing Insight - Actionable & Direct */}
          <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', position: 'relative', zIndex: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14.5px', color: 'rgba(255,255,255,0.95)', fontWeight: 600, lineHeight: 1.5 }}>
              <div>You’re safe in <strong style={{color: AURA.cyan, fontWeight: 900}}>{safeSubjectsCount}</strong> subjects.</div>
              <div><strong style={{color: (riskySubjectsCount || 0) > 0 ? AURA.pink : AURA.cyan, fontWeight: 900}}>{riskySubjectsCount}</strong> subject{(riskySubjectsCount || 0) === 1 ? " needs" : "s need"} attention.</div>
              <div>You can miss <strong style={{color: AURA.purple, fontWeight: 900}}>{totalSafeSkips}</strong> more class{(totalSafeSkips || 0) === 1 ? "y" : "es"} safely.</div>
              <div>Next risky class: <strong style={{color: (nextRiskyClassText || "").includes("None") ? AURA.cyan : AURA.pink, fontWeight: 900}}>{nextRiskyClassText}</strong>.</div>
            </div>
          </div>
        </div>

        {/* Can I skip tomorrow? Card */}
        <div className="premium-card" style={{ padding: '24px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>Can I skip tomorrow?</h3>
            <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.amber, letterSpacing: '0.05em' }}>DECISION ENGINE</span>
          </div>

          {tomorrowSkipStats?.isHoliday ? (
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Tomorrow is a holiday / weekend. No classes scheduled!</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Tomorrow</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>Day {tomorrowSkipStats?.dayOrder || "—"}</div>
                </div>
                <div style={{ background: 'rgba(52, 199, 89, 0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(52, 199, 89, 0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(52, 199, 89, 0.7)', textTransform: 'uppercase' }}>Safe</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#34c759', marginTop: '4px' }}>{tomorrowSkipStats?.safe} class{(tomorrowSkipStats?.safe || 0) === 1 ? '' : 'es'}</div>
                </div>
                <div style={{ background: 'rgba(255, 45, 85, 0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 45, 85, 0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 45, 85, 0.7)', textTransform: 'uppercase' }}>Risky</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#ff2d55', marginTop: '4px' }}>{tomorrowSkipStats?.risky} class{(tomorrowSkipStats?.risky || 0) === 1 ? '' : 'es'}</div>
                </div>
              </div>

              {tomorrowSkipStats?.classes && tomorrowSkipStats.classes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#555', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Class Analysis</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tomorrowSkipStats.classes.map((cls: AnyValue, idx: number) => {
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', fontWeight: 600 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cls.isRisky ? '#ff2d55' : '#34c759' }} />
                          <span style={{ color: '#fff' }}>{getSubjectName(cls.courseCode, cls.courseTitle)}</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>({cls.slot})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => router.push('/attendance')}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: AURA.cyan,
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <span>View Bunk Report →</span>
          </button>
        </div>

        {/* Marks Target Card */}
        <div className="premium-card" style={{ padding: '24px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Marks Target</h3>
            <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.pink, letterSpacing: '0.05em' }}>PREDICTION</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 850, color: '#fff', lineHeight: 1.4 }}>
            {marksTargetBrief}
          </div>
          <div style={{ fontSize: '10.5px', color: AURA.sub, fontWeight: 600 }}>
            Based on current cycle test scores & class performance.
          </div>
        </div>

        {/* Next Class Card */}
        <div className="premium-card" style={{ padding: '24px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next Class</h3>
            <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.cyan, letterSpacing: '0.05em' }}>TIMETABLE</span>
          </div>
          {nextClass ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 850, color: '#fff', textTransform: 'capitalize' }}>
                {getSubjectName(nextClass.courseCode, nextClass.courseTitle).toLowerCase()}
              </div>
              <div style={{ fontSize: '12px', color: AURA.cyan, fontWeight: 700 }}>
                {nextClass.startTime} - {nextClass.endTime} • Slot {nextClass.slot}
              </div>
              <div style={{ fontSize: '11px', color: AURA.sub, fontWeight: 600 }}>
                Room {nextClass.roomNo || "TBA"} • {nextClass.facultyName || "Faculty Unknown"}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              No more classes scheduled today.
            </div>
          )}
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

        {/* Holographic Identity Passport (Student ID) */}
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
                   <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>Student ID</div>
                   <div style={{ fontSize: '10px', color: AURA.pink, fontWeight: 900, letterSpacing: '0.08em' }}>Identity Passport</div>
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

        {/* Upcoming Timeline */}
        <section style={{ marginTop: '16px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingLeft: '8px' }}>
              <Zap size={18} color={AURA.amber} className="floating" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                 <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Upcoming Timeline</h3>
                 <span style={{ fontSize: '9px', color: AURA.sub, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Strategic Timeline</span>
              </div>
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
