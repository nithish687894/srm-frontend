"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DynamicGauge from "@/components/DynamicGauge";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useThemeStore } from "@/lib/themeStore";

function buildSlotToCourseMap(myTT: any[]) {
  const map: Record<string, any> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

export default function AttendancePage() {
  const { ready } = useAuth();
  const { academicData, setAcademicData } = useAuthStore();
  const [att, setAtt] = useState<any[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.attendance);

  const [calData, setCalData] = useState<any>(null);
  const [ttData, setTTData] = useState<any>(null);
  
  const [showPredictor, setShowPredictor] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<any[] | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (academicData?.attendance) setLoading(false);
    dataAPI.getAttendance()
      .then(d => { setAtt(d.data || []); setAcademicData({ ...academicData, attendance: d.data || [] }); setLoading(false); })
      .catch(() => { if (!att.length) router.push("/"); });

    dataAPI.getCalendar().then(d => setCalData(d)).catch(() => {});
    Promise.all([dataAPI.getTimetable(1), dataAPI.getMyTimetable()]).then(([tt, myTT]) => {
      setTTData({ rows: tt?.data?.rows || [], myTT: myTT?.data || [] });
    }).catch(() => {});
  }, [ready]);

  const calIndex = useMemo(() => {
    if (!calData) return null;
    try { return buildCalendarIndex(calData); } catch { return null; }
  }, [calData]);

  // Generate 30 days for predictor
  const next30Days = useMemo(() => {
    const days = [];
    const t = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(t);
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        iso,
        dayStr: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d),
        dateNum: d.getDate()
      });
    }
    return days;
  }, []);

  const toggleDate = (iso: string) => {
    const next = new Set(selectedDates);
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    setSelectedDates(next);
  };

  const calculatePredictions = () => {
    if (!calIndex || !ttData || att.length === 0) return;
    
    // 1. Map DayOrder -> list of course codes
    const doToCourses: Record<number, string[]> = {};
    const slotMap = buildSlotToCourseMap(ttData.myTT);
    const dayRows = ttData.rows.filter((r: any) => typeof r[0] === "string" && r[0].startsWith("Day"));
    
    dayRows.forEach((row: any, doIdx: number) => {
      const dOrder = doIdx + 1;
      doToCourses[dOrder] = [];
      const cells: string[] = row.slice(1);
      
      cells.forEach((cell) => {
        const s = cell?.trim()?.toUpperCase();
        if (!s || s === "-") return;
        if (/^[PL]\d+$/i.test(s)) {
          const course = slotMap[s];
          if (course) doToCourses[dOrder].push(course.courseCode);
        } else {
          for (const part of s.split("/")) {
            const letter = part.trim().replace(/[^A-Z]/g, "");
            if (!letter || letter === "X") continue;
            const course = slotMap[letter];
            if (course) {
              doToCourses[dOrder].push(course.courseCode);
              break;
            }
          }
        }
      });
    });

    // 2. Tally missed classes by course code based on selected dates
    const missedClasses: Record<string, number> = {};
    selectedDates.forEach(iso => {
      const info = calIndex.byDate.get(iso);
      if (info && !info.isHoliday && info.dayOrder) {
        const courses = doToCourses[info.dayOrder] || [];
        courses.forEach(c => {
          missedClasses[c] = (missedClasses[c] || 0) + 1;
        });
      }
    });

    // 3. Compute for all subjects
    const results = att.map((c: any) => {
      const code = c["Course Code"];
      const cond = parseInt(c["Hours Conducted"]) || 0;
      const abs = parseInt(c["Hours Absent"]) || 0;
      const pres = cond - abs;
      const currentPct = parseFloat(c["Attn %"]) || 0;
      
      const futureMissing = missedClasses[code] || 0;
      const projCond = cond + futureMissing;
      const projPct = projCond === 0 ? 0 : (pres / projCond) * 100;
      
      let marginLabel = "";
      let marginSafe = false;
      let alreadyRisk = currentPct < 75;

      if (projPct >= 75) {
        // Can miss how many more?
        // (pres) / (projCond + M) >= 0.75  =>  projCond + M <= pres / 0.75  =>  M <= (pres/0.75) - projCond
        const M = Math.floor((pres / 0.75) - projCond);
        marginLabel = `Safe to skip (buffer: ${M} classes)`;
        marginSafe = true;
      } else {
        // Needs how many to recover?
        // (pres + N) / (projCond + N) >= 0.75 => pres + N >= 0.75 projCond + 0.75 N => 0.25 N >= 0.75 projCond - pres => N >= 3 projCond - 4 pres
        const N = Math.ceil(3 * projCond - 4 * pres);
        if (alreadyRisk) {
          marginLabel = `Already at risk — do not skip`;
        } else {
          marginLabel = `Will fall below 75% — must attend ${N} more classes to recover`;
        }
        marginSafe = false;
      }

      return {
        code,
        title: c["Course Title"],
        currentPct,
        projPct,
        marginLabel,
        marginSafe,
        futureMissing
      };
    }).filter(r => r.futureMissing > 0 || r.currentPct < 75); // Only show affected or at-risk subjects

    setPredictions(results);
  };

  const riskClasses = att.filter(c => parseFloat(c["Attn %"]) < 75);
  const avgAtt = att.length
    ? (att.reduce((s, c) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";

  const totalAgg = att.reduce((acc, c) => acc + parseInt(c["Hours Conducted"] || "0"), 0);
  const absentAgg = att.reduce((acc, c) => acc + parseInt(c["Hours Absent"] || "0"), 0);
  const presentAgg = totalAgg - absentAgg;

  if (loading && !att.length) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner" />
    </div>
  );

  const { theme } = useThemeStore();
  if (theme === "cosmos") return <CosmosAttendance att={att} avgAtt={avgAtt} totalAgg={totalAgg} presentAgg={presentAgg} absentAgg={absentAgg} />;
  if (theme === "editorial") return <EditorialAttendance att={att} avgAtt={avgAtt} totalAgg={totalAgg} presentAgg={presentAgg} absentAgg={absentAgg} />;

  return (
    <div className="page-root">
      <Sidebar />

      <main className="page-main">
        <div className="page-content" data-section="Attendance" style={{ paddingBottom: "140px" }}>


          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "24px" }}>
              Overall Attendance
            </div>
            
            <DynamicGauge value={parseFloat(avgAtt)} size={200} strokeWidth={12} />
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", width: "100%", maxWidth: "400px", margin: "32px auto 0" }}>
              <div style={{ background: "#0a1f33", padding: "16px", borderRadius: "16px", border: "1px solid #1a334d" }}>
                <div style={{ fontSize: "11px", color: "#66aaff", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", marginBottom: "4px" }}>Total</div>
                <div style={{ fontSize: "24px", color: "#ffffff", fontWeight: 900 }}>{totalAgg}</div>
              </div>
              <div style={{ background: "#0d2a1a", padding: "16px", borderRadius: "16px", border: "1px solid #1a4d33" }}>
                <div style={{ fontSize: "11px", color: "#33ff88", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", marginBottom: "4px" }}>Present</div>
                <div style={{ fontSize: "24px", color: "#ffffff", fontWeight: 900 }}>{presentAgg}</div>
              </div>
              <div style={{ background: "#330a0a", padding: "16px", borderRadius: "16px", border: "1px solid #4d1a1a" }}>
                <div style={{ fontSize: "11px", color: "#ff5555", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold", marginBottom: "4px" }}>Absent</div>
                <div style={{ fontSize: "24px", color: "#ffffff", fontWeight: 900 }}>{absentAgg}</div>
              </div>
            </div>

            <div style={{ height: "4px", background: "#333", borderRadius: "2px", width: "100%", maxWidth: "400px", margin: "24px auto 0", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${(presentAgg / (totalAgg || 1)) * 100}%`, background: "#33ff88", height: "100%" }} />
              <div style={{ width: `${(absentAgg / (totalAgg || 1)) * 100}%`, background: "#ff5555", height: "100%" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: showPredictor ? "24px" : "40px" }}>
            <button className="action-btn" onClick={() => setShowPredictor(!showPredictor)}>
              <div className="icon-l">?</div>
              <div className="text-c"><span>Predict</span><span>Attendance Calculator</span></div>
              <div className="icon-r">{showPredictor ? "▾" : "›"}</div>
            </button>
          </div>

          {showPredictor && (
            <div style={{ background: "#1a1a1a", borderRadius: "20px", padding: "24px", marginBottom: "32px", animation: "slideDown 0.3s ease-out forwards" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>Attendance Predictor</div>
                  <div style={{ fontSize: "13px", color: "#888888" }}>Select dates you plan to skip</div>
                </div>
                {predictions && (
                  <button onClick={() => { setSelectedDates(new Set()); setPredictions(null); }} style={{ background: "none", border: "none", color: "#666666", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.1em", cursor: "pointer" }}>Reset</button>
                )}
              </div>

              <div style={{ display: "flex", overflowX: "auto", gap: "8px", paddingBottom: "16px", scrollbarWidth: "none" }}>
                {next30Days.map(d => {
                  const sel = selectedDates.has(d.iso);
                  const isWknd = [0, 6].includes(d.date.getDay());
                  return (
                    <div key={d.iso} onClick={() => !isWknd && toggleDate(d.iso)}
                      style={{ 
                        flexShrink: 0, width: "48px", height: "64px", borderRadius: "12px", 
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        background: sel ? "#ff3b3b" : "#2a2a2a", 
                        cursor: isWknd ? "not-allowed" : "pointer",
                        opacity: isWknd ? 0.3 : 1, transition: "background 0.2s"
                      }}>
                      <div style={{ fontSize: "10px", color: sel ? "#ffffff" : "#888888", fontWeight: "bold" }}>{d.dayStr}</div>
                      <div style={{ fontSize: "20px", color: sel ? "#ffffff" : "#ffffff", fontWeight: 900 }}>{d.dateNum}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#a8c200", marginBottom: "16px" }}>
                {selectedDates.size} dates selected
              </div>

              <button onClick={calculatePredictions} style={{ width: "100%", padding: "16px", background: "#a8c200", borderRadius: "99px", color: "#000000", fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer" }}>
                Calculate
              </button>

              {predictions && (
                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
                  {predictions.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#888888", textAlign: "center" }}>No classes missed on selected dates.</div>
                  ) : predictions.map((p, i) => (
                    <div key={i} style={{ background: "#000000", borderRadius: "16px", padding: "16px", border: "1px solid #333" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>{p.code}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#666" }}>{p.currentPct.toFixed(1)}%</span>
                          <span style={{ fontSize: "12px", color: "#444" }}>›</span>
                          <span style={{ fontSize: "16px", fontWeight: "bold", color: p.projPct >= 75 ? "#a8c200" : "#ff3b3b" }}>{p.projPct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#888888", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontSize: "11px", fontWeight: "bold", color: p.marginSafe ? "#a8c200" : "#ff3b3b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {p.marginLabel}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {riskClasses.length > 0 && (
            <div style={{ padding: "24px", background: "#1a0000", border: "2px dashed #ff3b3b", borderRadius: "20px", marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ff3b3b", marginBottom: "8px" }}>Action Required</div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#ff3b3b", lineHeight: 1 }}>{riskClasses.length} SUBJECTS AT RISK</div>
              <div style={{ fontSize: "12px", color: "#ff3b3b", fontStyle: "italic", marginTop: "8px" }}>aint nobody savin you</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {att.map((c: any, i: number) => {
              const attn = parseFloat(c["Attn %"]) || 0;
              const isRisk = attn < 75;
              const cond = parseInt(c["Hours Conducted"]) || 0;
              const abs = parseInt(c["Hours Absent"]) || 0;
              const pres = cond - abs;

              let advice = "";
              let adviceColor = "";

              if (attn >= 75) {
                const canSkip = Math.floor((4 * pres - 3 * cond) / 3);
                advice = canSkip > 0 ? `${canSkip} can skip` : `Don't skip`;
                adviceColor = canSkip > 0 ? "#a8c200" : "#888";
              } else {
                const mustAttend = Math.ceil(3 * cond - 4 * pres);
                advice = `${mustAttend} more needed`;
                adviceColor = "#ff3b3b";
              }
              
              return (
                <div key={i} className="min-card" style={{ 
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  background: isRisk ? "rgba(255,59,59,0.05)" : "var(--bg-surface)",
                  borderLeft: isRisk ? "4px solid var(--accent-red)" : "1px solid var(--border)",
                  borderColor: isRisk ? "var(--accent-red)" : "var(--border)",
                  borderStyle: isRisk ? "dashed" : "solid"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <div style={{ width: "60px" }}>
                        <div className="font-heading" style={{ fontSize: "40px", fontWeight: 900, color: isRisk ? "var(--accent-red)" : "var(--text-primary)", lineHeight: 1 }}>
                          {pres}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "4px", fontWeight: "bold" }}>
                          /{cond} pres
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)", paddingBottom: "2px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word", lineHeight: 1.2 }}>
                          {c["Course Title"]}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold", letterSpacing: "0.05em" }}>
                          {c["Course Code"]}
                        </div>
                      </div>
                    </div>

                    <div className="font-heading" style={{ fontSize: "32px", fontWeight: 900, color: isRisk ? "var(--accent-red)" : "var(--accent)" }}>
                      {attn}%
                    </div>
                  </div>

                  <div style={{ 
                    borderTop: "1px solid var(--border)", 
                    paddingTop: "12px", 
                    fontSize: "11px", 
                    fontWeight: "900", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.1em",
                    color: adviceColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{ 
                      width: "6px", 
                      height: "6px", 
                      borderRadius: "50%", 
                      background: adviceColor,
                      boxShadow: `0 0 8px ${adviceColor}` 
                    }} />
                    {advice}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="watermark">Attendance</div>
        </div>
      </main>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function CosmosAttendance({ att, avgAtt, totalAgg, presentAgg, absentAgg }: any) {
  const attPct = parseFloat(avgAtt as string) || 0;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: "100px", fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main style={{ padding: "20px" }}>
        
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>Attendance</h1>

        {/* Hero Card */}
        <div style={{ 
          background: "linear-gradient(135deg, #3b1fa8 0%, #1e1035 100%)",
          borderRadius: "20px", padding: "24px", marginBottom: "32px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em", marginBottom: "8px" }}>Overall</div>
            <div style={{ fontSize: "64px", fontWeight: 800, color: "#fff", lineHeight: 1, marginBottom: "16px" }}>{avgAtt}%</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{presentAgg} / {totalAgg} classes</div>
          </div>
          <div style={{ width: "80px", height: "80px", position: "relative" }}>
            <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#fff" strokeWidth="3" 
                strokeDasharray="100 100" strokeDashoffset={100 - attPct} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 }}>
              {avgAtt}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {att.map((c: any, i: number) => {
            const attn = parseFloat(c["Attn %"]) || 0;
            const isRisk = attn < 75;
            const barColor = isRisk ? "var(--accent-red)" : "var(--accent-green)";

            return (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "16px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ flex: 1, paddingRight: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{c["Course Title"]}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{c["Course Code"]}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: barColor }}>{attn}%</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{c["Hours Conducted"]}h</div>
                  </div>
                </div>
                <div style={{ height: "5px", background: "rgba(255,255,255,0.07)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: barColor, width: `${attn}%` }} />
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}

function EditorialAttendance({ att, avgAtt, totalAgg, presentAgg, absentAgg }: any) {
  return (
    <div style={{ background: "#f5f2eb", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "40px 20px" }}>
        
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "48px", fontWeight: 900, color: "#111", marginBottom: "8px" }}>ATTENDANCE</h1>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "96px", fontWeight: 900, color: "#111", lineHeight: 0.9, marginBottom: "40px" }}>
          {avgAtt}<span style={{ fontSize: "0.4em" }}>%</span>
        </div>

        <div style={{ height: "2px", background: "#111", width: "100%", marginBottom: "32px" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {att.map((c: any, i: number) => {
            const attn = parseFloat(c["Attn %"]) || 0;
            const isRisk = attn < 75;
            return (
              <div key={i} style={{ padding: "24px 0", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ flex: 1, paddingRight: "20px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{c["Course Title"].toLowerCase()}</div>
                    <div style={{ fontSize: "10px", color: "#999", fontWeight: 600, letterSpacing: "0.1em", marginTop: "4px" }}>{c["Course Code"]}</div>
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", fontWeight: 700, color: isRisk ? "#c0392b" : "#111" }}>{attn}%</div>
                </div>
                <div style={{ height: "4px", background: "rgba(0,0,0,0.05)", width: "100%", position: "relative" }}>
                  <div style={{ height: "100%", background: isRisk ? "#c0392b" : "#27ae60", width: `${attn}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function EditorialAttendance({ att, avgAtt, totalAgg, presentAgg, absentAgg }: any) {
  return (
    <div style={{ background: "#f5f2eb", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "40px 20px" }}>
        
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "48px", fontWeight: 900, color: "#111", marginBottom: "8px" }}>ATTENDANCE</h1>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: "96px", fontWeight: 900, color: "#111", lineHeight: 0.9, marginBottom: "40px" }}>
          {avgAtt}<span style={{ fontSize: "0.4em" }}>%</span>
        </div>

        <div style={{ height: "2px", background: "#111", width: "100%", marginBottom: "32px" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {att.map((c: any, i: number) => {
            const attn = parseFloat(c["Attn %"]) || 0;
            const isRisk = attn < 75;
            return (
              <div key={i} style={{ padding: "24px 0", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ flex: 1, paddingRight: "20px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{c["Course Title"].toLowerCase()}</div>
                    <div style={{ fontSize: "10px", color: "#999", fontWeight: 600, letterSpacing: "0.1em", marginTop: "4px" }}>{c["Course Code"]}</div>
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", fontWeight: 700, color: isRisk ? "#c0392b" : "#111" }}>{attn}%</div>
                </div>
                <div style={{ height: "4px", background: "rgba(0,0,0,0.05)", width: "100%", position: "relative" }}>
                  <div style={{ height: "100%", background: isRisk ? "#c0392b" : "#27ae60", width: `${attn}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
