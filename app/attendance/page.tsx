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
  const { theme } = useThemeStore();
  const { academicData, setAcademicData } = useAuthStore();
  const [att, setAtt] = useState<any[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.attendance);

  const [calData, setCalData] = useState<any>(null);
  const [ttData, setTTData] = useState<any>(null);
  
  const [showPredictor, setShowPredictor] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [showRiskOnly, setShowRiskOnly] = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(int);
  }, []);

  const lastFetchedAt = academicData?.lastFetchedAt;
  const timeAgoStr = useMemo(() => {
    if (!lastFetchedAt) return "";
    const diff = Math.floor((now - lastFetchedAt) / 60000);
    if (diff < 1) return "Updated just now";
    if (diff === 1) return "Updated 1 min ago";
    if (diff < 60) return `Updated ${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    return `Updated ${hours} hr${hours > 1 ? 's' : ''} ago`;
  }, [now, lastFetchedAt]);

  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (academicData?.attendance) setLoading(false);
    dataAPI.getAttendance()
      .then(d => { setAtt(d.data || []); setAcademicData({ ...academicData, attendance: d.data || [] }); setLoading(false); })
      .catch(() => { if (!att.length) router.push("/"); });

    dataAPI.getCalendar().then(d => setCalData(d)).catch(() => {});
    
    // Dynamically get the batch from profile
    const rawBatch = academicData?.profile?.["Combo / Batch"] || "";
    const batchNum = parseInt(rawBatch.match(/\d+/)?.[0] || "1");

    Promise.all([dataAPI.getTimetable(batchNum), dataAPI.getMyTimetable()]).then(([tt, myTT]) => {
      const courses = myTT?.data?.courses || myTT?.data || [];
      setTTData({ rows: tt?.data?.rows || [], myTT: courses });
    }).catch(() => {});
  }, [ready, academicData?.profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShowRiskOnly(params.get("risk") === "1");
  }, []);

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
  const displayAtt = showRiskOnly ? riskClasses : att;
  const avgAtt = att.length
    ? (att.reduce((s, c) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";

  const totalAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Conducted"]) || 0), 0);
  const absentAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Absent"]) || 0), 0);
  const presentAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Attended"]) || (parseInt(c["Hours Conducted"]) - parseInt(c["Hours Absent"])) || 0), 0);

  if (loading && !att.length) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner" />
    </div>
  );

  if (theme === "cosmos") return (
    <CosmosAttendance 
      att={att} 
      avgAtt={avgAtt} 
      totalAgg={totalAgg} 
      presentAgg={presentAgg} 
      absentAgg={absentAgg} 
      showPredictor={showPredictor}
      setShowPredictor={setShowPredictor}
      next30Days={next30Days}
      selectedDates={selectedDates}
      toggleDate={toggleDate}
      calculatePredictions={calculatePredictions}
      predictions={predictions}
      setSelectedDates={setSelectedDates}
      setPredictions={setPredictions}
      showRiskOnly={showRiskOnly}
      timeAgoStr={timeAgoStr}
    />
  );

  if (theme === "matrix") return (
    <MatrixAttendance 
      att={att} 
      avgAtt={avgAtt} 
      totalAgg={totalAgg} 
      presentAgg={presentAgg} 
      absentAgg={absentAgg} 
      showPredictor={showPredictor}
      setShowPredictor={setShowPredictor}
      next30Days={next30Days}
      selectedDates={selectedDates}
      toggleDate={toggleDate}
      calculatePredictions={calculatePredictions}
      predictions={predictions}
      setSelectedDates={setSelectedDates}
      setPredictions={setPredictions}
      showRiskOnly={showRiskOnly}
      timeAgoStr={timeAgoStr}
    />
  );

  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
        <div className="page-content" data-section="Attendance" style={{ paddingBottom: "140px" }}>

          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
              Overall Attendance
            </div>
            {timeAgoStr && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "20px", fontWeight: "bold" }}>
                {timeAgoStr}
              </div>
            )}
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
              <button onClick={calculatePredictions} style={{ width: "100%", padding: "16px", background: "#a8c200", borderRadius: "99px", color: "#000000", fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer" }}>Calculate</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {displayAtt.map((c: any, i: number) => {
              const attn = parseFloat(c["Attn %"]) || 0;
              const isRisk = attn < 75;
              const cond = parseInt(c["Hours Conducted"]) || 0;
              const abs = parseInt(c["Hours Absent"]) || 0;
              const pres = parseInt(c["Hours Attended"]) || (cond - abs);

              return (
                <div key={i} className="min-card" style={{ background: isRisk ? "rgba(255,59,59,0.05)" : "var(--bg-surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: "16px" }}>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>{c["Course Title"]}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>{c["Course Code"]}</div>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: isRisk ? "#ff3b3b" : "#a8c200" }}>{attn}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          {showRiskOnly && (
            <div style={{ marginBottom: "16px", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-red)", fontWeight: 700 }}>
              Showing only at-risk subjects
            </div>
          )}
          <div className="watermark">Attendance</div>
        </div>
      </main>
    </div>
  );
}

function MatrixAttendance({ 
  att, avgAtt, totalAgg, presentAgg, absentAgg, 
  showPredictor, setShowPredictor, next30Days, selectedDates, toggleDate, 
  calculatePredictions, predictions, setSelectedDates, setPredictions, showRiskOnly, timeAgoStr
}: any) {
  const router = useRouter();
  const riskCount = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;

  return (
    <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "120px", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "20px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", marginTop: "20px" }}>
           <div>
              <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>ACADEMIC</div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>Attendance Tracker</div>
              {timeAgoStr && <div style={{ fontSize: "10px", color: "#444", fontWeight: 800, marginTop: "2px" }}>{timeAgoStr.toUpperCase()}</div>}
           </div>
           <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#1c1c1c", padding: "8px 16px", borderRadius: "14px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: riskCount > 0 ? "#ff3b3b" : "#a8c200" }} />
              <div style={{ fontSize: "12px", fontWeight: 900 }}>{riskCount > 0 ? "AT RISK" : "STABLE"}</div>
           </div>
        </div>

        {/* Big Overall Number */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
           <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, marginBottom: "8px" }}>Overall Percentage</div>
           <div style={{ fontSize: "120px", fontWeight: 900, lineHeight: 0.8, letterSpacing: "-0.05em", color: parseFloat(avgAtt) < 75 ? "#ff3b3b" : "#fff" }}>{avgAtt}%</div>
        </div>

        {/* Stats Grid Card */}
        <div style={{ background: "#a8c200", borderRadius: "28px", padding: "28px", marginBottom: "40px", color: "#000", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
           <div>
              <div style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", opacity: 0.6 }}>Total</div>
              <div style={{ fontSize: "28px", fontWeight: 900 }}>{totalAgg}</div>
           </div>
           <div>
              <div style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", opacity: 0.6 }}>Present</div>
              <div style={{ fontSize: "28px", fontWeight: 900 }}>{presentAgg}</div>
           </div>
           <div>
              <div style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", opacity: 0.6 }}>Absent</div>
              <div style={{ fontSize: "28px", fontWeight: 900 }}>{absentAgg}</div>
           </div>
        </div>

        {/* Predictor Toggle */}
        <div style={{ marginBottom: "32px" }}>
           <button onClick={() => setShowPredictor(!showPredictor)} style={{ width: "100%", background: "#1c1c1c", border: "1px solid #333", borderRadius: "20px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                 <span style={{ fontSize: "20px" }}>🔮</span>
                 <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "14px", fontWeight: 900 }}>Attendance Predictor</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Simulate upcoming skip days</div>
                 </div>
              </div>
              <span style={{ color: "#a8c200", fontWeight: 900 }}>{showPredictor ? "CLOSE" : "OPEN"}</span>
           </button>
        </div>

        {showPredictor && (
          <div style={{ background: "#1c1c1c", borderRadius: "28px", padding: "24px", marginBottom: "40px", border: "1px solid #333" }}>
            <div style={{ display: "flex", overflowX: "auto", gap: "10px", paddingBottom: "20px", scrollbarWidth: "none" }}>
              {next30Days.map((d: any) => {
                const sel = selectedDates.has(d.iso);
                const isWknd = [0, 6].includes(d.date.getDay());
                return (
                  <div key={d.iso} onClick={() => !isWknd && toggleDate(d.iso)}
                    style={{ 
                      flexShrink: 0, width: "50px", height: "66px", borderRadius: "16px", 
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: sel ? "#ff3b3b" : "#2a2a2a", 
                      cursor: isWknd ? "not-allowed" : "pointer",
                      opacity: isWknd ? 0.3 : 1, transition: "all 0.2s"
                    }}>
                    <div style={{ fontSize: "10px", color: sel ? "#fff" : "#666", fontWeight: 800 }}>{d.dayStr}</div>
                    <div style={{ fontSize: "18px", color: "#fff", fontWeight: 900 }}>{d.dateNum}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={calculatePredictions} style={{ width: "100%", padding: "18px", background: "#a8c200", borderRadius: "20px", color: "#000", fontSize: "14px", fontWeight: 900, textTransform: "uppercase", border: "none", cursor: "pointer" }}>Run Simulation</button>
            
            {predictions && (
              <div style={{ 
                marginTop: "24px", 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
                gap: "12px" 
              }}>
                {predictions.map((p: any, i: number) => (
                  <div key={i} style={{ background: "#000", borderRadius: "20px", padding: "16px", border: "1px solid #333", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                       <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", flex: 1, paddingRight: "12px", lineHeight: 1.3 }}>{p.title}</div>
                       <div style={{ fontWeight: 900, color: p.projPct >= 75 ? "#a8c200" : "#ff3b3b", fontSize: "16px" }}>{p.projPct.toFixed(1)}%</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", fontWeight: 700 }}>{p.marginLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subjects List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
           <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800 }}>Subject Breakdown</div>
           {(showRiskOnly ? att.filter((c: any) => parseFloat(c["Attn %"]) < 75) : att).map((c: any, i: number) => {
              const attn = parseFloat(c["Attn %"]) || 0;
              const isRisk = attn < 75;
              const cond = parseInt(c["Hours Conducted"]) || 0;
              const abs = parseInt(c["Hours Absent"]) || 0;
              const pres = parseInt(c["Hours Attended"]) || (cond - abs);

              let margin = 0;
              if (attn >= 75) {
                margin = Math.floor((pres / 0.75) - cond);
              } else {
                margin = -Math.ceil(3 * cond - 4 * pres);
              }

              let statusColor = "#00FF88"; // Vibrant Green
              let statusText = `SKIP ${margin}`;

              if (attn < 75) {
                statusColor = "#ff3b3b"; // Red
                statusText = `ATTEND ${Math.abs(margin)}`;
              } else if (attn < 80 || margin <= 1) {
                statusColor = "#ff8c00"; // Orange (Warning)
                statusText = margin === 0 ? "SKIP 0" : `SKIP ${margin}`;
              }

              // Handle 0/0 case (newly added subjects or parsing error)
              const isNoData = cond === 0;
              if (isNoData) {
                statusColor = attn > 0 ? "#ff8c00" : "rgba(255,255,255,0.2)";
                statusText = attn > 0 ? "COUNTS PENDING" : "NO DATA";
              }

              return (
                <div key={i} style={{ 
                  background: "#1c1c1c", borderRadius: "28px", padding: "24px", 
                  border: isRisk ? "1px solid #ff3b3b" : "1px solid transparent", 
                  opacity: (isNoData && attn === 0) ? 0.6 : 1,
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div style={{ flex: 1, paddingRight: "16px" }}>
                         <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff", lineHeight: 1.2, textTransform: "capitalize" }}>{c["Course Title"].toLowerCase()}</div>
                         <div style={{ fontSize: "11px", color: "#666", fontWeight: 800, marginTop: "4px" }}>{c["Course Code"]}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                         <div style={{ 
                           fontSize: "28px", fontWeight: 900, color: statusColor,
                           textShadow: attn > 0 ? `0 0 20px ${statusColor}33` : "none"
                         }}>{attn}%</div>
                         <div style={{ fontSize: "10px", fontWeight: 900, color: statusColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {statusText}
                         </div>
                      </div>
                   </div>
                   
                   <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 800 }}>{pres}/{cond} PRES</div>
                      <div style={{ background: isRisk ? "rgba(255,59,59,0.1)" : "rgba(255,255,255,0.05)", color: isRisk ? "#ff3b3b" : "#888", padding: "6px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 800 }}>{abs} ABS</div>
                   </div>

                   <div style={{ height: "6px", background: "#000", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: statusColor, width: `${attn}%`, transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: attn > 0 ? `0 0 10px ${statusColor}44` : "none" }} />
                   </div>
                </div>
              );
           })}
        </div>
      </main>
    </div>
  );
}

function CosmosAttendance({ 
  att, avgAtt, totalAgg, presentAgg, absentAgg, 
  showPredictor, setShowPredictor, next30Days, selectedDates, toggleDate, 
  calculatePredictions, predictions, setSelectedDates, setPredictions, showRiskOnly, timeAgoStr
}: any) {
  const attPct = parseFloat(avgAtt as string) || 0;
  const riskCount = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;

  return (
    <div style={{ background: "transparent", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FFFFFF" }}>
      <Sidebar />
      <main style={{ padding: "16px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "24px 0 32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>Attendance</h1>
            {timeAgoStr && <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, marginTop: "2px" }}>{timeAgoStr}</div>}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
            <div style={{ fontSize: "20px" }}>🔔</div>
            <div style={{ 
              width: "48px", height: "24px", borderRadius: "12px", background: "rgba(26, 117, 255, 0.4)", position: "relative",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--accent-secondary)" }}>{avgAtt}%</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase" }}>Overall</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>{att.length}</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase" }}>Subjects</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: riskCount > 0 ? "var(--accent-red)" : "#fff" }}>{riskCount}</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase" }}>Below 75%</div>
          </div>
        </div>

        {/* Subject Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(showRiskOnly ? att.filter((c: any) => parseFloat(c["Attn %"]) < 75) : att).map((c: any, i: number) => {
            const attn = parseFloat(c["Attn %"]) || 0;
            const cond = parseInt(c["Hours Conducted"]) || 0;
            const abs = parseInt(c["Hours Absent"]) || 0;
            const pres = parseInt(c["Hours Attended"]) || (cond - abs);
            const isRisk = attn < 75;
            
            // Calculate margin (classes safe to skip or needed to recover)
            let margin = 0;
            let statusColor = "#00FF88"; // Vibrant Green
            let statusText = "Margin";

            if (attn < 75) {
              margin = Math.ceil(3 * cond - 4 * pres);
              statusColor = "var(--accent-red)";
              statusText = "Attend";
            } else {
              margin = Math.floor((pres / 0.75) - cond);
              if (attn < 80 || margin <= 1) {
                statusColor = "#ff8c00"; // Orange
                statusText = "Critical";
              }
            }

            // Handle 0/0 case
            const isNoData = cond === 0;
            if (isNoData) {
              statusColor = "rgba(255,255,255,0.2)";
              statusText = "No Data";
            }

            return (
              <div key={i} className="min-card" style={{ padding: "20px", opacity: isNoData ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ flex: 1, paddingRight: "16px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{c["Course Title"]}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 600 }}>{c["Course Code"]} • Theory</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 900, color: statusColor }}>{isNoData ? "—" : (attn < 75 ? margin : margin)}</div>
                    <div style={{ fontSize: "9px", color: statusColor, fontWeight: 800, textTransform: "uppercase" }}>{statusText}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <div style={{ background: "rgba(0, 255, 136, 0.1)", color: "var(--accent-secondary)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>P {pres}</div>
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--accent-red)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>A {abs}</div>
                    <div style={{ background: "rgba(26, 117, 255, 0.1)", color: "var(--accent)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>T {cond}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "14px", fontWeight: 900, color: statusColor }}>{attn}%</div>
                </div>

                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden", position: "relative" }}>
                  <div style={{ 
                    height: "100%", 
                    background: statusColor, 
                    width: `${attn}%`,
                    boxShadow: `0 0 10px ${statusColor}4D`,
                    transition: "width 1s ease-in-out"
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {showPredictor && (
          <div className="min-card" style={{ padding: "24px", marginBottom: "32px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", animation: "slideDown 0.3s ease-out forwards" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Predictor</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Select dates you plan to skip</div>
              </div>
              {predictions && (
                <button onClick={() => { setSelectedDates(new Set()); setPredictions(null); }} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Reset</button>
              )}
            </div>

            <div style={{ display: "flex", overflowX: "auto", gap: "10px", paddingBottom: "16px", scrollbarWidth: "none" }}>
              {next30Days.map((d: any) => {
                const sel = selectedDates.has(d.iso);
                const isWknd = [0, 6].includes(d.date.getDay());
                return (
                  <div key={d.iso} onClick={() => !isWknd && toggleDate(d.iso)}
                    style={{ 
                      flexShrink: 0, width: "50px", height: "66px", borderRadius: "14px", 
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: sel ? "var(--accent-red)" : "rgba(255,255,255,0.05)", 
                      cursor: isWknd ? "not-allowed" : "pointer",
                      opacity: isWknd ? 0.3 : 1, transition: "all 0.2s"
                    }}>
                    <div style={{ fontSize: "10px", color: sel ? "#fff" : "var(--text-muted)", fontWeight: 800, textTransform: "uppercase" }}>{d.dayStr}</div>
                    <div style={{ fontSize: "18px", color: "#fff", fontWeight: 900 }}>{d.dateNum}</div>
                  </div>
                );
              })}
            </div>

            <button onClick={calculatePredictions} style={{ width: "100%", padding: "16px", background: "var(--accent)", borderRadius: "14px", color: "#fff", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer" }}>
              Run Prediction
            </button>

            {predictions && (
              <div style={{ 
                marginTop: "24px", 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                gap: "12px" 
              }}>
                {predictions.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", gridColumn: "1 / -1" }}>No classes missed on selected dates.</div>
                ) : predictions.map((p: any, i: number) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "flex-start" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", flex: 1, paddingRight: "10px", lineHeight: 1.3 }}>{p.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>{p.currentPct.toFixed(0)}%</span>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>→</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: p.projPct >= 75 ? "var(--accent-secondary)" : "var(--accent-red)" }}>{p.projPct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: p.marginSafe ? "var(--accent-secondary)" : "var(--accent-red)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                      {p.marginLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
          <button 
            className="theme-cosmos action-btn" 
            onClick={() => setShowPredictor(!showPredictor)}
            style={{ padding: "14px 32px", borderRadius: "14px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", border: "none" }}
          >
            🔮 {showPredictor ? "Close Predictor" : "Predict Attendance"}
          </button>
        </div>

      </main>
    </div>
  );
}



