"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, Download, FileText, Lock, Search } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import {
  formatViewerHref,
  getExamLibraryIndex,
  resourceCanOpen,
  resolveExamResourceUrl,
  searchExamResources,
  type ExamLibraryMasterIndex,
  type ExamLibraryResource,
} from "@/lib/examLibraryManifest";

function useColors(isLight: boolean) {
  return {
    bg: isLight ? "radial-gradient(circle at 20% 0%, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)" : "#050508",
    card: isLight ? "rgba(255,255,255,0.84)" : "rgba(255,255,255,0.055)",
    surface: isLight ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.035)",
    border: isLight ? "rgba(88,61,145,0.14)" : "rgba(255,255,255,0.09)",
    text: isLight ? "#17111f" : "#fff",
    muted: isLight ? "rgba(23,17,31,0.62)" : "rgba(255,255,255,0.58)",
    accent: isLight ? "#7c3aed" : "#BF5AF2",
    green: isLight ? "#047857" : "#30D158",
  };
}

function ResourceCard({ resource, isPremium, colors }: { resource: ExamLibraryResource; isPremium: boolean; colors: ReturnType<typeof useColors> }) {
  const locked = !resourceCanOpen(resource, isPremium);
  const canOpen = resource.type !== "folder";
  const href = locked ? "/premium" : canOpen ? formatViewerHref(resource) : "#";

  return (
    <article style={{ border: `1px solid ${colors.border}`, borderRadius: 22, background: colors.card, padding: 14, display: "grid", gap: 13 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ width: 46, height: 46, borderRadius: 16, background: locked ? "rgba(255,159,10,0.13)" : "rgba(191,90,242,0.13)", color: locked ? "#FFB020" : colors.accent, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {locked ? <Lock size={19} /> : <FileText size={19} />}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: colors.muted, fontSize: 10.5, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase" }}>{resource.category}</span>
            {locked ? <span style={{ border: "1px solid rgba(255,159,10,0.24)", color: "#FFB020", borderRadius: 999, padding: "4px 7px", fontSize: 10, fontWeight: 950 }}>Premium</span> : null}
          </div>
          <h2 style={{ margin: "7px 0 0", color: colors.text, fontSize: 16, lineHeight: 1.26 }}>{resource.title}</h2>
          <p style={{ margin: "6px 0 0", color: colors.muted, fontSize: 12, fontWeight: 750 }}>
            PDF {resource.fileName ? `· ${resource.fileName}` : ""}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {resource.tags.slice(0, 4).map((tag) => (
          <span key={tag} style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "6px 9px", color: colors.muted, fontSize: 11, fontWeight: 850 }}>{tag}</span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
        {canOpen ? (
          <Link href={href} style={{ minHeight: 44, borderRadius: 14, background: locked ? colors.surface : "linear-gradient(135deg, #7B2CBF, #BF5AF2)", color: locked ? colors.text : "#fff", textDecoration: "none", fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {locked ? "Unlock" : "Open"} <ChevronRight size={16} />
          </Link>
        ) : (
          <button disabled style={{ minHeight: 44, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.muted, fontWeight: 950 }}>
            Browse below
          </button>
        )}
        {resource.type !== "folder" ? (
          locked ? (
            <Link href="/premium" aria-label="Unlock download" style={{ width: 46, minHeight: 44, borderRadius: 14, border: `1px solid ${colors.border}`, color: colors.muted, display: "grid", placeItems: "center" }}>
              <Lock size={17} />
            </Link>
          ) : (
            <a href={resolveExamResourceUrl(resource.path)} download aria-label="Download resource" style={{ width: 46, minHeight: 44, borderRadius: 14, border: `1px solid ${colors.border}`, color: colors.green, display: "grid", placeItems: "center" }}>
              <Download size={17} />
            </a>
          )
        ) : null}
      </div>
    </article>
  );
}

export default function ExamLibrarySubjectPage() {
  const router = useRouter();
  const params = useParams<{ semester: string; subject: string }>();
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
  const subject = semester?.subjects.find((item) => item.slug === params.subject);
  const resources = useMemo(() => {
    const items = (index?.resources || []).filter((item) => item.semesterId === params.semester && item.subjectSlug === params.subject && item.type === "pdf");
    return searchExamResources(items, query);
  }, [index, params.semester, params.subject, query]);

  return (
    <main style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, padding: "28px 16px calc(118px + env(safe-area-inset-bottom))", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push(`/exam-library/${params.semester}`)} aria-label="Back" style={{ width: 42, height: 42, borderRadius: 15, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, display: "grid", placeItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, color: colors.muted, fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.16em" }}>{semester?.label || "Exam Library"}</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 27, lineHeight: 1.08, letterSpacing: "-0.04em" }}>{subject?.name || "Subject Resources"}</h1>
            <p style={{ margin: "7px 0 0", color: colors.muted, fontSize: 13, fontWeight: 700 }}>PDF study materials, PYQ papers & notes</p>
          </div>
        </header>

        <section style={{ border: `1px solid ${colors.border}`, borderRadius: 24, background: `linear-gradient(135deg, rgba(191,90,242,0.14), transparent 54%), ${colors.card}`, padding: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 48, height: 48, borderRadius: 17, background: "rgba(191,90,242,0.15)", color: colors.accent, display: "grid", placeItems: "center" }}>
              <BookOpen size={21} />
            </span>
            <div>
              <strong style={{ display: "block", fontSize: 15 }}>{resources.length} PDF{resources.length !== 1 ? "s" : ""} available</strong>
              <span style={{ color: colors.muted, fontSize: 12, fontWeight: 750 }}>{subject?.questionCount || 0} indexed questions - local library only</span>
            </div>
          </div>
        </section>

        <label style={{ height: 50, borderRadius: 18, border: `1px solid ${colors.border}`, background: colors.card, display: "flex", alignItems: "center", gap: 12, padding: "0 15px" }}>
          <Search size={17} color={colors.accent} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources..." style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: colors.text, fontSize: 14, fontWeight: 700 }} />
        </label>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} isPremium={isPremium} colors={colors} />
          ))}
        </section>

        {index && !resources.length ? (
          <section style={{ border: `1px solid ${colors.border}`, borderRadius: 20, background: colors.card, padding: 18, color: colors.muted, display: "flex", gap: 10, alignItems: "center" }}>
            <FileText size={18} /> Resource not available yet.
          </section>
        ) : null}
      </div>
    </main>
  );
}
