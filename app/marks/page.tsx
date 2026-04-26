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
                    <div style={{ width: "80px", flexShrink: 0 }}>
                      <div style={{ fontSize: "40px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                        {scored.toFixed(0)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666666", fontWeight: "bold", marginTop: "4px" }}>
                        /{maxTotal.toFixed(0)} TOTAL
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
                      <div style={{ textAlign: "right" }}>
                         <div style={{ fontSize: "32px", fontWeight: 900, color: "#a8c200" }}>{scored.toFixed(0)}</div>
                         <div style={{ fontSize: "11px", color: "#666", fontWeight: 800 }}>/{maxTotal.toFixed(0)}</div>
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
    if (pct >= 50) return "#60A5FA";
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
  const overallPct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
  const overallCircumference = 2 * Math.PI * 52;
  const overallOffset = overallCircumference * (1 - overallPct / 100);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: "100px", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main style={{ padding: "20px" }}>
        <div
          className="min-card"
          style={{
            marginBottom: "20px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            background: "linear-gradient(135deg, rgba(26,117,255,0.20) 0%, rgba(107,51,255,0.14) 45%, rgba(0,255,136,0.08) 100%)",
            border: "1px solid rgba(120,140,255,0.28)",
          }}
        >
          <svg width="124" height="124" viewBox="0 0 124 124" style={{ flexShrink: 0 }}>
            <circle cx="62" cy="62" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="62"
              cy="62"
              r="52"
              fill="none"
              stroke={getRingColor(overallPct)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={overallCircumference}
              strokeDashoffset={overallOffset}
              transform="rotate(-90 62 62)"
              style={{ transition: "stroke-dashoffset 0.45s ease" }}
            />
            <text x="62" y="58" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800">
              {overallPct.toFixed(0)}%
            </text>
            <text x="62" y="76" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="700">
              OVERALL
            </text>
          </svg>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px", color: "#fff" }}>Marks Analytics</h1>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
              Circular performance overview across all internal assessments.
            </div>
            <div style={{ display: "inline-flex", gap: "6px", alignItems: "baseline", padding: "6px 10px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>{totalScored.toFixed(1)}</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/ {totalMax.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {marks.map((m: any, i: number) => {
            const title = titleMap[m.courseCode] || m.courseCode;
            const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
            const maxTotal = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
            const pct = maxTotal > 0 ? (scored / maxTotal) * 100 : 0;
            const ringColor = getRingColor(pct);
            const ringCirc = 2 * Math.PI * 28;
            const ringOffset = ringCirc * (1 - pct / 100);
            return (
              <div key={i} className="min-card" style={{ borderRadius: "18px", padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
                  <svg width="68" height="68" viewBox="0 0 68 68" style={{ flexShrink: 0 }}>
                    <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
                    <circle
                      cx="34"
                      cy="34"
                      r="28"
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={ringCirc}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 34 34)"
                    />
                    <text x="34" y="38" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">
                      {pct.toFixed(0)}%
                    </text>
                  </svg>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{title}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>{m.courseCode}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {m.tests?.map((t: any, j: number) => {
                    const [lbl, mxStr] = t.test.split("/");
                    const mx = parseFloat(mxStr) || 100;
                    const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                    const pct = (sc / mx) * 100;
                    const barColor = pct >= 60 ? "var(--accent-secondary)" : pct >= 40 ? "#fbbf24" : "var(--accent-red)";

                    return (
                      <div key={j}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{lbl}</div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent)" }}>{t.score === "Abs" ? "ABS" : t.score}<span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 500 }}> / {mx}</span></div>
                        </div>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: barColor, width: `${pct}%`, borderRadius: "99px" }} />
                        </div>
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



