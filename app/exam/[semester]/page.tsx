"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, FileQuestion, Loader2, Sparkles } from "lucide-react";
import { getSemesters, getSubjectsBySemester, type ExamSemester, type ExamSubjectSummary } from "@/lib/examLibrary";
import { useThemeStore } from "@/lib/themeStore";

function readinessColor(status: string) {
  if (status === "Ready") return "#30D158";
  if (status === "Needs OCR") return "#FF453A";
  return "#FF9F0A";
}

export default function ExamSemesterPage() {
  const router = useRouter();
  const params = useParams<{ semester: string }>();
  const semesterId = params.semester;
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const [semester, setSemester] = useState<ExamSemester | null>(null);
  const [subjects, setSubjects] = useState<ExamSubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = useMemo(() => ({
    bg: isLight ? "#f7f7fb" : "#050508",
    card: isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.055)",
    border: isLight ? "rgba(20,20,40,0.10)" : "rgba(255,255,255,0.10)",
    text: isLight ? "#10101a" : "#fff",
    muted: isLight ? "rgba(20,20,40,0.62)" : "rgba(255,255,255,0.62)",
  }), [isLight]);

  useEffect(() => {
    let alive = true;
    Promise.all([getSemesters(), getSubjectsBySemester(semesterId)])
      .then(([semesters, items]) => {
        if (!alive) return;
        setSemester(semesters.find((item) => item.id === semesterId) || null);
        setSubjects(items);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [semesterId]);

  return (
    <main style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, padding: "26px 16px 110px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/exam")} aria-label="Back" style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, display: "grid", placeItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>Exam Library</p>
            <h1 style={{ margin: "3px 0 0", fontSize: 28, lineHeight: 1.08 }}>{semester?.label || "Semester"}</h1>
          </div>
        </header>

        {loading ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} style={{ height: 190, borderRadius: 18, background: colors.card, border: `1px solid ${colors.border}` }} />)}
          </section>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {subjects.map((subject) => {
              const readiness = readinessColor(subject.readiness);
              const content = [
                subject.availableContent.notes ? "Notes" : "",
                subject.availableContent.pyqs ? "PYQs" : "",
                subject.availableContent.importantQuestions ? "Important Questions" : "",
                subject.availableContent.revision ? "Revision" : "",
              ].filter((item) => item.length > 0);

              return (
                <article key={subject.slug} style={{ border: `1px solid ${colors.border}`, borderRadius: 18, background: colors.card, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(191,90,242,0.16)", display: "grid", placeItems: "center" }}>
                      <BookOpen size={20} color="#BF5AF2" />
                    </div>
                    <span style={{ border: `1px solid ${readiness}55`, color: readiness, borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 900, alignSelf: "flex-start" }}>{subject.readiness}</span>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{subject.name}</h2>
                    <p style={{ margin: "7px 0 0", color: colors.muted, fontSize: 12, fontWeight: 750 }}>{subject.questionCount} extracted questions • {subject.sourceCount} resources</p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {content.length ? content.map((item) => (
                      <span key={item} style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "6px 9px", color: colors.muted, fontSize: 11, fontWeight: 850 }}>{item}</span>
                    )) : <span style={{ color: colors.muted, fontSize: 12 }}>This content is not available in uploaded resources yet.</span>}
                  </div>
                  <Link href={`/exam/${semesterId}/${subject.slug}`} style={{ height: 42, borderRadius: 12, background: "linear-gradient(135deg, #7B2CBF, #BF5AF2)", color: "#fff", textDecoration: "none", fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    Open Subject <ChevronRight size={15} />
                  </Link>
                </article>
              );
            })}
          </section>
        )}

        {!loading && subjects.length === 0 && (
          <section style={{ border: `1px solid ${colors.border}`, borderRadius: 18, background: colors.card, padding: 18, color: colors.muted }}>
            This content is not available in uploaded resources yet.
          </section>
        )}
      </div>
    </main>
  );
}
