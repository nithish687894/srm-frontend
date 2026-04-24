"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useThemeStore } from "@/lib/themeStore";

function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }
function parseStart(t: string) { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEnd(t: string) { const parts = t.split(/\s*[-–]\s*/); const last = parts[parts.length - 1] || ""; const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function isNowIn(st: string, en: string) { const now = new Date().getHours() * 60 + new Date().getMinutes(); return now >= parseStart(st) && now <= parseEnd(en); }
function fmt12(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "PM" : "AM"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]} ${suffix}`; }
function fmtTimeOnly(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "p" : "a"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]}${suffix}`; }

interface ScheduleItem { slot: string; startTime: string; endTime: string; courseTitle: string; courseCode: string; roomNo: string; facultyName: string; courseType: string; }

function buildSlotToCourseMap(myTT: any[]) {
  const map: Record<string, any> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function buildSchedule(gridRows: any[], slotMap: Record<string, any>, attendance: any[] = []): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = gridRows.find((r: any) => r[0] === "FROM");
  const times: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = gridRows.filter((r: any) => typeof r[0] === "string" && r[0].startsWith("Day"));

  return dayRows.map((row: any) => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];
    const seenCourses = new Set<string>();

    const labCells: { idx: number; slot: string; course: any }[] = [];
    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      const up = s?.toUpperCase() || "";
      if (!s || !/^[PL]\d+$/i.test(up)) return;
      const course = slotMap[up];
      if (course) labCells.push({ idx: ci, slot: up, course });
    });

    const labGroups: { cells: { idx: number; slot: string; course: any }[] }[] = [];
    for (let i = 0; i < labCells.length; i++) {
      const cell = labCells[i];
      const prev = i > 0 ? labCells[i - 1] : null;
      if (prev && prev.course.courseCode === cell.course.courseCode && cell.idx === prev.idx + 1) {
        labGroups[labGroups.length - 1].cells.push(cell);
      } else {
        labGroups.push({ cells: [cell] });
      }
    }

    labGroups.forEach(group => {
      const course = group.cells[0].course;
      classes.push({ slot: group.cells.map(c => c.slot).join("-"), startTime: times[group.cells[0].idx] || "", endTime: times[group.cells[group.cells.length - 1].idx] || "", courseTitle: course.courseTitle, courseCode: course.courseCode, roomNo: course.roomNo, facultyName: course.facultyName, courseType: course.courseType });
    });

    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      if (/^[PL]\d+$/i.test(up)) return;
      for (const part of up.split("/")) {
        const letter = part.trim().replace(/[^A-Z]/g, "");
        if (!letter || letter === "X") continue;
        const course = slotMap[letter];
        if (!course) continue;
        const key = `${course.courseCode}-${ci}`;
        if (seenCourses.has(key)) continue;
        seenCourses.add(key);
        classes.push({ slot: s, startTime: times[ci] || "", endTime: times[ci] || "", courseTitle: course.courseTitle, courseCode: course.courseCode, roomNo: course.roomNo, facultyName: course.facultyName, courseType: course.courseType });
        break;
      }
    });

    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

function MiniGridTile({ slot }: { slot: any }) {
  if (!slot || slot.isEmpty) return <div style={{ background: "transparent", borderRadius: "16px", height: "88px", border: "1px dashed #333333" }} />;
  const isActive = isNowIn(slot.startTime, slot.endTime);
  const isNso = slot.courseCode.includes("NSO") || slot.courseType.toLowerCase().includes("practical");
  return (
    <div style={{ background: isNso ? "#0d1a2a" : "#1c1c1c", borderRadius: "16px", height: "88px", padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: isActive ? "1.5px solid #a8c200" : "none" }}>
      <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: "8px", color: "#888888", marginBottom: "4px", fontWeight: "bold" }}>{slot.courseCode.substring(0, 5)} • {slot.roomNo?.split(",")[0]?.substring(0, 4) || "TBA"}</div>
        <span style={{ fontSize: "11px", fontWeight: "900", color: isNso ? "#00aaff" : "#ffffff", textAlign: "center", lineHeight: 1.1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textTransform: "capitalize", wordBreak: "break-word" }}>{slot.courseTitle.toLowerCase()}</span>
      </div>
      <div style={{ fontSize: "9px", color: "#888888", textAlign: "center", fontWeight: "bold" }}>
        {fmtTimeOnly(slot.startTime) === fmtTimeOnly(slot.endTime) ? fmtTimeOnly(slot.startTime) : `${fmtTimeOnly(slot.startTime)} - ${fmtTimeOnly(slot.endTime)}`}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { setProfile, academicData, setAcademicData } = useAuthStore();
  const [data, setData] = useState<any>(academicData || null);
  const [loading, setLoading] = useState(!academicData);
  const [ttData, setTTData] = useState<any>(null);
  const [myTTData, setMyTTData] = useState<any>(null);
  const [calData, setCalData] = useState<any>(null);
  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    if (!ready) return;
    dataAPI.getAll()
      .then(d => {
        setData(d);
        setAcademicData(d);
        if (d.profile) setProfile(d.profile);
        setLoading(false);
      })
      .catch(() => {
        if (!data) router.push("/");
        else setLoading(false);
      });
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    dataAPI.getTimetable(1).then(d => setTTData(d)).catch(() => { });
    dataAPI.getCalendar().then(d => setCalData(d)).catch(() => { });
    dataAPI.getMyTimetable().then(d => setMyTTData(d)).catch(() => { });
  }, [ready]);

  const att = data?.attendance || [];
  const marks = data?.marks || [];

  // Calculate top stats
  const totalCourses = att.length;
  const avgAtt = att.length ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1) : "—";
  const riskCount = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;

  // Calculate average marks
  const totalScored = marks.reduce((s: number, m: any) => s + (m.tests?.reduce((a: number, t: any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s: number, m: any) => s + (m.tests?.reduce((a: number, t: any) => { const [, mx] = t.test.split("/"); return a + (parseFloat(mx) || 0); }, 0) || 0), 0);
  const avgMarks = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : "—";

  // Recent 5 marks without 0 place holders
  const recentMarksList: any[] = [];
  marks.forEach((m: any) => {
    m.tests?.forEach((t: any) => {
      const sc = parseFloat(t.score);
      const mx = parseFloat(t.test.split("/")[1] || "100");
      if (!isNaN(sc) && sc > 0 && t.score !== "Abs") {
        recentMarksList.push({ courseCode: m.courseCode, label: t.test.split("/")[0], score: sc, max: mx });
      }
    });
  });
  // Since timestamps are rarely given per-test, we just reverse to pseudo "latest"
  const recentTop5 = recentMarksList.reverse().slice(0, 5);

  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "Student";
  const initials = firstName.slice(0, 2).toUpperCase();

  const { byDate } = useMemo(() => {
    if (!calData) return { byDate: new Map() };
    try { return buildCalendarIndex(calData); } catch { return { byDate: new Map() }; }
  }, [calData]);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [dayOffset]);

  const targetCalInfo = byDate.get(targetDate);
  const isWeekend = [0, 6].includes(new Date(targetDate).getDay());
  const isHoliday = !!targetCalInfo?.isHoliday || isWeekend;
  const dayOrder = targetCalInfo?.dayOrder || null;

  const targetClasses = useMemo(() => {
    if (!ttData?.data?.rows || !myTTData?.data || isHoliday || !dayOrder) return [];
    const rows = ttData.data.rows;
    const slotMap = buildSlotToCourseMap(myTTData.data || []);
    const schedule = buildSchedule(rows, slotMap, att);
    return schedule[dayOrder - 1]?.classes || [];
  }, [ttData, myTTData, att, dayOrder, isHoliday]);

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nextClass = dayOffset === 0
    ? targetClasses.find((c: ScheduleItem) => parseStart(c.startTime) > nowMin || isNowIn(c.startTime, c.endTime))
    : targetClasses[0];

  const gridSlots = useMemo(() => {
    if (!ttData?.data?.rows || targetClasses.length === 0) return Array(10).fill(null);
    const timeRow = ttData.data.rows.find((r: any) => r[0] === "FROM");
    const timesList = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];

    // Create exactly 10 slots map
    const slots = Array(10).fill({ isEmpty: true });
    timesList.slice(0, 10).forEach((timeStr: string, i: number) => {
      // Find class that falls in this time
      const tStart = parseStart(timeStr);
      const cls = targetClasses.find((c: ScheduleItem) => {
        const cs = parseStart(c.startTime);
        const ce = parseEnd(c.endTime);
        // Add robust time overlapping check for labs
        return (tStart >= cs && tStart < ce) || (Math.abs(tStart - cs) <= 5); // 5 min tolerance
      });
      if (cls) {
        // Only insert if previous slot isn't exactly the same class (visual deduplication)
        if (i > 0 && slots[i - 1] && slots[i - 1].courseCode === cls.courseCode) {
          slots[i] = { isEmpty: true }; // Hide redundant extended class blocks visually in mini-grid
        } else {
          slots[i] = cls;
        }
      }
    });
    return slots;
  }, [ttData, targetClasses]);

  if (loading && !data) return (
    <div className="page-root" style={{ display: "flex", flexDirection: "column", padding: "32px", gap: "24px" }}>
      <div style={{ height: "64px", background: "#1c1c1c", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: "160px", background: "#1c1c1c", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
      <div style={{ height: "300px", background: "#1c1c1c", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
    </div>
  );

  if (theme === "cosmos") return <CosmosDashboard data={data} riskCount={riskCount} avgAtt={avgAtt} avgMarks={avgMarks} totalCourses={totalCourses} targetClasses={targetClasses} nextClass={nextClass} recentTop5={recentTop5} initials={initials} firstName={firstName} />;


  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
        <div className="page-content" data-section="Portal" style={{ paddingBottom: "120px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#1c1c1c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "16px" }}>
              {initials}
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ fontSize: "12px", color: "#666666", marginBottom: "2px" }}>Welcome Back</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", letterSpacing: "-0.5px" }}>{firstName}</div>
            </div>
          </div>

          {/* Top Stats Cards */}
          {(() => {
            const stats = [
              { label: "Attendance", value: `${avgAtt}%`, color: "var(--accent)" },
              { label: "Avg Marks", value: `${avgMarks}%`, color: "var(--text-primary)" },
              { label: "At Risk", value: riskCount, color: riskCount > 0 ? "var(--accent-red)" : "var(--text-secondary)" },
              { label: "Courses", value: totalCourses, color: "var(--text-secondary)" },
            ];

            // Matrix (Default)
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "32px" }}>
                {stats.map((s, i) => (
                  <div key={i} className="min-card" style={{ padding: "16px 12px", textAlign: "center", border: "none" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color, marginBottom: "4px" }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Date / Day Order Selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
              {isHoliday ? `Holiday • ${dayOffset === 0 ? "Today" : "Later"}` : `Day Order ${dayOrder} • ${dayOffset === 0 ? "Today" : "Later"}`}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setDayOffset(o => o - 1)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}>‹</button>
              <button onClick={() => setDayOffset(o => o + 1)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}>›</button>
            </div>
          </div>

          {/* Next Up / Today's Schedule */}
          {targetClasses.length > 0 ? (
            <>
              {nextClass ? (
                <div style={{ marginBottom: "32px", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", position: "relative", zIndex: 10 }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800 }}>Next Up</span>
                    <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 800, background: "var(--bg-surface)", padding: "4px 12px", borderRadius: "12px", border: "1px solid var(--border)" }}>{nextClass.roomNo || "TBA"}</span>
                  </div>
                  <div className="font-heading" style={{
                    fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 0.9,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    wordBreak: "break-word", textTransform: "uppercase", marginBottom: "20px", marginTop: "12px"
                  }}>
                    {nextClass.courseTitle}
                  </div>
                  <div className="min-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>STATUS • <span style={{ fontWeight: 900 }}>{nextClass.courseCode.substring(0, 5)}</span></div>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 900 }}>
                      {fmtTimeOnly(nextClass.startTime) === fmtTimeOnly(nextClass.endTime) ? fmtTimeOnly(nextClass.startTime) : `${fmtTimeOnly(nextClass.startTime)} — ${fmtTimeOnly(nextClass.endTime)}`}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Mini Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "40px" }}>
                {gridSlots.map((s, i) => (
                  <MiniGridTile key={i} slot={s} />
                ))}
              </div>
            </>
          ) : (
            <div style={{ background: "#1c1c1c", borderRadius: "20px", padding: "40px", textAlign: "center", marginBottom: "40px" }}>
              <div style={{ fontSize: "32px", color: "#333", marginBottom: "16px" }}>☕</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>No Classes Scheduled</div>
              <div style={{ fontSize: "12px", color: "#888888", marginTop: "8px" }}>Enjoy your free time.</div>
            </div>
          )}

          {/* Action Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Alerts */}
            {riskCount > 0 && (
              <div onClick={() => router.push("/attendance")} style={{ background: "#1a0000", border: "2px dashed #ff3b3b", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#ff3b3b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>Academic Emergency</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#ff3b3b", lineHeight: 1 }}>{riskCount} Subjects At Risk</div>
                  <div style={{ fontSize: "12px", color: "#ff3b3b", fontStyle: "italic", marginTop: "8px" }}>Tap to view details</div>
                </div>
                <div style={{ color: "#ff3b3b", fontSize: "24px" }}>›</div>
              </div>
            )}

            {/* Recent Marks Widget */}
            <div onClick={() => router.push("/marks")} className="min-card" style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>Recent Marks</div>
                <div style={{ color: "var(--text-primary)", fontSize: "24px" }}>›</div>
              </div>

              {recentTop5.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recentTop5.map((rm, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>{rm.courseCode}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>{rm.label}</div>
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: "16px", color: "var(--accent)" }}>
                        {rm.score}/{rm.max}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>No recent assessments recorded.</div>
              )}
            </div>

          </div>

          {/* Watermark */}
          <div className="watermark">Dashboard</div>

        </div>
      </main>
    </div>
  );
}

function CosmosDashboard({ riskCount, avgAtt, avgMarks, totalCourses, targetClasses, nextClass, recentTop5, initials, firstName }: any) {
  const router = useRouter();
  const attPct = parseFloat(avgAtt as string) || 0;

  return (
    <div style={{ background: "transparent", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FFFFFF" }}>
      <Sidebar />
      <main style={{ padding: "16px" }}>

        {/* Header with SRMX Branding */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "10px", 
              background: "linear-gradient(135deg, #1A75FF, #6B33FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 15px rgba(26, 117, 255, 0.3)"
            }}>
              <span style={{ fontSize: "16px", fontWeight: 900, color: "#fff" }}>X</span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.8px", margin: 0 }}>
              SRMX
            </h1>
          </div>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", border: "1px solid rgba(255,255,255,0.1)" }}>
            🔔
          </div>
        </div>

        {/* Profile Section */}
        <div className="min-card" style={{ padding: "20px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ 
            width: "52px", height: "52px", borderRadius: "12px", 
            background: "linear-gradient(135deg, #1A75FF, #00C6FF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", fontWeight: 800, color: "#fff"
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Welcome back, {firstName}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Student Portal Access Granted</div>
          </div>
        </div>

        {/* Overview & High-Fidelity Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ fontSize: "18px" }}>🚀</div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance</h2>
        </div>

        {/* Attendance Highlight (Badge style) */}
        <div className="min-card" style={{ padding: "28px 20px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", width: "90px", height: "90px" }}>
            <div style={{ 
              position: "absolute", inset: "-4px", borderRadius: "50%", 
              border: "2px dashed var(--accent-secondary)", opacity: 0.4,
              animation: "spin 12s linear infinite"
            }} />
            <div style={{ 
              position: "absolute", inset: 0, borderRadius: "50%", 
              background: "rgba(0, 255, 136, 0.04)",
              border: "3px solid var(--accent-secondary)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(0, 255, 136, 0.15)"
            }}>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{avgAtt}%</div>
              <div style={{ fontSize: "9px", color: "var(--accent-secondary)", fontWeight: 800, marginTop: "2px", textTransform: "uppercase" }}>Overall</div>
            </div>
          </div>
          <div style={{ flex: 1, paddingLeft: "24px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attendance Status</div>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Tap to view subject-wise breakdown</div>
          </div>
        </div>

        {/* Standings Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <div className="min-card" style={{ padding: "20px 12px", textAlign: "center", background: "rgba(26, 117, 255, 0.03)" }}>
            <div style={{ fontSize: "18px", marginBottom: "8px" }}>📋</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>{avgMarks}%</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "6px", fontWeight: 700, textTransform: "uppercase" }}>Avg Marks</div>
          </div>
          <div className="min-card" style={{ padding: "20px 12px", textAlign: "center", background: "rgba(239, 68, 68, 0.03)" }}>
            <div style={{ fontSize: "18px", marginBottom: "8px" }}>⚠️</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: riskCount > 0 ? "var(--accent-red)" : "#fff" }}>{riskCount}</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "6px", fontWeight: 700, textTransform: "uppercase" }}>At Risk</div>
          </div>
        </div>

        {/* Next Class / Today's Schedule */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ fontSize: "18px" }}>📅</div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Schedule</h2>
        </div>

        {nextClass ? (
          <div className="min-card" style={{ padding: "20px", marginBottom: "16px", border: "1px solid var(--accent-bg)" }}>
            <div style={{ display: "inline-block", background: "var(--accent-bg)", color: "var(--accent)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Up Next</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: "12px 0 8px" }}>{nextClass.courseTitle}</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.05)" }}>📍 {nextClass.roomNo}</div>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.05)" }}>⏰ {fmtTimeOnly(nextClass.startTime)} — {fmtTimeOnly(nextClass.endTime)}</div>
            </div>
          </div>
        ) : (
          <div className="min-card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No more classes for today. Relax!
          </div>
        )}

      </main>
    </div>
  );
}


