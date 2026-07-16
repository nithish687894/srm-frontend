"use client";
import React, { useMemo } from "react";
import { 
  Sparkles, Activity, Award, Compass, User, Zap, Coffee, ChevronRight, Fingerprint, Bell, LockKeyhole
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";
import { AURA_COLORS } from "./system/theme-tokens";
import { useAuthStore } from "@/lib/store";
import Toast from "@/components/Toast";
import { enableAcademicAlerts } from "@/lib/notificationHelper";

const AURA = AURA_COLORS;

export default function AuraDashboard({ 
  data, avgAtt, avgMarks, firstName, nextClass, targetClasses,
  onShowStudentInfo, broadcast, renderAcademicIntegrityHub,
  upcomingEvents, marks,
  tomorrowSkipStats, totalSafeSkips, nextRiskyClassText,
  safeSubjectsCount, riskySubjectsCount,
  currentClass, currentClassMeta, nextClassMeta
}: AnyValue) {
  const router = useRouter();
  const { activeTheme, stars } = useAuraTheme();
  const isPremium = useAuthStore((state) => state.isPremium);
  
  // Notification prompt state selectors
  const academicAlertsPrompted = useAuthStore((state) => state.academicAlertsPrompted);
  const academicAlertsEnabled = useAuthStore((state) => state.academicAlertsEnabled);
  const setAcademicAlertsPrompted = useAuthStore((state) => state.setAcademicAlertsPrompted);
  const setAcademicAlertsEnabled = useAuthStore((state) => state.setAcademicAlertsEnabled);

  const [toast, setToast] = React.useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = React.useState(false);
  const showToast = (title: string, body: string, type: "success" | "error" | "info" = "success") => {
    setToast({ title, body, type });
  };

  const getSubjectName = (courseCode: string, fallbackTitle?: string) => {
    if (!courseCode) return fallbackTitle || "";
    const attList = data?.attendance || 
                    data?.academia?.attendance || 
                    data?.studentPortal?.attendance || [];
    const found = attList.find((c: AnyValue) => (c["Course Code"] || c.courseCode) === courseCode);
    if (found) {
      const title = found["Course Title"] || found.courseTitle || found.courseName;
      if (title) return title;
    }
    return fallbackTitle || courseCode;
  };

  const formatCountdown = (minutes: number | null, isTomorrow = false) => {
    if (minutes === null) return "";
    if (minutes < 1) return "starting now";

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h <= 0) return `in ${m}m`;

    if (m === 0) {
      return isTomorrow ? `tomorrow in ${h}h` : `in ${h}h`;
    }

    return isTomorrow
      ? `tomorrow in ${h}h ${m}m`
      : `in ${h}h ${m}m`;
  };

  const formatEndsIn = (minutes: number | null) => {
    if (minutes === null) return "";
    if (minutes < 1) return "ending now";
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h <= 0) return `ends in ${m}m`;
    if (m === 0) return `ends in ${h}h`;

    return `ends in ${h}h ${m}m`;
  };

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      {/* Dashboard-specific responsive styles (animations inherited from AuraBackground) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .dashboard-main {
          flex: 1;
          padding: 120px 24px 140px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          min-width: 0;
          overflow-x: clip;
        }

        .dashboard-top-banners {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .dashboard-grid-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          min-width: 0;
        }

        .dashboard-col-main, .dashboard-col-side {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          min-width: 0;
        }

        .dashboard-main > *,
        .dashboard-top-banners > *,
        .dashboard-grid-layout > *,
        .dashboard-col-main > *,
        .dashboard-col-side > * {
          min-width: 0;
        }

        .dashboard-analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (min-width: 1180px) {
          .dashboard-grid-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
            align-items: start;
            gap: 32px;
          }
          .dashboard-analytics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .dashboard-grid-layout {
            grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1fr);
          }
        }

        .notification-prompt,
        .notification-copy {
          min-width: 0;
        }

        .notification-copy {
          overflow-wrap: anywhere;
        }

        @media (min-width: 1180px) {
          .notification-prompt {
            flex-direction: row !important;
            align-items: center;
            justify-content: space-between;
          }
          .notification-actions {
            flex-shrink: 0;
          }
        }

        .today-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .skip-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 480px) {
          .dashboard-main {
            padding: 104px 16px 120px;
            gap: 16px;
          }
          .premium-card {
            padding: 18px !important;
            border-radius: 24px !important;
          }
          .today-header {
            font-size: 24px !important;
          }
          .today-stats-grid {
            gap: 8px !important;
          }
          .today-stats-grid > div {
            padding: 10px 8px !important;
            border-radius: 14px !important;
          }
          .skip-stats-grid {
            gap: 8px !important;
          }
          .skip-stats-grid > div {
            padding: 10px 8px !important;
            border-radius: 14px !important;
          }
        }

        @media (max-width: 360px) {
          .dashboard-main {
            padding: 96px 12px 105px;
            gap: 12px;
          }
          .premium-card {
            padding: 14px !important;
            border-radius: 20px !important;
          }
          .today-header {
            font-size: 20px !important;
          }
          .today-stats-grid {
            gap: 6px !important;
          }
          .today-stats-grid > div {
            padding: 8px 4px !important;
            border-radius: 12px !important;
          }
          .today-stats-grid div {
            font-size: 8px !important;
          }
          .today-stats-grid .tabular-nums {
            font-size: 16px !important;
          }
          .skip-stats-grid {
            gap: 6px !important;
          }
          .skip-stats-grid > div {
            padding: 8px 4px !important;
            border-radius: 12px !important;
          }
          .skip-stats-grid div {
            font-size: 8px !important;
          }
          .skip-stats-grid .tabular-nums {
            font-size: 14px !important;
          }
        }
      `}} />

      <main className="dashboard-main">
        <div className="dashboard-top-banners">
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
                  <span style={{ fontSize: '10px', color: AURA.sub, fontWeight: 600, marginTop: '2px' }}>Viewing sample dashboard. Connect your portal for real sync.</span>
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

        {/* Enable Notification Alerts Card - Only show when data exists, user has not enabled, and has not dismissed prompt */}
        {!academicAlertsPrompted && !academicAlertsEnabled && data && (
          <div 
            className="premium-card notification-prompt"
            style={{
              background: 'linear-gradient(135deg, rgba(143, 146, 255, 0.08) 0%, rgba(191, 90, 242, 0.04) 100%)',
              border: '1px solid var(--accent-secondary)',
              borderColor: 'rgba(143, 146, 255, 0.25)',
              boxShadow: '0 8px 32px rgba(143, 146, 255, 0.08)',
              borderRadius: '24px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(143, 146, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-secondary)',
                flexShrink: 0
              }}>
                <Bell size={18} />
              </div>
              <div className="notification-copy" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                  Want Nexus to alert you when attendance or marks update?
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '3px' }}>
                  Get updates even when you’re not checking the app.
                </span>
              </div>
            </div>
            <div className="notification-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setAcademicAlertsPrompted(true);
                  localStorage.setItem("academicAlertsPrompted", "true");
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Maybe later
              </button>
              <button
                onClick={() => {
                  enableAcademicAlerts(showToast);
                }}
                style={{
                  background: 'var(--accent-secondary)',
                  color: 'var(--bg-root)',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(143, 146, 255, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                Enable alerts
              </button>
            </div>
          </div>
        )}
        </div>

        <div className="dashboard-grid-layout">
          <div className="dashboard-col-main">

        {/* Today Command Center */}
        <div className="premium-card" style={{ padding: '24px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative', zIndex: 2 }}>
            <div style={{ padding: '8px 16px', background: 'rgba(192, 132, 252, 0.08)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 12px rgba(192, 132, 252, 0.1)' }}>
              <Sparkles size={14} color={AURA.purple} className="floating" />
              <span style={{ fontSize: "10px", fontWeight: 900, color: AURA.purple, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lumina Sync v2.6</span>
            </div>
            <div style={{ fontSize: '10px', color: AURA.sub, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Today</div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '11px', color: AURA.sub, fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {activeTheme.greeting}, {firstName || "Explorer"}
            </div>
            <h1 className="today-header" style={{ fontSize: "28px", fontWeight: 950, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.08, color: AURA.text }}>
              {currentClass 
                ? "You have a class ongoing." 
                : nextClass 
                  ? nextClassMeta?.isTomorrow 
                    ? "Class schedule is clear." 
                    : "Your next class is ready." 
                  : "No class queued right now."}
            </h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 2 }}>
            {/* Case 1 & Case 2: Ongoing class card */}
            {currentClass && (
              <div style={{ padding: '18px', background: 'rgba(255, 45, 85, 0.04)', borderRadius: '24px', border: '1px solid rgba(255, 45, 85, 0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: AURA.pink, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {currentClass.startTime} - {currentClass.endTime}
                    </div>
                    <span style={{ background: '#FF2D55', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Now ({formatEndsIn(currentClassMeta?.endsInMinutes)})
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', color: AURA.text, fontWeight: 950, lineHeight: 1.18, textTransform: 'capitalize' }}>
                    {getSubjectName(currentClass.courseCode, currentClass.courseTitle).toLowerCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: AURA.subBright, fontWeight: 700 }}>
                    Room {currentClass.roomNo || "TBA"} | Slot {currentClass.slot}
                  </div>
                </div>
              </div>
            )}

            {/* Next class (Up Next / Tomorrow) */}
            {nextClass ? (
              <div style={{ 
                padding: '18px', 
                background: 'rgba(0,0,0,0.28)', 
                borderRadius: '24px', 
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: AURA.cyan, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {nextClass.startTime} - {nextClass.endTime}
                    </div>
                    <span style={{ 
                      background: nextClassMeta?.isTomorrow ? 'rgba(191, 90, 242, 0.12)' : 'rgba(0, 229, 255, 0.12)', 
                      color: nextClassMeta?.isTomorrow ? AURA.purple : AURA.cyan, 
                      fontSize: '9px', 
                      fontWeight: 900, 
                      padding: '3px 8px', 
                      borderRadius: '8px', 
                      letterSpacing: '0.05em', 
                      textTransform: 'uppercase' 
                    }}>
                      {nextClassMeta?.isTomorrow ? 'Tomorrow' : 'Up Next'} ({formatCountdown(nextClassMeta?.startsInMinutes, nextClassMeta?.isTomorrow)})
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', color: AURA.text, fontWeight: 950, lineHeight: 1.18, textTransform: 'capitalize' }}>
                    {getSubjectName(nextClass.courseCode, nextClass.courseTitle).toLowerCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: AURA.subBright, fontWeight: 700 }}>
                    Room {nextClass.roomNo || "TBA"} | Slot {nextClass.slot}
                  </div>
                </div>
              </div>
            ) : !currentClass && (
              /* Case 4: No current or next class */
              <div style={{ padding: '18px', background: 'rgba(0,0,0,0.28)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '14px', color: AURA.text, fontWeight: 800 }}>
                  No upcoming classes
                </div>
                <div style={{ fontSize: '12px', color: AURA.subBright, fontWeight: 600, marginTop: '4px' }}>
                  You’re free for now 😌
                </div>
              </div>
            )}
          </div>

          <div className="today-stats-grid">
            <div style={{ background: 'rgba(0, 229, 255, 0.06)', border: '1px solid rgba(0, 229, 255, 0.14)', borderRadius: '18px', padding: '12px 10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 950, color: AURA.cyan, lineHeight: 1 }} className="tabular-nums">{safeSubjectsCount}</div>
              <div style={{ fontSize: '9px', color: AURA.sub, fontWeight: 850, textTransform: 'uppercase', marginTop: '6px' }}>Safe subjects</div>
            </div>
            <div style={{ background: (riskySubjectsCount || 0) > 0 ? 'rgba(255, 45, 85, 0.07)' : 'rgba(52, 199, 89, 0.06)', border: (riskySubjectsCount || 0) > 0 ? '1px solid rgba(255, 45, 85, 0.15)' : '1px solid rgba(52, 199, 89, 0.14)', borderRadius: '18px', padding: '12px 10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 950, color: (riskySubjectsCount || 0) > 0 ? AURA.pink : '#34c759', lineHeight: 1 }} className="tabular-nums">{riskySubjectsCount}</div>
              <div style={{ fontSize: '9px', color: AURA.sub, fontWeight: 850, textTransform: 'uppercase', marginTop: '6px' }}>Need care</div>
            </div>
            <div style={{ background: 'rgba(192, 132, 252, 0.07)', border: '1px solid rgba(192, 132, 252, 0.15)', borderRadius: '18px', padding: '12px 10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 950, color: (nextRiskyClassText || "").includes("None") ? AURA.cyan : AURA.pink, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(nextRiskyClassText || "").includes("None") ? "Clear" : "Check"}
              </div>
              <div style={{ fontSize: '9px', color: AURA.sub, fontWeight: 850, textTransform: 'uppercase', marginTop: '6px' }}>Next risk</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 2 }}>
            <button
              onClick={() => router.push('/timetable')}
              style={{ flex: 1, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: AURA.text, borderRadius: '16px', padding: '12px 10px', fontSize: '11px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
            >
              Timetable
            </button>
            <button
              onClick={() => router.push('/attendance')}
              style={{ flex: 1, border: 'none', background: `linear-gradient(135deg, ${AURA.purple}, ${AURA.pink})`, color: '#fff', borderRadius: '16px', padding: '12px 10px', fontSize: '11px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 10px 24px rgba(191,90,242,0.18)' }}
            >
              Attendance
            </button>
          </div>
          
          {/* Daily Briefing Insight - Actionable & Direct */}
          <div style={{ display: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14.5px', color: AURA.text, fontWeight: 600, lineHeight: 1.5 }}>
              <div>You’re safe in <strong style={{color: AURA.cyan, fontWeight: 900}}>{safeSubjectsCount}</strong> subjects.</div>
              <div><strong style={{color: (riskySubjectsCount || 0) > 0 ? AURA.pink : AURA.cyan, fontWeight: 900}}>{riskySubjectsCount}</strong> subject{(riskySubjectsCount || 0) === 1 ? " needs" : "s need"} attention.</div>
              <div>You can miss <strong style={{color: AURA.purple, fontWeight: 900}}>{totalSafeSkips}</strong> more class{(totalSafeSkips || 0) === 1 ? "y" : "es"} safely.</div>
              <div>Next risky class: <strong style={{color: (nextRiskyClassText || "").includes("None") ? AURA.cyan : AURA.pink, fontWeight: 900}}>{nextRiskyClassText}</strong>.</div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="dashboard-analytics-grid">
          <div onClick={() => router.push('/attendance')} className="premium-card" style={{ padding: '24px', borderRadius: '32px', cursor: 'pointer' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '16px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Activity size={18} color={AURA.cyan} />
                </div>
                <ChevronRight size={16} color={AURA.sub} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: AURA.text }} className="tabular-nums">{avgAtt}%</div>
             <div style={{ fontSize: '11px', color: AURA.subBright, marginTop: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Attendance</div>
          </div>

          <div onClick={() => router.push('/marks')} className="premium-card" style={{ padding: '24px', borderRadius: '32px', cursor: 'pointer' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '16px', background: 'rgba(255, 45, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Award size={18} color={AURA.pink} />
                </div>
                <ChevronRight size={16} color={AURA.subBright} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 900, color: AURA.text }} className="tabular-nums">{avgMarks}%</div>
             <div style={{ fontSize: '11px', color: AURA.subBright, marginTop: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Academic</div>
          </div>
        </div>

        {/* Official Hub Integration */}
        {renderAcademicIntegrityHub && renderAcademicIntegrityHub("aura")}

          </div>
          <div className="dashboard-col-side">

        {/* Can I skip tomorrow? Card */}
        <div className="premium-card" style={{ padding: '24px', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ai-border" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: AURA.text, margin: 0 }}>Can I skip tomorrow?</h3>
            {isPremium ? (
              <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.amber, letterSpacing: '0.05em' }}>DECISION ENGINE</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LockKeyhole size={12} color={AURA.amber} />
                <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.amber, letterSpacing: '0.05em' }}>PREMIUM</span>
              </div>
            )}
          </div>

          {!isPremium ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '16px 8px 8px', 
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '15px', 
                background: 'rgba(255, 149, 0, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: AURA.amber,
                marginBottom: '12px',
                border: '1px solid rgba(255, 149, 0, 0.2)',
                boxShadow: '0 0 15px rgba(255, 149, 0, 0.12)'
              }}>
                <LockKeyhole size={18} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 950, color: AURA.text }}>
                Unlock Decision Engine
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '11px', color: AURA.subBright, fontWeight: 700, lineHeight: 1.45, maxWidth: '280px' }}>
                Skip safety analyzes tomorrow's schedule and forecasts if you can miss classes safely without dropping below 75%.
              </p>
              <button
                onClick={() => router.push('/premium')}
                style={{
                  background: `linear-gradient(135deg, ${AURA.purple}, ${AURA.pink})`,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(191,90,242,0.22)'
                }}
              >
                Upgrade to Premium
              </button>
            </div>
          ) : (
            <>
              {tomorrowSkipStats?.isHoliday ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: AURA.subBright }}>Tomorrow is a holiday / weekend. No classes scheduled!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="skip-stats-grid">
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Tomorrow</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: AURA.text, marginTop: '4px' }}>Day {tomorrowSkipStats?.dayOrder || "—"}</div>
                    </div>
                    <div style={{ background: 'rgba(52, 199, 89, 0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(52, 199, 89, 0.15)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(52, 199, 89, 0.7)', textTransform: 'uppercase' }}>Safe to skip</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#34c759', marginTop: '4px' }}>{tomorrowSkipStats?.safe} class{(tomorrowSkipStats?.safe || 0) === 1 ? '' : 'es'}</div>
                    </div>
                    <div style={{ background: 'rgba(255, 45, 85, 0.05)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 45, 85, 0.15)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 45, 85, 0.7)', textTransform: 'uppercase' }}>Risky to skip</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#ff2d55', marginTop: '4px' }}>{tomorrowSkipStats?.risky} class{(tomorrowSkipStats?.risky || 0) === 1 ? '' : 'es'}</div>
                    </div>
                  </div>

                  {tomorrowSkipStats?.classes && tomorrowSkipStats.classes.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                      <button 
                        onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                        style={{ 
                          background: 'none', border: 'none', padding: 0, margin: 0,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none'
                        }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#666', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Class Analysis</span>
                        <span style={{ fontSize: '10px', color: AURA.cyan, fontWeight: 900 }}>
                          {isAnalysisExpanded ? "Hide breakdown ↑" : `Analyze classes (${tomorrowSkipStats.classes.length}) ↓`}
                        </span>
                      </button>

                      {isAnalysisExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {tomorrowSkipStats.classes.map((cls: AnyValue, idx: number) => {
                            return (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '6px', 
                                background: 'rgba(0,0,0,0.18)', 
                                padding: '12px 16px', 
                                borderRadius: '16px', 
                                border: '1px solid rgba(255,255,255,0.04)' 
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ color: AURA.text, fontSize: '13px', fontWeight: 800, textTransform: 'capitalize' }}>
                                      {getSubjectName(cls.courseCode, cls.courseTitle).toLowerCase()}
                                    </span>
                                    <span style={{ color: AURA.sub, fontSize: '10px', fontWeight: 700 }}>
                                      Slot {cls.slot} | Code {cls.courseCode}
                                    </span>
                                  </div>
                                  <span style={{ 
                                    background: cls.isRisky ? 'rgba(255, 45, 85, 0.12)' : 'rgba(52, 199, 89, 0.12)', 
                                    color: cls.isRisky ? '#ff2d55' : '#34c759', 
                                    fontSize: '9px', 
                                    fontWeight: 900, 
                                    padding: '4px 10px', 
                                    borderRadius: '8px', 
                                    letterSpacing: '0.05em', 
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {cls.isRisky ? 'Risky (Attend)' : 'Safe to skip'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: AURA.subBright, fontWeight: 700, borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                                  <div>Current: <span style={{ color: AURA.text, fontWeight: 800 }}>{cls.currentAttendance}%</span></div>
                                  <div style={{ color: 'rgba(255,255,255,0.15)' }}>|</div>
                                  <div>After skip: <span style={{ color: cls.isRisky ? '#ff2d55' : '#34c759', fontWeight: 800 }}>{cls.afterSkipAttendance}%</span></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: '10px', color: AURA.sub, fontWeight: 750, fontStyle: 'italic', marginTop: '4px' }}>
                * Skip Safety is calculated after marking tomorrow’s class as absent.
              </div>
            </>
          )}
        </div>


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
                   <div style={{ fontSize: '16px', fontWeight: 900, color: AURA.text }}>Student ID</div>
                   <div style={{ fontSize: '10px', color: AURA.pink, fontWeight: 900, letterSpacing: '0.08em' }}>Identity Passport</div>
                </div>
             </div>
             <Compass size={20} color={AURA.sub} />
          </div>

          <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
             <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', flex: 1 }}>
                <div style={{ fontSize: '9px', fontWeight: 900, color: AURA.sub, marginBottom: '4px', letterSpacing: '0.05em' }}>ID_TOKEN</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: AURA.text }} className="tabular-nums">{data?.profile?.["Registration Number"] || "LOCKED"}</div>
             </div>
          </div>
        </button>

        {/* Upcoming Timeline */}
        <section style={{ marginTop: '16px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingLeft: '8px' }}>
              <Zap size={18} color={AURA.amber} className="floating" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                 <h3 style={{ fontSize: '14px', fontWeight: 900, color: AURA.text, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Upcoming Timeline</h3>
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
                             <span style={{ fontSize: '14px', fontWeight: 900, color: AURA.text }} className="tabular-nums">{event.dateNum}</span>
                             <span style={{ fontSize: '8px', fontWeight: 900, color: AURA.sub }}>{event.monthLabel.split(' ')[0].toUpperCase()}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                             <div style={{ fontSize: '14px', fontWeight: 800, color: AURA.text }}>{event.event}</div>
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
                          <div style={{ fontSize: '12px', fontWeight: 900, color: AURA.text, letterSpacing: '0.15em', textTransform: 'uppercase' }}>All Systems Clear</div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: AURA.sub, marginTop: '4px' }}>No immediate academic threats detected.</div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </section>
          </div>
        </div>
      </main>
      {toast && (
        <Toast
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AuraBackground>
  );
}
