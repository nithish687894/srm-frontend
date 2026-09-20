"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarCheck, 
  Sun, 
  Clock, 
  X,
  Zap,
  Target,
  ArrowRight,
  BookOpen,
  RotateCcw
} from "lucide-react";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex, type Semester, type CalendarDayInfo } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";

// ─── TIMETABLE & ATTENDANCE ENGINE HELPERS ───────────────────────────────────
function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }

function parseTimeRange(t: string): { start: string; end: string } {
  const parts = t.split(/[-–]/).map(s => s.trim());
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: t, end: t };
}

function fmt12(t: string) {
  const m = t.match(/(\d+):(\d+)/);
  if (!m) return t;
  const h24 = to24(parseInt(m[1]));
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${h12}:${m[2]} ${suffix}`;
}

interface ScheduleItem {
  slot: string;
  startTime: string;
  endTime: string;
  courseTitle: string;
  courseCode: string;
  courseType: string;
  facultyName: string;
  roomNo: string;
}

function buildSlotToCourseMap(myTT: AnyValue[]) {
  const map: Record<string, AnyValue> = {};
  (myTT || []).forEach(c => {
    if (!c) return;

    if (Array.isArray(c.slots)) {
      c.slots.forEach((s: string) => {
        if (!s) return;
        const upper = String(s).toUpperCase().trim().replace(/-+$/, "");
        if (upper) map[upper] = c;
      });
    }

    if (c.slot) {
      const parts = String(c.slot)
        .split(/[+,\s/-]+/)
        .map((sp: string) => sp.trim().toUpperCase().replace(/-+$/, ""))
        .filter(Boolean);

      parts.forEach((p: string) => {
        if (!p) return;
        map[p] = c;

        const baseLetter = p.replace(/[^A-Z]/g, "");
        if (baseLetter && baseLetter.length === 1 && !['P', 'L'].includes(baseLetter) && !map[baseLetter]) {
          map[baseLetter] = c;
        }
      });
    }
  });
  return map;
}

function getRegisteredCourses(payload: AnyValue): AnyValue[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getMasterGridRows(payload: AnyValue): AnyValue[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function buildSchedule(gridRows: AnyValue[], slotMap: Record<string, AnyValue>): { day: string; classes: ScheduleItem[] }[] {
  if (!Array.isArray(gridRows)) return [];
  const timeRow = gridRows.find((r: AnyValue) => Array.isArray(r) && typeof r[0] === "string" && /^from$/i.test(r[0].trim()));
  const timeStrings: string[] = timeRow ? timeRow.slice(1).map((t: string) => String(t || "").replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = gridRows.filter((r: AnyValue) => Array.isArray(r) && typeof r[0] === "string" && /^day/i.test(r[0].trim()));

  return dayRows.map((row: AnyValue) => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];
    const seenCourses = new Set<string>();

    const labCells: { idx: number; slot: string; course: AnyValue }[] = [];
    cells.forEach((cell, ci) => {
      const s = String(cell || "").trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      const matches = up.match(/[PL]\d+/gi);
      if (!matches) return;

      for (const slotToken of matches) {
        const slotCode = slotToken.toUpperCase();
        const course = slotMap[slotCode] || slotMap[slotCode.replace(/[^A-Z]/g, "")];
        if (course) {
          labCells.push({ idx: ci, slot: slotCode, course });
          break;
        }
      }
    });

    const labGroups: { cells: { idx: number; slot: string; course: AnyValue }[] }[] = [];
    for (let i = 0; i < labCells.length; i++) {
      const cell = labCells[i];
      const prev = i > 0 ? labCells[i - 1] : null;
      const sameGroup = prev &&
        prev.course.courseCode === cell.course.courseCode &&
        (prev.course.courseType || '') === (cell.course.courseType || '') &&
        cell.idx === prev.idx + 1;

      if (sameGroup) {
        labGroups[labGroups.length - 1].cells.push(cell);
      } else {
        labGroups.push({ cells: [cell] });
      }
    }

    labGroups.forEach(group => {
      const course = group.cells[0].course;
      const startRange = parseTimeRange(timeStrings[group.cells[0].idx] || "");
      const endRange = parseTimeRange(timeStrings[group.cells[group.cells.length - 1].idx] || "");
      classes.push({
        slot: group.cells.map((c: AnyValue) => c.slot).join("-"),
        startTime: startRange.start,
        endTime: endRange.end,
        courseTitle: course.courseTitle || course.courseCode,
        courseCode: course.courseCode,
        courseType: course.courseType || "Practical",
        facultyName: course.facultyName || "TBA",
        roomNo: course.roomNo || "TBA"
      });
    });

    cells.forEach((cell, ci) => {
      const s = String(cell || "").trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      if (/[PL]\d+/i.test(up)) return;
      const parts = up.split("/").map((p: string) => p.trim());
      for (const part of parts) {
        const letter = part.replace(/[^A-Z]/g, "");
        if (!letter || letter === "X") continue;
        const course = slotMap[part] || slotMap[letter];
        if (!course) continue;
        const key = `${course.courseCode}-${course.courseType || 'theory'}-${ci}`;
        if (seenCourses.has(key)) continue;
        seenCourses.add(key);
        const { start, end } = parseTimeRange(timeStrings[ci] || "");
        classes.push({
          slot: s,
          startTime: start,
          endTime: end,
          courseTitle: course.courseTitle || course.courseCode,
          courseCode: course.courseCode,
          courseType: course.courseType || "Theory",
          facultyName: course.facultyName || "TBA",
          roomNo: course.roomNo || "TBA"
        });
        break;
      }
    });

    const parseSortTime = (t: string) => {
      const parts = t.split(':');
      if (parts.length < 2) return 0;
      return to24(parseInt(parts[0])) * 60 + parseInt(parts[1]);
    };

    classes.sort((a, b) => parseSortTime(a.startTime) - parseSortTime(b.startTime));
    return { day: row[0] as string, classes };
  });
}

function getClassesForDayOrder(
  dayOrder: number | string | null,
  myTimetable: AnyValue,
  masterTimetable: AnyValue
): ScheduleItem[] {
  if (!dayOrder) return [];
  const doNum = typeof dayOrder === "string" ? parseInt(dayOrder.replace(/[^0-9]/g, ""), 10) : dayOrder;
  if (!doNum || doNum < 1 || doNum > 5) return [];

  const slotMap = buildSlotToCourseMap(getRegisteredCourses(myTimetable));
  const gridRows = getMasterGridRows(masterTimetable);
  const schedule = buildSchedule(gridRows, slotMap);

  const dayTargetStr = `Day ${doNum}`;
  const found = schedule.find(s => s.day.toLowerCase().replace(/\s+/g, '') === dayTargetStr.toLowerCase().replace(/\s+/g, ''));
  return found?.classes || [];
}

interface ForecastSubjectImpact {
  courseCode: string;
  courseTitle: string;
  currentAttended: number;
  currentConducted: number;
  currentPct: number;
  projectedAttended: number;
  projectedConducted: number;
  projectedPct: number;
  hoursMissed: number;
  isAtRisk: boolean;
  statusChange: "safe" | "warning" | "danger";
}

interface AttendanceForecastResult {
  currentOverallPct: number;
  projectedOverallPct: number;
  totalHoursMissed: number;
  totalConductedProjected: number;
  totalAttendedProjected: number;
  impactedSubjects: ForecastSubjectImpact[];
  criticalAlertCount: number;
}

function calculateAttendanceForecast(
  attendanceRecords: AnyValue[],
  skippedDays: CalendarDayInfo[],
  myTimetable: AnyValue,
  masterTimetable: AnyValue
): AttendanceForecastResult {
  const MONTH_REGEX = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-\s_]?\d{2,4}$/i;
  const cleanAttendance = (attendanceRecords || []).filter((a: AnyValue) => {
    if (!a || typeof a !== "object") return false;
    const code = String(a["Course Code"] || a.courseCode || a.code || "").trim();
    const title = String(a["Course Title"] || a.courseTitle || a.title || "").trim();
    return !MONTH_REGEX.test(code) && !MONTH_REGEX.test(title) && !code.toLowerCase().includes("total");
  });

  const missedHoursByCode: Record<string, number> = {};

  skippedDays.forEach((day) => {
    if (day.isHoliday || !day.dayOrder) return;
    const classes = getClassesForDayOrder(day.dayOrder, myTimetable, masterTimetable);
    classes.forEach((cls) => {
      const code = String(cls.courseCode || "").trim().toUpperCase();
      if (code) {
        missedHoursByCode[code] = (missedHoursByCode[code] || 0) + 1;
      }
    });
  });

  let curTotAttended = 0;
  let curTotConducted = 0;
  let projTotAttended = 0;
  let projTotConducted = 0;
  let criticalCount = 0;

  const impactedSubjects: ForecastSubjectImpact[] = cleanAttendance.map((rec: AnyValue) => {
    const code = String(rec["Course Code"] || rec.courseCode || rec.code || "").trim().toUpperCase();
    const title = String(rec["Course Title"] || rec.courseTitle || rec.title || code).trim();
    const curAtt = parseFloat(rec["Att. hours"] || rec.attended || rec["Hours Attended"] || "0") || 0;
    const curCond = parseFloat(rec["Max. hours"] || rec.conducted || rec["Hours Conducted"] || "0") || 0;
    const curPct = curCond > 0 ? (curAtt / curCond) * 100 : 100;

    const missed = missedHoursByCode[code] || 0;
    const projAtt = curAtt;
    const projCond = curCond + missed;
    const projPct = projCond > 0 ? (projAtt / projCond) * 100 : 100;

    curTotAttended += curAtt;
    curTotConducted += curCond;
    projTotAttended += projAtt;
    projTotConducted += projCond;

    const isAtRisk = projPct < 75;
    if (isAtRisk) criticalCount++;

    let statusChange: "safe" | "warning" | "danger" = "safe";
    if (projPct < 75) statusChange = "danger";
    else if (projPct < 80) statusChange = "warning";

    return {
      courseCode: code,
      courseTitle: title,
      currentAttended: curAtt,
      currentConducted: curCond,
      currentPct: Math.min(100, Math.max(0, curPct)),
      projectedAttended: projAtt,
      projectedConducted: projCond,
      projectedPct: Math.min(100, Math.max(0, projPct)),
      hoursMissed: missed,
      isAtRisk,
      statusChange,
    };
  });

  const curOverall = curTotConducted > 0 ? (curTotAttended / curTotConducted) * 100 : 0;
  const projOverall = projTotConducted > 0 ? (projTotAttended / projTotConducted) * 100 : 0;
  const totalMissed = Object.values(missedHoursByCode).reduce((a, b) => a + b, 0);

  return {
    currentOverallPct: Math.min(100, Math.max(0, curOverall)),
    projectedOverallPct: Math.min(100, Math.max(0, projOverall)),
    totalHoursMissed: totalMissed,
    totalConductedProjected: projTotConducted,
    totalAttendedProjected: projTotAttended,
    impactedSubjects,
    criticalAlertCount: criticalCount,
  };
}

// ─── MAIN CALENDAR PAGE COMPONENT ───────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const [monthIdx, setMonthIdx] = useState(0);
  const [sem, setSem] = useState<Semester>("ODD");
  const [selectedDay, setSelectedDay] = useState<CalendarDayInfo | null>(null);
  const [plannerMode, setPlannerMode] = useState<boolean>(false);
  const [skippedDates, setSkippedDates] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<"lumina" | "light">("lumina");

  const cachedCalendar = useAuthStore((state) => state.calendar);
  const setCalendar = useAuthStore((state) => state.setCalendar);
  const cachedTimetable = useAuthStore((state) => state.timetable);
  const setTimetable = useAuthStore((state) => state.setTimetable);
  const cachedMyTimetable = useAuthStore((state) => state.myTimetable);
  const setMyTimetable = useAuthStore((state) => state.setMyTimetable);
  const academicData = useAuthStore((state) => state.academicData);

  const { data: cal } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => dataAPI.getCalendar(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
    initialData: cachedCalendar ? cachedCalendar : undefined
  });

  const { data: masterTT } = useQuery({
    queryKey: ["timetable"],
    queryFn: () => dataAPI.getTimetable(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
    initialData: cachedTimetable ? cachedTimetable : undefined
  });

  const { data: myTT } = useQuery({
    queryKey: ["my-timetable"],
    queryFn: () => dataAPI.getMyTimetable(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
    initialData: cachedMyTimetable ? cachedMyTimetable : undefined
  });

  useEffect(() => { if (cal) setCalendar(cal); }, [cal, setCalendar]);
  useEffect(() => { if (masterTT) setTimetable(masterTT); }, [masterTT, setTimetable]);
  useEffect(() => { if (myTT) setMyTimetable(myTT); }, [myTT, setMyTimetable]);

  useEffect(() => { 
    const id = setTimeout(() => setMounted(true), 0); 
    return () => clearTimeout(id); 
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolve = () => {
      if (theme === "system") {
        setResolvedTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "lumina");
      } else {
        setResolvedTheme(theme === "light" ? "light" : "lumina");
      }
    };
    resolve();
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      media.addEventListener("change", resolve);
      return () => media.removeEventListener("change", resolve);
    }
  }, [theme, mounted]);

  const isLumina = resolvedTheme === "lumina";
  const pageText = isLumina ? "#fff" : "#17111f";
  const mutedText = isLumina ? "rgba(255,255,255,0.60)" : "rgba(23,17,31,0.62)";
  const cardBg = isLumina ? "#12121A" : "#FFFFFF";
  const cardBorder = isLumina ? "#292532" : "rgba(23,17,31,0.14)";

  const { months, byDate } = useMemo(() => buildCalendarIndex(cal), [cal]);
  const semMonths = months[sem] || [];

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  
  useEffect(() => {
    const currentMonthNum = today.getMonth() + 1;
    if (currentMonthNum <= 6 && sem !== "EVEN") {
      setSem("EVEN");
    } else if (currentMonthNum > 6 && sem !== "ODD") {
      setSem("ODD");
    }
  }, []);

  const jumpToToday = () => {
    if (semMonths.length > 0) {
      const idx = semMonths.findIndex(m => m.days.some((d: CalendarDayInfo) => d.isoDate === todayIso));
      if (idx !== -1) {
        setMonthIdx(idx);
      }
    }
  };

  useEffect(() => {
    if (semMonths.length > 0) {
      const idx = semMonths.findIndex(m => m.days.some((d: CalendarDayInfo) => d.isoDate === todayIso));
      if (idx !== -1) {
        setMonthIdx(idx);
      }
    }
  }, [semMonths, todayIso]);

  const current = semMonths[monthIdx];
  const todayInfo = byDate.get(todayIso);
  const isTodayHoliday = todayInfo?.isHoliday || [0, 6].includes(today.getDay());

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const gridCells: (CalendarDayInfo | null)[] = useMemo(() => {
    if (!current || !current.days || current.days.length === 0) return [];
    const cells: (CalendarDayInfo | null)[] = [];
    const firstDay = current.days[0];
    const firstDate = firstDay ? new Date(firstDay.isoDate) : new Date();
    const startDay = firstDate.getDay(); 
    const offset = (startDay + 6) % 7; 
    for (let i = 0; i < offset; i++) cells.push(null);
    current.days.forEach((d: CalendarDayInfo) => cells.push(d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [current]);

  const todayStr = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }).format(today);

  const monthEvents = useMemo(() => {
    if (!current?.days) return [];
    return current.days.filter((d: CalendarDayInfo) => {
      const event = String(d.event || "").trim().toLowerCase();
      return event.length > 0 && !["holiday", "sunday", "no special events", "standard academic working day"].includes(event);
    });
  }, [current]);

  const selectedDayClasses: ScheduleItem[] = useMemo(() => {
    if (!selectedDay || selectedDay.isHoliday || !selectedDay.dayOrder) return [];
    return getClassesForDayOrder(selectedDay.dayOrder, myTT, masterTT);
  }, [selectedDay, myTT, masterTT]);

  const todayClasses: ScheduleItem[] = useMemo(() => {
    if (isTodayHoliday || !todayInfo?.dayOrder) return [];
    return getClassesForDayOrder(todayInfo.dayOrder, myTT, masterTT);
  }, [isTodayHoliday, todayInfo, myTT, masterTT]);

  const handleToggleSkip = (day: CalendarDayInfo) => {
    if (day.isHoliday || !day.dayOrder) return;
    setSkippedDates(prev => {
      const next = new Set(prev);
      if (next.has(day.isoDate)) {
        next.delete(day.isoDate);
      } else {
        next.add(day.isoDate);
      }
      return next;
    });
  };

  const skippedDayObjects = useMemo(() => {
    const list: CalendarDayInfo[] = [];
    skippedDates.forEach(iso => {
      const found = byDate.get(iso);
      if (found) list.push(found);
    });
    return list;
  }, [skippedDates, byDate]);

  const forecast = useMemo(() => {
    const attendance = Array.isArray(academicData?.attendance) ? academicData.attendance : [];
    return calculateAttendanceForecast(attendance, skippedDayObjects, myTT, masterTT);
  }, [academicData, skippedDayObjects, myTT, masterTT]);


  return (
    <div style={{ 
      background: isLumina ? "#09090F" : "#f8f6fc", 
      minHeight: "100dvh", 
      display: "flex", 
      flexDirection: "column", 
      color: pageText, 
      fontFamily: "var(--font-main), Inter, sans-serif" 
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .cal-day-cell {
          appearance: none;
          font: inherit;
          padding: 0;
          aspect-ratio: 1 / 1;
          min-height: 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: border-color 160ms ease, background-color 160ms ease;
          cursor: pointer;
          position: relative;
          user-select: none;
        }
        .cal-day-cell:hover {
          border-color: #4B5563 !important;
        }
        .cal-day-cell:active {
          transform: none;
        }

        .event-card {
          border-radius: 10px;
          padding: 14px 16px;
          transition: border-color 160ms ease, background-color 160ms ease;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .event-card:hover {
          transform: none;
        }

        .class-slot-pill {
          padding: 12px 14px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: border-color 160ms ease, background-color 160ms ease;
        }
        .class-slot-pill:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}} />

      {/* TOP HEADER */}
      <header style={{ 
        flexShrink: 0, 
        padding: "calc(env(safe-area-inset-top, 0px) + 66px) 20px 14px", 
        position: 'relative', 
        zIndex: 10, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: "1160px",
        width: "100%",
        margin: "0 auto",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => router.push("/dashboard")} 
            style={{ 
              background: isLumina ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)', 
              border: `1px solid ${cardBorder}`, 
              color: pageText, 
              width: '38px', 
              height: '38px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              backdropFilter: 'blur(18px)' 
            }}
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Calendar</h1>
            <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 550, color: mutedText }}>
              Day orders and academic dates
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setPlannerMode(!plannerMode)}
            style={{
              background: plannerMode 
                ? "rgba(37,99,235,0.18)" 
                : (isLumina ? "#12121A" : "rgba(88,61,145,0.08)"),
              border: `1px solid ${plannerMode ? "#2563EB" : cardBorder}`,
              color: plannerMode ? "#fff" : pageText,
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
              boxShadow: "none"
            }}
          >
            <Target size={14} />
            <span>{plannerMode ? "Exit planner" : "Plan absence"}</span>
          </button>

          <button
            onClick={jumpToToday}
            style={{
              background: isLumina ? "#12121A" : "rgba(124,58,237,0.12)",
              border: `1px solid ${cardBorder}`,
              color: isLumina ? "#B8B2C2" : "#7C3AED",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
          >
            <CalendarCheck size={14} />
            <span>Today</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ 
        flex: 1, 
        overflowY: "auto", 
        WebkitOverflowScrolling: "touch", 
        padding: "0 18px 140px", 
        position: 'relative', 
        zIndex: 1,
        maxWidth: "1160px",
        width: "100%",
        margin: "0 auto"
      }}>

        {/* 1. BUNK PLANNER BANNER */}
        {plannerMode && (
          <section style={{
            borderRadius: "10px",
            padding: "14px 16px",
            margin: "4px 0 16px",
            background: isLumina ? "rgba(37,99,235,0.10)" : "#EFF6FF",
            border: "1px solid rgba(37,99,235,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(37,99,235,0.16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60A5FA" }}>
                <Target size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Absence planner active</h4>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: mutedText, fontWeight: 700 }}>
                  Select working dates to preview their attendance impact.
                </p>
              </div>
            </div>

            {skippedDates.size > 0 && (
              <button
                onClick={() => setSkippedDates(new Set())}
                style={{
                  background: isLumina ? "#12121A" : "#FFFFFF",
                  border: `1px solid ${cardBorder}`,
                  color: pageText,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  fontWeight: 850,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <RotateCcw size={12} />
                <span>Reset ({skippedDates.size} days)</span>
              </button>
            )}
          </section>
        )}

        {/* 2. TODAY'S STATUS HERO CARD */}
        <section style={{
          borderRadius: "12px",
          padding: "18px 20px",
          margin: "4px 0 16px",
          background: cardBg,
          border: `1px solid ${isTodayHoliday ? "rgba(239,68,68,0.42)" : cardBorder}`,
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ 
                  background: isTodayHoliday ? "rgba(239,68,68,0.12)" : "rgba(37,99,235,0.14)",
                  color: isTodayHoliday ? "#F87171" : "#60A5FA",
                  fontSize: "10.5px",
                  fontWeight: 900,
                  padding: "3px 10px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}>
                  {isTodayHoliday ? <Sun size={12} /> : <Zap size={12} />}
                  {isTodayHoliday ? "No classes" : "Working day"}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 750, color: mutedText }}>{todayStr}</span>
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0", letterSpacing: "-0.02em" }}>
                {isTodayHoliday 
                  ? (todayInfo?.event || "Weekend / Official Holiday")
                  : `Day Order ${todayInfo?.dayOrder || "1"} · ${todayClasses.length} classes`
                }
              </h2>
            </div>

            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "14px",
              background: isLumina ? "#09090F" : "#F8F8FA", 
              padding: "10px 14px", 
              borderRadius: "8px",
              border: `1px solid ${cardBorder}`
            }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", fontWeight: 800, color: mutedText, textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Order</div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: isTodayHoliday ? "#EF4444" : "#60A5FA", lineHeight: 1 }} className="tabular-nums">
                  {isTodayHoliday ? "OFF" : `DO ${todayInfo?.dayOrder || "—"}`}
                </div>
              </div>
            </div>
          </div>

          {!isTodayHoliday && todayClasses.length > 0 && (
            <div style={{
              background: isLumina ? "#09090F" : "#F8F8FA",
              borderRadius: "8px",
              padding: "12px 14px",
              border: `1px solid ${isLumina ? "rgba(255,255,255,0.06)" : "rgba(88,61,145,0.1)"}`
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 850, color: mutedText, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Today's Schedule Quick Preview
                </span>
                <button
                  onClick={() => router.push(`/timetable?dayOrder=${todayInfo?.dayOrder || 1}`)}
                  style={{ background: "none", border: "none", color: "#60A5FA", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}
                >
                  <span>Full Timetable</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }} className="hide-scrollbar">
                {todayClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    style={{
                      minWidth: "160px",
                      flexShrink: 0,
                      background: isLumina ? "#12121A" : "#fff",
                      border: `1px solid ${cardBorder}`,
                      borderRadius: "8px",
                      padding: "8px 12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#60A5FA" }}>
                        {cls.courseType}
                      </span>
                      <span style={{ fontSize: "9.5px", fontWeight: 800, color: mutedText }}>{fmt12(cls.startTime)}</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 850, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cls.courseCode}
                    </div>
                    <div style={{ fontSize: "10px", color: mutedText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cls.roomNo || "Room TBA"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. SEMESTER SWITCHER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div style={{ 
            display: "inline-flex", 
            gap: "4px", 
            background: isLumina ? "#12121A" : "#F8F8FA", 
            padding: "4px", 
            borderRadius: "10px",
            border: `1px solid ${cardBorder}`
          }}>
            <button
              onClick={() => { setSem("ODD"); setMonthIdx(0); }}
              style={{
                padding: "8px 14px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer",
                border: "none",
                background: sem === "ODD" ? "#2563EB" : "transparent",
                color: sem === "ODD" ? "#FFFFFF" : mutedText,
                boxShadow: "none",
                transition: "all 0.2s"
              }}
            >
              Odd (Jul–Dec)
            </button>

            <button
              onClick={() => { setSem("EVEN"); setMonthIdx(0); }}
              style={{
                padding: "8px 14px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer",
                border: "none",
                background: sem === "EVEN" ? "#2563EB" : "transparent",
                color: sem === "EVEN" ? "#FFFFFF" : mutedText,
                boxShadow: "none",
                transition: "all 0.2s"
              }}
            >
              Even (Jan–Jun)
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
              disabled={monthIdx === 0}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: isLumina ? "#12121A" : "#fff",
                border: `1px solid ${cardBorder}`,
                color: pageText,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: monthIdx === 0 ? "not-allowed" : "pointer",
                opacity: monthIdx === 0 ? 0.3 : 1
              }}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <span style={{ fontSize: "14px", fontWeight: 700, minWidth: "120px", textAlign: "center" }}>
              {current?.name || "Month"}
            </span>

            <button
              onClick={() => setMonthIdx((i) => Math.min(semMonths.length - 1, i + 1))}
              disabled={monthIdx >= semMonths.length - 1}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: isLumina ? "#12121A" : "#fff",
                border: `1px solid ${cardBorder}`,
                color: pageText,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: monthIdx >= semMonths.length - 1 ? "not-allowed" : "pointer",
                opacity: monthIdx >= semMonths.length - 1 ? 0.3 : 1
              }}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 4. CALENDAR GRID */}
        <section style={{
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "12px" }}>
            {weekDays.map((d, i) => (
              <div 
                key={i} 
                style={{ 
                  textAlign: "center", 
                  fontSize: "11px", 
                  fontWeight: 650, 
                  color: mutedText,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {current ? gridCells.map((cell, i) => {
              if (!cell) {
                return <div key={i} style={{ aspectRatio: "1 / 1" }} />;
              }

              const isToday = cell.isoDate === todayIso;
              const hasDayOrder = cell.dayOrder !== null && cell.dayOrder !== undefined;
              const hasEvent = cell.event && cell.event.trim().length > 0 && cell.event !== "Holiday" && cell.event !== "Sunday";
              const isSelected = selectedDay?.isoDate === cell.isoDate;
              const isSkipped = skippedDates.has(cell.isoDate);

              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    if (plannerMode && !cell.isHoliday && cell.dayOrder) {
                      handleToggleSkip(cell);
                    } else {
                      setSelectedDay(cell);
                    }
                  }}
                  className="cal-day-cell"
                  style={{
                    background: isToday
                      ? "#2563EB"
                      : isSkipped
                      ? "rgba(239,68,68,0.12)"
                      : isSelected
                      ? "rgba(37,99,235,0.18)"
                      : cell.isHoliday
                      ? (isLumina ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)")
                      : (isLumina ? "#09090F" : "#FAFAFA"),
                    border: isToday
                      ? "1px solid #2563EB"
                      : isSkipped
                      ? "1px dashed #EF4444"
                      : isSelected
                      ? "1px solid #2563EB"
                      : `1px solid ${cell.isHoliday ? "rgba(239,68,68,0.18)" : cardBorder}`,
                    color: isToday ? "#fff" : pageText
                  }}
                >
                  <span style={{ 
                    fontSize: "15px", 
                    fontWeight: 900,
                    lineHeight: 1,
                    marginBottom: "3px"
                  }} className="tabular-nums">
                    {cell.dateNum}
                  </span>

                  {isSkipped ? (
                    <span style={{
                      fontSize: "8px",
                      fontWeight: 900,
                      color: "#F87171",
                      background: "rgba(239,68,68,0.16)",
                      padding: "1px 4px",
                      borderRadius: "6px"
                    }}>
                      SKIP
                    </span>
                  ) : !cell.isHoliday && hasDayOrder ? (
                    <span style={{
                      fontSize: "8.5px",
                      fontWeight: 900,
                      color: isToday ? "rgba(255,255,255,0.95)" : "#60A5FA",
                      background: isToday ? "rgba(0,0,0,0.16)" : "rgba(37,99,235,0.14)",
                      padding: "1px 5px",
                      borderRadius: "6px",
                      letterSpacing: "0.02em"
                    }}>
                      DO {cell.dayOrder}
                    </span>
                  ) : null}

                  {cell.isHoliday && (
                    <span style={{
                      fontSize: "8px",
                      fontWeight: 900,
                      color: "#EF4444",
                      background: "rgba(239,68,68,0.12)",
                      padding: "1px 4px",
                      borderRadius: "6px"
                    }}>
                      OFF
                    </span>
                  )}

                  {hasEvent && !isToday && !isSkipped && (
                    <div style={{
                      position: "absolute",
                      bottom: "4px",
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "#38BDF8",
                      boxShadow: "none"
                    }} />
                  )}
                </button>
              );
            }) : (
              <div style={{ gridColumn: "span 7", padding: "40px 20px", textAlign: "center", color: mutedText }}>
                No calendar data available for this semester.
              </div>
            )}
          </div>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            marginTop: "14px", 
            paddingTop: "12px",
            borderTop: `1px solid ${cardBorder}`,
            fontSize: "11px",
            fontWeight: 800
          }}>
            <span>Tap a date to see its schedule.</span>
            {plannerMode && <span>Working dates can be selected for the absence planner.</span>}
          </div>
        </section>

        {/* 5. ATTENDANCE FORECAST IMPACT DECK */}
        {skippedDates.size > 0 && (
          <section style={{
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "20px",
            background: cardBg,
            border: "1px solid rgba(255,107,139,0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.12)", padding: "4px 8px", borderRadius: "6px", color: "#F87171", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                  <Target size={12} />
                  <span>PROJECTED ATTENDANCE IMPACT</span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                  {skippedDates.size} Day{skippedDates.size > 1 ? "s" : ""} Selected ({forecast.totalHoursMissed} class hours missed)
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: mutedText }}>Current</span>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: mutedText }} className="tabular-nums">
                    {forecast.currentOverallPct.toFixed(1)}%
                  </div>
                </div>
                <ArrowRight size={18} color={mutedText} />
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: forecast.projectedOverallPct < 75 ? "#EF4444" : "#60A5FA" }}>Projected</span>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: forecast.projectedOverallPct < 75 ? "#EF4444" : "#60A5FA" }} className="tabular-nums">
                    {forecast.projectedOverallPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {forecast.impactedSubjects.filter(s => s.hoursMissed > 0).map((subj, idx) => (
                <div
                  key={idx}
                  style={{
                    background: isLumina ? "#09090F" : "#fff",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    border: `1px solid ${subj.isAtRisk ? "rgba(239,68,68,0.4)" : cardBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: pageText }}>
                      {subj.courseCode} — {subj.courseTitle}
                    </div>
                    <div style={{ fontSize: "11px", color: mutedText, fontWeight: 750, marginTop: "2px" }}>
                      Misses {subj.hoursMissed} hour{subj.hoursMissed > 1 ? "s" : ""} • ({subj.projectedAttended}/{subj.projectedConducted} hrs)
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: mutedText, fontWeight: 800 }} className="tabular-nums">
                      {subj.currentPct.toFixed(1)}%
                    </span>
                    <ArrowRight size={14} color={mutedText} />
                    <span style={{ 
                      fontSize: "14px", 
                      fontWeight: 950, 
                      color: subj.isAtRisk ? "#EF4444" : (subj.projectedPct < 80 ? "#F59E0B" : "#10B981") 
                    }} className="tabular-nums">
                      {subj.projectedPct.toFixed(1)}%
                    </span>
                    {subj.isAtRisk && (
                      <span style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", fontSize: "9.5px", fontWeight: 900, padding: "2px 6px", borderRadius: "6px" }}>
                        &lt; 75% RISK
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. SELECTED DAY INSPECTOR MODAL WITH TIMETABLE PREVIEW */}
        {selectedDay && (
          <div 
            onClick={() => setSelectedDay(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(14px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "500px",
                width: "100%",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                background: isLumina ? "#12121A" : "#fff",
                border: `1px solid ${cardBorder}`,
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
                color: pageText,
                position: "relative",
                overflow: "hidden"
              }}
            >
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  position: "absolute",
                  top: "18px",
                  right: "18px",
                  background: isLumina ? "#09090F" : "rgba(0,0,0,0.06)",
                  border: `1px solid ${cardBorder}`,
                  color: pageText,
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ 
                  background: selectedDay.isHoliday ? "rgba(239,68,68,0.12)" : "rgba(37,99,235,0.14)",
                  color: selectedDay.isHoliday ? "#EF4444" : "#60A5FA",
                  fontSize: "11px",
                  fontWeight: 900,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  textTransform: "uppercase"
                }}>
                  {selectedDay.isHoliday ? "Holiday" : `Day Order ${selectedDay.dayOrder}`}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 750, color: mutedText }}>{selectedDay.weekdayLabel}</span>
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>
                {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(selectedDay.isoDate))}
              </h3>

              <div style={{ 
                background: isLumina ? "#09090F" : "#F8F8FA", 
                padding: "12px 14px", 
                borderRadius: "8px",
                border: `1px solid ${cardBorder}`,
                margin: "12px 0",
                fontSize: "13px",
                fontWeight: 700,
                lineHeight: 1.4
              }}>
                {selectedDay.event && selectedDay.event.trim().length > 0 
                  ? selectedDay.event 
                  : selectedDay.isHoliday 
                  ? "Official Holiday • No scheduled academic sessions." 
                  : `Regular academic day. Follow Day Order ${selectedDay.dayOrder} timetable schedule.`}
              </div>

              {!selectedDay.isHoliday && selectedDay.dayOrder && (
                <div style={{ flex: 1, overflowY: "auto", margin: "8px 0 16px" }} className="hide-scrollbar">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 900, color: mutedText, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Registered Classes ({selectedDayClasses.length})
                    </div>
                    <span style={{ fontSize: "11px", color: "#60A5FA", fontWeight: 700 }}>
                      DO {selectedDay.dayOrder}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDayClasses.length > 0 ? (
                      selectedDayClasses.map((cls, idx) => (
                        <div
                          key={idx}
                          className="class-slot-pill"
                          style={{
                            background: isLumina ? "#09090F" : "#F8F8FA",
                            border: `1px solid ${cardBorder}`
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                            <div style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "12px",
                              background: cls.courseType.toLowerCase().includes("practical") || cls.courseType.toLowerCase().includes("lab") 
                                ? "rgba(56,189,248,0.15)" 
                                : "rgba(37,99,235,0.15)",
                              color: cls.courseType.toLowerCase().includes("practical") || cls.courseType.toLowerCase().includes("lab") 
                                ? "#38BDF8" 
                                : "#60A5FA",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <BookOpen size={16} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "13.5px", fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {cls.courseCode} — {cls.courseTitle}
                              </div>
                              <div style={{ fontSize: "11px", color: mutedText, fontWeight: 750, marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#60A5FA", fontWeight: 700 }}>{cls.slot}</span>
                                <span>•</span>
                                <span>{cls.roomNo || "Room TBA"}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "11.5px", fontWeight: 900 }} className="tabular-nums">
                              {fmt12(cls.startTime)}
                            </div>
                            <div style={{ fontSize: "10px", color: mutedText, fontWeight: 750 }} className="tabular-nums">
                              to {fmt12(cls.endTime)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px", color: mutedText, fontSize: "12.5px" }}>
                        No registered classes found for Day Order {selectedDay.dayOrder}.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                {!selectedDay.isHoliday && selectedDay.dayOrder && (
                  <>
                    <button
                      onClick={() => handleToggleSkip(selectedDay)}
                      style={{
                        flex: 1,
                        background: skippedDates.has(selectedDay.isoDate) 
                          ? "rgba(239,68,68,0.12)" 
                          : (isLumina ? "#09090F" : "#F8F8FA"),
                        border: `1px solid ${skippedDates.has(selectedDay.isoDate) ? "#EF4444" : cardBorder}`,
                        color: skippedDates.has(selectedDay.isoDate) ? "#F87171" : pageText,
                        padding: "12px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Target size={15} />
                      <span>{skippedDates.has(selectedDay.isoDate) ? "Remove absence" : "Plan absence"}</span>
                    </button>

                    <button
                      onClick={() => router.push(`/timetable?dayOrder=${selectedDay.dayOrder}`)}
                      style={{
                        flex: 1,
                        background: "#2563EB",
                        border: "none",
                        color: "#fff",
                        padding: "12px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Clock size={15} />
                      <span>Full Timetable</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. IMPORTANT DATES THIS MONTH */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              Important dates · {current?.name || "Month"}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {monthEvents.length > 0 ? (
              monthEvents.map((d: CalendarDayInfo, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(d)}
                  className="event-card"
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    cursor: "pointer"
                  }}
                >
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    background: d.isHoliday ? "rgba(239,68,68,0.12)" : "rgba(37,99,235,0.14)",
                    border: `1px solid ${d.isHoliday ? "rgba(239,68,68,0.25)" : "rgba(37,99,235,0.25)"}`,
                    color: d.isHoliday ? "#EF4444" : "#60A5FA",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: "17px", fontWeight: 950, lineHeight: 1 }}>{d.dateNum}</span>
                    <span style={{ fontSize: "8px", fontWeight: 850, textTransform: "uppercase" }}>{d.weekdayLabel}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "14.5px", fontWeight: 700, margin: "0 0 2px" }}>{d.event}</h3>
                    <span style={{ fontSize: "11px", fontWeight: 750, color: mutedText }}>
                      {d.isHoliday ? "Holiday / Off" : `Day Order ${d.dayOrder}`}
                    </span>
                  </div>

                  <ChevronRight size={16} color={mutedText} />
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: "center", 
                padding: "32px 20px", 
                background: cardBg, 
                borderRadius: "10px", 
                border: `1px solid ${cardBorder}`,
                color: mutedText,
                fontSize: "13px",
                fontWeight: 700
              }}>
                No special events or exam schedules listed for {current?.name || "this month"}. Regular timetable applies.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
