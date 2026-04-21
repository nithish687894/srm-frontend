"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { buildCalendarIndex } from "@/lib/calendarIndex";

// ── Helpers ────────────────────────────────────────────────────────────────
function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }
function parseStart(t: string) { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEnd(t: string) { const parts = t.split(/\s*[-–]\s*/); const last = parts[parts.length - 1] || ""; const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function fmt12(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "PM" : "AM"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]} ${suffix}`; }
function fmtTimeOnly(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; return `${m[1]}:${m[2]}`; }
function isNowIn(s: string, e: string) { const now = new Date().getHours() * 60 + new Date().getMinutes(); return now >= parseStart(s) && now <= parseEnd(e); }

interface ScheduleItem {
  slot: string; startTime: string; endTime: string;
  courseTitle: string; courseCode: string; courseType: string;
  facultyName: string; roomNo: string; category: string;
  attn: number; hoursConducted: number; hoursAbsent: number;
  type: "theory" | "lab" | "practical";
}

function buildSlotToCourseMap(myTT: any[]) {
  const map: Record<string, any> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function findAttendance(code: string, courseType: string, atts: any[]) {
  return atts.find(a => {
    const aCode = a["Course Code"] || "";
    const aCat = (a["Category"] || "").toLowerCase();
    const isLabType = courseType.toLowerCase().includes("practical") || courseType.toLowerCase().includes("lab");
    return aCode === code && (isLabType ? aCat.includes("practical") : !aCat.includes("practical"));
  }) || atts.find(a => a["Course Code"] === code);
}

function buildSchedule(gridRows: any[], slotMap: Record<string, any>, attendance: any[]): { day: string; classes: ScheduleItem[] }[] {
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
      const sameGroup = prev && prev.course.courseCode === cell.course.courseCode && prev.course.courseType === cell.course.courseType && cell.idx === prev.idx + 1;
      if (sameGroup) labGroups[labGroups.length - 1].cells.push(cell);
      else labGroups.push({ cells: [cell] });
    }

    labGroups.forEach(group => {
      const course = group.cells[0].course;
      const startTime = times[group.cells[0].idx] || "";
      const endTime = times[group.cells[group.cells.length - 1].idx] || "";
      const att = findAttendance(course.courseCode, course.courseType, attendance);
      const attn = att ? parseFloat(att["Attn %"]) || 0 : 0;
      classes.push({ slot: group.cells.map((c: any) => c.slot).join("-"), startTime, endTime, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo, category: course.category, attn, hoursConducted: 0, hoursAbsent: 0, type: "practical" });
    });

    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      if (/^[PL]\d+$/i.test(up)) return;
      const parts = up.split("/").map((p: string) => p.trim());
      for (const part of parts) {
        const letter = part.replace(/[^A-Z]/g, "");
        if (!letter || letter === "X") continue;
        const course = slotMap[letter];
        if (!course) continue;
        const key = `${course.courseCode}-theory-${ci}`;
        if (seenCourses.has(key)) continue;
        seenCourses.add(key);
        const time = times[ci] || "";
        const att = findAttendance(course.courseCode, course.courseType, attendance);
        const attn = att ? parseFloat(att["Attn %"]) || 0 : 0;
        classes.push({ slot: s, startTime: time, endTime: time, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo, category: course.category, attn, hoursConducted: 0, hoursAbsent: 0, type: "theory" });
        break;
      }
    });

    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

// ── Components ─────────────────────────────────────────────────────────────
function MiniGridTile({ slot }: { slot: ScheduleItem | null }) {
  if (!slot) {
    return (
      <div style={{
        borderRadius: "20px",
        border: "1.5px dashed #2a2a2a",
        background: "transparent",
        height: "100px",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }} />
    );
  }

  const isNso = slot.courseCode.includes("NSO") || slot.courseType.toLowerCase().includes("practical");
  const bg = isNso ? "#0d1a2a" : "#1e1e1e";
  const fg = isNso ? "#00aaff" : "#ffffff";

  return (
    <div style={{
      borderRadius: "20px",
      background: bg,
      padding: "16px",
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      height: "100px",
      overflow: "hidden"
    }}>
      <div style={{ fontSize: "10px", color: isNso ? "#00aaff" : "#888888", textTransform: "uppercase" }}>
        {isNso ? "TBA" : slot.roomNo || "TBA"}
      </div>
      <div style={{ fontSize: "18px", fontWeight: "bold", color: fg }}>
        {slot.courseCode}
      </div>
      <div style={{ fontSize: "10px", color: isNso ? "#00aaff" : "#888888", opacity: isNso ? 0.7 : 1 }}>
        {fmtTimeOnly(slot.startTime)} - {fmtTimeOnly(slot.endTime)}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { ready } = useAuth();
  const router = useRouter();
  const { setProfile, academicData, setAcademicData } = useAuthStore();
  const [data, setData] = useState<any>(academicData || null);
  const [loading, setLoading] = useState(!academicData);
  const [ttData, setTTData] = useState<any>(null);
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
    dataAPI.getTimetable(1).then(d => setTTData(d)).catch(() => {});
    dataAPI.getCalendar().then(d => setCalData(d)).catch(() => {});
  }, [ready]);

  const att = data?.attendance || [];
  const marks = data?.marks || [];
  const avg = att.length ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1) : "—";
  const risk = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  
  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "STUDENT";
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
    if (!ttData?.data?.rows || !data?.timetable || isHoliday || !dayOrder) return [];
    const rows = ttData.data.rows;
    const slotMap = buildSlotToCourseMap(data.timetable || []);
    const schedule = buildSchedule(rows, slotMap, att);
    return schedule[dayOrder - 1]?.classes || [];
  }, [ttData, data, att, dayOrder, isHoliday]);

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nextClass = dayOffset === 0 
    ? targetClasses.find((c: ScheduleItem) => parseStart(c.startTime) > nowMin || isNowIn(c.startTime, c.endTime))
    : targetClasses[0];

  const gridSlots = Array(6).fill(null);
  targetClasses.slice(0, 6).forEach((c, i) => gridSlots[i] = c);

  if (loading && !data) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#000000" }}>
      <div className="srmx-spinner" />
    </div>
  );

  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "120px" }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#1c1c1c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "16px" }}>
              {initials}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "#666666", marginBottom: "2px" }}>sup!</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", letterSpacing: "-0.5px" }}>{firstName.toLowerCase()}</div>
            </div>
          </div>

          {/* Date / Day Order Selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
              {isHoliday ? `HOLIDAY • ${dayOffset === 0 ? "TODAY" : "LATER"}` : `DAY ORDER ${dayOrder} • ${dayOffset === 0 ? "TODAY" : "LATER"}`}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setDayOffset(o => o - 1)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}>‹</button>
              <button onClick={() => setDayOffset(o => o + 1)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}>›</button>
            </div>
          </div>

          {/* Mini Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "40px" }}>
            {gridSlots.map((s, i) => (
              <MiniGridTile key={i} slot={s} />
            ))}
          </div>

          {/* Next Up */}
          {nextClass && (
            <div style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#666666", letterSpacing: "0.2em", textTransform: "uppercase" }}>next up</span>
                <span style={{ fontSize: "11px", color: "#888888" }}>{nextClass.roomNo || "TBA"}</span>
              </div>
              <div style={{ 
                fontSize: "64px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.04em", lineHeight: 1.1,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                wordBreak: "break-word"
              }}>
                {nextClass.courseTitle.toLowerCase()}
              </div>
              <div style={{ fontSize: "20px", color: "#888888", fontWeight: 500, marginTop: "8px" }}>
                {fmt12(nextClass.startTime)} - {fmt12(nextClass.endTime)}
              </div>
              <div style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "8px", background: "#1e1e1e", padding: "8px 16px", borderRadius: "99px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#555555" }} />
                <span style={{ fontSize: "13px", color: "#ffffff", fontWeight: 600 }}>STATUS • {nextClass.courseCode}</span>
                <span style={{ fontSize: "13px", color: "#888888", marginLeft: "8px" }}>starts at {fmtTimeOnly(nextClass.startTime)}</span>
              </div>
            </div>
          )}

          {/* Action Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Attendance */}
            <div onClick={() => router.push("/attendance")} style={{ background: "#1a2600", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#a8c200", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: "bold" }}>%</div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#a8c200" }}>overall attendance</div>
                  <div style={{ fontSize: "13px", color: "#a8c200", opacity: 0.8 }}>{avg}% average</div>
                </div>
              </div>
              <div style={{ color: "#a8c200", fontSize: "24px" }}>›</div>
            </div>

            {/* Alerts */}
            {risk > 0 ? (
              <div style={{ background: "#1a0000", border: "2px dashed #ff3b3b", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#ff3b3b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>academic emergency</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#ff3b3b", lineHeight: 1 }}>{risk} SUBJECTS ALERTS</div>
                  <div style={{ fontSize: "12px", color: "#ff3b3b", fontStyle: "italic", marginTop: "8px" }}>aint nobody savin you</div>
                </div>
                <div style={{ color: "#ff3b3b", fontSize: "24px" }}>›</div>
              </div>
            ) : (
              <div style={{ background: "#ffffff", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: "bold" }}>!</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#000000" }}>no class alerts</div>
                    <div style={{ fontSize: "13px", color: "#666666" }}>safe zone</div>
                  </div>
                </div>
                <div style={{ color: "#000000", fontSize: "24px" }}>›</div>
              </div>
            )}

            {/* Recent Marks */}
            <div onClick={() => router.push("/marks")} style={{ background: "#1c1c1c", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>★</div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>recent marks</div>
                  <div style={{ fontSize: "13px", color: "#888888" }}>{marks.length} assessments taken</div>
                </div>
              </div>
              <div style={{ color: "#ffffff", fontSize: "24px" }}>›</div>
            </div>

          </div>

          {/* Watermark */}
          <div className="watermark">home</div>

        </div>
      </main>
    </div>
  );
}
