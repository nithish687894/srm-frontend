"use client";
import React, { useState, useMemo } from "react";
import { AlertTriangle, RefreshCcw, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";

const getStatusColor = (pct: number) => {
  if (pct === 0) return "#94A3B8";
  if (pct < 40) return "#EF4444";
  if (pct < 65) return "#F59E0B";
  return "#10B981";
};

const getStatusBadge = (pct: number) => {
  if (pct === 0) return { label: "No marks", bg: "rgba(148, 163, 184, 0.1)", text: "#94A3B8" };
  if (pct < 40) return { label: "Below 40%", bg: "rgba(239, 68, 68, 0.12)", text: "#EF4444" };
  if (pct < 65) return { label: "Average", bg: "rgba(245, 158, 11, 0.12)", text: "#F59E0B" };
  return { label: "Passed", bg: "rgba(16, 185, 129, 0.12)", text: "#10B981" };
};

export default function AuraMarks({ marks, handleSync, isSyncing }: AnyValue) {
  const [filter, setFilter] = useState<"All" | "At Risk">("All");
  const [sortOption, setSortOption] = useState<"default" | "lowest" | "highest" | "alpha">("default");
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const { activeTheme, stars } = useAuraTheme();

  const toggleCourse = (key: string) => {
    setExpandedCourses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const processedMarks = useMemo(() => {
    if (!marks || !marks.length) return [];
    return marks.map((m: AnyValue) => {
      const tests = m.tests || [];
      const hasDirectTotals = typeof m.totalInternalScore === 'number' && typeof m.totalInternalMax === 'number' && m.totalInternalMax > 0;
      const totalScored = hasDirectTotals
        ? m.totalInternalScore
        : tests.reduce((s: number, t: AnyValue) => s + (t.score === "Abs" ? 0 : (typeof t.marksScored === 'number' ? t.marksScored : parseFloat(t.score) || 0)), 0);
      const maxPossible = hasDirectTotals
        ? m.totalInternalMax
        : tests.reduce((s: number, t: AnyValue) => s + (typeof t.maxMarks === 'number' && t.maxMarks > 0 ? t.maxMarks : (parseFloat((t.test || "").split('/')[1]) || 0)), 0);
      const pct = maxPossible > 0 ? (totalScored / maxPossible) * 100 : 0;
      return {
        ...m,
        totalScored,
        maxPossible,
        pct,
      };
    });
  }, [marks]);

  const stats = useMemo(() => {
    const totalSubs = processedMarks.length;
    const totalS = processedMarks.reduce((a: number, b: AnyValue) => a + b.totalScored, 0);
    const totalM = processedMarks.reduce((a: number, b: AnyValue) => a + b.maxPossible, 0);
    const overallAvg = totalM > 0 ? (totalS / totalM) * 100 : 0;
    const atRisk = processedMarks.filter((m: AnyValue) => m.pct > 0 && m.pct < 40).length;
    const publishedCourses = processedMarks.filter((m: AnyValue) => m.maxPossible > 0).length;
    return { totalSubs, overallAvg, atRisk, publishedCourses };
  }, [processedMarks]);

  const hasPublishedMarks = useMemo(() => processedMarks.some((mark: AnyValue) =>
    mark.tests?.some((test: AnyValue) => test.score !== undefined && test.score !== null && test.score !== "")
  ), [processedMarks]);

  const filteredMarks = useMemo(() => {
    let result = [...processedMarks];
    if (filter === "At Risk") {
      result = result.filter((m: AnyValue) => m.pct > 0 && m.pct < 40);
    }

    if (sortOption === "lowest") {
      result.sort((a: AnyValue, b: AnyValue) => {
        if (a.pct === 0 && b.pct !== 0) return 1;
        if (b.pct === 0 && a.pct !== 0) return -1;
        return a.pct - b.pct;
      });
    } else if (sortOption === "highest") {
      result.sort((a: AnyValue, b: AnyValue) => {
        if (a.pct === 0 && b.pct !== 0) return 1;
        if (b.pct === 0 && a.pct !== 0) return -1;
        return b.pct - a.pct;
      });
    } else if (sortOption === "alpha") {
      result.sort((a: AnyValue, b: AnyValue) => (a.title || "").localeCompare(b.title || ""));
    }

    return result;
  }, [processedMarks, filter, sortOption]);

  const avgColor = getStatusColor(stats.overallAvg);

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <main className="marks-workspace" style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px calc(env(safe-area-inset-bottom, 0px) + 100px)", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto" }}>
          
          {/* Header */}
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "22px" }}>
            <div>
              <p style={{ margin: "0 0 6px", color: "#60A5FA", fontSize: "11px", fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Academic workspace
              </p>
              <h1 style={{ margin: 0, color: "#F7F5FA", fontSize: "30px", letterSpacing: "-0.04em", fontWeight: 850 }}>
                Marks
              </h1>
              <p style={{ margin: "5px 0 0", color: "#9C96A7", fontSize: "13px" }}>
                Internal assessments · Current semester
              </p>
            </div>
            <button
              onClick={() => handleSync(true)}
              disabled={isSyncing}
              aria-label="Refresh marks"
              style={{
                height: "38px",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "10px",
                border: "1px solid #292532",
                background: "#12121A",
                color: "#93C5FD",
                fontSize: "12px",
                fontWeight: 700,
                cursor: isSyncing ? "wait" : "pointer"
              }}
            >
              <RefreshCcw size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </header>

          {/* Performance overview: the decision comes before the course list. */}
          <section style={{ background: "#12121A", border: "1px solid #292532", borderTop: "2px solid #2563EB", borderRadius: "14px", padding: "18px 20px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <div style={{ color: "#9C96A7", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 750 }}>
                  Semester score
                </div>
                <div style={{ fontSize: "46px", color: hasPublishedMarks ? "#F7F5FA" : "#938D9B", fontWeight: 850, letterSpacing: "-0.065em", lineHeight: 1, marginTop: "7px" }}>
                  {hasPublishedMarks ? stats.overallAvg.toFixed(1) : "—"}
                  <span style={{ color: avgColor, fontSize: "24px", marginLeft: "2px" }}>{hasPublishedMarks ? "%" : ""}</span>
                </div>
                <div style={{ color: "#8F8998", fontSize: "11.5px", marginTop: "8px", fontWeight: 600 }}>
                  Weighted from published internal assessments
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(58px, 1fr))", gap: "10px", minWidth: "142px", textAlign: "right" }}>
                <div style={{ paddingLeft: "10px", borderLeft: "1px solid #292532" }}>
                  <strong style={{ display: "block", color: "#F7F5FA", fontSize: "18px", fontWeight: 800 }}>{stats.publishedCourses}</strong>
                  <span style={{ color: "#8F8998", fontSize: "10px", fontWeight: 650 }}>Scored</span>
                </div>
                <div style={{ paddingLeft: "10px", borderLeft: "1px solid #292532" }}>
                  <strong style={{ display: "block", color: stats.atRisk ? "#F87171" : "#10B981", fontSize: "18px", fontWeight: 800 }}>{stats.atRisk}</strong>
                  <span style={{ color: "#8F8998", fontSize: "10px", fontWeight: 650 }}>Need review</span>
                </div>
              </div>
            </div>
          </section>

          {/* At Risk Alert banner if any */}
          {stats.atRisk > 0 && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", marginBottom: "16px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.24)", color: "#FCA5A5", fontSize: "12px", fontWeight: 700 }}>
              <AlertTriangle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
              <span>{stats.atRisk} course{stats.atRisk === 1 ? "" : "s"} currently below 40% internal mark threshold.</span>
            </div>
          )}

          {hasPublishedMarks && stats.atRisk === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", marginBottom: "16px", borderRadius: "9px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)", color: "#6EE7B7", fontSize: "11.5px", fontWeight: 700 }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
              All published internal scores are above the 40% review threshold.
            </div>
          )}

          {/* Filter & Sort Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setFilter("All")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: filter === "All" ? "1px solid #2563EB" : "1px solid #292532",
                  background: filter === "All" ? "#2563EB" : "#12121A",
                  color: filter === "All" ? "#FFFFFF" : "#B8B2C2",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer"
                }}
              >
                All <span style={{ opacity: 0.75 }}>{stats.totalSubs}</span>
              </button>
              <button
                onClick={() => setFilter("At Risk")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: filter === "At Risk" ? "1px solid #2563EB" : "1px solid #292532",
                  background: filter === "At Risk" ? "#2563EB" : "#12121A",
                  color: filter === "At Risk" ? "#FFFFFF" : "#B8B2C2",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer"
                }}
              >
                At Risk <span style={{ opacity: 0.75 }}>{stats.atRisk}</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <SlidersHorizontal size={13} color="#8F8998" />
              <select
                id="marks-sort-select"
                name="sortOption"
                aria-label="Sort marks"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                style={{
                  background: "#12121A",
                  border: "1px solid #292532",
                  color: "#C9C4D0",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  fontWeight: 650,
                  cursor: "pointer"
                }}
              >
                <option value="default">Default order</option>
                <option value="highest">Highest score first</option>
                <option value="lowest">Lowest score first</option>
                <option value="alpha">Course title (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Course performance register */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", margin: "2px 0 10px", color: "#777181", fontSize: "10px", fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <span>Course performance</span>
            <span>{stats.totalSubs} registered</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", background: "#12121A", border: "1px solid #292532", borderRadius: "12px", overflow: "hidden" }}>
            {!hasPublishedMarks ? (
              <div style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "12px", padding: "28px 20px", textAlign: "center", color: "#8F8998", fontSize: "13px" }}>
                Internal marks have not been published by the university yet.
              </div>
            ) : filteredMarks.length === 0 ? (
              <div style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "12px", padding: "28px 20px", textAlign: "center", color: "#8F8998", fontSize: "13px" }}>
                No courses match the selected filter.
              </div>
            ) : (
              filteredMarks.map((mark: AnyValue, index: number) => {
                const key = `${mark.courseCode || mark.code}-${index}`;
                const isExpanded = expandedCourses[key] ?? false;
                const color = getStatusColor(mark.pct);
                const badge = getStatusBadge(mark.pct);
                const scoreText = mark.maxPossible > 0
                  ? `${mark.totalScored.toFixed(mark.totalScored % 1 ? 1 : 0)} / ${mark.maxPossible}`
                  : "—";

                return (
                  <article
                    key={key}
                    style={{
                      background: "#12121A",
                      borderBottom: index < filteredMarks.length - 1 ? "1px solid #292532" : "none",
                      borderRadius: 0,
                      overflow: "hidden",
                      transition: "border-color 0.15s ease"
                    }}
                  >
                    {/* Primary Row */}
                    <button
                      type="button"
                      onClick={() => toggleCourse(key)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} assessments for ${mark.title}`}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "14px",
                        cursor: "pointer",
                        userSelect: "none",
                        border: "none",
                        background: "transparent",
                        textAlign: "left"
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h2 style={{ color: "#F7F5FA", margin: 0, fontSize: "14px", fontWeight: 750, lineHeight: 1.3 }}>
                            {mark.title}
                          </h2>
                          <span style={{ fontSize: "10.5px", color: badge.text, background: badge.bg, padding: "2px 6px", borderRadius: "5px", fontWeight: 700 }}>
                            {badge.label}
                          </span>
                        </div>
                        <div style={{ color: "#8F8998", marginTop: "3px", fontSize: "11px", fontWeight: 650 }}>
                          {mark.courseCode || mark.code}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0, textAlign: "right" }}>
                        <div>
                          <div style={{ color, fontSize: "18px", fontWeight: 850, lineHeight: 1, letterSpacing: "-0.03em" }}>
                            {mark.maxPossible > 0 ? `${mark.pct.toFixed(1)}%` : "—"}
                          </div>
                          <div style={{ color: "#8F8998", fontSize: "11px", marginTop: "3px", fontWeight: 650 }}>
                            {scoreText}
                          </div>
                        </div>
                        <span style={{ color: "#8F8998", padding: "4px", display: "flex", alignItems: "center" }} aria-hidden="true">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </button>

                    {/* Compact Assessment Rows (CT1/CT2/Model/CLA) */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid #22222C", background: "#0E0E15", padding: "8px 16px 12px" }}>
                        {mark.tests && mark.tests.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            {/* Table Header */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px", padding: "6px 0", borderBottom: "1px solid #1E1E28", fontSize: "10.5px", fontWeight: 750, color: "#6F6978", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              <div>Assessment</div>
                              <div style={{ textAlign: "right" }}>Score</div>
                              <div style={{ textAlign: "right" }}>Pct</div>
                            </div>

                            {/* Test Rows */}
                            {mark.tests.map((test: AnyValue, testIndex: number) => {
                              const max = (typeof test.maxMarks === 'number' && test.maxMarks > 0)
                                ? test.maxMarks
                                : (Number((test.test || "").split("/")[1]) || 100);
                              const rawScore = test.marksScored !== undefined ? test.marksScored : test.score;
                              const score = test.score === "Abs" ? 0 : (rawScore !== undefined && rawScore !== null && rawScore !== "" ? Number(rawScore) : null);
                              const testPct = score !== null && max > 0 ? (score / max) * 100 : null;
                              const testName = test.testName || test.name || (test.test ? test.test.split("/")[0].trim() : "") || "Assessment";
                              const testColor = testPct !== null ? getStatusColor(testPct) : "#8F8998";

                              return (
                                <div
                                  key={`${test.test || test.testName || testIndex}-${testIndex}`}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 90px 70px",
                                    alignItems: "center",
                                    padding: "8px 0",
                                    borderBottom: testIndex < mark.tests.length - 1 ? "1px solid #181822" : "none",
                                    fontSize: "12px"
                                  }}
                                >
                                  <div style={{ color: "#D3CDD8", fontWeight: 650 }}>
                                    {testName}
                                  </div>
                                  <div style={{ textAlign: "right", color: "#F7F5FA", fontWeight: 750 }} className="tabular-nums">
                                    {test.score === "Abs" ? (
                                      <span style={{ color: "#EF4444" }}>ABS</span>
                                    ) : score !== null ? (
                                      <span>{score.toFixed(score % 1 ? 1 : 0)} <span style={{ color: "#8F8998", fontSize: "11px", fontWeight: 500 }}>/ {max}</span></span>
                                    ) : (
                                      <span style={{ color: "#6F6978" }}>—</span>
                                    )}
                                  </div>
                                  <div style={{ textAlign: "right", color: testColor, fontWeight: 750 }} className="tabular-nums">
                                    {testPct !== null ? `${testPct.toFixed(0)}%` : "—"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ color: "#8F8998", fontSize: "11.5px", padding: "8px 0" }}>
                            No individual assessments have been published yet.
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

        </div>
      </main>
    </AuraBackground>
  );
}
