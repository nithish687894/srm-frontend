"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import {
  Clock, BookCheck, AlertTriangle,
  TrendingUp, Award, Calendar, Zap, ChevronRight,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────
function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }
function parseStart(t: string) { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEnd(t: string) { const parts = t.split(/\s*[-–]\s*/); const last = parts[parts.length - 1] || ""; const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function fmt12(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "PM" : "AM"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]} ${suffix}`; }
function fmtRange(s: string, e: string) { const a = fmt12(s); const parts = e.split(/\s*[-–]\s*/); const b = fmt12(parts[parts.length - 1] || e); return a === b ? a : `${a} – ${b}`; }
function isNowIn(s: string, e: string) { const now = new Date().getHours() * 60 + new Date().getMinutes(); return now >= parseStart(s) && now <= parseEnd(e); }

const TC: Record<string, { accent: string; bg: string; label: string; icon: string }> = {
  theory:    { accent: "#7eb8c4", bg: "rgba(126,184,196,0.12)", label: "Theory",    icon: "T" },
  lab:       { accent: "#a98bc4", bg: "rgba(169,139,196,0.12)", label: "Lab",       icon: "L" },
  practical: { accent: "#7ecba1", bg: "rgba(126,203,161,0.12)", label: "Practical", icon: "P" },
};

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
      const hoursConducted = att ? parseInt(att["Hours Conducted"]) || 0 : 0;
      const hoursAbsent = att ? parseInt(att["Hours Absent"]) || 0 : 0;
      const isPrac = /practical|workshop/i.test(course.courseType || course.category || "");
      classes.push({ slot: group.cells.map((c: any) => c.slot).join("-"), startTime, endTime, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo, category: course.category, attn, hoursConducted, hoursAbsent, type: isPrac ? "practical" : "lab" });
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

// ── StatCard ───────────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, variant, delay = 0, onClick }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const variants: any = {
    green:  { bg: "#3d5a50",  iconBg: "rgba(126,203,161,0.14)", text: "#7ecba1", bar: "#7ecba1" },
    cyan:   { bg: "#3a5260",  iconBg: "rgba(126,184,196,0.14)", text: "#7eb8c4", bar: "#7eb8c4" },
    red:    { bg: "#553a3a",  iconBg: "rgba(196,123,123,0.14)", text: "#c47b7b", bar: "#c47b7b" },
    blue:   { bg: "#3a4c60",  iconBg: "rgba(123,158,196,0.14)", text: "#7b9ec4", bar: "#7b9ec4" },
    amber:  { bg: "#55493a",  iconBg: "rgba(196,169,123,0.14)", text: "#c4a97b", bar: "#c4a97b" },
    purple: { bg: "#4a3d56",  iconBg: "rgba(169,139,196,0.14)", text: "#a98bc4", bar: "#a98bc4" },
  };
  const v = variants[variant] || variants.green;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "14px", padding: "18px 20px",
        background: v.bg,
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        position: "relative", overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${v.bar}99, transparent)`, borderRadius: "14px 14px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(232,240,244,0.40)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1.6px" }}>{title}</p>
          <p style={{ fontSize: "28px", fontWeight: 800, color: v.text, marginBottom: "4px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</p>
          {subtitle && <p style={{ fontSize: "11px", color: "rgba(232,240,244,0.35)" }}>{subtitle}</p>}
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: v.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color={v.text} />
        </div>
      </div>
    </div>
  );
}

// ── TodayClassCard ─────────────────────────────────────────────────────────
function TodayClassCard({ item, idx, isNow }: { item: ScheduleItem; idx: number; isNow: boolean }) {
  const cfg = TC[item.type] || TC.theory;
  const fac = (item.facultyName || "").replace(/\s*\(\d+\)/, "").trim();
  const attn = item.attn;
  const isRisk = attn > 0 && attn < 75;

  return (
    <div style={{
      display: "flex", alignItems: "stretch", gap: "0",
      borderRadius: "12px", overflow: "hidden",
      background: isNow ? "rgba(126,203,161,0.07)" : "rgba(255,255,255,0.03)",
      border: isNow ? "1px solid rgba(126,203,161,0.28)" : "1px solid rgba(255,255,255,0.08)",
      animation: "cardIn 0.4s cubic-bezier(.22,1,.36,1) both",
      animationDelay: `${idx * 0.06}s`,
      transition: "border-color 0.2s",
    }}>
      {/* Color accent bar */}
      <div style={{ width: "3px", background: cfg.accent, flexShrink: 0 }} />
      
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {/* Time */}
        <div style={{ flexShrink: 0, textAlign: "center", minWidth: "64px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(232,240,244,0.65)", fontFamily: "monospace" }}>
            {fmt12(item.startTime)}
          </div>
          <div style={{ fontSize: "9px", color: "rgba(232,240,244,0.28)", marginTop: "2px" }}>
            {item.slot}
          </div>
        </div>

        <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />

        {/* Course info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#e8f0f4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.courseTitle.length > 32 ? item.courseTitle.slice(0, 32) + "…" : item.courseTitle}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "9px", color: cfg.accent, background: cfg.bg, border: `1px solid ${cfg.accent}40`, padding: "1px 6px", borderRadius: "5px", fontWeight: 700 }}>
              {cfg.icon} {cfg.label}
            </span>
            {fac && <span style={{ fontSize: "10px", color: "rgba(232,240,244,0.32)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fac.split(" ").slice(-1)[0]}
            </span>}
            {item.roomNo && <span style={{ fontSize: "10px", color: "rgba(232,240,244,0.32)" }}>· {item.roomNo}</span>}
          </div>
        </div>

        {/* Attendance badge */}
        {attn > 0 && (
          <div style={{
            flexShrink: 0, textAlign: "right",
            fontSize: "13px", fontWeight: 800,
            color: isRisk ? "#c47b7b" : attn >= 85 ? "#7ecba1" : "#7ecba1",
          }}>
            {Math.round(attn)}%
          </div>
        )}

        {/* NOW badge */}
        {isNow && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "99px", background: "rgba(126,203,161,0.14)", border: "1px solid rgba(126,203,161,0.32)", fontSize: "9px", fontWeight: 700, color: "#7ecba1" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#7ecba1", animation: "pulse 1.5s infinite" }} />
            NOW
          </div>
        )}
      </div>
    </div>
  );
}

// ── MarksRow ──────────────────────────────────────────────────────────────
function MarksRow({ mark, idx }: { mark: any; idx: number }) {
  const max = parseFloat(mark["Max"]) || 100;
  const scored = parseFloat(mark["Scored"]) || 0;
  const pct = Math.min(100, (scored / max) * 100);
  const color = pct >= 75 ? "#7ecba1" : pct >= 50 ? "#c4a97b" : "#c47b7b";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px", padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      animation: "cardIn 0.4s both", animationDelay: `${idx * 0.05}s`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#e8f0f4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
          {mark["Course Title"] || mark["Course Code"] || "—"}
        </div>
        <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.35)" }}>
          {mark["Test"]} · {mark["Course Code"]}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "60px", height: "4px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "99px", transition: "width 0.6s ease" }} />
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color, minWidth: "44px", textAlign: "right" }}>
          {scored}/{max}
        </span>
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

  useEffect(() => {
    if (!ready) return;
    // Always try to refresh data in background
    dataAPI.getAll()
      .then(d => {
        setData(d);
        setAcademicData(d);
        if (d.profile) setProfile(d.profile);
        setLoading(false);
      })
      .catch(() => {
        // If we have cached data, don't redirect
        if (!data) {
          router.push("/");
        } else {
          setLoading(false);
        }
      });
  }, [ready]);

  // Load timetable and calendar for today's widget
  useEffect(() => {
    if (!ready) return;
    dataAPI.getTimetable(1).then(d => setTTData(d)).catch(() => {});
    dataAPI.getCalendar().then(d => setCalData(d)).catch(() => {});
  }, [ready]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const att = data?.attendance || [];
  const marks = data?.marks || [];
  const avg = att.length
    ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";
  const risk = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  const theoryCount = att.filter((c: any) => c["Category"] === "Theory").length;
  const labCount = att.filter((c: any) => c["Category"] === "Practical").length;
  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "Student";
  const fullName = data?.profile?.["Name"] || "Student";
  const regNo = data?.profile?.["Reg No"] || data?.profile?.["Registration Number"] || "";
  const sem = data?.profile?.["Semester"] || "—";
  const spec = data?.profile?.["Specialization"] || data?.profile?.["Branch"] || "—";

  // Average marks
  const avgMarks = marks.length
    ? (marks.reduce((s: number, m: any) => {
        const maxV = parseFloat(m["Max"]) || 100;
        const scored = parseFloat(m["Scored"]) || 0;
        return s + (scored / maxV) * 100;
      }, 0) / marks.length).toFixed(1)
    : "—";

  // Today's timetable
  const { byDate } = useMemo(() => {
    if (!calData) return { byDate: new Map() };
    try { return buildCalendarIndex(calData); }
    catch { return { byDate: new Map() }; }
  }, [calData]);

  const todayIso = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const todayCalInfo = byDate.get(todayIso);
  const isWeekend = [0, 6].includes(new Date().getDay());
  const isHoliday = !!todayCalInfo?.isHoliday || isWeekend;
  const dayOrder = todayCalInfo?.dayOrder || (isWeekend ? null : 1);

  const todayClasses = useMemo(() => {
    if (!ttData?.data?.rows || !data?.timetable || isHoliday || !dayOrder) return [];
    const rows = ttData.data.rows;
    const slotMap = buildSlotToCourseMap(data.timetable || []);
    const schedule = buildSchedule(rows, slotMap, att);
    return schedule[dayOrder - 1]?.classes || [];
  }, [ttData, data, att, dayOrder, isHoliday]);

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nowClass = todayClasses.find((c: ScheduleItem) => isNowIn(c.startTime, c.endTime));
  const nextClass = todayClasses.find((c: ScheduleItem) => parseStart(c.startTime) > nowMin);

  const initials = fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  if (loading && !data) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#36454F", flexDirection: "column", gap: "18px" }}>
      <div className="srmx-spinner" />
      <p style={{ color: "rgba(232,240,244,0.38)", fontSize: "14px" }}>Loading your portal…</p>
    </div>
  );

  return (
    <div className="page-root">
      <div className="orb orb-green-1" />
      <div className="orb orb-green-2" />
      <div className="bg-grid" />
      <Sidebar />

      <main className="page-main">
        {/* Topbar */}
        <div className="srmx-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(126,203,161,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#7ecba1" strokeWidth="1.5"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#7ecba1" strokeWidth="1.5"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#7ecba1" strokeWidth="1.5"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#7ecba1" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#e8f0f4", letterSpacing: "-0.3px" }}>Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "rgba(232,240,244,0.35)", fontFamily: "monospace" }}>{timeStr}</span>
            <span className="neon-badge">
              Sem {sem} · {spec}
            </span>
          </div>
        </div>

        <div className="page-content">
          {/* ── Hero Section: Greeting + Profile ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto", gap: "20px",
            marginBottom: "28px", alignItems: "center",
            animation: "fadeUp 0.6s ease",
          }}>
            <div>
              <div style={{ fontSize: "12px", color: "rgba(232,240,244,0.38)", marginBottom: "6px", letterSpacing: "0.3px" }}>
                {dateStr}
                {dayOrder && !isHoliday && (
                  <span style={{ marginLeft: "10px", padding: "2px 8px", borderRadius: "6px", background: "rgba(126,203,161,0.10)", color: "#7ecba1", fontSize: "11px", fontWeight: 600 }}>
                    Day Order {dayOrder}
                  </span>
                )}
                {isHoliday && (
                  <span style={{ marginLeft: "10px", padding: "2px 8px", borderRadius: "6px", background: "rgba(196,169,123,0.12)", color: "#c4a97b", fontSize: "11px", fontWeight: 600 }}>
                    Holiday / Weekend
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, color: "#e8f0f4", letterSpacing: "-0.4px", lineHeight: 1.2, marginBottom: "6px" }}>
                {greeting}, <span style={{ color: "#7ecba1" }}>{firstName}</span> 👋
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(232,240,244,0.40)", lineHeight: 1.6 }}>
                {nowClass
                  ? `You're currently in ${nowClass.courseTitle.split(" ").slice(0, 4).join(" ")}…`
                  : nextClass
                  ? `Next up: ${nextClass.courseTitle.split(" ").slice(0, 4).join(" ")} at ${fmt12(nextClass.startTime)}`
                  : isHoliday
                  ? "Enjoy your day off! You deserve it."
                  : "Here's your academic overview for today."
                }
              </p>
            </div>

            {/* Profile Card */}
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "14px 18px", borderRadius: "14px",
              background: "#3a4f5c",
              border: "1px solid rgba(255,255,255,0.09)",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #7ecba1, #5aaf85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "15px", fontWeight: 800, color: "#1a3028", flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#e8f0f4", marginBottom: "2px" }}>
                  {fullName}
                </div>
                {regNo && (
                  <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.38)", fontFamily: "monospace", marginBottom: "2px" }}>
                    {regNo}
                  </div>
                )}
                <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.32)" }}>
                  Sem {sem} · {spec}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div id="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            <StatCard
              title="Avg Attendance"
              value={avg + "%"}
              subtitle="This semester"
              icon={Clock}
              variant={parseFloat(avg) >= 75 ? "green" : "red"}
              delay={0}
              onClick={() => router.push("/attendance")}
            />
            <StatCard
              title="Total Courses"
              value={att.length}
              subtitle={`${theoryCount} Theory · ${labCount} Lab`}
              icon={BookCheck}
              variant="cyan"
              delay={80}
              onClick={() => router.push("/attendance")}
            />
            <StatCard
              title="At Risk"
              value={risk}
              subtitle={risk > 0 ? "Need attention" : "All clear!"}
              icon={AlertTriangle}
              variant={risk > 0 ? "red" : "green"}
              delay={160}
              onClick={() => router.push("/attendance")}
            />
            <StatCard
              title="Avg Marks"
              value={avgMarks !== "—" ? avgMarks + "%" : "—"}
              subtitle={`${marks.length} test entries`}
              icon={TrendingUp}
              variant="blue"
              delay={240}
              onClick={() => router.push("/marks")}
            />
          </div>

          {/* ── Two Column Layout: Today's Timetable + Quick Marks ── */}
          <div id="dash-main-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "14px", marginBottom: "24px" }}>

            {/* Today's Timetable Widget */}
            <div style={{
              borderRadius: "16px",
              background: "#3a4f5c",
              border: "1px solid rgba(255,255,255,0.09)",
              overflow: "hidden",
              animation: "fadeUp 0.7s ease 0.1s both",
            }}>
              {/* Header */}
              <div style={{
                padding: "16px 18px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(126,184,196,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={14} color="#7eb8c4" />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#e8f0f4" }}>Today&apos;s Schedule</div>
                    <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.38)" }}>
                      {isHoliday ? "No classes today" : dayOrder ? `Day Order ${dayOrder} · ${todayClasses.length} classes` : "Loading…"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/timetable")}
                  style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#7eb8c4", background: "rgba(126,184,196,0.10)", border: "1px solid rgba(126,184,196,0.22)", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontWeight: 600 }}
                >
                  Full View <ChevronRight size={12} />
                </button>
              </div>

              {/* Class list */}
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "380px", overflowY: "auto" }}>
                {isHoliday ? (
                  <div style={{ textAlign: "center", padding: "36px 0" }}>
                    <div style={{ fontSize: "30px", marginBottom: "10px" }}>🎉</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(232,240,244,0.45)" }}>Holiday / Weekend</div>
                    <div style={{ fontSize: "12px", color: "rgba(232,240,244,0.28)", marginTop: "4px" }}>Enjoy your free time!</div>
                  </div>
                ) : todayClasses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "36px 0" }}>
                    <div style={{ fontSize: "30px", marginBottom: "10px" }}>📭</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(232,240,244,0.45)" }}>No timetable data</div>
                    <div style={{ fontSize: "11px", color: "rgba(232,240,244,0.28)", marginTop: "4px" }}>
                      <button onClick={() => router.push("/timetable")} style={{ color: "#7eb8c4", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "11px" }}>
                        Visit Timetable page
                      </button>
                    </div>
                  </div>
                ) : (
                  todayClasses.map((item: ScheduleItem, i: number) => (
                    <TodayClassCard key={`${item.courseCode}-${i}`} item={item} idx={i} isNow={isNowIn(item.startTime, item.endTime)} />
                  ))
                )}
              </div>
            </div>

            {/* Right column: Marks + Quick links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Marks Summary */}
              <div style={{
                borderRadius: "16px", flex: 1,
                background: "#3a4f5c",
                border: "1px solid rgba(255,255,255,0.09)",
                overflow: "hidden",
                animation: "fadeUp 0.7s ease 0.15s both",
              }}>
                <div style={{
                  padding: "16px 18px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(123,158,196,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Award size={14} color="#7b9ec4" />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#e8f0f4" }}>Recent Marks</div>
                      <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.38)" }}>{marks.length} test records</div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/marks")}
                    style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#7b9ec4", background: "rgba(123,158,196,0.10)", border: "1px solid rgba(123,158,196,0.22)", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontWeight: 600 }}
                  >
                    All Marks <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ padding: "4px 16px 8px", maxHeight: "260px", overflowY: "auto" }}>
                  {marks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", fontSize: "13px", color: "rgba(232,240,244,0.30)" }}>No marks data</div>
                  ) : (
                    marks.slice(0, 6).map((m: any, i: number) => <MarksRow key={i} mark={m} idx={i} />)
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                borderRadius: "16px",
                background: "#3a4f5c",
                border: "1px solid rgba(255,255,255,0.09)",
                padding: "14px",
                animation: "fadeUp 0.7s ease 0.2s both",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(232,240,244,0.32)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>
                  Quick Access
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                  {[
                    { label: "Attendance", icon: Clock,    color: "#7ecba1", bg: "rgba(126,203,161,0.10)", href: "/attendance" },
                    { label: "Timetable",  icon: Calendar, color: "#7eb8c4", bg: "rgba(126,184,196,0.10)", href: "/timetable" },
                    { label: "GPA Calc",   icon: Zap,      color: "#a98bc4", bg: "rgba(169,139,196,0.10)", href: "/gpa" },
                    { label: "AI Assist",  icon: Award,    color: "#c4a97b", bg: "rgba(196,169,123,0.10)", href: "/ai" },
                  ].map(({ label, icon: Icon, color, bg, href }) => (
                    <button
                      key={href}
                      onClick={() => router.push(href)}
                      style={{
                        display: "flex", alignItems: "center", gap: "7px",
                        padding: "9px 10px", borderRadius: "10px",
                        background: bg, border: `1px solid ${color}28`,
                        cursor: "pointer", fontSize: "12px", fontWeight: 600, color,
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}50`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}28`; }}
                    >
                      <Icon size={14} color={color} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── At-Risk Subjects ── */}
          {risk > 0 && (
            <div style={{
              borderRadius: "16px",
              background: "#4a3535",
              border: "1px solid rgba(196,123,123,0.18)",
              overflow: "hidden",
              animation: "fadeUp 0.7s ease 0.25s both",
            }}>
              <div style={{
                padding: "14px 18px",
                borderBottom: "1px solid rgba(196,123,123,0.10)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(196,123,123,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertTriangle size={14} color="#c47b7b" />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#c47b7b" }}>Attendance Alert</div>
                    <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.38)" }}>{risk} subject{risk > 1 ? "s" : ""} below 75%</div>
                  </div>
                </div>
                <button onClick={() => router.push("/attendance")} style={{ fontSize: "11px", color: "#c47b7b", background: "rgba(196,123,123,0.10)", border: "1px solid rgba(196,123,123,0.22)", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontWeight: 600 }}>
                  View All
                </button>
              </div>
              <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
                {att.filter((c: any) => parseFloat(c["Attn %"]) < 75).slice(0, 4).map((c: any) => {
                  const pct = parseFloat(c["Attn %"]) || 0;
                  const cond = parseInt(c["Hours Conducted"]) || 0;
                  const pres = parseInt(c["Hours Present"]) || (cond - (parseInt(c["Hours Absent"]) || 0));
                  const need = cond > 0 ? Math.max(0, Math.ceil((0.75 * cond - pres) / 0.25)) : 0;
                  return (
                    <div key={c["Course Code"] + c["Category"]} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(196,123,123,0.06)", border: "1px solid rgba(196,123,123,0.10)" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: pct >= 65 ? "rgba(196,169,123,0.14)" : "rgba(196,123,123,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: pct >= 65 ? "#c4a97b" : "#c47b7b" }}>{Math.round(pct)}%</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#e8f0f4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c["Course Title"] || c["Course Code"]}
                        </div>
                        <div style={{ fontSize: "10px", color: "#c47b7b", marginTop: "2px" }}>Need {need} more {need === 1 ? "class" : "classes"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        #dash-stats {
          grid-template-columns: repeat(4, 1fr);
        }
        #dash-main-grid {
          grid-template-columns: 1.2fr 0.8fr;
        }
        @media (max-width: 1100px) {
          #dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          #dash-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          #dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          #dash-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
