"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, FileQuestion, Lock, Search } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import { formatSubjectHref, getExamLibraryIndex, type ExamLibraryMasterIndex } from "@/lib/examLibraryManifest";

function useColors(isLight: boolean) {
  return {
    bg: isLight ? "radial-gradient(circle at 20% 0%, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)" : "#050508",
    card: isLight ? "rgba(255,255,255,0.84)" : "rgba(255,255,255,0.055)",
    surface: isLight ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.035)",
    border: isLight ? "rgba(88,61,145,0.14)" : "rgba(255,255,255,0.09)",
    text: isLight ? "#17111f" : "#fff",
    muted: isLight ? "rgba(23,17,31,0.62)" : "rgba(255,255,255,0.58)",
    accent: isLight ? "#7c3aed" : "#BF5AF2",
  };
}

export default function ExamLibrarySemesterPage() {
  const router = useRouter();
  const params = useParams<{ semester: string }>();
  const { theme } = useThemeStore();
  const isPremium = useAuthStore((state) => state.isPremium);
  const colors = useColors(theme === "light");
  const [index, setIndex] = useState<ExamLibraryMasterIndex | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    getExamLibraryIndex().then((data) => {
      if (alive) setIndex(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const semester = index?.semesters.find((item) => item.id === params.semester);
  const subjects = useMemo(() => {
    const items = semester?.subjects || [];
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((subject) => `${subject.name} ${subject.slug}`.toLowerCase().includes(q));
  }, [semester, query]);

  return (
    <main style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, padding: "28px 16px 118px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/exam-library")} aria-label="Back" style={{ width: 42, height: 42, borderRadius: 15, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, display: "grid", placeItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, color: colors.muted, fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.16em" }}>Exam Library</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 28, lineHeight: 1.06, letterSpacing: "-0.04em" }}>{semester?.label || "Semester"}</h1>
            <p style={{ margin: "7px 0 0", color: colors.muted, fontSize: 13, fontWeight: 700 }}>Subject-wise PDF notes, PYQ papers & study materials</p>
          </div>
        </header>

        <label style={{ height: 50, borderRadius: 18, border: `1px solid ${colors.border}`, background: colors.card, display: "flex", alignItems: "center", gap: 12, padding: "0 15px" }}>
          <Search size={17} color={colors.accent} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subjects..." style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: colors.text, fontSize: 14, fontWeight: 700 }} />
        </label>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {subjects.map((subject) => {
            const resources = index?.resources.filter((item) => item.semesterId === params.semester && item.subjectSlug === subject.slug && item.type === "pdf") || [];
            const tags = [
              subject.availableContent.pyqs ? "PYQ" : "",
              subject.availableContent.notes ? "Notes" : "",
              subject.availableContent.revision ? "Revision" : "",
              subject.availableContent.importantQuestions ? "Important" : "",
            ].filter(Boolean);
            const locked = !isPremium && subject.readiness !== "Needs OCR";
            return (
              <article key={subject.slug} style={{ border: `1px solid ${colors.border}`, borderRadius: 22, background: colors.card, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 16, background: "rgba(191,90,242,0.13)", color: colors.accent, display: "grid", placeItems: "center" }}>
                    {locked ? <Lock size={19} /> : <BookOpen size={19} />}
                  </span>
                  <span style={{ border: `1px solid ${colors.border}`, color: colors.muted, borderRadius: 999, padding: "7px 10px", fontSize: 11, fontWeight: 900 }}>{subject.readiness}</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{subject.name}</h2>
                  <p style={{ margin: "8px 0 0", color: colors.muted, fontSize: 12, fontWeight: 750 }}>
                    {resources.length} PDF{resources.length !== 1 ? "s" : ""} · {subject.questionCount} questions
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {tags.map((tag) => <span key={tag} style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "6px 9px", color: colors.muted, fontSize: 11, fontWeight: 850 }}>{tag}</span>)}
                </div>
                <Link href={formatSubjectHref(params.semester, subject.slug)} style={{ height: 43, borderRadius: 14, background: "linear-gradient(135deg, #7B2CBF, #BF5AF2)", color: "#fff", textDecoration: "none", fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  View Resources <ChevronRight size={16} />
                </Link>
              </article>
            );
          })}
        </section>

        {index && !subjects.length && (
          <section style={{ border: `1px solid ${colors.border}`, borderRadius: 20, background: colors.card, padding: 18, color: colors.muted, display: "flex", gap: 10, alignItems: "center" }}>
            <FileQuestion size={18} /> Resource not available yet.
          </section>
        )}
      </div>
    </main>
  );
}
