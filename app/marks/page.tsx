"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Home, Award, MoreHorizontal, Terminal, User, 
  Cpu, RefreshCcw, Activity, Binary, BarChart3
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { dataAPI } from "@/lib/api";
import MatrixMarks from "@/components/MatrixMarks";
import AuraMarks from "@/components/aura-theme/AuraMarks";
import CosmosMarks from "@/components/CosmosMarks";
import Sidebar from "@/components/Sidebar";

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
  // Enforce granular Zustand selectors to eliminate main-thread render lags
  const academicData = useAuthStore((state) => state.academicData);
  const setAcademicData = useAuthStore((state) => state.setAcademicData);
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
         setAcademicData({ ...(academicData || {}), marks: res.data });
      } else if (Array.isArray(res)) {
         setAcademicData({ ...(academicData || {}), marks: res });
      }
    } catch (e) { console.error(e); } finally { setTimeout(() => setIsSyncing(false), 800); }
  };

  const { marks, totalScored, totalMax, avgPct } = useMemo(() => {
    // Logic inside here is safe because it's always called
    const rawMarks = Array.isArray(academicData?.marks) ? academicData.marks : [];
    const attendance = Array.isArray(academicData?.attendance) ? academicData.attendance : [];

    const processedMarks = rawMarks.map((m: any) => {
      if (!m) return null;
      const attnMatch = attendance.find((a: any) => a && (a['Course Code'] === m.courseCode || a['Course Code'] === m.code));
      return {
        ...m,
        title: m.courseTitle || m.description || attnMatch?.['Course Title'] || attnMatch?.['title'] || "Unknown Module"
      };
    }).filter(Boolean);

    // Merge subjects from attendance that are missing in marks as placeholders
    const marksCodes = new Set(processedMarks.map((m: any) => m.courseCode || m.code));
    attendance.forEach((a: any) => {
      if (a && a['Course Code'] && !marksCodes.has(a['Course Code'])) {
        processedMarks.push({
          courseCode: a['Course Code'],
          code: a['Course Code'],
          courseTitle: a['Course Title'] || a['title'] || 'Unknown Module',
          title: a['Course Title'] || a['title'] || 'Unknown Module',
          tests: []
        });
      }
    });

    const scored = processedMarks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
    const max = processedMarks.reduce((s:number, m:any) => s + (m.tests?.reduce((a:number, t:any) => a + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0), 0);
    const pct = max > 0 ? (scored / max) * 100 : 0;

    return { marks: processedMarks, totalScored: scored, totalMax: max, avgPct: pct };
  }, [academicData]);

  const activeMarks = useMemo(() => {
    if (!mounted) return null;
    switch (theme) {
      case "aura": return <AuraMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />;
      case "matrix": return <MatrixMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} router={router} />;
      case "cosmos": return <CosmosMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />;
      default: return null;
    }
  }, [mounted, theme, marks, isSyncing, router]);

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: THEME.bg, color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${THEME.bg}; }
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
      <Sidebar />
      <main style={{ flex: 1, paddingBottom: "140px" }}>
        {theme === "matrix" ? (
          <MatrixMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} router={router} />
        ) : theme === "aura" ? (
          <AuraMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />
        ) : theme === "cosmos" ? (
          <CosmosMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />
        ) : (
          <div style={{ padding: "0 20px", paddingBottom: "140px" }}>
             <header style={{ padding: "60px 24px 20px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
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

              <div style={{ padding: "0 20px" }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {marks.length > 0 ? marks.map((m: any, i: number) => {
                      const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
                      const max = m.tests?.reduce((s: number, t: any) => s + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0;
                      
                      return (
                        <div key={i} style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '32px', padding: '30px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '200px' }}>
                                 <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '999px', display: 'inline-block', marginBottom: '10px' }}>{m.courseCode || m.code}</div>
                                 <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2, textTransform: 'uppercase' }}>{m.title}</h3>
                              </div>
                              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                 <div style={{ fontSize: '34px', fontWeight: 900, color: THEME.accentCyan, lineHeight: 1 }}>{scored.toFixed(1)}</div>
                                 <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>/{max}</div>
                              </div>
                           </div>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
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
              </div>
          </div>
        )}
      </main>
    </div>
  );
}
