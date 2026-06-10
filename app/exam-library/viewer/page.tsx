"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, FileWarning, Lock, Share2 } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import { type ExamLibraryResource } from "@/lib/examLibraryManifest";

type ViewerStatus = "loading" | "ready" | "missing";

function useColors(isLight: boolean) {
  return {
    bg: isLight ? "radial-gradient(circle at 20% 0%, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)" : "#050508",
    card: isLight ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.06)",
    surface: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.04)",
    border: isLight ? "rgba(88,61,145,0.14)" : "rgba(255,255,255,0.09)",
    text: isLight ? "#17111f" : "#fff",
    muted: isLight ? "rgba(23,17,31,0.62)" : "rgba(255,255,255,0.58)",
    accent: isLight ? "#7c3aed" : "#BF5AF2",
  };
}

export default function ExamLibraryViewerPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { theme } = useThemeStore();
  const isPremium = useAuthStore((state) => state.isPremium);
  const colors = useColors(theme === "light");
  const title = params.get("title") || "Exam Resource";
  const path = params.get("path") || "";
  const type = params.get("type") || "pdf";
  const semester = params.get("semester") || "sem-1";
  const subject = params.get("subject") || "";
  const locked = params.get("premium") === "1" && !isPremium;
  const [status, setStatus] = useState<ViewerStatus>("loading");

  const backHref = useMemo(() => `/exam-library/${encodeURIComponent(semester)}/${encodeURIComponent(subject)}`, [semester, subject]);

  useEffect(() => {
    if (!path || locked) return;
    let alive = true;
    queueMicrotask(() => {
      if (alive) setStatus("loading");
    });

    async function loadResource() {
      try {
        const response = await fetch(path, { method: "HEAD", cache: "force-cache" });
        if (!alive) return;
        setStatus(response.ok ? "ready" : "missing");
      } catch {
        if (alive) setStatus("missing");
      }
    }

    loadResource();
    return () => {
      alive = false;
    };
  }, [path, locked]);

  useEffect(() => {
    if (!path || locked || status === "loading" || status === "missing") return;
    try {
      const resource: Partial<ExamLibraryResource> = { id: path, title, path, type: type as ExamLibraryResource["type"], semesterId: semester, subjectSlug: subject, semester, subject, isPremium: params.get("premium") === "1", tags: ["Recent"], category: "Recent" };
      const raw = localStorage.getItem("examLibraryRecent");
      const previous = raw ? JSON.parse(raw) : [];
      const next = [resource, ...previous.filter((item: ExamLibraryResource) => item.path !== path)].slice(0, 6);
      localStorage.setItem("examLibraryRecent", JSON.stringify(next));
    } catch {}
  }, [path, status, locked, title, type, semester, subject, params]);

  async function shareResource() {
    const url = `${window.location.origin}/exam-library/viewer?${params.toString()}`;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard?.writeText(url);
  }

  return (
    <main style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, padding: "18px 12px calc(112px + env(safe-area-inset-bottom))", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <header style={{ minHeight: 62, border: `1px solid ${colors.border}`, borderRadius: 22, background: colors.card, padding: 10, display: "grid", gridTemplateColumns: "42px 1fr auto auto", alignItems: "center", gap: 8, backdropFilter: "blur(18px)" }}>
          <button onClick={() => router.push(subject ? backHref : "/exam-library")} aria-label="Back" style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, display: "grid", placeItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 15, lineHeight: 1.18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
            <p style={{ margin: "4px 0 0", color: colors.muted, fontSize: 11.5, fontWeight: 750 }}>PDF - Cloud resource</p>
          </div>
          <button onClick={shareResource} aria-label="Share" style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, display: "grid", placeItems: "center" }}>
            <Share2 size={17} />
          </button>
          {locked ? (
            <Link href="/premium" aria-label="Unlock" style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${colors.border}`, color: "#FFB020", display: "grid", placeItems: "center" }}>
              <Lock size={17} />
            </Link>
          ) : (
            <a href={path} download aria-label="Download" style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${colors.border}`, color: colors.accent, display: "grid", placeItems: "center" }}>
              <Download size={17} />
            </a>
          )}
        </header>

        {locked ? (
          <section style={{ minHeight: "58dvh", border: `1px solid ${colors.border}`, borderRadius: 24, background: colors.card, padding: 22, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <Lock size={34} color="#FFB020" />
              <h2 style={{ margin: "14px 0 8px", fontSize: 21 }}>Premium resource</h2>
              <p style={{ margin: "0 auto 16px", maxWidth: 340, color: colors.muted, fontSize: 13, fontWeight: 750 }}>Unlock the full Exam Library to view and download this resource.</p>
              <Link href="/premium" style={{ height: 46, padding: "0 18px", borderRadius: 15, background: "linear-gradient(135deg, #7B2CBF, #BF5AF2)", color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", fontWeight: 950 }}>Unlock Premium</Link>
            </div>
          </section>
        ) : status === "loading" ? (
          <section style={{ height: "68dvh", border: `1px solid ${colors.border}`, borderRadius: 24, background: colors.card, padding: 16 }}>
            <div style={{ height: "100%", borderRadius: 18, background: `linear-gradient(90deg, ${colors.surface}, rgba(191,90,242,0.10), ${colors.surface})` }} />
          </section>
        ) : status === "missing" || !path ? (
          <section style={{ minHeight: "58dvh", border: `1px solid ${colors.border}`, borderRadius: 24, background: colors.card, padding: 22, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <FileWarning size={34} color={colors.accent} />
              <h2 style={{ margin: "14px 0 8px", fontSize: 21 }}>Resource not available yet</h2>
              <p style={{ margin: 0, maxWidth: 340, color: colors.muted, fontSize: 13, fontWeight: 750 }}>This file is listed in the library, but it is not available locally right now.</p>
            </div>
          </section>
        ) : (
          <section style={{ height: "72dvh", minHeight: 520, border: `1px solid ${colors.border}`, borderRadius: 24, background: colors.card, padding: 8, overflow: "hidden" }}>
            <iframe title={title} src={path} style={{ width: "100%", height: "100%", border: 0, borderRadius: 18, background: "#fff" }} />
          </section>
        )}
      </div>
    </main>
  );
}
