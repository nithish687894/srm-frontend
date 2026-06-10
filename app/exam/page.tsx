"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Layers, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSemesters, type ExamSemester } from "@/lib/examLibrary";
import { useThemeStore } from "@/lib/themeStore";

export default function ExamPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const [semesters, setSemesters] = useState<ExamSemester[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = useMemo(() => ({
    bg: isLight ? "#f7f7fb" : "#050508",
    card: isLight ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.055)",
    border: isLight ? "rgba(20,20,40,0.10)" : "rgba(255,255,255,0.10)",
    text: isLight ? "#10101a" : "#fff",
    muted: isLight ? "rgba(20,20,40,0.62)" : "rgba(255,255,255,0.62)",
  }), [isLight]);

  useEffect(() => {
    let alive = true;
    getSemesters()
      .then((items) => {
        if (alive) setSemesters(items);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, padding: "26px 16px 110px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/dashboard")} aria-label="Back" style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, display: "grid", placeItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>SRM Nexus</p>
            <h1 style={{ margin: "3px 0 0", fontSize: 30, lineHeight: 1.08 }}>Exam Library</h1>
          </div>
        </header>

        {loading ? (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {[1, 2, 3, 4, 5].map((item) => <div key={item} style={{ height: 156, borderRadius: 18, background: colors.card, border: `1px solid ${colors.border}` }} />)}
          </section>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {semesters.map((semester, index) => {
              const accent = ["#BF5AF2", "#00D4FF", "#30D158", "#FF9F0A", "#FF375F"][index % 5];
              return (
                <Link
                  key={semester.id}
                  href={`/exam/${semester.id}`}
                  style={{
                    minHeight: 164,
                    borderRadius: 18,
                    border: `1px solid ${colors.border}`,
                    background: `linear-gradient(135deg, ${accent}24, transparent 55%), ${colors.card}`,
                    backdropFilter: "blur(18px)",
                    color: colors.text,
                    textDecoration: "none",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: isLight ? "0 18px 50px rgba(70,64,110,0.10)" : "0 18px 50px rgba(0,0,0,0.28)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: `${accent}26`, display: "grid", placeItems: "center" }}>
                      <Layers size={20} color={accent} />
                    </div>
                    <ChevronRight size={18} color={colors.muted} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24 }}>{semester.label}</h2>
                    <p style={{ margin: "7px 0 0", color: colors.muted, fontSize: 13, fontWeight: 850 }}>{semester.subjectCount} subjects available</p>
                  </div>
                </Link>
              );
            })}
          </section>
        )}

        <section style={{ border: `1px solid ${colors.border}`, borderRadius: 18, background: colors.card, padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <BookOpen size={20} color="#30D158" />
          <p style={{ margin: 0, color: colors.muted, fontSize: 13, fontWeight: 750 }}>
            Local static library only. No AI is used here, and missing uploaded content stays marked as unavailable.
          </p>
          {loading && <Loader2 size={16} className="animate-spin" />}
        </section>
      </div>
    </main>
  );
}
