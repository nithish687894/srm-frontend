"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";

export default function MarksPage() {
  const { academicData, setAcademicData } = useAuthStore();
  const [marks, setMarks] = useState<any[]>(academicData?.marks || []);
  const [attendance, setAttendance] = useState<any[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.marks);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
      router.push("/"); return;
    }
    if (academicData?.marks && academicData?.attendance) setLoading(false);
    Promise.all([dataAPI.getMarks(), dataAPI.getAttendance()])
      .then(([m, a]) => {
        setMarks(m.data || []);
        setAttendance(a.data || []);
        setAcademicData({ ...academicData, marks: m.data || [], attendance: a.data || [] });
        setLoading(false);
      })
      .catch(() => { if (!marks.length) router.push("/"); });
  }, []);

  const titleMap: Record<string, string> = {};
  attendance.forEach((c: any) => { titleMap[c["Course Code"]] = c["Course Title"]; });

  const totalScored = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => { const [, mx] = t.test.split("/"); return a + (parseFloat(mx) || 0); }, 0) || 0), 0);

  const hasEmergency = totalMax > 0 && (totalScored / totalMax) < 0.5;

  const { theme } = useThemeStore();

  if (loading && !marks.length) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner" />
    </div>
  );

  if (theme === "cosmos") return <CosmosMarks marks={marks} titleMap={titleMap} />;

  if (theme === "matrix") return <MatrixMarks marks={marks} titleMap={titleMap} totalScored={totalScored} totalMax={totalMax} hasEmergency={hasEmergency} />;


  return (
    <div className="page-root">
      <Sidebar />

      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "140px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "#666666", textTransform: "uppercase" }}>
              Total Marks
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px" }}>
              <div style={{ fontSize: "72px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                {totalScored.toFixed(1)}
              </div>
              <div style={{ fontSize: "24px", color: "#555555", fontWeight: "bold" }}>
                /{totalMax.toFixed(0)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
            <button className="action-btn">
              <div className="icon-l">↑</div>
              <div className="text-c"><span>Target</span><span>Set Score Goals</span></div>
              <div className="icon-r">›</div>
            </button>
          </div>

          {hasEmergency && (
            <div style={{ padding: "24px", background: "#1a0000", border: "2px dashed #ff3b3b", borderRadius: "20px", marginBottom: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ff3b3b", marginBottom: "8px" }}>Academic Emergency</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#ff3b3b", lineHeight: 1 }}>OVERALL SCORE &lt; 50%</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {marks.map((m: any, i: number) => {
              const title = titleMap[m.courseCode] || m.courseCode;
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const maxTotal = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;

              return (
                <div key={i} style={{
                  background: "#1c1c1c",
                  borderRadius: "20px",
                  padding: "24px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "20px" }}>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                        <span style={{ fontSize: "36px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{scored.toFixed(0)}</span>
                        <span style={{ fontSize: "18px", color: "#666666", fontWeight: "bold" }}>/{maxTotal.toFixed(0)}</span>
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word", lineHeight: 1.2, paddingRight: "8px" }}>
                          {title}
                        </div>
                        <div style={{ background: "#333333", color: "#ffffff", fontSize: "10px", fontWeight: "bold", padding: "4px 8px", borderRadius: "99px", letterSpacing: "0.05em", flexShrink: 0 }}>
                          {m.courseType.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888888", fontWeight: "bold", letterSpacing: "0.05em" }}>
                        {m.courseCode}
                      </div>
                    </div>
                  </div>

                  {m.tests && m.tests.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {m.tests.map((t: any, j: number) => {
                        const parts = t.test.split("/");
                        const lbl = parts[0];
                        const mx = parseFloat(parts[1]) || 100;
                        const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                        const failed = sc < (mx * 0.5) || t.score === "Abs";

                        return (
                          <div key={j} style={{
                            background: failed ? "#3d0000" : "#2a3d00",
                            borderRadius: "12px",
                            padding: "8px 12px",
                            minWidth: "80px",
                            display: "flex", flexDirection: "column",
                            border: failed ? "1px solid #5a0000" : "none"
                          }}>
                            <div style={{ fontSize: "11px", color: "#888888", textTransform: "uppercase", marginBottom: "4px", fontWeight: 600 }}>{lbl}</div>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}>{t.score === "Abs" ? "ABS" : sc.toFixed(1)}</span>
                              <span style={{ fontSize: "11px", color: "#666666", marginLeft: "2px" }}>/{mx}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="watermark">Marks</div>
        </div>
      </main>
    </div>
  );
}

function MatrixMarks({ marks, titleMap, totalScored, totalMax, hasEmergency }: any) {
  return (
    <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "120px", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "20px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", marginTop: "20px" }}>
           <div>
              <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>ASSESSMENT</div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>Internal Marks</div>
           </div>
           <div style={{ background: "#1c1c1c", padding: "8px 16px", borderRadius: "14px", fontSize: "12px", fontWeight: 900, color: "#a8c200" }}>
              {marks.length} SUBJECTS
           </div>
        </div>

        {/* Big Total Marks Card */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
           <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, marginBottom: "8px" }}>Total Points</div>
           <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "12px" }}>
              <div style={{ fontSize: "120px", fontWeight: 900, lineHeight: 0.8, letterSpacing: "-0.05em" }}>{totalScored.toFixed(1)}</div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#333" }}>/{totalMax.toFixed(0)}</div>
           </div>
        </div>

        {hasEmergency && (
          <div style={{ background: "#ff3b3b", borderRadius: "28px", padding: "24px", marginBottom: "40px", color: "#000", textAlign: "center" }}>
             <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>Academic Alert</div>
             <div style={{ fontSize: "24px", fontWeight: 900 }}>CRITICAL SCORE STATUS</div>
          </div>
        )}

        {/* Subjects List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
           {marks.map((m: any, i: number) => {
              const title = titleMap[m.courseCode] || m.courseCode;
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const maxTotal = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
              const pct = (scored / (maxTotal || 1)) * 100;

              return (
                <div key={i} style={{ background: "#1c1c1c", borderRadius: "28px", padding: "24px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                      <div style={{ flex: 1, paddingRight: "16px" }}>
                         <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff", lineHeight: 1.2, textTransform: "capitalize" }}>{title.toLowerCase()}</div>
                         <div style={{ fontSize: "11px", color: "#666", fontWeight: 800, marginTop: "4px" }}>{m.courseCode}</div>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "2px" }}>
                         <div style={{ fontSize: "32px", fontWeight: 900, color: "#a8c200" }}>{scored.toFixed(0)}</div>
                         <div style={{ fontSize: "16px", color: "#666", fontWeight: 800 }}>/{maxTotal.toFixed(0)}</div>
                      </div>
                   </div>

                   {/* Test Breakdown */}
                   <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {m.tests?.map((t: any, j: number) => {
                         const [lbl] = t.test.split("/");
                         const sc = t.score === "Abs" ? "ABS" : t.score;
                         return (
                           <div key={j} style={{ background: "#000", padding: "10px 16px", borderRadius: "16px", border: "1px solid #333", minWidth: "80px" }}>
                              <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", fontWeight: 900, marginBottom: "2px" }}>{lbl}</div>
                              <div style={{ fontSize: "16px", fontWeight: 900, color: sc === "ABS" ? "#ff3b3b" : "#fff" }}>{sc}</div>
                           </div>
                         );
                      })}
                   </div>
                </div>
              );
           })}
        </div>
      </main>
    </div>
  );
}

function CosmosMarks({ marks, titleMap }: any) {
  const getRingColor = (pct: number) => {
    if (pct >= 75) return "#00FF88";
    if (pct >= 50) return "#FBBF24";
    if (pct >= 35) return "#FBBF24";
    return "#EF4444";
  };

  const courseTotals = marks.map((m: any) => {
    const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
    const maxTotal = m.tests?.reduce((s: number, t: any) => {
      const [, mx] = t.test.split("/");
      return s + (parseFloat(mx) || 0);
    }, 0) || 0;
    const pct = maxTotal > 0 ? (scored / maxTotal) * 100 : 0;
    return { scored, maxTotal, pct };
  });

  const totalScored = courseTotals.reduce((s: number, c: any) => s + c.scored, 0);
  const totalMax = courseTotals.reduce((s: number, c: any) => s + c.maxTotal, 0);
  const totalTests = marks.reduce((sum: number, m: any) => sum + (m.tests?.length || 0), 0);
  const formatTotal = (value: number) => value.toFixed(value % 1 === 0 ? 0 : 1);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: "100px", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main style={{ padding: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "12px" }}>
          <div>
            <div className="cosmos-text-glow" style={{ fontSize: "32px", lineHeight: 1.1, letterSpacing: "-0.02em", fontWeight: 800, marginBottom: "4px" }}>Marks Analytics</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Track subject-wise internal scores</div>
          </div>
          <button
            style={{
              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", borderRadius: "12px", padding: "10px 16px", color: "#fff", fontWeight: 800, fontSize: "12px",
              background: "linear-gradient(135deg, rgba(54,115,255,0.8), rgba(94,68,255,0.9))",
              boxShadow: "0 4px 20px rgba(94, 68, 255, 0.4)",
              letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.3s ease"
            }}
          >
            Analysis
          </button>
        </div>

        {/* Snapshot Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
           <div className="min-card" style={{ padding: "18px", borderRadius: "20px", background: "linear-gradient(145deg, rgba(36, 58, 132, 0.5), rgba(18, 29, 67, 0.7))", border: "1px solid rgba(124, 152, 255, 0.2)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "var(--accent)", filter: "blur(40px)", opacity: 0.4 }} />
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Total Points</div>
              <div style={{ fontSize: "34px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{totalScored.toFixed(1)} <span style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 700 }}>/ {totalMax.toFixed(0)}</span></div>
           </div>
           
           <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "10px" }}>
              <div className="min-card" style={{ padding: "12px 18px", borderRadius: "16px", background: "rgba(13, 20, 46, 0.6)", border: "1px solid rgba(255, 255, 255, 0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Subjects</div>
                 <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>{marks.length}</div>
              </div>
              <div className="min-card" style={{ padding: "12px 18px", borderRadius: "16px", background: "rgba(13, 20, 46, 0.6)", border: "1px solid rgba(255, 255, 255, 0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Tests Recorded</div>
                 <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>{totalTests}</div>
              </div>
           </div>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {marks.map((m: any, i: number) => {
            const title = titleMap[m.courseCode] || m.courseCode;
            const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
            const maxTotal = m.tests?.reduce((s: number, t: any) => {
              const [, mx] = t.test.split("/");
              return s + (parseFloat(mx) || 0);
            }, 0) || 0;
            const totalPct = maxTotal > 0 ? (scored / maxTotal) * 100 : 0;
            const totalRingColor = getRingColor(totalPct);
            const totalR = 22;
            const totalC = 2 * Math.PI * totalR;
            const totalOffset = totalC * (1 - Math.min(totalPct, 100) / 100);
            return (
              <div key={i} className="min-card" style={{ borderRadius: "20px", padding: "18px", background: "rgba(16, 25, 57, 0.7)", border: "1px solid rgba(255, 255, 255, 0.03)", transition: "all 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", lineHeight: 1.3, fontWeight: 800, color: "#eef2ff" }}>{title}</div>
                    <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 800, color: "#00FF88", letterSpacing: "0.04em" }}>
                      TOTAL: {formatTotal(scored)}/{maxTotal.toFixed(0)}
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {m.courseCode}
                    </div>
                  </div>
                  <div style={{ position: "relative", width: "56px", height: "56px", flexShrink: 0 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r={totalR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle
                        cx="28"
                        cy="28"
                        r={totalR}
                        fill="none"
                        stroke={totalRingColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={totalC}
                        strokeDashoffset={totalOffset}
                        transform="rotate(-90 28 28)"
                        style={{ transition: "stroke-dashoffset 1s ease-out" }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 900, color: "#fff" }}>{formatTotal(scored)}</div>
                      <div style={{ fontSize: "8px", color: "var(--text-muted)", marginTop: "2px", fontWeight: 700 }}>/{maxTotal.toFixed(0)}</div>
                    </div>
                  </div>
                </div>

                {m.tests?.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px" }}>
                    {m.tests.map((t: any, j: number) => {
                      const [lbl, mxStr] = t.test.split("/");
                      const mx = parseFloat(mxStr) || 100;
                      const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                      const pct = mx > 0 ? (sc / mx) * 100 : 0;
                      const ringColor = getRingColor(pct);
                      const r = 20;
                      const c = 2 * Math.PI * r;
                      const offset = c * (1 - pct / 100);

                      return (
                        <div key={j} style={{ background: "rgba(0,0,0,0.25)", borderRadius: "16px", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", border: "1px solid rgba(255,255,255,0.02)" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>{lbl}</div>
                          <div style={{ position: "relative", width: "50px", height: "50px" }}>
                            <svg width="50" height="50" viewBox="0 0 50 50">
                              <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                              <circle
                                cx="25"
                                cy="25"
                                r={r}
                                fill="none"
                                stroke={ringColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={c}
                                strokeDashoffset={offset}
                                transform="rotate(-90 25 25)"
                                style={{ transition: "stroke-dashoffset 1s ease-out" }}
                              />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                              <div style={{ fontSize: "13px", fontWeight: 900, color: "#fff" }}>{t.score === "Abs" ? "ABS" : sc.toFixed(sc % 1 === 0 ? 0 : 1)}</div>
                              <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px", fontWeight: 700 }}>/{mx}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>No tests recorded yet.</div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}



