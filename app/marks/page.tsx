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

const TestBadge = ({ test, score }: AnyValue) => {
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
      if (Array.isArray(res?.data) && res.data.length > 0) {
         setAcademicData({ ...(academicData || {}), marks: res.data });
      } else if (Array.isArray(res) && res.length > 0) {
         setAcademicData({ ...(academicData || {}), marks: res });
      }
    } catch (e) {
      console.error("Marks sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const { marks, totalScored, totalMax, avgPct } = useMemo(() => {
    const rawMarks = Array.isArray(academicData?.marks) ? academicData.marks : [];
    const attendance = Array.isArray(academicData?.attendance) ? academicData.attendance : [];

    const processedMarks = rawMarks.map((m: AnyValue) => {
      if (!m) return null;
      const attnMatch = attendance.find((a: AnyValue) => a && (a['Course Code'] === m.courseCode || a['Course Code'] === m.code));
      return {
        ...m,
        title: m.courseTitle || m.description || attnMatch?.['Course Title'] || attnMatch?.['title'] || "Unknown Module"
      };
    }).filter(Boolean);

    // Merge subjects from attendance that are missing in marks as placeholders
    const marksCodes = new Set(processedMarks.map((m: AnyValue) => m.courseCode || m.code));
    attendance.forEach((a: AnyValue) => {
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

    const scored = processedMarks.reduce((s:number, m:AnyValue) => s + (m.tests?.reduce((a:number, t:AnyValue) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
    const max = processedMarks.reduce((s:number, m:AnyValue) => s + (m.tests?.reduce((a:number, t:AnyValue) => a + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0), 0);
    const pct = max > 0 ? (scored / max) * 100 : 0;

    return { marks: processedMarks, totalScored: scored, totalMax: max, avgPct: pct };
  }, [academicData]);


  return (
    <div style={{ minHeight: "100dvh", width: "100%", background: "var(--app-bg)", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${THEME.bg}; }
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
      <main style={{ flex: 1, paddingBottom: "140px", paddingTop: "100px" }} className="max-w-4xl mx-auto px-4 w-full">
        <AuraMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />
      </main>
    </div>
  );
}
