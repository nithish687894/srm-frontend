"use client";
import React, { useMemo } from "react";
import { 
  Sparkles, Activity, Award, Compass, User, Zap, ChevronRight, Fingerprint, Bell, LockKeyhole,
  CheckCircle2, AlertTriangle, BarChart3, Clock, MapPin, ShieldCheck, ShieldAlert
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
  data, avgAtt, avgMarks, firstName, nextClass, targetClasses, todaySchedule,
  onShowStudentInfo, broadcast, renderAcademicIntegrityHub,
  upcomingEvents, marks,
  tomorrowSkipStats, totalSafeSkips, nextRiskyClassText,
  safeSubjectsCount, riskySubjectsCount, onConnectPortal,
  currentClass, currentClassMeta, nextClassMeta,
  syncError, dayOrder
}: AnyValue) {
  const router = useRouter();
  const { activeTheme, stars } = useAuraTheme();
  const isPremium = useAuthStore((state) => state.isPremium);
  const studentPortalConnected = useAuthStore((state) => state.studentPortalConnected);
  
  // Notification prompt state selectors
  const academicAlertsPrompted = useAuthStore((state) => state.academicAlertsPrompted);
  const academicAlertsEnabled = useAuthStore((state) => state.academicAlertsEnabled);
  const setAcademicAlertsPrompted = useAuthStore((state) => state.setAcademicAlertsPrompted);

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

  // Plain-English, precise time countdowns
  const formatCountdownText = (minutes: number | null, isTomorrow = false) => {
    if (minutes === null) return "";
    if (minutes < 1) return "Starts now";

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h <= 0) return `Starts in ${m}m`;
    if (m === 0) return `Starts in ${h}h`;

    return `Starts in ${h}h ${m}m`;
  };

  const formatEndsInText = (minutes: number | null) => {
    if (minutes === null) return "";
    if (minutes < 1) return "Ending now";
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h <= 0) return `Ends in ${m}m`;
    if (m === 0) return `Ends in ${h}h`;

    return `Ends in ${h}h ${m}m`;
  };

  // Main status headline logic (Apple-style calm, meaningful status)
  const mainHeadline = useMemo(() => {
    if (currentClass) return "Class in session";
    if (nextClass) {
      if (nextClassMeta?.isTomorrow) return "You're all set for tomorrow";
      return "Next class starts soon";
    }
    return "No class conflicts today";
  }, [currentClass, nextClass, nextClassMeta]);

  // Numerical attendance value calculation for color thresholds
  const numericAvgAtt = useMemo(() => {
    if (!avgAtt || avgAtt === "—") return null;
    const val = parseFloat(avgAtt);
    return isNaN(val) ? null : val;
  }, [avgAtt]);

  const attStatusColor = useMemo(() => {
    if (numericAvgAtt === null) return "#00E5FF";
    if (numericAvgAtt >= 75) return "#34C759"; // Green (Healthy)
    if (numericAvgAtt >= 65) return "#FF9500"; // Orange (Warning)
    return "#FF2D55"; // Red (Critical)
  }, [numericAvgAtt]);

  // Check if valid academic marks exist
  const hasValidAcademicMarks = useMemo(() => {
    if (!avgMarks || avgMarks === "—" || avgMarks === "0" || avgMarks === "0.0") return false;
    const val = parseFloat(avgMarks);
    return !isNaN(val) && val > 0;
  }, [avgMarks]);

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      {/* Dashboard-specific responsive styles */}
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
          padding: calc(env(safe-area-inset-top, 0px) + 72px) 24px 96px;
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
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        @media (min-width: 1180px) {
          .dashboard-grid-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.3fr) minmax(320px, 380px);
            align-items: start;
            gap: 32px;
          }
          .dashboard-analytics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1280px) {
          .dashboard-grid-layout {
            grid-template-columns: minmax(0, 1.4fr) minmax(340px, 1fr);
          }
        }

        .today-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        .skip-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 480px) {
          .dashboard-main {
            padding: calc(env(safe-area-inset-top, 0px) + 72px) 16px 110px;
            gap: 20px;
          }
          .today-stats-grid {
            gap: 8px !important;
          }
          .skip-stats-grid {
            gap: 8px !important;
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
            if (!isDemo || studentPortalConnected) return null;
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
                  onClick={onConnectPortal}
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

          {/* Sync Error Warning Banner */}
          {syncError && (
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
              zIndex: 10,
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={16} color="#FF2D55" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#ff2d55', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sync Issue</span>
                  <span style={{ fontSize: '10px', color: AURA.sub, fontWeight: 600, marginTop: '2px' }}>{syncError}</span>
                </div>
              </div>
              <button
                onClick={onConnectPortal}
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
                Reconnect
              </button>
            </div>
          )}

          {/* Enable Notification Alerts Card */}
          {!academicAlertsPrompted && !academicAlertsEnabled && data && (
            <div 
              className="premium-card notification-prompt"
              style={{
                background: 'linear-gradient(135deg, rgba(143, 146, 255, 0.08) 0%, rgba(191, 90, 242, 0.04) 100%)',
                border: '1px solid rgba(143, 146, 255, 0.25)',
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
                  <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                    Want Nexus to alert you when attendance or marks update?
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                    Get instant push updates even when you’re not checking the app.
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
                    cursor: 'pointer'
                  }}
                >
                  Maybe later
                </button>
                <button
                  onClick={() => enableAcademicAlerts(showToast)}
                  style={{
                    background: 'var(--accent-secondary)',
                    color: 'var(--bg-root)',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(143, 146, 255, 0.2)'
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

            {/* 1. TODAY COMMAND CENTER (Apple + Linear level card) */}
            <div className="premium-card" style={{ padding: 'clamp(16px, 5vw, 28px)', borderRadius: '32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 4vw, 22px)', minWidth: 0 }}>
              <div className="ai-border" />
              
              {/* Header Badge Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative', zIndex: 2 }}>
                <div style={{ padding: '6px 14px', background: 'rgba(191, 90, 242, 0.1)', border: '1px solid rgba(191, 90, 242, 0.2)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} color={AURA.purple} />
                  <span style={{ fontSize: "10px", fontWeight: 900, color: AURA.purple, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Academic Command</span>
                </div>
                <div style={{ fontSize: '11px', color: AURA.subBright, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {activeTheme.greeting}, {firstName || "Student"}
                </div>
              </div>
              
              {/* Main Headline (Clear & Instant) */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h1 style={{ fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 950, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1, color: AURA.text, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {mainHeadline}
                </h1>
              </div>

              {/* 2. UPCOMING / ONGOING CLASS CARD (Redesigned with clear typography hierarchy) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 2 }}>
                {/* Case 1: Ongoing Class */}
                {currentClass ? (
                  <div style={{ 
                    padding: '20px', 
                    background: 'linear-gradient(135deg, rgba(255, 45, 85, 0.08) 0%, rgba(191, 90, 242, 0.04) 100%)', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(255, 45, 85, 0.25)',
                    boxShadow: '0 8px 24px rgba(255, 45, 85, 0.12)' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: '#FF2D55', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Live Now
                        </span>
                        <span style={{ fontSize: '12px', color: '#FF2D55', fontWeight: 900 }}>
                          {formatEndsInText(currentClassMeta?.endsInMinutes)}
                        </span>
                      </div>
                      <div style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', color: AURA.text, fontWeight: 900, lineHeight: 1.2, textTransform: 'capitalize', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}>
                        {getSubjectName(currentClass.courseCode, currentClass.courseTitle).toLowerCase()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'clamp(11px, 3vw, 13px)', color: AURA.subBright, fontWeight: 700, flexWrap: 'wrap', minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} color={AURA.pink} /> {currentClass.startTime} – {currentClass.endTime}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color={AURA.pink} /> Room {currentClass.roomNo || "TBA"}
                        </span>
                        <span>•</span>
                        <span>Slot {currentClass.slot}</span>
                      </div>
                    </div>
                  </div>
                ) : nextClass ? (
                  /* Case 2: Next Class (Today or Tomorrow) */
                  <div style={{ 
                    padding: '20px', 
                    background: 'rgba(255, 255, 255, 0.025)', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          background: nextClassMeta?.isTomorrow ? 'rgba(191, 90, 242, 0.15)' : 'rgba(0, 229, 255, 0.15)', 
                          color: nextClassMeta?.isTomorrow ? AURA.purple : AURA.cyan, 
                          border: nextClassMeta?.isTomorrow ? '1px solid rgba(191, 90, 242, 0.3)' : '1px solid rgba(0, 229, 255, 0.3)',
                          fontSize: '11px', 
                          fontWeight: 900, 
                          padding: '4px 12px', 
                          borderRadius: '8px', 
                          letterSpacing: '0.04em', 
                          textTransform: 'uppercase' 
                        }}>
                          {nextClassMeta?.isTomorrow ? 'Tomorrow' : 'Up Next'}
                        </span>
                        <span style={{ fontSize: '12px', color: nextClassMeta?.isTomorrow ? AURA.purple : AURA.cyan, fontWeight: 800 }}>
                          {formatCountdownText(nextClassMeta?.startsInMinutes, nextClassMeta?.isTomorrow)}
                        </span>
                      </div>

                      {/* Subject Title */}
                      <div style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', color: AURA.text, fontWeight: 900, lineHeight: 1.25, textTransform: 'capitalize', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}>
                        {getSubjectName(nextClass.courseCode, nextClass.courseTitle).toLowerCase()}
                      </div>

                      {/* Time, Room & Slot Metadata Hierarchy */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'clamp(11px, 3vw, 13px)', color: AURA.subBright, fontWeight: 700, flexWrap: 'wrap', marginTop: '2px', minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} color={AURA.cyan} /> {nextClass.startTime} – {nextClass.endTime}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color={AURA.cyan} /> Room {nextClass.roomNo || "TBA"}
                        </span>
                        <span>•</span>
                        <span>Slot {nextClass.slot}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Case 3: No Class Queued */
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '15px', color: AURA.text, fontWeight: 800 }}>
                      No upcoming classes queued
                    </div>
                    <div style={{ fontSize: '12px', color: AURA.subBright, fontWeight: 600, marginTop: '4px' }}>
                      You’re all caught up for today 😌
                    </div>
                  </div>
                )}
              </div>

              {/* TODAY'S TIMETABLE SCHEDULE WIDGET ON HOME SCREEN */}
              {Array.isArray(todaySchedule) && todaySchedule.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: AURA.subBright, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Today's Schedule <span style={{ color: AURA.purple }}>({todaySchedule.length} classes)</span>
                    </div>
                    <button
                      onClick={() => router.push('/timetable' + (dayOrder ? `?day=${dayOrder}` : ''))}
                      style={{ background: 'transparent', border: 'none', color: AURA.cyan, fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      Full Grid <ChevronRight size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todaySchedule.map((cls: AnyValue, idx: number) => {
                      const isLab = (cls.slot || '').toUpperCase().startsWith('P') || (cls.slot || '').toUpperCase().startsWith('L') || (cls.courseType || '').toLowerCase().includes('lab') || (cls.courseType || '').toLowerCase().includes('practical');
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px',
                            background: isLab ? 'rgba(255, 117, 195, 0.04)' : 'rgba(255, 255, 255, 0.025)',
                            border: isLab ? '1px solid rgba(255, 117, 195, 0.15)' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                              {getSubjectName(cls.courseCode, cls.courseTitle).toLowerCase()}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span><Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />{cls.startTime} - {cls.endTime}</span>
                              <span>•</span>
                              <span>Room {cls.roomNo || 'TBA'}</span>
                            </div>
                          </div>
                          <div style={{
                            padding: '4px 10px',
                            background: isLab ? 'rgba(255, 117, 195, 0.15)' : 'rgba(0, 229, 255, 0.12)',
                            color: isLab ? '#FF75C3' : '#00E5FF',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            flexShrink: 0
                          }}>
                            Slot {cls.slot}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. REPLACED STATISTICS GRID (Intuitive & Instant Meaning) */}
              <div className="today-stats-grid">
                {/* Safe Subjects Card */}
                <div style={{ 
                  background: 'rgba(52, 199, 89, 0.08)', 
                  border: '1px solid rgba(52, 199, 89, 0.2)', 
                  borderRadius: '20px', 
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#34C759" />
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#34C759', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 950, color: '#ffffff', lineHeight: 1 }} className="tabular-nums">
                    {safeSubjectsCount} <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Subjects</span>
                  </div>
                </div>

                {/* Attendance Risk Card */}
                <div style={{ 
                  background: (riskySubjectsCount || 0) > 0 ? 'rgba(255, 45, 85, 0.08)' : 'rgba(52, 199, 89, 0.08)', 
                  border: (riskySubjectsCount || 0) > 0 ? '1px solid rgba(255, 45, 85, 0.2)' : '1px solid rgba(52, 199, 89, 0.2)', 
                  borderRadius: '20px', 
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={13} color={(riskySubjectsCount || 0) > 0 ? '#FF2D55' : '#34C759'} />
                    <span style={{ fontSize: '10px', fontWeight: 900, color: (riskySubjectsCount || 0) > 0 ? '#FF2D55' : '#34C759', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {(riskySubjectsCount || 0) > 0 ? "Risk" : "No Risk"}
                    </span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 950, color: '#ffffff', lineHeight: 1 }} className="tabular-nums">
                    {riskySubjectsCount} <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Subject{(riskySubjectsCount || 0) === 1 ? '' : 's'}</span>
                  </div>
                </div>

                {/* View Details Card */}
                <div 
                  onClick={() => router.push('/attendance')}
                  style={{ 
                    background: 'rgba(191, 90, 242, 0.08)', 
                    border: '1px solid rgba(191, 90, 242, 0.2)', 
                    borderRadius: '20px', 
                    padding: '14px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <BarChart3 size={13} color={AURA.purple} />
                    <span style={{ fontSize: '10px', fontWeight: 900, color: AURA.purple, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    View Details <ChevronRight size={13} color={AURA.purple} />
                  </div>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 2, marginTop: '2px' }}>
                <button
                  onClick={() => router.push('/timetable')}
                  style={{ 
                    flex: 1, 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    background: 'rgba(255,255,255,0.04)', 
                    color: AURA.text, 
                    borderRadius: '16px', 
                    padding: '14px 12px', 
                    fontSize: '12px', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.06em', 
                    cursor: 'pointer' 
                  }}
                >
                  Timetable
                </button>
                <button
                  onClick={() => router.push('/attendance')}
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    background: `linear-gradient(135deg, ${AURA.purple}, ${AURA.pink})`, 
                    color: '#fff', 
                    borderRadius: '16px', 
                    padding: '14px 12px', 
                    fontSize: '12px', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.06em', 
                    cursor: 'pointer', 
                    boxShadow: '0 10px 24px rgba(191,90,242,0.22)' 
                  }}
                >
                  Attendance
                </button>
              </div>

              {/* Quick Academic Tools Row (Instant Discoverability) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: AURA.sub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Quick Utilities
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                  <div 
                    onClick={() => router.push('/gpa')}
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>🧮</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: AURA.text }}>GPA Calc</div>
                  </div>
                  <div 
                    onClick={() => router.push('/notes')}
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>📝</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: AURA.text }}>Notes</div>
                  </div>
                  <div 
                    onClick={() => router.push('/exam-library')}
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>📚</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: AURA.text }}>Exam Hub</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. ANALYTICS GRID (Primary Metric: Attendance & Academic Cards) */}
            <div className="dashboard-analytics-grid">
              {/* Primary Metric: Attendance Card */}
              <div 
                onClick={() => router.push('/attendance')} 
                className="premium-card" 
                style={{ 
                  padding: 'clamp(16px, 4vw, 24px)', 
                  borderRadius: '32px', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  minWidth: 0
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    width: '42px', 
                    height: '42px', 
                    borderRadius: '16px', 
                    background: `${attStatusColor}15`, 
                    border: `1px solid ${attStatusColor}30`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Activity size={20} color={attStatusColor} />
                  </div>
                  <ChevronRight size={16} color={AURA.sub} />
                </div>

                <div>
                  <div style={{ fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: 950, color: AURA.text, lineHeight: 1 }} className="tabular-nums">
                    {avgAtt === "—" ? "0.0%" : `${avgAtt}%`}
                  </div>
                  <div style={{ fontSize: '11px', color: AURA.subBright, marginTop: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Current Attendance
                  </div>
                </div>

                {/* Modern Progress Bar with 75% Threshold Line */}
                <div style={{ width: '100%', position: 'relative', marginTop: '4px' }}>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, Math.max(0, numericAvgAtt || 0))}%`, 
                        height: '100%', 
                        background: attStatusColor,
                        borderRadius: '100px',
                        transition: 'width 0.6s ease'
                      }} 
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '9px', fontWeight: 800, color: AURA.sub }}>
                    <span style={{ color: attStatusColor }}>{numericAvgAtt !== null && numericAvgAtt >= 75 ? "Healthy" : "Risk"}</span>
                    <span>Target: 75%</span>
                  </div>
                </div>
              </div>

              {/* Academic Performance Card (Never display broken values) */}
              <div 
                onClick={() => router.push('/marks')} 
                className="premium-card" 
                style={{ 
                  padding: 'clamp(16px, 4vw, 24px)', 
                  borderRadius: '32px', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  minWidth: 0
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    width: '42px', 
                    height: '42px', 
                    borderRadius: '16px', 
                    background: 'rgba(255, 45, 85, 0.1)', 
                    border: '1px solid rgba(255, 45, 85, 0.2)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Award size={20} color={AURA.pink} />
                  </div>
                  <ChevronRight size={16} color={AURA.subBright} />
                </div>

                <div>
                  {hasValidAcademicMarks ? (
                    <div style={{ fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: 950, color: AURA.text, lineHeight: 1 }} className="tabular-nums">
                      {avgMarks}%
                    </div>
                  ) : (
                    <div style={{ fontSize: '18px', fontWeight: 800, color: AURA.subBright, lineHeight: 1.2 }}>
                      No data available
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: AURA.subBright, marginTop: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Academic Score
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700 }}>
                  {hasValidAcademicMarks ? "Internal test evaluation" : "Results pending sync"}
                </div>
              </div>
            </div>

            {/* Official Hub Integration */}
            {renderAcademicIntegrityHub && renderAcademicIntegrityHub("aura")}

          </div>

          <div className="dashboard-col-side">

            {/* 5. CAN I SKIP TOMORROW? (DECISION ENGINE CARD) */}
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
                  textAlign: 'center'
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
                    border: '1px solid rgba(255, 149, 0, 0.2)'
                  }}>
                    <LockKeyhole size={18} />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 950, color: AURA.text }}>
                    Unlock Decision Engine
                  </h4>
                  <p style={{ margin: '0 0 16px', fontSize: '11px', color: AURA.subBright, fontWeight: 700, lineHeight: 1.45, maxWidth: '280px' }}>
                    Analyzes tomorrow's schedule and calculates if you can miss classes safely without dropping below 75%.
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
                    <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: AURA.subBright }}>🎉 Tomorrow is a holiday / weekend. No classes scheduled!</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Overall Day Decision Banner */}
                      <div style={{ 
                        padding: '12px 16px', 
                        borderRadius: '16px', 
                        background: tomorrowSkipStats?.isWholeDaySafe ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 45, 85, 0.1)', 
                        border: tomorrowSkipStats?.isWholeDaySafe ? '1px solid rgba(52, 199, 89, 0.25)' : '1px solid rgba(255, 45, 85, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tomorrowSkipStats?.isWholeDaySafe ? '#34C759' : '#FF2D55' }} />
                          <span style={{ fontSize: '11px', fontWeight: 900, color: tomorrowSkipStats?.isWholeDaySafe ? '#34C759' : '#FF2D55', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {tomorrowSkipStats?.isWholeDaySafe ? `Day ${tomorrowSkipStats?.dayOrder} · Safe Whole Day` : `Day ${tomorrowSkipStats?.dayOrder} · Has Attendance Risks`}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: AURA.subBright }}>
                          {tomorrowSkipStats?.isWholeDaySafe ? "Can skip all" : "Partial skip only"}
                        </span>
                      </div>

                      {/* Upcoming Holiday Smart Alert (e.g. Pongal / Festival break awareness) */}
                      {tomorrowSkipStats?.upcomingHoliday && (
                        <div style={{ 
                          padding: '12px 14px', 
                          borderRadius: '16px', 
                          background: 'rgba(255, 149, 0, 0.1)', 
                          border: '1px solid rgba(255, 149, 0, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '16px', flexShrink: 0 }}>🌴</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#FF9500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {tomorrowSkipStats.upcomingHoliday.event} (in {tomorrowSkipStats.upcomingHoliday.daysAway} day{tomorrowSkipStats.upcomingHoliday.daysAway === 1 ? '' : 's'})
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: AURA.subBright }}>
                              {tomorrowSkipStats.risky > 0 
                                ? "Must attend tomorrow before holiday starts — no classes run during break to recover %!"
                                : "Skipping tomorrow gives you an extended long vacation combined with the holiday!"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 2-Column Summary Grid */}
                      <div className="skip-stats-grid">
                        <div style={{ background: 'rgba(52, 199, 89, 0.08)', padding: '14px 12px', borderRadius: '18px', border: '1px solid rgba(52, 199, 89, 0.2)', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', fontWeight: 900, color: '#34C759', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safe to Skip</div>
                          <div style={{ fontSize: '20px', fontWeight: 950, color: '#34C759', marginTop: '4px' }}>{tomorrowSkipStats?.safe} <span style={{ fontSize: '11px', fontWeight: 700 }}>class{(tomorrowSkipStats?.safe || 0) === 1 ? '' : 'es'}</span></div>
                        </div>
                        <div style={{ background: (tomorrowSkipStats?.risky || 0) > 0 ? 'rgba(255, 45, 85, 0.08)' : 'rgba(255,255,255,0.03)', padding: '14px 12px', borderRadius: '18px', border: (tomorrowSkipStats?.risky || 0) > 0 ? '1px solid rgba(255, 45, 85, 0.2)' : '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', fontWeight: 900, color: (tomorrowSkipStats?.risky || 0) > 0 ? '#FF2D55' : AURA.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Must Attend</div>
                          <div style={{ fontSize: '20px', fontWeight: 950, color: (tomorrowSkipStats?.risky || 0) > 0 ? '#FF2D55' : AURA.subBright, marginTop: '4px' }}>{tomorrowSkipStats?.risky} <span style={{ fontSize: '11px', fontWeight: 700 }}>class{(tomorrowSkipStats?.risky || 0) === 1 ? '' : 'es'}</span></div>
                        </div>
                      </div>

                      {/* Class Analysis Breakdown Toggle */}
                      {tomorrowSkipStats?.classes && tomorrowSkipStats.classes.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2px' }}>
                          <button 
                            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                            style={{ 
                              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: '14px',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                              width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none'
                            }}
                          >
                            <span style={{ fontSize: '11px', fontWeight: 900, color: AURA.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Subject Breakdown</span>
                            <span style={{ fontSize: '11px', color: AURA.cyan, fontWeight: 900 }}>
                              {isAnalysisExpanded ? "Hide ↑" : `View classes (${tomorrowSkipStats.classes.length}) ↓`}
                            </span>
                          </button>

                          {isAnalysisExpanded && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {tomorrowSkipStats.classes.map((cls: AnyValue, idx: number) => {
                                const durationLabel = cls.durationHours > 1 ? `${cls.durationHours}-Hour Session` : "1 Hour";
                                return (
                                  <div key={idx} style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '8px', 
                                    background: 'rgba(0,0,0,0.22)', 
                                    padding: '14px 16px', 
                                    borderRadius: '18px', 
                                    border: '1px solid rgba(255,255,255,0.06)' 
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        <span style={{ color: AURA.text, fontSize: '14px', fontWeight: 800, textTransform: 'capitalize' }}>
                                          {getSubjectName(cls.courseCode, cls.courseTitle).toLowerCase()}
                                        </span>
                                        <span style={{ color: AURA.subBright, fontSize: '11px', fontWeight: 700 }}>
                                          Slot {cls.slot} • {durationLabel}
                                        </span>
                                      </div>
                                      <span style={{ 
                                        background: cls.isRisky ? 'rgba(255, 45, 85, 0.15)' : 'rgba(52, 199, 89, 0.15)', 
                                        color: cls.isRisky ? '#FF2D55' : '#34C759', 
                                        border: cls.isRisky ? '1px solid rgba(255, 45, 85, 0.3)' : '1px solid rgba(52, 199, 89, 0.3)',
                                        fontSize: '9.5px', 
                                        fontWeight: 900, 
                                        padding: '4px 10px', 
                                        borderRadius: '8px', 
                                        letterSpacing: '0.04em', 
                                        textTransform: 'uppercase',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {cls.isRisky ? 'MUST ATTEND' : 'SAFE TO MISS'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: AURA.subBright, fontWeight: 700, borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '2px' }}>
                                      <div>Current: <span style={{ color: AURA.text, fontWeight: 800 }}>{cls.currentAttendance}%</span></div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>After skip:</span>
                                        <span style={{ color: cls.isRisky ? '#FF2D55' : '#34C759', fontWeight: 900 }}>{cls.afterSkipAttendance}%</span>
                                      </div>
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

                  <div style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, marginTop: '2px' }}>
                    * Projections factor multi-hour lab sessions and 75% target threshold.
                  </div>
                </>
              )}
            </div>

            {/* 6. HOLOGRAPHIC IDENTITY PASSPORT (Student ID Card) */}
            <button 
              onClick={onShowStudentInfo} 
              className="premium-card"
              style={{ 
                width: '100%', padding: '24px', borderRadius: '32px', 
                display: 'flex', flexDirection: 'column', gap: '18px', 
                textAlign: 'left', position: 'relative', overflow: 'hidden',
                cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', zIndex: 2, justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Fingerprint size={22} color={AURA.text} />
                    </div>
                    <div>
                       <div style={{ fontSize: '15px', fontWeight: 900, color: AURA.text }}>Student ID</div>
                       <div style={{ fontSize: '10px', color: AURA.pink, fontWeight: 900, letterSpacing: '0.08em' }}>Identity Passport</div>
                    </div>
                 </div>
                 <Compass size={18} color={AURA.sub} />
              </div>

              <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
                 <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '16px', flex: 1 }}>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: AURA.sub, marginBottom: '4px', letterSpacing: '0.05em' }}>REGISTRATION_NUMBER</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: AURA.text }} className="tabular-nums">{data?.profile?.["Registration Number"] || "LOCKED"}</div>
                 </div>
              </div>
            </button>

            {/* 7. UPCOMING TIMELINE SECTION */}
            <section style={{ marginTop: '8px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingLeft: '4px' }}>
                  <Zap size={16} color={AURA.amber} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                     <h3 style={{ fontSize: '13px', fontWeight: 900, color: AURA.text, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Upcoming Timeline</h3>
                     <span style={{ fontSize: '9px', color: AURA.sub, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Academic Milestones</span>
                  </div>
               </div>
               
               <div style={{ position: 'relative', paddingLeft: upcomingEvents?.length > 0 ? '28px' : '0' }}>
                  {upcomingEvents?.length > 0 && (
                     <div style={{ 
                        position: 'absolute', left: '13px', top: '20px', bottom: '20px', width: '2px', 
                        background: `linear-gradient(to bottom, ${AURA.purple}, transparent)`, 
                        opacity: 0.5, borderRadius: '2px' 
                     }} />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                     {upcomingEvents?.length > 0 ? (
                        upcomingEvents.map((event: AnyValue, idx: number) => (
                           <div key={idx} className="premium-card" style={{ 
                              display: 'flex', alignItems: 'center', gap: '14px', 
                              padding: '16px', borderRadius: '24px', position: 'relative'
                           }}>
                              <div style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', background: AURA.purple, boxShadow: `0 0 10px ${AURA.purple}` }} />
                              
                              <div style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                 <span style={{ fontSize: '14px', fontWeight: 900, color: AURA.text }} className="tabular-nums">{event.dateNum}</span>
                                 <span style={{ fontSize: '8px', fontWeight: 900, color: AURA.sub }}>{event.monthLabel.split(' ')[0].toUpperCase()}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                 <div style={{ fontSize: '13px', fontWeight: 800, color: AURA.text }}>{event.event}</div>
                                 <div style={{ fontSize: '11px', fontWeight: 700, color: AURA.sub, marginTop: '2px' }}>{event.weekdayLabel}</div>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="premium-card" style={{ padding: '28px 20px', borderRadius: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                           <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: AURA.cyan }} />
                           </div>
                           <div>
                              <div style={{ fontSize: '12px', fontWeight: 900, color: AURA.text, letterSpacing: '0.12em', textTransform: 'uppercase' }}>All Systems Clear</div>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: AURA.sub, marginTop: '4px' }}>No immediate academic events scheduled.</div>
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
