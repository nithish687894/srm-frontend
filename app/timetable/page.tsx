"use client";
import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface AttendanceCourse {
  "Course Code": string; "Course Title": string; "Faculty Name": string;
  "Slot": string; "Room No": string; "Category": string;
  "Attn %": string; "Hours Conducted": string; "Hours Absent": string;
}
interface MyTimetableCourse {
  courseCode: string; courseTitle: string; courseType: string;
  category: string; facultyName: string; slot: string;
  slots: string[]; roomNo: string; credit: string;
}
interface ScheduleItem {
  slot: string; startTime: string; endTime: string;
  courseTitle: string; courseCode: string; courseType: string;
  facultyName: string; roomNo: string; category: string;
  attn: number; hoursConducted: number; hoursAbsent: number;
  type: "theory" | "lab" | "practical";
}

function buildSlotToCourseMap(myTT: MyTimetableCourse[]) {
  const map: Record<string, MyTimetableCourse> = {};
  myTT.forEach(c => { c.slots.forEach(s => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function findAttendance(code: string, courseType: string, atts: AttendanceCourse[]) {
  return atts.find(a => {
    const aCode = a["Course Code"] || "";
    const aCat = (a["Category"] || "").toLowerCase();
    const isLabType = courseType.toLowerCase().includes("practical") || courseType.toLowerCase().includes("lab");
    return aCode === code && (isLabType ? aCat.includes("practical") : !aCat.includes("practical"));
  }) || atts.find(a => a["Course Code"] === code);
}

function buildSchedule(gridRows: any[], slotMap: Record<string, MyTimetableCourse>, attendance: AttendanceCourse[]): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = gridRows.find(r => r[0] === "FROM");
  const times: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = gridRows.filter(r => typeof r[0] === "string" && r[0].startsWith("Day"));

  return dayRows.map(row => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];
    const seenCourses = new Set<string>();

    type LabCell = { idx: number; slot: string; course: MyTimetableCourse };
    const labCells: LabCell[] = [];
    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      const up = s?.toUpperCase() || "";
      if (!s || !/^[PL]\d+$/i.test(up)) return;
      const course = slotMap[up];
      if (course) labCells.push({ idx: ci, slot: up, course });
    });

    const labGroups: { cells: LabCell[] }[] = [];
    for (let i = 0; i < labCells.length; i++) {
      const cell = labCells[i];
      const prev = i > 0 ? labCells[i - 1] : null;
      const sameGroup = prev && prev.course.courseCode === cell.course.courseCode && prev.course.courseType === cell.course.courseType && cell.idx === prev.idx + 1;
      if (sameGroup) { labGroups[labGroups.length - 1].cells.push(cell); }
      else { labGroups.push({ cells: [cell] }); }
    }

    labGroups.forEach(group => {
      const course = group.cells[0].course;
      const startTime = times[group.cells[0].idx] || "";
      const endTime = times[group.cells[group.cells.length - 1].idx] || "";
      const att = findAttendance(course.courseCode, course.courseType, attendance);
      const attn = att ? parseFloat(att["Attn %"]) || 0 : 0;
      const hoursConducted = att ? parseInt(att["Hours Conducted"]) || 0 : 0;
      const hoursAbsent = att ? parseInt(att["Hours Absent"]) || 0 : 0;
      const isPrac = /practical|workshop/i.test(course.courseType || course.category || "");
      classes.push({ slot: group.cells.map(c => c.slot).join("-"), startTime, endTime, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo, category: course.category, attn, hoursConducted, hoursAbsent, type: isPrac ? "practical" : "lab" });
    });

    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      if (/^[PL]\d+$/i.test(up)) return;
      const parts = up.split("/").map(p => p.trim());
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
        const hoursConducted = att ? parseInt(att["Hours Conducted"]) || 0 : 0;
        const hoursAbsent = att ? parseInt(att["Hours Absent"]) || 0 : 0;
        classes.push({ slot: s, startTime: time, endTime: time, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo, category: course.category, attn, hoursConducted, hoursAbsent, type: "theory" });
        break;
      }
    });

    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

function to24(h: number): number { return (h >= 1 && h <= 7) ? h + 12 : h; }
function parseStart(t: string): number { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEndTime(t: string): number { const parts = t.split(/\s*[-–]\s*/); const last = (parts[parts.length - 1] || "").trim(); const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function isNowIn(s: string, e: string): boolean { const now = new Date().getHours() * 60 + new Date().getMinutes(); return now >= parseStart(s) && now <= parseEndTime(e); }
function fmt12(t: string): string { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "PM" : "AM"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]} ${suffix}`; }
function fmtRange(s: string, e: string): string { const a = fmt12(s); const parts = e.split(/\s*[-–]\s*/); const b = fmt12(parts[parts.length - 1] || e); return a === b ? a : `${a} – ${b}`; }
function slotMins(s: string, e: string): number { return Math.max(0, parseEndTime(e) - parseStart(s)); }

const TC = {
  theory:    { accent: "#00e5ff", bg: "rgba(0,229,255,0.08)",   label: "Theory",    icon: "T" },
  lab:       { accent: "#b388ff", bg: "rgba(179,136,255,0.08)", label: "Lab",       icon: "L" },
  practical: { accent: "#00ff87", bg: "rgba(0,255,135,0.08)",   label: "Practical", icon: "P" },
};

function attnInfo(pct: number) {
  if (!pct) return { color: "#52525b", label: "No data" };
  if (pct >= 85) return { color: "#00ff87", label: "Excellent" };
  if (pct >= 75) return { color: "#00e676", label: "Safe" };
  if (pct >= 65) return { color: "#ffb300", label: "At risk" };
  return { color: "#ff4757", label: "Critical" };
}

function Ring({ pct }: { pct: number }) {
  const r = 17, sz = 46, circ = 2 * Math.PI * r;
  const filled = (Math.min(pct, 100) / 100) * circ;
  const { color } = attnInfo(pct);
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ flexShrink: 0 }}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"/>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${sz/2} ${sz/2})`}
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)" }}/>
      <text x={sz/2} y={sz/2+4} textAnchor="middle" fill={color}
        style={{ fontSize: "9px", fontWeight: 700 }}>
        {pct > 0 ? `${Math.round(pct)}%` : "–"}
      </text>
    </svg>
  );
}

function ClassCard({ item, idx, active, cRef }: { item: ScheduleItem; idx: number; active: boolean; cRef?: React.RefObject<HTMLDivElement | null> }) {
  const cfg = TC[item.type] || TC.theory;
  const attn = item.attn;
  const cond = item.hoursConducted;
  const abs = item.hoursAbsent;
  const pres = cond - abs;
  const need = cond > 0 ? Math.max(0, Math.ceil((0.75 * cond - pres) / 0.25)) : 0;
  const skip = cond > 0 ? Math.max(0, Math.floor((pres - 0.75 * cond) / 0.75)) : 0;
  const { color: ac, label: al } = attnInfo(attn);
  const isRisk = attn > 0 && attn < 75;
  const mins = slotMins(item.startTime, item.endTime);
  const multi = mins > 58;
  const fac = (item.facultyName || "").replace(/\s*\(\d+\)/, "");
  const room = item.roomNo || "TBA";

  return (
    <div ref={cRef}
      style={{
        borderRadius: "16px", overflow: "hidden", position: "relative",
        background: active ? "rgba(0,255,135,0.06)" : "rgba(10,10,10,0.55)",
        border: active ? "1px solid rgba(0,255,135,0.30)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: active ? "0 0 0 1px rgba(0,255,135,0.08), 0 8px 32px rgba(0,255,135,0.10)" : "none",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        animation: "cardIn 0.42s cubic-bezier(.22,1,.36,1) both",
        animationDelay: `${idx * 0.055}s`,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: cfg.accent }} />
      {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${cfg.accent}aa,transparent)` }} />}

      <div style={{ padding: "13px 14px 10px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "9px", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.accent}35` }}>
            <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: `${cfg.accent}20`, border: `1px solid ${cfg.accent}40`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800 }}>{cfg.icon}</span>
            {cfg.label}
          </span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace", background: "rgba(255,255,255,0.03)", padding: "1px 7px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.06)" }}>{item.slot}</span>
          {active && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "999px", background: "rgba(0,255,135,0.10)", border: "1px solid rgba(0,255,135,0.30)", fontSize: "10px", fontWeight: 700, color: "#00ff87", marginLeft: "auto" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00ff87", animation: "pulse 1.5s infinite" }} />
              NOW
            </span>
          )}
        </div>

        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f0", lineHeight: 1.4, marginBottom: "3px" }}>{item.courseTitle}</div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)", fontFamily: "monospace", marginBottom: "9px" }}>{item.courseCode}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "9px" }}>
          {[{ icon: "person", text: fac }, { icon: "room", text: `Room ${room}` }].map(({ icon, text }) => (
            <div key={icon} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                {icon === "person"
                  ? <><circle cx="6" cy="4" r="2.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round"/></>
                  : <><rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.1" strokeLinecap="round"/></>}
              </svg>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)", margin: "0 14px 0 18px" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 12px 18px" }}>
        <div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.20)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "2px" }}>Time</div>
          <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.70)" }}>{fmtRange(item.startTime, item.endTime)}</div>
          {multi && <div style={{ fontSize: "9px", color: cfg.accent, marginTop: "2px" }}>{Math.round(mins / 55)} hr session</div>}
        </div>
        {attn > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.20)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "2px" }}>Attendance</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: ac }}>{al}</div>
              <div style={{ fontSize: "10px", marginTop: "2px" }}>
                {isRisk ? <span style={{ color: "#ff4757" }}>Need {need} more</span> : <span style={{ color: "#00ff87" }}>{skip} can skip</span>}
              </div>
            </div>
            <Ring pct={attn} />
          </div>
        ) : <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)" }}>No data</span>}
      </div>

      {multi && (
        <div style={{ height: "2px", margin: "0 18px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (mins / 240) * 100)}%`, background: cfg.accent, borderRadius: "99px", opacity: 0.6 }} />
        </div>
      )}
    </div>
  );
}

export default function TimetablePage() {
  const [gridRows, setGridRows] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceCourse[]>([]);
  const [myTT, setMyTT] = useState<MyTimetableCourse[]>([]);
  const [batch, setBatch] = useState(1);
  const [dayOverride, setDayOverride] = useState<number | null>(null);
  const [selectedIso, setSelectedIso] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    const q = url.searchParams.get("date");
    const now = new Date();
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q)
      ? q
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const nowRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const weekend = selectedIso
    ? [0, 6].includes(new Date(`${selectedIso}T00:00:00`).getDay())
    : false;

  const { data: tt, isLoading: loadingTT } = useQuery({
    queryKey: ["timetable", batch],
    queryFn: () => dataAPI.getTimetable(batch),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  const { data: att, isLoading: loadingAtt } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => dataAPI.getAttendance(),
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });
  const { data: mytt, isLoading: loadingMy } = useQuery({
    queryKey: ["myTT"],
    queryFn: () => dataAPI.getMyTimetable(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });
  const { data: cal, isLoading: loadingCal } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => dataAPI.getCalendar(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  const loading = loadingTT || loadingAtt || loadingMy || loadingCal;

  const { byDate } = useMemo(() => buildCalendarIndex(cal), [cal]);
  const calInfo = selectedIso ? byDate.get(selectedIso) : undefined;
  const isHoliday = !!calInfo?.isHoliday || weekend;
  const headerSub = calInfo
    ? (calInfo.isHoliday ? (calInfo.event || "Holiday") : `Day Order ${calInfo.dayOrder}`)
    : (weekend ? "Holiday" : "Day Order");

  const effectiveDay = !isHoliday
    ? (dayOverride ?? (calInfo?.dayOrder || 1))
    : (dayOverride ?? 1);

  // keep existing scroll behaviour via ref focus on "active" card without effects

  const slotMap = buildSlotToCourseMap(mytt?.data || myTT);
  const ttRows = tt?.data?.rows || gridRows;
  const schedule = buildSchedule(ttRows, slotMap, att?.data || attendance);
  const classes = schedule[effectiveDay - 1]?.classes || [];
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nowItem = classes.find(c => isNowIn(c.startTime, c.endTime));
  const nxtItem = classes.find(c => parseStart(c.startTime) > nowMin);
  const labCnt = classes.filter(c => c.type !== "theory").length;
  const thryCnt = classes.filter(c => c.type === "theory").length;

  return (
    <div className="page-root">
      <div className="orb orb-green-1" />
      <div className="orb orb-green-2" />
      <div className="bg-grid" />
      <Sidebar />

      <main className="page-main">
        <div className="srmx-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, overflow: "hidden" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>Timetable</span>
            <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.32)", whiteSpace: "nowrap" }}>{headerSub}</span>
            {nowItem && !isHoliday && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 10px", borderRadius: "999px", background: "rgba(0,255,135,0.10)", border: "1px solid rgba(0,255,135,0.25)", fontSize: "11px", color: "#00ff87", fontWeight: 600, whiteSpace: "nowrap" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#00ff87", animation: "pulse 1.5s infinite" }} />
                In class
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              value={selectedIso}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedIso(v);
                setDayOverride(null);
                const u = new URL(window.location.href);
                u.searchParams.set("date", v);
                window.history.replaceState(null, "", u.toString());
              }}
              type="date"
              style={{
                height: "34px",
                padding: "0 10px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.65)",
                fontSize: "12px",
              }}
            />
          <div style={{ display: "flex", padding: "3px", gap: "3px", background: "rgba(255,255,255,0.03)", borderRadius: "11px", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {[1, 2].map(b => (
              <button key={b} onClick={() => setBatch(b)}
                style={{ padding: "5px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: batch === b ? "#00ff87" : "transparent", color: batch === b ? "#050505" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", transition: "all 0.18s" }}>
                Batch {b}
              </button>
            ))}
          </div>
          </div>
        </div>

        <div className="page-content">
          {/* Day selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}>Day Order</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3, 4, 5].map(d => (
                  <button key={d} onClick={() => setDayOverride(d)}
                    style={{
                      width: "46px", height: "46px", borderRadius: "13px", fontSize: "18px", fontWeight: 800,
                      background: effectiveDay === d ? "linear-gradient(135deg,#00ff87,#00e676)" : "rgba(255,255,255,0.03)",
                      color: effectiveDay === d ? "#050505" : "rgba(255,255,255,0.28)",
                      border: effectiveDay === d ? "1px solid rgba(0,255,135,0.5)" : "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer", transition: "all 0.2s cubic-bezier(.22,1,.36,1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: effectiveDay === d ? "0 6px 24px rgba(0,255,135,0.3)" : "none",
                      transform: effectiveDay === d ? "scale(1.08)" : "scale(1)",
                    }}>{d}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
              {[{ ic: "‹", fn: () => setDayOverride(d => (d ?? effectiveDay) > 1 ? (d ?? effectiveDay) - 1 : 5) }, { ic: "›", fn: () => setDayOverride(d => (d ?? effectiveDay) < 5 ? (d ?? effectiveDay) + 1 : 1) }].map(({ ic, fn }) => (
                <button key={ic} onClick={fn}
                  style={{ width: "36px", height: "36px", borderRadius: "10px", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.40)", cursor: "pointer" }}>{ic}</button>
              ))}
            </div>
          </div>

          {/* Heading */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "20px", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.20)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                {weekend ? "Weekend — No classes" : "Schedule for"}
              </div>
              <div style={{ fontSize: "38px", fontWeight: 300, color: "rgba(255,255,255,0.80)", letterSpacing: "-1px", lineHeight: 1 }}>
                Day <strong style={{ fontWeight: 800, color: "#fff" }}>{effectiveDay}</strong>
              </div>
            </div>
            {!loading && classes.length > 0 && (
              <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", flexShrink: 0 }}>
                {thryCnt > 0 && <div style={{ textAlign: "right" }}><div style={{ fontSize: "9px", color: "rgba(255,255,255,0.20)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "3px" }}>Theory</div><div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: "#00e5ff" }}>{thryCnt}</div></div>}
                {labCnt > 0 && <div style={{ textAlign: "right" }}><div style={{ fontSize: "9px", color: "rgba(255,255,255,0.20)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "3px" }}>Labs</div><div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: "#b388ff" }}>{labCnt}</div></div>}
                {nxtItem && !nowItem && <div style={{ textAlign: "right" }}><div style={{ fontSize: "9px", color: "rgba(255,255,255,0.20)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "3px" }}>Next at</div><div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: "#00ff87" }}>{fmt12(nxtItem.startTime)}</div></div>}
              </div>
            )}
          </div>

          {/* Legend */}
          {!loading && classes.length > 0 && (
            <div style={{ display: "flex", gap: "16px", marginBottom: "18px", flexWrap: "wrap" }}>
              {(["theory", "lab", "practical"] as const).filter(tp => classes.some(c => c.type === tp)).map(tp => (
                <div key={tp} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.32)" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: TC[tp].accent, opacity: 0.85 }} />
                  {TC[tp].label}
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: "12px" }}>
              {[...Array(4)].map((_, i) => <div key={i} className="sk-card" style={{ height: "210px", animationDelay: `${i * 0.12}s` }} />)}
            </div>
          ) : isHoliday ? (
            <div style={{ textAlign: "center", padding: "80px 0", animation: "fadeUp 0.5s ease" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.55)", marginBottom: "8px" }}>
                {headerSub || "Holiday"}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
                No classes scheduled for this date.
              </div>
            </div>
          ) : classes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", animation: "fadeUp 0.5s ease" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.55)", marginBottom: "8px" }}>No classes — Day {effectiveDay}</div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>Enjoy your free time!</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: "12px" }}>
              {classes.map((item, i) => {
                const active = !isHoliday && isNowIn(item.startTime, item.endTime);
                return <ClassCard key={`${item.courseCode}-${item.type}-${i}`} item={item} idx={i} active={active} cRef={active ? nowRef : undefined} />;
              })}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .page-content > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
