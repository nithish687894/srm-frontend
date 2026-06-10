"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, FileQuestion, Layers, Lock, Search, Sparkles } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import {
  formatSemesterHref,
  formatSubjectHref,
  formatViewerHref,
  getExamLibraryIndex,
  resourceCanOpen,
  searchExamResources,
  type ExamLibraryMasterIndex,
  type ExamLibraryResource,
} from "@/lib/examLibraryManifest";

function useColors(isLight: boolean) {
  return {
    bg: isLight ? "radial-gradient(circle at 20% 0%, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)" : "radial-gradient(circle at 20% 0%, rgba(191,90,242,0.16), transparent 34%), #050508",
    card: isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.055)",
    surface: isLight ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.035)",
    border: isLight ? "rgba(88,61,145,0.14)" : "rgba(255,255,255,0.09)",
    text: isLight ? "#17111f" : "#fff",
    muted: isLight ? "rgba(23,17,31,0.62)" : "rgba(255,255,255,0.58)",
    accent: isLight ? "#7c3aed" : "#BF5AF2",
  };
}

function ResourceRow({ item, isPremium, colors }: { item: ExamLibraryResource; isPremium: boolean; colors: ReturnType<typeof useColors> }) {
  const locked = !resourceCanOpen(item, isPremium);
  const href = item.type === "folder" ? formatSubjectHref(item.semesterId, item.subjectSlug) : formatViewerHref(item);
  return (
    <Link
      href={locked ? "/premium" : href}
      style={{
        minHeight: 72,
        borderRadius: 18,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
        color: colors.text,
        textDecoration: "none",
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ width: 42, height: 42, borderRadius: 15, display: "grid", placeItems: "center", background: "rgba(191,90,242,0.12)", color: colors.accent, flexShrink: 0 }}>
        {locked ? <Lock size={18} /> : <FileQuestion size={18} />}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <strong style={{ display: "block", fontSize: 13.5, lineHeight: 1.25 }}>{item.title}</strong>
        <span style={{ display: "block", marginTop: 4, color: colors.muted, fontSize: 11.5, fontWeight: 750 }}>
          {item.semester} - {item.subject} - {item.tags.slice(0, 3).join(", ")}
        </span>
      </span>
      <ChevronRight size={17} color={colors.muted} />
    </Link>
  );
}

export default function ExamLibraryPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isPremium = useAuthStore((state) => state.isPremium);
  const isLight = theme === "light";
  const colors = useColors(isLight);
  const [index, setIndex] = useState<ExamLibraryMasterIndex | null>(null);
  const [query, setQuery] = useState("");
  const [recent] = useState<ExamLibraryResource[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("examLibraryRecent");
      return raw ? JSON.parse(raw).slice(0, 4) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let alive = true;
    getExamLibraryIndex().then((data) => {
      if (alive) setIndex(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const resources = useMemo(() => (index?.resources || []).filter((r) => r.type === "pdf" || r.type === "folder"), [index]);
  const searchResults = useMemo(() => searchExamResources(resources, query).filter((r) => r.type === "pdf").slice(0, 12), [resources, query]);
  const popular = resources.filter((item) => item.type === "folder").sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0)).slice(0, 5);
  const pyqs = resources.filter((item) => item.tags.includes("PYQ") && item.type === "pdf").slice(0, 5);

  return (
    <main style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, padding: "28px 16px 118px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/dashboard")} aria-label="Back" style={{ width: 42, height: 42, borderRadius: 15, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, display: "grid", placeItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, color: colors.muted, fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.16em" }}>SRM Nexus</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 29, lineHeight: 1.06, letterSpacing: "-0.04em" }}>Exam Library</h1>
            <p style={{ margin: "7px 0 0", color: colors.muted, fontSize: 13, fontWeight: 700 }}>PDF Notes, PYQ Papers & Study Materials</p>
          </div>
        </header>

        <label style={{ height: 52, borderRadius: 18, border: `1px solid ${colors.border}`, background: colors.card, display: "flex", alignItems: "center", gap: 12, padding: "0 15px", backdropFilter: "blur(18px)" }}>
          <Search size={18} color={colors.accent} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search calculus, biochemistry pyq, sem 2 programming..." style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: colors.text, fontSize: 14, fontWeight: 700 }} />
        </label>

        {query.trim() ? (
          <section style={{ border: `1px solid ${colors.border}`, borderRadius: 22, background: colors.card, padding: 14 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 15 }}>Search Results</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {searchResults.length ? searchResults.map((item) => <ResourceRow key={item.id} item={item} isPremium={isPremium} colors={colors} />) : <p style={{ margin: 0, color: colors.muted }}>Resource not available yet.</p>}
            </div>
          </section>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(154px, 1fr))", gap: 12 }}>
          {(index?.semesters || []).map((semester, idx) => {
            const accent = ["#BF5AF2", "#0A84FF", "#30D158", "#FF9F0A", "#FF2D55", "#00E5FF"][idx % 6];
            return (
              <Link key={semester.id} href={formatSemesterHref(semester.id)} style={{ minHeight: 142, borderRadius: 22, border: `1px solid ${colors.border}`, background: `linear-gradient(135deg, ${accent}24, transparent 58%), ${colors.card}`, color: colors.text, textDecoration: "none", padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <span style={{ display: "flex", justifyContent: "space-between" }}>
                  <Layers size={20} color={accent} />
                  <ChevronRight size={17} color={colors.muted} />
                </span>
                <span>
                  <strong style={{ display: "block", fontSize: 22 }}>{semester.label}</strong>
                  <span style={{ color: colors.muted, fontSize: 12, fontWeight: 800 }}>{semester.subjectCount} subjects</span>
                </span>
              </Link>
            );
          })}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 22, background: colors.card, padding: 14 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, display: "flex", gap: 8, alignItems: "center" }}><Sparkles size={16} color={colors.accent} /> Continue Studying</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {(recent.length ? recent : popular.slice(0, 3)).map((item) => <ResourceRow key={item.id} item={item} isPremium={isPremium} colors={colors} />)}
            </div>
          </div>
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 22, background: colors.card, padding: 14 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, display: "flex", gap: 8, alignItems: "center" }}><BookOpen size={16} color="#30D158" /> Popular Subjects</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {popular.slice(0, 4).map((item) => <ResourceRow key={item.id} item={item} isPremium={isPremium} colors={colors} />)}
            </div>
          </div>
        </section>

        <section style={{ border: `1px solid ${colors.border}`, borderRadius: 22, background: colors.card, padding: 14 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 15 }}>PYQ Papers (PDF)</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {pyqs.map((item) => <ResourceRow key={item.id} item={item} isPremium={isPremium} colors={colors} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

