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
  const ringSize = 72;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const getRingColor = (pct: number) => {
    if (pct >= 85) return "#00f0ff"; // Cyber Cyan
    if (pct >= 70) return "#3b82f6"; // Blue
    if (pct >= 50) return "#d946ef"; // Pink
    return "#ef4444"; // Red
  };

  return (
    <div className="page-root theme-cosmos" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <Sidebar />
      <main className="page-main" style={{ padding: "24px 20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--accent-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>Assessment</div>
            <h1 className="cosmos-text-glow" style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>Performance</h1>
          </div>
          <button className="action-btn">
             <span className="text-c">
               <span>Analytics</span>
             </span>
             <div className="icon-r">→</div>
          </button>
        </div>

        {hasEmergency && (
          <div className="min-card" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontWeight: 900, fontSize: "20px", boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)" }}>!</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em" }}>Academic Alert</div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px" }}>Overall score is below 50%. Immediate attention required for upcoming assessments.</div>
            </div>
          </div>
        )}

        <div className="min-card" style={{ marginBottom: "32px", padding: "24px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 800, marginBottom: "20px" }}>Global Overview</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "space-between", alignItems: "flex-end" }}>
            
            <div style={{ flex: "1 1 200px" }}>
               <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px" }}>Total Points Scored</div>
               <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                 <div className="cosmos-text-glow" style={{ fontSize: "56px", fontWeight: 900, lineHeight: 0.9 }}>{totalScored.toFixed(1)}</div>
                 <div style={{ fontSize: "20px", color: "var(--text-secondary)", fontWeight: 700 }}>/ {totalMax.toFixed(0)}</div>
               </div>
            </div>

            <div style={{ display: "flex", gap: "16px", flex: "1 1 200px" }}>
               <div style={{ flex: 1, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", backdropFilter: "blur(10px)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subjects</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{marks.length}</div>
               </div>

               <div style={{ flex: 1, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", backdropFilter: "blur(10px)" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assessments</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{marks.reduce((n: any, m: any) => n + (m.tests?.length || 0), 0)}</div>
               </div>
            </div>

          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", paddingBottom: "100px" }}>
          {marks.map((m: any, i: number) => {
            const title = titleMap[m.courseCode] || m.courseCode;
            const mScored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
            const mMax = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
            const mPct = mMax > 0 ? (mScored / mMax) * 100 : 0;
            const subjectColor = getRingColor(mPct);

            return (
              <div key={i} className="min-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                
                <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", background: subjectColor, opacity: 0.15, filter: "blur(50px)", borderRadius: "50%", pointerEvents: "none" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: "8px" }}>{title}</div>
                    <div style={{ display: "inline-block", padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                       <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                         {m.courseCode}
                       </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: subjectColor, textShadow: `0 0 15px ${subjectColor}40`, lineHeight: 1 }}>{mScored.toFixed(1)}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, marginTop: "4px" }}>/ {mMax.toFixed(0)}</div>
                  </div>
                </div>

                <div style={{ display: "flex", overflowX: "auto", gap: "16px", paddingBottom: "8px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                  {m.tests?.map((t: any, j: number) => {
                    const [lbl, mxStr] = t.test.split("/");
                    const mx = parseFloat(mxStr) || 100;
                    const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                    const pct = Math.max(0, Math.min(100, (sc / mx) * 100));
                    const strokeDashoffset = circumference - (pct / 100) * circumference;
                    const ringColor = getRingColor(pct);
                    const isAbs = t.score === "Abs";

                    return (
                      <div key={j} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <div style={{ position: "relative", width: `${ringSize}px`, height: `${ringSize}px` }}>
                          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} style={{ transform: "rotate(-90deg)" }}>
                            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="none" />
                            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke={ringColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ filter: `drop-shadow(0 0 8px ${ringColor}80)`, transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: isAbs ? "12px" : "16px", fontWeight: 900, color: isAbs ? "#ef4444" : "#fff", letterSpacing: "-0.02em" }}>{isAbs ? "ABS" : sc}</span>
                            {!isAbs && <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>/ {mx}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{lbl}</div>
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



