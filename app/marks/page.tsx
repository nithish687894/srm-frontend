"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Home, Award, MoreHorizontal, Terminal, User, 
  Cpu, RefreshCcw, Activity, Binary
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { dataAPI } from "@/lib/api";

const MATRIX = {
  bg: "#050705",
  surface: "rgba(0, 59, 0, 0.05)",
  border: "rgba(0, 255, 65, 0.1)",
  glow: "#00ff41",
  darkGlow: "#003b00",
  text: "#00ff41",
};

const MatrixCard = ({ children, style = {} }: any) => (
  <div style={{ 
    background: MATRIX.surface, 
    border: `1px solid ${MATRIX.border}`,
    borderRadius: '24px', 
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    ...style
  }}>
    <div style={{ 
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: `linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
      pointerEvents: 'none'
    }} />
    {children}
  </div>
);

const TestBadge = ({ test, score }: any) => {
  const parts = (test || "T/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  const sc = score === "Abs" ? 0 : parseFloat(score) || 0;
  
  return (
    <div style={{ 
      background: "rgba(0,255,65,0.03)", 
      border: `1px solid rgba(0,255,65,0.08)`,
      borderRadius: '12px', padding: '10px', minWidth: '80px', flex: 1
    }}>
      <p style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(0,255,65,0.4)', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '16px', fontWeight: 900, color: MATRIX.glow, fontFamily: 'monospace' }}>{score === "Abs" ? "ABS" : sc}</span>
        <span style={{ fontSize: '9px', color: 'rgba(0,255,65,0.2)', fontWeight: 800 }}>/{max}</span>
      </div>
    </div>
  );
};

export default function MarksPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { academicData, setAcademicData } = useAuthStore();
  
  useEffect(() => {
    setMounted(true);
    if (!academicData?.marks) handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await dataAPI.getMarks();
      if (res && res.data) {
         setAcademicData({ ...academicData, marks: res.data });
      } else if (Array.isArray(res)) {
         setAcademicData({ ...academicData, marks: res });
      }
    } catch (e) { console.error(e); } finally { setTimeout(() => setIsSyncing(false), 800); }
  };

  if (!mounted) return <div style={{ background: '#050705', height: '100vh' }} />;

  const rawMarks = Array.isArray(academicData?.marks) ? academicData.marks : [];
  const attendance = Array.isArray(academicData?.attendance) ? academicData.attendance : [];

  // Merge titles from attendance
  const marks = rawMarks.map((m: any) => {
    const attnMatch = attendance.find((a: any) => a['Course Code'] === m.courseCode || a['Course Code'] === m.code);
    return {
      ...m,
      title: m.courseTitle || m.description || attnMatch?.['Course Title'] || attnMatch?.['title'] || "Unknown Module"
    };
  });

  const totalScored = marks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0), 0);
  const avgPct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: MATRIX.bg, color: MATRIX.text, display: "flex", flexDirection: "column", paddingBottom: "140px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${MATRIX.bg}; }
        .matrix-scanline {
          position: absolute; top: 0; left: 0; width: 100%; height: 2px;
          background: rgba(0, 255, 65, 0.2); animation: scan 3s linear infinite;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
        }
        @keyframes scan { from { top: 0%; } to { top: 100%; } }
        .animate-pulse-green { animation: pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse-green { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,7,5,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, borderBottom: `1px solid ${MATRIX.border}` }}>
        <button onClick={() => router.back()} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,255,65,0.05)", border: `1px solid ${MATRIX.border}`, color: MATRIX.glow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Terminal size={14} className="animate-pulse-green" />
            <span style={{ fontSize: "10px", fontWeight: 900, color: MATRIX.glow, textTransform: "uppercase", letterSpacing: "0.4em", fontFamily: 'monospace' }}>MATRIX RECORDS</span>
          </div>
          <span style={{ fontSize: "9px", fontWeight: 800, color: "rgba(0,255,65,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", display: 'block', marginTop: '4px' }}>ACCESS: GRANTED</span>
        </div>
        <button onClick={handleSync} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,255,65,0.05)", border: `1px solid ${MATRIX.border}`, color: MATRIX.glow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px", flex: 1 }}>
        <MatrixCard style={{ textAlign: 'center', marginBottom: '32px', border: `1px solid rgba(0,255,65,0.3)` }}>
           <div className="matrix-scanline" />
           <p style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(0,255,65,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px', fontFamily: 'monospace' }}>SYSTEM INTEGRITY</p>
           <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '64px', fontWeight: 900, color: MATRIX.glow, margin: 0, textShadow: '0 0 20px rgba(0,255,65,0.5)', fontFamily: 'monospace' }}>{totalScored.toFixed(1)}</h1>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(0,255,65,0.1)', fontFamily: 'monospace' }}>/{totalMax.toFixed(0)}</span>
           </div>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,255,65,0.05)', padding: '6px 16px', borderRadius: '12px', marginTop: '20px', border: `1px solid ${MATRIX.border}` }}>
              <Activity size={14} color={MATRIX.glow} />
              <span style={{ fontSize: '10px', fontWeight: 900, color: MATRIX.glow, fontFamily: 'monospace' }}>{avgPct.toFixed(1)}% OVERRIDE</span>
           </div>
        </MatrixCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {marks.length > 0 ? marks.map((m: any, i: number) => {
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              
              return (
                <MatrixCard key={i}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', fontWeight: 900, color: MATRIX.glow, background: 'rgba(0,255,65,0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px', fontFamily: 'monospace' }}>{m.courseCode || m.code}</div>
                         <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3, textTransform: 'uppercase' }}>{m.title}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '24px', fontWeight: 900, color: MATRIX.glow, lineHeight: 1, fontFamily: 'monospace' }}>{scored.toFixed(1)}</div>
                         <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(0,255,65,0.2)', marginTop: '4px', fontFamily: 'monospace' }}>/{max}</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {m.tests?.map((t: any, j: number) => (
                        <TestBadge key={j} test={t.test} score={t.score} />
                      ))}
                   </div>
                </MatrixCard>
              );
           }) : (
             <div style={{ textAlign: 'center', padding: '60px', opacity: 0.2 }}>
                <Binary size={48} style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'monospace' }}>WAITING FOR SYSTEM RESPONSE...</p>
             </div>
           )}
        </div>
      </main>

      <nav style={{ position: "fixed", bottom: "0", left: "0", right: "0", height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", background: "rgba(5,7,5,0.98)", backdropFilter: "blur(24px)", borderTop: `1px solid ${MATRIX.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 1000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: 'rgba(0,255,65,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'monospace' }}>Nexus</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: MATRIX.glow, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Award size={22} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'monospace' }}>Marks</span>
        </button>
        <button onClick={() => router.push('/portal/student-dashboard')} style={{ background: "none", border: "none", color: 'rgba(0,255,65,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <User size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'monospace' }}>Records</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: 'rgba(0,255,65,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'monospace' }}>More</span>
        </button>
      </nav>
    </div>
  );
}
