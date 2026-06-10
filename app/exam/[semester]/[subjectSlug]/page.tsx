"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Clock,
  FileQuestion,
  Flame,
  Layers,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  getSubjectMaterials,
  getSubjectMetadata,
  getSubjectPyqs,
  getSubjectQuestions,
  type ExamQuestion,
  type ExamSubjectMetadata,
} from "@/lib/examLibrary";
import { useThemeStore } from "@/lib/themeStore";

const missing = "This content is not available in uploaded resources yet.";
const tabs = [
  "Overview",
  "Study Priority",
  "Unit-wise Notes",
  "PYQs",
  "Important Questions",
  "Repeated Questions",
  "Last Night Revision",
  "Final 2-Hour Revision",
  "Common Mistakes",
];
const filters = ["All", "2 Mark", "5 Mark", "10 Mark", "Repeated", "Important"];

function badgeColor(label: string) {
  if (label.includes("10") || label === "Must Study") return "#FF453A";
  if (label.includes("5") || label === "Important") return "#FF9F0A";
  if (label.includes("2")) return "#0A84FF";
  if (label === "PYQ") return "#BF5AF2";
  if (label === "Repeated") return "#30D158";
  return "#8E8E93";
}

function readinessColor(status?: string) {
  if (status === "Ready") return "#30D158";
  if (status === "Needs OCR") return "#FF453A";
  return "#FF9F0A";
}

function compactText(text: string, limit = 5000) {
  const clean = text.replace(/^===== SOURCE_FILE:.*?=====$/gm, "").replace(/^CATEGORY:.*$/gm, "").replace(/^STATUS:.*$/gm, "").trim();
  return clean.length > limit ? `${clean.slice(0, limit).trim()}\n\n...` : clean;
}

function splitUnits(text: string) {
  const parts = text.split(/(?=\bUnit\s*[-:]?\s*(?:[IVX]+|\d+)\b)/gi).map((part) => part.trim()).filter((part) => part.length > 120);
  if (parts.length > 1) return parts.slice(0, 8);
  return compactText(text, 5200).split(/\n{2,}/).filter((part) => part.trim().length > 120).slice(0, 8);
}

function filterQuestions(questions: ExamQuestion[], filter: string) {
  if (filter === "All") return questions;
  if (filter === "2 Mark") return questions.filter((question) => question.marks === 2 || question.badges.includes("2 Mark"));
  if (filter === "5 Mark") return questions.filter((question) => question.marks === 5 || question.badges.includes("5 Mark"));
  if (filter === "10 Mark") return questions.filter((question) => question.marks === 10 || question.badges.includes("10 Mark"));
  return questions.filter((question) => question.badges.includes(filter));
}

function groupedQuestions(questions: ExamQuestion[]) {
  return questions.reduce<Record<string, ExamQuestion[]>>((groups, question) => {
    const key = question.unit || question.topic || "Ungrouped";
    groups[key] ||= [];
    groups[key].push(question);
    return groups;
  }, {});
}

function QuestionList({ questions, colors }: { questions: ExamQuestion[]; colors: ReturnType<typeof useColors> }) {
  if (!questions.length) return <Empty colors={colors} />;
  const grouped = groupedQuestions(questions);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>{group}</h3>
          {items.map((question) => (
            <article key={question.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.surface, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{question.text}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {question.badges.map((badge) => (
                  <span key={badge} style={{ color: badgeColor(badge), border: `1px solid ${badgeColor(badge)}55`, borderRadius: 999, padding: "4px 7px", fontSize: 11, fontWeight: 900 }}>{badge}</span>
                ))}
              </div>
              <span style={{ color: colors.muted, fontSize: 11, fontWeight: 750 }}>{question.source}</span>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

function Empty({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, color: colors.muted, background: colors.surface, fontSize: 13, fontWeight: 750 }}>{missing}</div>;
}

function useColors(isLight: boolean) {
  return useMemo(() => ({
    bg: isLight ? "#f7f7fb" : "#050508",
    card: isLight ? "rgba(255,255,255,0.84)" : "rgba(255,255,255,0.055)",
    surface: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.04)",
    border: isLight ? "rgba(20,20,40,0.10)" : "rgba(255,255,255,0.10)",
    text: isLight ? "#10101a" : "#fff",
    muted: isLight ? "rgba(20,20,40,0.62)" : "rgba(255,255,255,0.62)",
  }), [isLight]);
}

export default function ExamSubjectPage() {
  const router = useRouter();
  const params = useParams<{ semester: string; subjectSlug: string }>();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const colors = useColors(isLight);
  const [metadata, setMetadata] = useState<ExamSubjectMetadata | null>(null);
  const [materials, setMaterials] = useState("");
  const [pyqs, setPyqs] = useState("");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getSubjectMetadata(params.semester, params.subjectSlug),
      getSubjectMaterials(params.semester, params.subjectSlug),
      getSubjectPyqs(params.semester, params.subjectSlug),
      getSubjectQuestions(params.semester, params.subjectSlug),
    ])
      .then(([meta, text, pyqText, qs]) => {
        if (!alive) return;
        setMetadata(meta);
        setMaterials(text);
        setPyqs(pyqText);
        setQuestions(qs);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [params.semester, params.subjectSlug]);

  const important = questions.filter((question) => question.badges.includes("Important"));
  const repeated = questions.filter((question) => question.badges.includes("Repeated"));
  const filteredPyqs = filterQuestions(questions, filter);
  const units = splitUnits(materials);
  const priority = [...important, ...repeated, ...questions.filter((question) => question.marks === 10)].filter((question, index, all) => all.findIndex((item) => item.id === question.id) === index).slice(0, 40);
  const revisionText = compactText(materials, 2800);
  const mistakesText = materials.split("\n").filter((line) => /mistake|error|wrong|avoid|caution|note:/i.test(line)).slice(0, 20).join("\n\n");

  return (
    <main style={{ minHeight: "100dvh", background: colors.bg, color: colors.text, padding: "22px 14px 110px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => router.push(`/exam/${params.semester}`)} aria-label="Back" style={{ width: 42, height: 42, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, display: "grid", placeItems: "center" }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{metadata?.semesterLabel || params.semester}</p>
            <h1 style={{ margin: "3px 0 0", fontSize: 24, lineHeight: 1.12 }}>{metadata?.subject || "Subject Dashboard"}</h1>
          </div>
        </header>

        {loading ? (
          <section style={{ border: `1px solid ${colors.border}`, borderRadius: 18, background: colors.card, minHeight: 360, display: "grid", placeItems: "center" }}>
            <Loader2 size={24} color="#BF5AF2" className="animate-spin" />
          </section>
        ) : (
          <>
            {metadata?.readiness !== "Ready" && (
              <section style={{ border: `1px solid ${readinessColor(metadata?.readiness)}55`, borderRadius: 14, background: `${readinessColor(metadata?.readiness)}14`, padding: 13, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <ShieldAlert size={17} color={readinessColor(metadata?.readiness)} />
                <span style={{ fontSize: 13, lineHeight: 1.45, fontWeight: 750 }}>{metadata?.statusMessage || "Some scanned resources still need OCR, so this subject may be partial."}</span>
              </section>
            )}

            <nav style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              {tabs.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ height: 38, whiteSpace: "nowrap", borderRadius: 999, border: `1px solid ${activeTab === tab ? "#BF5AF2" : colors.border}`, background: activeTab === tab ? "rgba(191,90,242,0.16)" : colors.card, color: colors.text, padding: "0 12px", fontSize: 12, fontWeight: 900 }}>
                  {tab}
                </button>
              ))}
            </nav>

            <section style={{ border: `1px solid ${colors.border}`, borderRadius: 18, background: colors.card, padding: 16 }}>
              {activeTab === "Overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  {[
                    ["Readiness", metadata?.readiness || "Partial", AlertTriangle, readinessColor(metadata?.readiness)],
                    ["Resources", `${metadata?.sourceCount || 0}`, Layers, "#0A84FF"],
                    ["Questions", `${questions.length}`, FileQuestion, "#BF5AF2"],
                    ["Revision", metadata?.availableContent.revision ? "Available" : "Partial", Clock, "#30D158"],
                  ].map(([label, value, Icon, accent]) => (
                    <article key={String(label)} style={{ border: `1px solid ${colors.border}`, borderRadius: 14, background: colors.surface, padding: 14 }}>
                      <Icon size={18} color={String(accent)} />
                      <p style={{ margin: "10px 0 3px", color: colors.muted, fontSize: 12, fontWeight: 850 }}>{String(label)}</p>
                      <strong style={{ fontSize: 18 }}>{String(value)}</strong>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === "Study Priority" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: "#FF453A", fontWeight: 950 }}>Must Study</span>
                    <span style={{ color: "#FF9F0A", fontWeight: 950 }}>Important</span>
                    <span style={{ color: "#0A84FF", fontWeight: 950 }}>If Time Remains</span>
                  </div>
                  <QuestionList questions={priority} colors={colors} />
                </div>
              )}

              {activeTab === "Unit-wise Notes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {units.length ? units.map((unit, index) => (
                    <article key={index} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, background: colors.surface, padding: 13 }}>
                      <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Unit / Topic {index + 1}</h3>
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.58 }}>{unit.slice(0, 1800)}</pre>
                    </article>
                  )) : <Empty colors={colors} />}
                </div>
              )}

              {activeTab === "PYQs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                    {filters.map((item) => (
                      <button key={item} onClick={() => setFilter(item)} style={{ height: 34, whiteSpace: "nowrap", borderRadius: 999, border: `1px solid ${filter === item ? "#BF5AF2" : colors.border}`, background: filter === item ? "rgba(191,90,242,0.16)" : colors.surface, color: colors.text, padding: "0 10px", fontSize: 12, fontWeight: 900 }}>
                        {item}
                      </button>
                    ))}
                  </div>
                  {questions.length ? <QuestionList questions={filteredPyqs} colors={colors} /> : pyqs ? <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.58 }}>{compactText(pyqs, 7000)}</pre> : <Empty colors={colors} />}
                </div>
              )}

              {activeTab === "Important Questions" && <QuestionList questions={important} colors={colors} />}
              {activeTab === "Repeated Questions" && <QuestionList questions={repeated} colors={colors} />}

              {activeTab === "Last Night Revision" && (
                revisionText ? <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.62 }}>{revisionText}</pre> : <Empty colors={colors} />
              )}

              {activeTab === "Final 2-Hour Revision" && (
                priority.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#30D158", fontWeight: 950 }}><Flame size={17} /> High-yield uploaded questions</div>
                    <QuestionList questions={priority.slice(0, 20)} colors={colors} />
                  </div>
                ) : <Empty colors={colors} />
              )}

              {activeTab === "Common Mistakes" && (
                mistakesText ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertTriangle size={18} color="#FF9F0A" />
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.62 }}>{mistakesText}</pre>
                  </div>
                ) : <Empty colors={colors} />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
