"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Home, Award, MoreHorizontal, Terminal, User, 
  Cpu, RefreshCcw, Activity, Binary, BarChart3
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { dataAPI } from "@/lib/api";
import HackerMarks from "@/components/hacker-os/HackerMarks";
import AuraMarks from "@/components/aura-theme/AuraMarks";

const THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPurple: "#bf00ff",
  accentCyan: "#00d4ff",
  accentGreen: "#00ff88",
  accentRed: "#ff3b3b",
};

const TestBadge = ({ test, score }: any) => {
  const parts = (test || "Test/100").split('/');
  const label = parts[0];
  const max = parseFloat(parts[1]) || 100;
  const sc = score === "Abs" ? 0 : parseFloat(score) || 0;
  const pct = (sc / max) * 100;
  const isCritical = pct < 50;

  return (
    <div style={{ 
      background: isCritical ? "rgba(255,59,59,0.05)" : "rgba(255,255,255,0.03)", 
      border: `1px solid ${isCritical ? "rgba(255,59,59,0.1)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: '16px', padding: '12px', minWidth: '85px', flex: 1
    }}>
      <p style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color: score === "Abs" ? THEME.accentRed : '#fff' }}>{score === "Abs" ? "ABS" : sc}</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>/{max}</span>
      </div>
    </div>
  );
};

export default function MarksPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { academicData, setAcademicData } = useAuthStore();
  const { theme } = useThemeStore();
  
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

  if (!mounted) return <div style={{ background: '#050505', height: '100vh' }} />;

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

  // Hacker OS Theme
  if (theme === "hacker") return (
    <HackerMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />
  );

  if (theme === "aura") return (
    <AuraMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />
  );

  // Matrix Theme (Direct Render for now)
  if (theme === "matrix") return (
    <MatrixMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} router={router} />
  );

  // Default: EduVerse Theme
  const totalScored = marks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0), 0);
  const avgPct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: "#fff", display: "flex", flexDirection: "column", paddingBottom: "140px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${THEME.bg}; }
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />

      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: THEME.accentPurple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: THEME.accentPurple }} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: THEME.accentPurple, textTransform: "uppercase", letterSpacing: "0.4em" }}>ACADEMIC OS</span>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: THEME.accentPurple }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", display: 'block', marginTop: '2px' }}>INTERNAL RECORDS</span>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "0 20px", flex: 1 }}>
        <div style={{ 
          background: 'linear-gradient(145deg, rgba(191,0,255,0.05), rgba(0,212,255,0.05))',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', padding: '32px 24px',
          textAlign: 'center', marginBottom: '32px', position: 'relative', overflow: 'hidden'
        }}>
           <p style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>AGGREGATED SCORE</p>
           <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '64px', fontWeight: 900, color: '#fff', margin: 0 }}>{totalScored.toFixed(1)}</h1>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.1)' }}>/{totalMax.toFixed(0)}</span>
           </div>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 16px', borderRadius: '12px', marginTop: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <BarChart3 size={14} color={THEME.accentCyan} />
              <span style={{ fontSize: '11px', fontWeight: 800, color: THEME.accentCyan }}>{avgPct.toFixed(1)}% SUCCESS</span>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {marks.length > 0 ? marks.map((m: any, i: number) => {
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
              
              return (
                <div key={i} style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '28px', padding: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                         <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>{m.courseCode || m.code}</div>
                         <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3, textTransform: 'uppercase' }}>{m.title}</h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '28px', fontWeight: 900, color: THEME.accentCyan, lineHeight: 1 }}>{scored.toFixed(1)}</div>
                         <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>/{max}</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {m.tests?.map((t: any, j: number) => (
                        <TestBadge key={j} test={t.test} score={t.score} />
                      ))}
                   </div>
                </div>
              );
           }) : (
             <div style={{ textAlign: 'center', padding: '60px', opacity: 0.2 }}>
                <BarChart3 size={48} style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: '12px', fontWeight: 800 }}>No internal records found.</p>
             </div>
           )}
        </div>
      </main>

      <nav style={{ position: "fixed", bottom: "0", left: "0", right: "0", height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", background: "rgba(10,10,12,0.98)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 1000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Nexus</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: THEME.accentCyan, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Award size={22} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Marks</span>
        </button>
        <button onClick={() => router.push('/portal/student-dashboard')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <User size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Records</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>
    </div>
  );
}

function MatrixMarks({ marks, handleSync, isSyncing, router }: any) {
  const MATRIX = {
    bg: "#050705",
    surface: "rgba(0, 59, 0, 0.05)",
    border: "rgba(0, 255, 65, 0.1)",
    glow: "#00ff41",
    darkGlow: "#003b00",
    text: "#00ff41",
  };

  const totalScored = marks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0), 0);
  const avgPct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: MATRIX.bg, color: MATRIX.text, display: "flex", flexDirection: "column", paddingBottom: "140px" }}>
      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,7,5,0.9)', backdropFilter: 'blur(20px)', zIndex: 100, borderBottom: `1px solid ${MATRIX.border}` }}>
        <button onClick={() => router.back()} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,255,65,0.05)", border: `1px solid ${MATRIX.border}`, color: MATRIX.glow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Terminal size={14} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: MATRIX.glow, textTransform: "uppercase", letterSpacing: "0.4em", fontFamily: 'monospace' }}>MATRIX RECORDS</span>
          </div>
          <span style={{ fontSize: "9px", fontWeight: 800, color: "rgba(0,255,65,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", display: 'block', marginTop: '4px' }}>ACCESS: GRANTED</span>
        </div>
        <button onClick={handleSync} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,255,65,0.05)", border: `1px solid ${MATRIX.border}`, color: MATRIX.glow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "24px 20px", flex: 1 }}>
         <div style={{ background: MATRIX.surface, border: `1px solid ${MATRIX.border}`, borderRadius: '24px', padding: '32px', textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
           <p style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(0,255,65,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '12px', fontFamily: 'monospace' }}>SYSTEM INTEGRITY</p>
           <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '64px', fontWeight: 900, color: MATRIX.glow, margin: 0, textShadow: '0 0 20px rgba(0,255,65,0.5)', fontFamily: 'monospace' }}>{totalScored.toFixed(1)}</h1>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(0,255,65,0.1)', fontFamily: 'monospace' }}>/{totalMax.toFixed(0)}</span>
           </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           {marks.map((m: any, i: number) => (
             <div key={i} style={{ background: MATRIX.surface, border: `1px solid ${MATRIX.border}`, borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: MATRIX.glow, background: 'rgba(0,255,65,0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>{m.courseCode || m.code}</div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase' }}>{m.title}</h3>
                   </div>
                   <div style={{ fontSize: '24px', fontWeight: 900, color: MATRIX.glow }}>{(m.tests?.reduce((s:number, t:any)=>s+(parseFloat(t.score)||0), 0)).toFixed(1)}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                   {m.tests?.map((t: any, j: number) => (
                     <div key={j} style={{ background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.08)', borderRadius: '8px', padding: '8px', minWidth: '60px' }}>
                        <div style={{ fontSize: '8px', color: 'rgba(0,255,65,0.4)', textTransform: 'uppercase' }}>{t.test.split('/')[0]}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: MATRIX.glow }}>{t.score}</div>
                     </div>
                   ))}
                </div>
             </div>
           ))}
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
      </nav>
    </div>
  );
}
