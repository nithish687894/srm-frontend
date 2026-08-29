"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

export default function MarksPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  // Enforce granular Zustand selectors to eliminate main-thread render lags
  const academicData = useAuthStore((state) => state.academicData);
  const setAcademicData = useAuthStore((state) => state.setAcademicData);
  const { theme } = useThemeStore();
  
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

  useEffect(() => {
    setMounted(true);
    if (!academicData?.marks) handleSync();
  }, []);

  const { marks } = useMemo(() => {
    const rawMarks = Array.isArray(academicData?.marks) ? academicData.marks : [];
    const attendance = Array.isArray(academicData?.attendance) ? academicData.attendance : [];

    // Filter out monthly breakdown rows (e.g. JUL-2026) from attendance first
    const MONTH_REGEX = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-\s_]?\d{2,4}$/i;
    const currentAttendance = attendance.filter((a: AnyValue) => {
      if (!a || typeof a !== "object") return false;
      const code = String(a["Course Code"] || a.courseCode || a.code || "").trim();
      const title = String(a["Course Title"] || a.courseTitle || a.title || "").trim();
      return !MONTH_REGEX.test(code) && !MONTH_REGEX.test(title) && !code.toLowerCase().includes("total");
    });

    const currentCourseCodes = new Set(
      currentAttendance
        .map((a: AnyValue) => String(a?.courseCode || a?.['Course Code'] || a?.code || '').trim().toUpperCase())
        .filter(Boolean)
    );

    // If current semester courses exist in attendance, strictly filter marks to only current registered courses
    let filteredMarks = rawMarks;
    if (currentCourseCodes.size > 0) {
      filteredMarks = rawMarks.filter((m: AnyValue) => {
        const code = String(m?.courseCode || m?.code || '').trim().toUpperCase();
        return currentCourseCodes.has(code);
      });
    }

    const processedMarks = filteredMarks.map((m: AnyValue) => {
      if (!m) return null;
      const code = String(m.courseCode || m.code || '').trim().toUpperCase();
      const attnMatch = currentAttendance.find((a: AnyValue) => {
        const aCode = String(a?.courseCode || a?.['Course Code'] || a?.code || '').trim().toUpperCase();
        return aCode === code;
      });
      return {
        ...m,
        courseCode: code || m.courseCode || m.code,
        code: code || m.code,
        title: m.courseTitle || m.description || attnMatch?.['Course Title'] || attnMatch?.['courseTitle'] || attnMatch?.['title'] || "Subject"
      };
    }).filter(Boolean);

    // Merge active subjects from attendance that have no marks entry yet as placeholders
    const marksCodes = new Set(processedMarks.map((m: AnyValue) => String(m.courseCode || m.code).trim().toUpperCase()));
    currentAttendance.forEach((a: AnyValue) => {
      const aCode = String(a?.courseCode || a?.['Course Code'] || a?.code || '').trim().toUpperCase();
      const aTitle = a?.['Course Title'] || a?.courseTitle || a?.title || 'Subject';
      if (aCode && !marksCodes.has(aCode)) {
        processedMarks.push({
          courseCode: aCode,
          code: aCode,
          courseTitle: aTitle,
          title: aTitle,
          tests: []
        });
        marksCodes.add(aCode);
      }
    });

    const scored = processedMarks.reduce((s: number, m: AnyValue) => s + (m.tests?.reduce((a: number, t: AnyValue) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
    const max = processedMarks.reduce((s: number, m: AnyValue) => s + (m.tests?.reduce((a: number, t: AnyValue) => a + (parseFloat((t.test || "T/100").split('/')[1]) || 0), 0) || 0), 0);
    const pct = max > 0 ? (scored / max) * 100 : 0;

    return { marks: processedMarks, totalScored: scored, totalMax: max, avgPct: pct };
  }, [academicData]);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100dvh", width: "100%", background: "var(--app-bg)", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${THEME.bg}; }
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
      <main style={{ flex: 1, paddingBottom: "140px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 72px)" }} className="max-w-4xl mx-auto px-4 w-full">
        <AuraMarks marks={marks} handleSync={handleSync} isSyncing={isSyncing} />
      </main>
    </div>
  );
}
