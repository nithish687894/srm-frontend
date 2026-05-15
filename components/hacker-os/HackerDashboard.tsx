"use client";
import { motion } from "framer-motion";
import { 
  Terminal, Shield, Cpu, Activity, Zap, 
  Target, Binary, RefreshCcw, User, MessageSquare, Home, Award, MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";

const HACKER_COLORS = {
  bg: "#050705",
  accent: "#00ff41",
  dim: "rgba(0, 255, 65, 0.1)",
  text: "#00ff41",
  sub: "rgba(0, 255, 65, 0.4)",
  border: "rgba(0, 255, 65, 0.2)",
};

export default function HackerDashboard({ 
  data, riskCount, avgAtt, avgMarks, totalCourses, 
  targetClasses, nextClass, firstName, dayOrder, 
  isHoliday, dayOffset, setDayOffset, onShowStudentInfo,
  broadcast, setIsSyncModalOpen, renderAcademicIntegrityHub
}: any) {
  const router = useRouter();

  return (
    <div style={{ background: HACKER_COLORS.bg, minHeight: "100vh", color: HACKER_COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
        .scan-line {
          position: fixed; top: 0; left: 0; width: 100%; height: 2px;
          background: rgba(0, 255, 65, 0.05); animation: scan 4s linear infinite;
          z-index: 9999; pointer-events: none;
        }
        @keyframes scan { from { top: 0%; } to { top: 100%; } }
        .glitch-text:hover { animation: glitch 0.3s linear infinite; }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
      `}} />
      <div className="scan-line" />

      <main style={{ padding: "60px 20px 120px" }}>
        {/* Header Section */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: "10px", color: HACKER_COLORS.sub, letterSpacing: "0.4em", marginBottom: "8px" }}>[SYSTEM_ACCESS]: GRANTED</div>
              <h1 className="glitch-text" style={{ fontSize: "32px", fontWeight: 900, margin: 0, textShadow: `0 0 10px ${HACKER_COLORS.accent}` }}>
                {firstName?.toUpperCase() || "ADMIN"}
              </h1>
              <div style={{ fontSize: "11px", marginTop: "8px", color: HACKER_COLORS.sub }}>
                REGISTRY: {data?.profile?.["Registration Number"] || "UNKNOWN"}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onShowStudentInfo} style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(0,255,65,0.05)", border: `1px solid ${HACKER_COLORS.border}`, color: HACKER_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} />
              </button>
              <button onClick={() => setIsSyncModalOpen(true)} style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(0,255,65,0.05)", border: `1px solid ${HACKER_COLORS.border}`, color: HACKER_COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Status Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          <div onClick={() => router.push('/attendance')} style={{ background: "rgba(0,255,65,0.03)", border: `1px solid ${HACKER_COLORS.border}`, borderRadius: '20px', padding: '20px', cursor: 'pointer' }}>
             <div style={{ fontSize: '10px', color: HACKER_COLORS.sub, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={12} /> STABILITY
             </div>
             <div style={{ fontSize: '24px', fontWeight: 900 }}>{avgAtt}%</div>
          </div>
          <div onClick={() => router.push('/marks')} style={{ background: "rgba(0,255,65,0.03)", border: `1px solid ${HACKER_COLORS.border}`, borderRadius: '20px', padding: '20px', cursor: 'pointer' }}>
             <div style={{ fontSize: '10px', color: HACKER_COLORS.sub, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Binary size={12} /> EFFICIENCY
             </div>
             <div style={{ fontSize: '24px', fontWeight: 900 }}>{avgMarks}%</div>
          </div>
        </div>

        {/* Target Interceptor (Next Class) */}
        {nextClass ? (
          <div style={{ marginBottom: '40px', background: 'rgba(0,255,65,0.05)', border: `1px solid ${HACKER_COLORS.border}`, borderRadius: '24px', padding: '24px', position: 'relative' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: HACKER_COLORS.accent, letterSpacing: '0.2em' }}>NEXT_TARGET_INTERCEPTED</div>
                <Target size={18} className="animate-pulse" color={HACKER_COLORS.accent} />
             </div>
             <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px', color: '#fff', textTransform: 'uppercase' }}>{nextClass.courseTitle}</h2>
             <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: HACKER_COLORS.sub }}>
                <span>LOC: {nextClass.roomNo || "TBA"}</span>
                <span>ID: {nextClass.courseCode}</span>
             </div>
             <div style={{ marginTop: '20px', borderTop: `1px solid ${HACKER_COLORS.border}`, paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 900 }}>WINDOW: {nextClass.startTime} - {nextClass.endTime}</div>
                <Zap size={14} color={HACKER_COLORS.accent} />
             </div>
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(0,255,65,0.02)', borderRadius: '24px', border: `1px dashed ${HACKER_COLORS.border}`, marginBottom: '40px' }}>
             <Terminal size={32} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
             <div style={{ fontSize: '12px', color: HACKER_COLORS.sub }}>NO ACTIVE TARGETS DETECTED</div>
          </div>
        )}

        {/* Official Hub Integration */}
        {renderAcademicIntegrityHub(true)}

        {/* Broadcast / System Comms */}
        {broadcast?.active && (
          <div style={{ marginTop: '32px', background: 'rgba(0,255,65,0.08)', border: `1px solid ${HACKER_COLORS.accent}`, borderRadius: '20px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
             <MessageSquare size={20} color={HACKER_COLORS.accent} />
             <div>
                <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Incoming_Signal</div>
                <div style={{ fontSize: '13px', lineHeight: 1.4 }}>{broadcast.message}</div>
             </div>
          </div>
        )}

        {/* Cyber Bottom Nav */}
        <nav style={{ position: "fixed", bottom: "0", left: "0", right: "0", height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", background: "rgba(5,7,5,0.95)", backdropFilter: "blur(24px)", borderTop: `1px solid ${HACKER_COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 1000 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: HACKER_COLORS.accent, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Home size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Nexus</span>
          </button>
          <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: HACKER_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Award size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Marks</span>
          </button>
          <button onClick={() => router.push('/attendance')} style={{ background: "none", border: "none", color: HACKER_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Activity size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Attnd</span>
          </button>
          <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: HACKER_COLORS.sub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <MoreHorizontal size={22} />
            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>More</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
