"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { examHubAPI } from "@/lib/api";
import { useThemeStore } from "@/lib/themeStore";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileQuestion,
  FileText,
  FolderOpen,
  Layers,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Wand2,
} from "lucide-react";

type CatalogResource = {
  name: string;
  url: string | null;
  local?: boolean;
  watermarked?: boolean;
};

type CatalogSubject = {
  subject: string;
  syllabusUrl?: string | null;
  pyqs?: CatalogResource[];
  notes?: CatalogResource[];
};

type ExamCatalog = Record<string, CatalogSubject[]>;

type ExamSource = {
  title: string;
  source?: string;
  sourceType?: string;
  official?: boolean;
  semester?: number;
  subjectName?: string;
  resourceType?: string;
  sourceLink?: string;
  whyShown?: string;
};

type ExamResponse = {
  answer: string;
  intent: string;
  filtersUsed: Record<string, unknown>;
  sources: ExamSource[];
  confidence: "high" | "medium" | "low";
  official: boolean;
  sourceWarning: string | null;
  missingInfo: string[];
  usedLlm: boolean;
  tokenSaving?: {
    llmSkippedReason?: string | null;
  };
};

type QuickAction = {
  label: string;
  mode: string;
  resourceType?: string;
  prompt: string;
  icon: typeof FileQuestion;
};

type Colors = {
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  success: string;
};

const quickActions: QuickAction[] = [
  {
    label: "Important Questions",
    mode: "Important Questions",
    icon: FileQuestion,
    prompt: "I have exam tomorrow give important questions",
  },
  {
    label: "PYQs",
    mode: "PYQ",
    icon: FileText,
    prompt: "show previous year questions",
  },
  {
    label: "Notes",
    mode: "Explain",
    resourceType: "notes",
    icon: BookOpen,
    prompt: "show readable notes",
  },
  {
    label: "Source Links",
    mode: "Source Listing",
    icon: Search,
    prompt: "show source links",
  },
  {
    label: "2-Mark Answer",
    mode: "2-Mark Answer",
    icon: Wand2,
    prompt: "make 2 mark answer",
  },
  {
    label: "10-Mark Answer",
    mode: "10-Mark Answer",
    icon: Sparkles,
    prompt: "make 10 mark answer",
  },
];

const semesterKeys = ["1", "2", "3", "4", "5", "6", "7", "8"];

function hasUrl(url?: string | null) {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function cleanList(resources?: CatalogResource[]) {
  return (resources || []).filter((resource) => {
    const name = resource.name?.trim().toLowerCase();
    return name && name !== "coming soon" && name !== "not available";
  });
}

function resourceKind(resource: CatalogResource) {
  const name = resource.name.toLowerCase();
  const url = resource.url || "";
  if (url.toLowerCase().endsWith(".pdf")) return "PDF";
  if (url.toLowerCase().endsWith(".html")) return "Reader";
  if (url.includes("/drive/folders/")) return "Folder";
  if (url.includes("docs.google.com/document")) return "Doc";
  if (url.includes("docs.google.com/presentation")) return "Slides";
  if (name.includes("pdf") || url.includes("/file/d/")) return "PDF";
  if (name.includes("answer")) return "Key";
  return "File";
}

function getCounts(subject: CatalogSubject) {
  return {
    pyqs: cleanList(subject.pyqs).length,
    notes: cleanList(subject.notes).length,
    syllabus: hasUrl(subject.syllabusUrl) ? 1 : 0,
  };
}

function normalizeSubject(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function mergeCatalogs(primary: ExamCatalog, local: ExamCatalog, semester: string) {
  const merged = new Map<string, CatalogSubject>();

  for (const subject of primary[semester] || []) {
    merged.set(normalizeSubject(subject.subject), {
      ...subject,
      pyqs: [...(subject.pyqs || [])],
      notes: [...(subject.notes || [])],
    });
  }

  for (const subject of local[semester] || []) {
    const key = normalizeSubject(subject.subject);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        notes: [...(subject.notes || []), ...(existing.notes || [])],
      });
    } else {
      merged.set(key, {
        ...subject,
        pyqs: [...(subject.pyqs || [])],
        notes: [...(subject.notes || [])],
      });
    }
  }

  return [...merged.values()].sort((a, b) => a.subject.localeCompare(b.subject));
}

function ResourceGroup({
  title,
  icon: Icon,
  resources,
  colors,
  openLabel = "Open",
}: {
  title: string;
  icon: typeof FileText;
  resources: CatalogResource[];
  colors: Colors;
  openLabel?: string;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={17} color={colors.accent} />
        <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
        <span style={{ color: colors.muted, fontSize: 12, fontWeight: 800 }}>{resources.length}</span>
      </div>
      {resources.length === 0 ? (
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, color: colors.muted, fontSize: 13 }}>
          No files added yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {resources.map((resource, index) => {
            const available = hasUrl(resource.url);
            return (
              <article
                key={`${resource.name}-${index}`}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: 12,
                  background: colors.surface,
                  minHeight: 118,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: colors.accentSoft,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {resourceKind(resource) === "Folder" ? <FolderOpen size={16} color={colors.accent} /> : <FileText size={16} color={colors.accent} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 13, lineHeight: 1.35 }}>{resource.name}</strong>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                      <span style={{ display: "inline-flex", border: `1px solid ${colors.border}`, borderRadius: 999, padding: "4px 8px", color: colors.muted, fontSize: 11, fontWeight: 800 }}>
                        {available ? resourceKind(resource) : "Unavailable"}
                      </span>
                      {resource.watermarked && (
                        <span style={{ display: "inline-flex", border: `1px solid ${colors.border}`, borderRadius: 999, padding: "4px 8px", color: colors.accent, fontSize: 11, fontWeight: 900 }}>
                          srmnexus.app
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {available ? (
                  <a
                    href={resource.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      height: 34,
                      borderRadius: 8,
                      background: colors.elevated,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      fontSize: 12,
                      fontWeight: 900,
                      textDecoration: "none",
                    }}
                  >
                    {openLabel} <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ color: colors.muted, fontSize: 12, fontWeight: 800 }}>Not ready</span>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function ExamHubPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const [catalog, setCatalog] = useState<ExamCatalog>({});
  const [localCatalog, setLocalCatalog] = useState<ExamCatalog>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [customQuestion, setCustomQuestion] = useState("I have tmrw exam give imp qns");
  const [showExternalLinks, setShowExternalLinks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExamResponse | null>(null);
  const [error, setError] = useState("");

  const colors = useMemo<Colors>(() => ({
    bg: isLight ? "#f7f7fb" : "#050508",
    surface: isLight ? "#ffffff" : "rgba(255,255,255,0.035)",
    elevated: isLight ? "#ffffff" : "#101018",
    border: isLight ? "rgba(20,20,40,0.10)" : "rgba(255,255,255,0.08)",
    text: isLight ? "#090914" : "#ffffff",
    muted: isLight ? "rgba(20,20,40,0.62)" : "rgba(255,255,255,0.58)",
    accent: "#BF5AF2",
    accentSoft: isLight ? "rgba(191,90,242,0.12)" : "rgba(191,90,242,0.16)",
    success: "#30D158",
  }), [isLight]);

  const subjects = useMemo(() => mergeCatalogs(catalog, localCatalog, selectedSemester), [catalog, localCatalog, selectedSemester]);
  const filteredSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) => subject.subject.toLowerCase().includes(query));
  }, [subjectSearch, subjects]);
  const activeSubject = useMemo(() => {
    return subjects.find((subject) => subject.subject === selectedSubject) || subjects[0] || null;
  }, [selectedSubject, subjects]);
  const activeCounts = activeSubject ? getCounts(activeSubject) : { pyqs: 0, notes: 0, syllabus: 0 };
  const totalFiles = activeCounts.pyqs + activeCounts.notes + activeCounts.syllabus;

  useEffect(() => {
    let alive = true;
    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const response = await fetch("/exam-catalog.json");
        const data = await response.json();
        if (alive) setCatalog(data);
      } catch {
        if (alive) setCatalog({});
      } finally {
        if (alive) setCatalogLoading(false);
      }
    }
    loadCatalog();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadLocalCatalog() {
      try {
        const response = await fetch("/exam-local-catalog.json");
        const data = await response.json();
        if (alive) setLocalCatalog(data);
      } catch {
        if (alive) setLocalCatalog({});
      }
    }
    loadLocalCatalog();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const currentSubjects = catalog[selectedSemester] || [];
    if (!currentSubjects.some((subject) => subject.subject === selectedSubject)) {
      setSelectedSubject(currentSubjects[0]?.subject || "");
    }
  }, [catalog, selectedSemester, selectedSubject]);

  async function ask(mode?: string, prompt?: string, resourceType?: string) {
    const base = (prompt || customQuestion).trim() || "give important questions";
    const subjectName = activeSubject?.subject || selectedSubject;
    const question = `${subjectName} ${base}`.trim();
    setLoading(true);
    setError("");
    try {
      const response = await examHubAPI.ask({
        question,
        subjectName,
        semester: Number(selectedSemester),
        mode,
        resourceType,
        limit: 8,
      });
      setResult(response);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string; error?: string } } };
      setError(apiError.response?.data?.message || apiError.response?.data?.error || "Exam Hub is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  const syllabusResources: CatalogResource[] = activeSubject?.syllabusUrl
    ? [{ name: "Syllabus", url: activeSubject.syllabusUrl }]
    : [];
  const pyqResources = cleanList(activeSubject?.pyqs);
  const allNoteResources = cleanList(activeSubject?.notes);
  const localResources = allNoteResources.filter((resource) => resource.local);
  const noteResources = allNoteResources.filter((resource) => !resource.local);

  return (
    <div style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 18px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, display: "grid", placeItems: "center" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>SRM Exam Hub</p>
            <h1 style={{ margin: "4px 0 0", fontSize: 28, lineHeight: 1.08 }}>Semester-wise exam files</h1>
          </div>
          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 11px", color: colors.muted, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 7 }}>
            <Layers size={14} color={colors.accent} />
            Sem {selectedSemester}
          </div>
        </header>

        <section style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {semesterKeys.map((semester) => {
            const isActive = selectedSemester === semester;
            const subjectCount = catalog[semester]?.length || 0;
            return (
              <button
                key={semester}
                onClick={() => {
                  setSelectedSemester(semester);
                  setSubjectSearch("");
                  setResult(null);
                  setShowExternalLinks(false);
                }}
                style={{
                  minWidth: 92,
                  height: 48,
                  borderRadius: 8,
                  border: `1px solid ${isActive ? colors.accent : colors.border}`,
                  background: isActive ? colors.accentSoft : colors.surface,
                  color: colors.text,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                  fontWeight: 900,
                }}
              >
                <span>Sem {semester}</span>
                <span style={{ color: colors.muted, fontSize: 11, fontWeight: 800 }}>{subjectCount} subjects</span>
              </button>
            );
          })}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 14 }}>
          <aside style={{ border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.elevated, padding: 14, display: "flex", flexDirection: "column", gap: 12, minHeight: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Subjects</h2>
              {catalogLoading && <Loader2 size={15} color={colors.accent} className="animate-spin" />}
            </div>
            <div style={{ position: "relative" }}>
              <Search size={15} color={colors.muted} style={{ position: "absolute", left: 11, top: 12 }} />
              <input
                value={subjectSearch}
                onChange={(event) => setSubjectSearch(event.target.value)}
                placeholder="Search subject"
                style={{ width: "100%", height: 40, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, padding: "0 12px 0 34px", fontWeight: 750, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 540, paddingRight: 2 }}>
              {filteredSubjects.map((subject) => {
                const isActive = activeSubject?.subject === subject.subject;
                const counts = getCounts(subject);
                return (
                  <button
                    key={subject.subject}
                    onClick={() => {
                      setSelectedSubject(subject.subject);
                      setResult(null);
                      setShowExternalLinks(false);
                    }}
                    style={{
                      border: `1px solid ${isActive ? colors.accent : colors.border}`,
                      background: isActive ? colors.accentSoft : colors.surface,
                      color: colors.text,
                      borderRadius: 8,
                      padding: 12,
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{subject.subject}</strong>
                    <span style={{ color: colors.muted, fontSize: 11, fontWeight: 800 }}>
                      {counts.pyqs} PYQs • {counts.notes} notes • {counts.syllabus} syllabus
                    </span>
                  </button>
                );
              })}
              {!catalogLoading && filteredSubjects.length === 0 && (
                <div style={{ color: colors.muted, fontSize: 13, padding: 12 }}>No subject found.</div>
              )}
            </div>
          </aside>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <section style={{ border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.elevated, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Semester {selectedSemester}</p>
                  <h2 style={{ margin: "5px 0 0", fontSize: 22, lineHeight: 1.15 }}>{activeSubject?.subject || "Select a subject"}</h2>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 10px", color: colors.muted, fontSize: 12, fontWeight: 900 }}>{totalFiles} files</span>
                  <span style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 10px", color: colors.muted, fontSize: 12, fontWeight: 900 }}>{activeCounts.pyqs} PYQs</span>
                  <span style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 10px", color: colors.muted, fontSize: 12, fontWeight: 900 }}>{activeCounts.notes} notes</span>
                </div>
              </div>
              <ResourceGroup title="SRM Nexus local PDFs" icon={FileText} resources={localResources} colors={colors} openLabel="Open SRM PDF" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${colors.border}`, paddingTop: 4 }}>
                <span style={{ color: colors.muted, fontSize: 12, fontWeight: 800 }}>
                  External Drive links are backup only.
                </span>
                <button
                  onClick={() => setShowExternalLinks((value) => !value)}
                  style={{ height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, padding: "0 11px", fontSize: 12, fontWeight: 900 }}
                >
                  {showExternalLinks ? "Hide backups" : "Show backups"}
                </button>
              </div>
              {showExternalLinks && (
                <>
                  <ResourceGroup title="Syllabus" icon={BookOpen} resources={syllabusResources} colors={colors} openLabel="Open backup" />
                  <ResourceGroup title="PYQs and question banks" icon={FileQuestion} resources={pyqResources} colors={colors} openLabel="Open backup" />
                  <ResourceGroup title="Notes and study material" icon={FileText} resources={noteResources} colors={colors} openLabel="Open backup" />
                </>
              )}
            </section>

            <section style={{ border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.elevated, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16 }}>Ask Exam Hub</h2>
                  <p style={{ margin: "4px 0 0", color: colors.muted, fontSize: 12, fontWeight: 700 }}>Selected: Sem {selectedSemester} • {activeSubject?.subject || "Subject"}</p>
                </div>
                {loading && <Loader2 size={18} color={colors.accent} className="animate-spin" />}
              </div>
              <textarea
                value={customQuestion}
                onChange={(event) => setCustomQuestion(event.target.value)}
                rows={3}
                placeholder="I have tmrw exam give imp qns"
                style={{ resize: "vertical", minHeight: 84, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, padding: 12, fontWeight: 650, lineHeight: 1.45 }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))", gap: 8 }}>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => ask(action.mode, action.prompt, action.resourceType)}
                    disabled={loading || !activeSubject}
                    style={{ minHeight: 56, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, padding: "10px 11px", textAlign: "left", display: "flex", alignItems: "center", gap: 9, fontWeight: 900, fontSize: 12 }}
                  >
                    <action.icon size={17} color={colors.accent} />
                    {action.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => ask()}
                disabled={loading || !activeSubject}
                style={{ height: 44, borderRadius: 8, border: "none", background: colors.accent, color: "#fff", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </button>
            </section>

            {error && (
              <div style={{ border: "1px solid rgba(255,59,48,0.35)", background: "rgba(255,59,48,0.08)", color: "#ff6b6b", borderRadius: 8, padding: 14, fontWeight: 800 }}>
                {error}
              </div>
            )}

            {result && (
              <section style={{ background: colors.elevated, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{String(result.filtersUsed?.mode || result.intent)}</p>
                    <h2 style={{ margin: "4px 0 0", fontSize: 20 }}>Result</h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 10px", color: colors.muted, fontSize: 12, fontWeight: 800 }}>Confidence: {result.confidence}</span>
                    <span style={{ border: `1px solid ${colors.border}`, borderRadius: 999, padding: "8px 10px", color: colors.muted, fontSize: 12, fontWeight: 800 }}>{result.usedLlm ? "AI answer" : "Code-only"}</span>
                  </div>
                </div>

                {result.sourceWarning && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid rgba(255,204,0,0.22)", background: "rgba(255,204,0,0.08)", borderRadius: 8, padding: 12, color: colors.text }}>
                    <Shield size={16} color="#ffcc00" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, lineHeight: 1.45 }}>{result.sourceWarning}</span>
                  </div>
                )}

                <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: 14, lineHeight: 1.65, color: colors.text }}>
                  {result.answer}
                </pre>

                {result.sources?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 15 }}>Sources</h3>
                    {result.sources.map((source, index) => (
                      <div key={`${source.title}-${index}`} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                        <strong style={{ fontSize: 13 }}>{source.title}</strong>
                        <span style={{ color: colors.muted, fontSize: 12 }}>
                          {source.subjectName || "Subject"} {source.semester ? `• Sem ${source.semester}` : ""} {source.resourceType ? `• ${source.resourceType}` : ""}
                        </span>
                        {source.whyShown && <span style={{ color: colors.muted, fontSize: 12 }}>{source.whyShown}</span>}
                        {source.sourceLink && <a href={source.sourceLink} target="_blank" rel="noreferrer" style={{ color: colors.accent, fontSize: 12, fontWeight: 800 }}>Open source</a>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
