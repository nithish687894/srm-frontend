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

  if (theme === "cosmos") return <CosmosMarks marks={marks} titleMap={titleMap} totalScored={totalScored} totalMax={totalMax} hasEmergency={hasEmergency} />;

  return <MatrixMarks marks={marks} titleMap={titleMap} totalScored={totalScored} totalMax={totalMax} hasEmergency={hasEmergency} />;
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

function CosmosMarks({ marks, titleMap, totalScored, totalMax, hasEmergency }: any) {
  const ringSize = 84;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const getRingColor = (pct: number) => {
    if (pct >= 75) return "#00E676";
    if (pct >= 50) return "#FBBF24";
    return "#EF4444";
  };

  return (
    <div style={{ background: "transparent", minHeight: "100vh", paddingBottom: "100px", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "18px" }}>
          <div>
            <h1 style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "4px" }}>Marks</h1>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Track subject-wise internal scores</div>
          </div>
          <button
            onClick={() => {}}
            style={{
              background: "linear-gradient(90deg, #325df8, #5b43ea)",
              border: "none",
              color: "#eef2ff",
              padding: "8px 12px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700
            }}
          >
            Analysis
          </button>
        </div>

        {hasEmergency && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "14px", padding: "16px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(239,68,68,0.2)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>!</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ef4444" }}>Academic Emergency</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Overall score is below 50%. Focus on upcoming assessments.</div>
            </div>
          </div>
        )}

        <div className="min-card" style={{ borderRadius: "14px", padding: "14px", marginBottom: "14px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>Performance Snapshot</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
            {[
              { label: "Total Points", value: `${totalScored.toFixed(1)} / ${totalMax.toFixed(0)}` },
              { label: "Subjects", value: marks.length },
              { label: "Recorded Tests", value: marks.reduce((n: any, m: any) => n + (m.tests?.length || 0), 0) }
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{s.label}</div>
                <div style={{ fontSize: "26px", fontWeight: 800, marginTop: "4px" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {marks.map((m: any, i: number) => {
            const title = titleMap[m.courseCode] || m.courseCode;
            return (
              <div
                key={i}
                style={{
                  background: "linear-gradient(180deg, rgba(22,34,73,0.82), rgba(13,22,52,0.84))",
                  borderRadius: "14px",
                  padding: "16px",
                  border: "1px solid rgba(132,157,255,0.22)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "10px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#eef2ff" }}>{title}</div>
                  <div style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "999px", background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(147,197,253,0.3)" }}>
                    {m.courseCode}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
                    gap: "14px",
                    alignItems: "start",
                  }}
                >
                  {m.tests?.map((t: any, j: number) => {
                    const [lbl, mxStr] = t.test.split("/");
                    const mx = parseFloat(mxStr) || 100;
                    const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                    const pct = Math.max(0, Math.min(100, (sc / mx) * 100));
                    const strokeDashoffset = circumference - (pct / 100) * circumference;
                    const ringColor = getRingColor(pct);
                    const scoreText = t.score === "Abs" ? "ABS" : sc.toFixed(2);

                    return (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          {lbl}
                        </div>
                        <div style={{ position: "relative", width: `${ringSize}px`, height: `${ringSize}px` }}>
                          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} aria-label={`${lbl} score ring`}>
                            <circle
                              cx={ringSize / 2}
                              cy={ringSize / 2}
                              r={radius}
                              stroke="#1E2A3A"
                              strokeWidth={strokeWidth}
                              fill="none"
                            />
                            <circle
                              cx={ringSize / 2}
                              cy={ringSize / 2}
                              r={radius}
                              stroke={ringColor}
                              strokeWidth={strokeWidth}
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                            />
                          </svg>
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1.1,
                            }}
                          >
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>{scoreText}</span>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>/ {mx}</span>
                          </div>
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



