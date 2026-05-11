"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useThemeStore } from "@/lib/themeStore";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

// ─── Grade Table ──────────────────────────────────────────────────────────────
const GRADE_TABLE = [
  { min: 91, grade: "O",  points: 10, color: "#00FF88" },
  { min: 81, grade: "A+", points: 9,  color: "#4ade80" },
  { min: 71, grade: "A",  points: 8,  color: "#a3e635" },
  { min: 61, grade: "B+", points: 7,  color: "#facc15" },
  { min: 51, grade: "B",  points: 6,  color: "#fb923c" },
  { min: 0,  grade: "C",  points: 5,  color: "#f87171" },
];

function getGrade(pct: number) {
  return GRADE_TABLE.find(g => pct >= g.min) || GRADE_TABLE[GRADE_TABLE.length - 1];
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AppToolsPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<"cgpa" | "attendance" | "final">("cgpa");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const { academicData } = useAuthStore();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
      router.push("/"); return;
    }
    // Try from cache first
    if (academicData?.attendance) setAttendance(academicData.attendance);
    if (academicData?.marks) setMarks(academicData.marks);
    if (academicData?.attendance || academicData?.marks) setDataLoaded(true);

    // Fetch fresh data
    Promise.all([dataAPI.getAttendance(), dataAPI.getMarks()])
      .then(([a, m]) => {
        setAttendance(a.data || []);
        setMarks(m.data || []);
        setDataLoaded(true);
      })
      .catch(() => setDataLoaded(true));
  }, []);

  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "120px" }}>

          {/* Header */}
          <div style={{ marginBottom: "24px", marginTop: "8px" }}>
            <div className="cosmos-text-glow" style={{
              fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em",
              lineHeight: 1.1, marginBottom: "4px"
            }}>
              Tools
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Calculators & Simulators
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{
            display: "flex", gap: "8px", marginBottom: "24px",
            background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "4px"
          }}>
            {[
              { key: "cgpa",       label: "📊 CGPA" },
              { key: "attendance", label: "📅 Attendance" },
              { key: "final",      label: "🎯 Pass Predictor" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: "12px", border: "none",
                  fontWeight: 800, fontSize: "11px", cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: activeTab === tab.key
                    ? "linear-gradient(135deg, rgba(54,115,255,0.8), rgba(94,68,255,0.9))"
                    : "transparent",
                  color: activeTab === tab.key ? "#fff" : "var(--text-muted)",
                  boxShadow: activeTab === tab.key ? "0 4px 16px rgba(94,68,255,0.3)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {!dataLoaded ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <div className="srmx-spinner" />
            </div>
          ) : activeTab === "cgpa" ? (
            <CGPACalculator attendance={attendance} marks={marks} />
          ) : activeTab === "attendance" ? (
            <AttendanceCalculator attendance={attendance} />
          ) : (
            <FinalPassPredictor attendance={attendance} marks={marks} />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Final Pass Predictor (60/40) ─────────────────────────────────────────────
function FinalPassPredictor({ attendance, marks }: { attendance: any[]; marks: any[] }) {
  const [externals, setExternals] = useState<Record<string, number>>({});
  
  const subjects = attendance.filter(c => 
    c["Category"] === "Theory" || c["Course Type"] === "TH" || !c["Category"]
  );

  // Map marks to subjects
  const marksMap: Record<string, any> = {};
  marks.forEach(m => { marksMap[m.courseCode] = m; });

  if (subjects.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎯</div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)" }}>No subject data loaded.</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>Visit the Attendance or Marks page to sync your subjects.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ 
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "16px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5
      }}>
        💡 <b>Pass Criteria:</b> Internal (60) + University Exam (40) ≥ 50 total marks. University exam (100) is scaled down to 40. PASS = 50.
      </div>

      {subjects.map((c, i) => {
        const code = c["Course Code"];
        const mData = marksMap[code];
        
        // Calculate Internal out of 60
        let scoredInternals = 0;
        let totalWeight = 0;
        if (mData && mData.tests) {
          mData.tests.forEach((t: any) => {
            const parts = t.test.split("/");
            const max = parseFloat(parts[1]) || 25;
            const score = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
            scoredInternals += score;
            totalWeight += max;
          });
        }
        
        const internal60 = totalWeight > 0 ? (scoredInternals / totalWeight) * 60 : 30;
        const ext100 = externals[code] ?? 50;
        const ext40 = (ext100 / 100) * 40;
        const totalPass = internal60 + ext40;
        const isPassing = totalPass >= 50;
        const statusColor = isPassing ? "#00FF88" : "#f87171";

        return (
          <div key={i} className="min-card" style={{
            padding: "20px", borderRadius: "24px",
            background: isPassing ? "rgba(16,25,57,0.7)" : "rgba(239,68,68,0.05)",
            border: `1px solid ${isPassing ? "rgba(255,255,255,0.04)" : "rgba(239,68,68,0.15)"}`,
            transition: "all 0.3s ease"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ flex: 1, paddingRight: "16px" }}>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{c["Course Title"]}</div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 700 }}>{code}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ 
                  fontSize: "10px", fontWeight: 900, textTransform: "uppercase", 
                  color: statusColor, marginBottom: "4px", letterSpacing: "0.05em"
                }}>
                  {isPassing ? "Predicted Pass" : "At Risk"}
                </div>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  {totalPass.toFixed(1)}<span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/100</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", marginBottom: "6px" }}>Internal (60)</div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#eef2ff" }}>{internal60.toFixed(1)}</div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "8px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#7c58ff", width: `${(internal60/60)*100}%`, transition: "width 1s ease" }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", marginBottom: "6px" }}>Simulate Univ (100)</div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#3673ff" }}>{ext100}</div>
                <input 
                  type="range" min={0} max={100} value={ext100}
                  onChange={e => setExternals(p => ({ ...p, [code]: parseInt(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#3673ff", marginTop: "8px", height: "4px" }}
                />
              </div>
            </div>

            <div style={{ 
              fontSize: "11px", fontWeight: 700, padding: "12px", borderRadius: "14px",
              background: isPassing ? "rgba(0,255,136,0.05)" : "rgba(239,68,68,0.1)",
              color: statusColor, textAlign: "center", border: `1px solid ${statusColor}1A`
            }}>
              {isPassing 
                ? `Minimum to Pass: ${Math.max(0, Math.ceil((50 - internal60) * 2.5))} marks in University Exam.`
                : `Critical: You need at least ${Math.ceil((50 - internal60) * 2.5)} marks in University Exam to pass.`
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CGPA Calculator ──────────────────────────────────────────────────────────
function CGPACalculator({ attendance, marks }: { attendance: any[]; marks: any[] }) {
  const [internals, setInternals] = useState<Record<string, number>>({});
  const [externals, setExternals] = useState<Record<string, number>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || marks.length === 0) return;
    const init: Record<string, number> = {};
    marks.forEach((mk: any) => {
      const scored = mk.tests?.reduce((s: number, t: any) =>
        s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
      const maxTotal = mk.tests?.reduce((s: number, t: any) => {
        const parts = t.test.split("/");
        return s + (parseFloat(parts[1]) || 0);
      }, 0) || 0;
      if (maxTotal > 0) init[mk.courseCode] = Math.round((scored / maxTotal) * 50);
    });
    setInternals(init);
    setInitialized(true);
  }, [marks, initialized]);

  const theorySubjects = attendance.filter(c => c["Category"] === "Theory" || c["Course Type"] === "TH" || !c["Category"]);

  const rows = theorySubjects.map(c => {
    const code = c["Course Code"];
    const intMark = internals[code] ?? 25;
    const extMark = externals[code] ?? 60;
    const total = Math.min(intMark, 50) + Math.min(extMark, 50);
    const grade = getGrade(total);
    return { code, title: c["Course Title"] || code, intMark, extMark, total, grade };
  });

  const gpa = rows.length > 0 ? rows.reduce((s, r) => s + r.grade.points, 0) / rows.length : 0;
  const gpaColor = gpa >= 9 ? "#00FF88" : gpa >= 7 ? "#facc15" : gpa >= 6 ? "#fb923c" : "#f87171";
  const gpaLabel = gpa >= 9 ? "Outstanding" : gpa >= 8 ? "Excellent" : gpa >= 7 ? "Good" : gpa >= 6 ? "Average" : "Needs Work";

  if (theorySubjects.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>📊</div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)" }}>No subject data loaded yet.</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>Visit Marks or Attendance page first to load your data.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: "linear-gradient(145deg, rgba(36,58,132,0.5), rgba(18,29,67,0.7))",
        border: "1px solid rgba(124,152,255,0.2)", borderRadius: "24px",
        padding: "24px", marginBottom: "20px", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", background: gpaColor, filter: "blur(60px)", opacity: 0.25 }} />
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "8px" }}>
          Estimated GPA
        </div>
        <div style={{ fontSize: "72px", fontWeight: 900, color: gpaColor, lineHeight: 1, letterSpacing: "-0.04em" }}>
          {gpa.toFixed(2)}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 800, color: gpaColor, marginTop: "8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {gpaLabel}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
          {GRADE_TABLE.map(g => (
            <div key={g.grade} style={{ textAlign: "center", opacity: rows.some(r => r.grade.grade === g.grade) ? 1 : 0.25 }}>
              <div style={{ fontSize: "18px", fontWeight: 900, color: g.color }}>{g.grade}</div>
              <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>{g.points}pt</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rows.map((r) => (
          <div key={r.code} className="min-card" style={{
            padding: "18px", borderRadius: "20px",
            background: "rgba(16,25,57,0.7)", border: "1px solid rgba(255,255,255,0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ flex: 1, paddingRight: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#eef2ff", lineHeight: 1.3 }}>{r.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 700 }}>{r.code}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "28px", fontWeight: 900, color: r.grade.color, lineHeight: 1 }}>{r.grade.grade}</div>
                <div style={{ fontSize: "10px", color: r.grade.color, fontWeight: 800 }}>{r.total}/100</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Internal</span>
                  <span style={{ fontSize: "12px", fontWeight: 900, color: "#fff" }}>{r.intMark}<span style={{ color: "var(--text-muted)", fontWeight: 600 }}>/50</span></span>
                </div>
                <input
                  type="range" min={0} max={50} value={r.intMark}
                  onChange={e => setInternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#7c58ff", height: "4px" }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>External</span>
                  <span style={{ fontSize: "12px", fontWeight: 900, color: "#fff" }}>{r.extMark}<span style={{ color: "var(--text-muted)", fontWeight: 600 }}>/50</span></span>
                </div>
                <input
                  type="range" min={0} max={50} value={r.extMark}
                  onChange={e => setExternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#3673ff", height: "4px" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px", fontSize: "11px", color: "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>
        Drag sliders to simulate internal & external scores. GPA updates in real time.
      </div>
    </div>
  );
}

// ─── Attendance Calculator ────────────────────────────────────────────────────
function AttendanceCalculator({ attendance }: { attendance: any[] }) {
  const [conducted, setConducted] = useState<string>("");
  const [attended, setAttended] = useState<string>("");
  const [target, setTarget] = useState<number>(75);

  const totalC = parseInt(conducted) || 0;
  const totalA = parseInt(attended) || 0;
  const manualPct = totalC > 0 ? (totalA / totalC) * 100 : 0;
  const isSafe = manualPct >= target;
  const canBunk = isSafe ? Math.floor((totalA - target / 100 * totalC) / (target / 100)) : 0;
  const needAttend = !isSafe && totalC > 0
    ? Math.ceil((target / 100 * totalC - totalA) / (1 - target / 100))
    : 0;

  return (
    <div>
      <div style={{
        background: "linear-gradient(145deg, rgba(36,58,132,0.5), rgba(18,29,67,0.7))",
        border: "1px solid rgba(124,152,255,0.2)", borderRadius: "24px",
        padding: "24px", marginBottom: "20px"
      }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginBottom: "20px", letterSpacing: "-0.01em" }}>
          📅 Attendance Calculator
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
              Classes Conducted
            </label>
            <input
              type="number" min={0} value={conducted}
              onChange={e => setConducted(e.target.value)}
              placeholder="e.g. 50"
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px", padding: "12px 14px", color: "#fff", fontSize: "16px", fontWeight: 800,
                outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
              Classes Attended
            </label>
            <input
              type="number" min={0} value={attended}
              onChange={e => setAttended(e.target.value)}
              placeholder="e.g. 40"
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px", padding: "12px 14px", color: "#fff", fontSize: "16px", fontWeight: 800,
                outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Target %</span>
            <span style={{ fontSize: "13px", fontWeight: 900, color: "#fff" }}>{target}%</span>
          </div>
          <input
            type="range" min={50} max={100} value={target}
            onChange={e => setTarget(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#7c58ff", height: "4px" }}
          />
        </div>

        {totalC > 0 && (
          <div style={{
            background: isSafe ? "rgba(0,255,136,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${isSafe ? "rgba(0,255,136,0.2)" : "rgba(239,68,68,0.2)"}`,
            borderRadius: "16px", padding: "20px", textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", fontWeight: 900, color: isSafe ? "#00FF88" : "#f87171", lineHeight: 1 }}>
              {manualPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: "12px", fontWeight: 800, color: isSafe ? "#00FF88" : "#f87171", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {isSafe ? `✅ Safe — Can bunk ${canBunk} more class${canBunk !== 1 ? "es" : ""}` : `⚠️ At Risk — Attend ${needAttend} more class${needAttend !== 1 ? "es" : ""} to reach ${target}%`}
            </div>
          </div>
        )}
      </div>

      {attendance.length > 0 && (
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            Your Subjects
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {attendance.map((c: any, i: number) => {
              const attn = parseFloat(c["Attn %"]) || 0;
              const cond = parseInt(c["Hours Conducted"]) || 0;
              const abs = parseInt(c["Hours Absent"]) || 0;
              const pres = cond - abs;
              const isRisk = attn < 75;
              const isWarning = attn >= 75 && attn < 80;
              
              const canSkip = isRisk ? 0 : Math.floor((pres / 0.75) - cond);
              const needMore = isRisk ? Math.ceil(3 * cond - 4 * pres) : 0;
              
              let statusColor = "#00FF88"; // Green
              let statusText = isRisk ? `Need ${needMore}` : canSkip === 0 ? "Critical" : `Skip ${canSkip}`;
              
              if (isRisk) statusColor = "#f87171"; // Red
              else if (isWarning || canSkip === 0) statusColor = "#ff8c00"; // Orange

              const isNoData = cond === 0;
              if (isNoData) {
                statusColor = attn > 0 ? "#ff8c00" : "rgba(255,255,255,0.2)";
                statusText = attn > 0 ? "Pending Sync" : "No Data";
              }

              return (
                <div key={i} className="min-card" style={{
                  padding: "16px", borderRadius: "18px",
                  background: isRisk ? "rgba(239,68,68,0.06)" : (isWarning ? "rgba(255,140,0,0.06)" : "rgba(16,25,57,0.7)"),
                  border: `1px solid ${isRisk ? "rgba(239,68,68,0.2)" : (isWarning ? "rgba(255,140,0,0.2)" : "rgba(255,255,255,0.04)")}`,
                  opacity: (isNoData && attn === 0) ? 0.6 : 1,
                  transition: "all 0.3s ease"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#eef2ff", lineHeight: 1.3 }}>{c["Course Title"]}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 700 }}>
                        {pres}/{cond} • {c["Course Code"]}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: "12px" }}>
                      <div style={{ 
                        fontSize: "20px", fontWeight: 900, color: statusColor,
                        textShadow: attn > 0 ? `0 0 15px ${statusColor}33` : "none"
                      }}>{attn}%</div>
                      <div style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: statusColor }}>
                        {statusText}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden", marginTop: "12px" }}>
                    <div style={{ 
                      height: "100%", background: statusColor, width: `${Math.min(attn, 100)}%`, borderRadius: "99px", 
                      transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: attn > 0 ? `0 0 8px ${statusColor}44` : "none"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
