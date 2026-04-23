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

  if (loading && !marks.length) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner" />
    </div>
  );

  const { theme } = useThemeStore();
  if (theme === "cosmos") return <CosmosMarks marks={marks} titleMap={titleMap} />;
  if (theme === "editorial") return <EditorialMarks marks={marks} titleMap={titleMap} />;

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

function CosmosMarks({ marks, titleMap }: any) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: "100px", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>Marks</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {marks.map((m: any, i: number) => {
            const title = titleMap[m.courseCode] || m.courseCode;
            return (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "20px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>{title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {m.tests?.map((t: any, j: number) => {
                    const [lbl, mxStr] = t.test.split("/");
                    const mx = parseFloat(mxStr) || 100;
                    const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                    const pct = (sc / mx) * 100;
                    const barColor = pct >= 60 ? "var(--accent-green)" : pct >= 40 ? "#fbbf24" : "var(--accent-red)";

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

function EditorialMarks({ marks, titleMap }: any) {
  return (
    <div style={{ background: "#f5f2eb", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "40px 20px" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "48px", fontWeight: 900, color: "#111", marginBottom: "48px" }}>MARKS</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
          {marks.map((m: any, i: number) => {
            const title = titleMap[m.courseCode] || m.courseCode;
            return (
              <div key={i}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", fontWeight: 700, color: "#111", marginBottom: "24px", borderBottom: "2px solid #111", paddingBottom: "8px" }}>
                  {title.toLowerCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {m.tests?.map((t: any, j: number) => {
                    const [lbl, mx] = t.test.split("/");
                    const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                    const isLow = (sc / parseFloat(mx)) < 0.5;
                    return (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }}>{lbl}</div>
                        </div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "32px", fontWeight: 700, color: isLow ? "#c0392b" : "#111" }}>
                          {t.score === "Abs" ? "ABS" : t.score}
                          <span style={{ fontSize: "0.5em", opacity: 0.3, marginLeft: "4px" }}>/{mx}</span>
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

function EditorialMarks({ marks, titleMap }: any) {
  return (
    <div style={{ background: "#f5f2eb", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "40px 20px" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "48px", fontWeight: 900, color: "#111", marginBottom: "48px" }}>MARKS</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
          {marks.map((m: any, i: number) => {
            const title = titleMap[m.courseCode] || m.courseCode;
            return (
              <div key={i}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", fontWeight: 700, color: "#111", marginBottom: "24px", borderBottom: "2px solid #111", paddingBottom: "8px" }}>
                  {title.toLowerCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {m.tests?.map((t: any, j: number) => {
                    const [lbl, mx] = t.test.split("/");
                    const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                    const isLow = (sc / parseFloat(mx)) < 0.5;
                    return (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }}>{lbl}</div>
                        </div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "32px", fontWeight: 700, color: isLow ? "#c0392b" : "#111" }}>
                          {t.score === "Abs" ? "ABS" : t.score}
                          <span style={{ fontSize: "0.5em", opacity: 0.3, marginLeft: "4px" }}>/{mx}</span>
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
