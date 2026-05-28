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
import AuraAttendance from "@/components/aura-theme/AuraAttendance";
import CosmosAttendance from "@/components/CosmosAttendance";
import { RefreshCcw } from "lucide-react";

function buildSlotToCourseMap(myTT: AnyValue[]) {
  const map: Record<string, AnyValue> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

export default function AttendancePage() {
  const { ready } = useAuth();
  const { theme } = useThemeStore();
  // Optimize Zustand subscriptions to eliminate main-thread render lags
  const academicData = useAuthStore((state) => state.academicData);
  const setAcademicData = useAuthStore((state) => state.setAcademicData);
  const [att, setAtt] = useState<AnyValue[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.attendance);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const d = await dataAPI.getAttendance();
      const updated = d.data || [];
      setAtt(updated);
      setAcademicData({ ...academicData, attendance: updated });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const [calData, setCalData] = useState<AnyValue>(null);
  const [ttData, setTTData] = useState<AnyValue>(null);
  
  const [showPredictor, setShowPredictor] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<AnyValue[] | null>(null);
  const [showRiskOnly, setShowRiskOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

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
    const dayRows = ttData.rows.filter((r: AnyValue) => typeof r[0] === "string" && r[0].startsWith("Day"));
    
    dayRows.forEach((row: AnyValue) => {
      const header = String(row[0] || "");
      const dOrder = parseInt(header.match(/\d+/)?.[0] || "0");
      if (dOrder === 0) return;
      
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
    const results = att.map((c: AnyValue) => {
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
      const alreadyRisk = currentPct < 75;

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
    ? (att.reduce((s, c) => {
        const val = parseFloat(c["Attn %"] || "0");
        return s + (isNaN(val) ? 0 : val);
      }, 0) / att.length).toFixed(1)
    : "—";

  const totalAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Conducted"]) || 0), 0);
  const absentAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Absent"]) || 0), 0);
  const presentAgg = att.reduce((acc, c) => {
    const p = parseInt(c["Hours Attended"]) || (parseInt(c["Hours Conducted"]) - parseInt(c["Hours Absent"])) || 0;
    return acc + (isNaN(p) ? 0 : p);
  }, 0);

  if (loading && !att.length) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner" />
    </div>
  );

  if (!mounted && typeof window !== "undefined") return <div style={{ background: '#050505', minHeight: '100vh' }} />;

  const themeProps = {
    att, avgAtt, totalAgg, presentAgg, absentAgg, 
    showPredictor, setShowPredictor, next30Days, selectedDates, toggleDate, 
    calculatePredictions, predictions, setSelectedDates, setPredictions, showRiskOnly, timeAgoStr
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#050505", display: "flex", flexDirection: "column", position: "relative" }}>
      <Sidebar />
      <main id="attendance-parent-scroll" style={{ flex: 1, paddingBottom: "100px" }}>
        {theme === "cosmos" ? (
          <CosmosAttendance {...themeProps} />
        ) : theme === "aura" ? (
          <AuraAttendance attendance={att} handleSync={handleSync} isSyncing={isSyncing} {...themeProps} />
        ) : (
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
              {displayAtt.map((c: AnyValue, i: number) => {
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
        )}
      </main>
    </div>
  );
}
