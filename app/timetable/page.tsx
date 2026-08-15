"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex, type Semester } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { toPng } from "html-to-image";
import { extractBatch } from "@/lib/utils";
import { Share2, Star, Activity, Calendar, X } from "lucide-react";
// ── Helpers ───────────────────────────────────────────────────────────────────
function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }
function parseStart(t: string) { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEnd(t: string) { const parts = t.split(/\s*[-–]\s*/); const last = parts[parts.length - 1] || ""; const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseTimeRange(t: string): { start: string, end: string } {
  const parts = t.split(/[-–]/).map(s => s.trim());
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: t, end: t };
}

function getPrimaryClassroom(courses: AnyValue[], studentClassroom?: string): string {
  if (studentClassroom && studentClassroom.trim()) {
    return studentClassroom.trim().replace(/\s+/g, " ").toUpperCase();
  }
  const roomCounts: Record<string, number> = {};
  (courses || []).forEach((c: AnyValue) => {
    const room = (c.roomNo || c.room || "").trim().replace(/\s+/g, " ").toUpperCase();
    if (room && room !== "TBA" && room !== "-" && !/\b(lab|laboratory|comp|workshop|w\/s)\b/i.test(room)) {
      roomCounts[room] = (roomCounts[room] || 0) + 1;
    }
  });
  let maxCount = 0;
  let primary = "";
  Object.entries(roomCounts).forEach(([room, count]) => {
    if (count > maxCount) {
      maxCount = count;
      primary = room;
    }
  });
  return primary;
}

function isLabSession(
  item: { courseCode?: string; courseType?: string; courseTitle?: string; slot?: string; roomNo?: string },
  allCourses?: AnyValue[]
) {
  if (!item) return false;
  const type = (item.courseType || "").toLowerCase();
  const title = (item.courseTitle || "").toLowerCase();
  const code = (item.courseCode || "").toUpperCase();
  const room = (item.roomNo || "").trim().replace(/\s+/g, " ").toUpperCase();

  // 1. Room explicitly contains Lab keywords -> ALWAYS Lab Session
  if (/\b(lab|laboratory|comp|workshop|w\/s)\b/i.test(room)) {
    return true;
  }

  // 2. Primary Theory Classroom check:
  // If the class is conducted in the student's main theory classroom (e.g. TP 1406),
  // it is ALWAYS a Theory Class! (Returns false -> never highlighted as Lab).
  const primaryRoom = getPrimaryClassroom(allCourses || []);
  if (primaryRoom && room && room === primaryRoom) {
    return false;
  }

  // 3. Different Room check:
  // If the class is conducted in a DIFFERENT room from the main classroom,
  // AND has lab indications or is a different room for the subject, it is a Lab Session!
  if (primaryRoom && room && room !== "TBA" && room !== "-" && room !== primaryRoom) {
    return true;
  }

  // 4. Explicit courseType check (Practical, Lab, Laboratory)
  if (type.includes("practical") || type.includes("lab") || type.includes("laboratory")) {
    return true;
  }

  // 5. Course title containing standalone "lab", "laboratory", or "practical"
  if (/\b(lab|laboratory|practical)\b/i.test(title)) {
    return true;
  }

  // 6. NSO course code check
  if (code.includes("NSO")) {
    return true;
  }

  // 7. SRM Lab Course Code ending with 'L' or 'P' (excludes T and J)
  if (/^[A-Z0-9]+[LP]$/i.test(code) && !code.endsWith("T") && !code.endsWith("J")) {
    return true;
  }

  return false;
}

// Stable hash function to generate consistent timetables for mock friends
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function generateFriendTimetable(_nameOrReg: string, _myCourses: AnyValue[]) {
  // Pure strict: Do not generate fake/mock courses.
  // Unshared friend timetables return empty schedules.
  return [1, 2, 3, 4, 5].map(day => ({ day: `Day ${day}`, classes: [] as ScheduleItem[] }));
}



const PERIODS = [
  { id: 1, start: "08:00", end: "08:50" },
  { id: 2, start: "08:55", end: "09:45" },
  { id: 3, start: "09:50", end: "10:40" },
  { id: 4, start: "10:45", end: "11:35" },
  { id: 5, start: "11:40", end: "12:30" },
  { id: 6, start: "12:35", end: "13:25" },
  { id: 7, start: "13:30", end: "14:20" },
  { id: 8, start: "14:25", end: "15:15" },
  { id: 9, start: "15:20", end: "16:10" },
  { id: 10, start: "16:15", end: "17:05" },
];

function fmt12(t: string) { 
  const m = t.match(/(\d+):(\d+)/); 
  if (!m) return t; 
  const h24 = to24(parseInt(m[1])); 
  const suffix = h24 >= 12 ? "PM" : "AM"; 
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; 
  return `${h12}:${m[2]} ${suffix}`; 
}

function formatDateNicely(isoDateStr: string) {
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatDateNicelyShort(isoDateStr: string) {
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}


interface ScheduleItem {
  slot: string; startTime: string; endTime: string;
  courseTitle: string; courseCode: string; courseType: string;
  facultyName: string; roomNo: string;
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

function insertBreaks(classes: ScheduleItem[]) {
  if (!classes.length) return [];
  const res: AnyValue[] = [];
  for (let i = 0; i < classes.length; i++) {
    res.push({ ...classes[i], isBreak: false });
    if (i < classes.length - 1) {
      const curEnd = parseEnd(classes[i].endTime);
      const nextStart = parseStart(classes[i+1].startTime);
      if (nextStart - curEnd >= 15) {
        res.push({
          isBreak: true,
          startTime: classes[i].endTime,
          endTime: classes[i+1].startTime,
        });
      }
    }
  }
  return res;
}

const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];

export default function TimetablePage() {
  const { 
    academicData, 
    profile, 
    email,
    timetable: cachedTimetable, 
    myTimetable: cachedMyTimetable, 
    calendar: cachedCalendar, 
    setTimetable, 
    setMyTimetable, 
    setCalendar,
    isPremium 
  } = useAuthStore();
  const userEmail = (email || profile?.Email || profile?.email || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.some((e) => e.toLowerCase() === userEmail) || profile?.role === "admin" || profile?.Role === "admin";
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<"schedule" | "friends">("schedule");
  const [selectedFriend, setSelectedFriend] = useState<AnyValue | null>(null);
  const [syncedFriends, setSyncedFriends] = useState<AnyValue[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("srmx-synced-friends");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("srmx-synced-friends", JSON.stringify(syncedFriends));
  }, [syncedFriends]);
  const [importantSlots, setImportantSlots] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("srmx-important-slots");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem("srmx-important-slots", JSON.stringify(importantSlots));
  }, [importantSlots]);
  const [dayOverride, setDayOverride] = useState<number>(1);
  const [batch, setBatch] = useState<number>(() => {
    const raw = (profile || academicData?.profile)?.["Combo / Batch"] || "";
    return extractBatch(raw);
  });
  const router = useRouter();
  const shareRef = useRef<HTMLDivElement>(null);
  const fullShareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [fullSharing, setFullSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = async () => {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(shareRef.current, { quality: 0.95, cacheBust: true });
      
      // Try Web Share API for direct social sharing (WhatsApp/Insta)
      if (navigator.share && navigator.canShare) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `srm-nexus-day-${dayOverride}.png`, { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `My Schedule - Day ${dayOverride}`,
            text: 'Check my schedule on SRM Nexus!',
          });
          setSharing(false);
          return;
        }
      }

      // Fallback to Download
      const link = document.createElement("a");
      link.download = `srm-nexus-day-${dayOverride}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Share failed", err);
    } finally {
      setSharing(false);
    }
  };

  const handleFullShare = async () => {
    if (!fullShareRef.current) return;
    setFullSharing(true);
    try {
      const dataUrl = await toPng(fullShareRef.current, { quality: 0.95, cacheBust: true });
      
      if (navigator.share && navigator.canShare) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `srm-nexus-full-timetable.png`, { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Full Timetable',
            text: 'My complete SRM semester schedule via SRM Nexus!',
          });
          setFullSharing(false);
          return;
        }
      }

      const link = document.createElement("a");
      link.download = `srm-nexus-full-timetable.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Full share failed", err);
    } finally {
      setFullSharing(false);
    }
  };

  const calQ = useQuery({ 
    queryKey: ["calendar"], 
    queryFn: () => dataAPI.getCalendar(), 
    staleTime: 600000,
    initialData: cachedCalendar ? cachedCalendar : undefined,
    // Persisted Zustand data is only a fast first paint; always verify it in
    // the background instead of treating it as newly fetched for ten minutes.
    initialDataUpdatedAt: cachedCalendar ? 0 : undefined
  });
  const myTTQ = useQuery({ 
    queryKey: ["myTT"], 
    queryFn: () => dataAPI.getMyTimetable(), 
    staleTime: 600000, 
    initialData: cachedMyTimetable ? cachedMyTimetable : (academicData?.timetable ? { data: academicData.timetable } : undefined) 
  });
  const ttQ = useQuery({
    queryKey: ["tt", batch],
    queryFn: () => dataAPI.getTimetable(batch),
    staleTime: 600000,
    initialData: cachedTimetable ? cachedTimetable : (academicData?.timetableBatch && academicData?.timetableBatch === batch ? { data: { rows: academicData.timetableRows } } : undefined)
  });

  useEffect(() => {
    if (calQ.data) setCalendar(calQ.data);
  }, [calQ.data, setCalendar]);

  useEffect(() => {
    if (myTTQ.data) setMyTimetable(myTTQ.data);
  }, [myTTQ.data, setMyTimetable]);

  useEffect(() => {
    if (ttQ.data) setTimetable(ttQ.data);
  }, [ttQ.data, setTimetable]);

  const calendarIndex = useMemo(() => {
    if (!calQ.data) return null;
    return buildCalendarIndex(calQ.data);
  }, [calQ.data]);

  const todayInfo = useMemo(() => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (calendarIndex) {
      const info = calendarIndex.byDate.get(todayIso);
      if (info) return info;
    }
    const dayOfWeek = today.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return {
      isoDate: todayIso,
      semester: "ODD" as Semester,
      monthLabel: today.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      dateNum: today.getDate(),
      weekdayLabel: today.toLocaleDateString("en-US", { weekday: "long" }),
      dayOrder: isWeekend ? null : (dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 1),
      event: isWeekend ? "Weekend" : "Regular Classes",
      isHoliday: isWeekend,
    };
  }, [calendarIndex]);

  useEffect(() => {
    const currentDayOrder = todayInfo?.dayOrder;
    if (currentDayOrder && currentDayOrder >= 1 && currentDayOrder <= 10) {
      setDayOverride(currentDayOrder);
    }
  }, [todayInfo?.isoDate, todayInfo?.dayOrder]);

  const getNextOccurrence = useMemo(() => {
    return (targetDayOrder: number) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const currentDayOrder = todayInfo?.dayOrder || null;

      if (calendarIndex) {
        if (currentDayOrder) {
          if (targetDayOrder === currentDayOrder) {
            return calendarIndex.byDate.get(todayIso) || null;
          } else if (targetDayOrder < currentDayOrder) {
            // Find most recent occurrence on or before today
            let best: AnyValue = null;
            let bestTime = -Infinity;
            calendarIndex.byDate.forEach((info) => {
              if (info.dayOrder === targetDayOrder) {
                const parts = info.isoDate.split("-");
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                d.setHours(0, 0, 0, 0);
                const time = d.getTime();
                if (time <= today.getTime() && time > bestTime) {
                  bestTime = time;
                  best = info;
                }
              }
            });
            if (best) return best;
          } else {
            // Find upcoming occurrence on or after today
            let best: AnyValue = null;
            let bestTime = Infinity;
            calendarIndex.byDate.forEach((info) => {
              if (info.dayOrder === targetDayOrder) {
                const parts = info.isoDate.split("-");
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                d.setHours(0, 0, 0, 0);
                const time = d.getTime();
                if (time >= today.getTime() && time < bestTime) {
                  bestTime = time;
                  best = info;
                }
              }
            });
            if (best) return best;
          }
        } else {
          // Weekend/Holiday: find nearest upcoming occurrence
          let best: AnyValue = null;
          let bestTime = Infinity;
          calendarIndex.byDate.forEach((info) => {
            if (info.dayOrder === targetDayOrder) {
              const parts = info.isoDate.split("-");
              const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              d.setHours(0, 0, 0, 0);
              const time = d.getTime();
              if (time >= today.getTime() && time < bestTime) {
                bestTime = time;
                best = info;
              }
            }
          });
          if (best) return best;
        }
      }

      // Fallback relative date calculation
      const dayOfWeek = today.getDay();
      const refDayOrder = currentDayOrder || (dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 1);
      const diffDays = targetDayOrder - refDayOrder;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diffDays);
      const tIso = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

      return {
        isoDate: tIso,
        dayOrder: targetDayOrder,
        isHoliday: false,
      };
    };
  }, [calendarIndex, todayInfo]);


  const schedule = useMemo(() => {
    const rawMyTT = myTTQ.data;
    const courses = rawMyTT?.data?.courses || rawMyTT?.courses || rawMyTT?.data || (Array.isArray(rawMyTT) ? rawMyTT : []);
    const rawTT = ttQ.data;
    const gridRows = rawTT?.data?.rows || rawTT?.rows || (Array.isArray(rawTT) ? rawTT : []);

    if (!Array.isArray(gridRows) || gridRows.length === 0 || !Array.isArray(courses) || courses.length === 0) return [];

    const slotMap = buildSlotToCourseMap(courses);
    const rawSchedule = buildSchedule(gridRows, slotMap);
    
    return rawSchedule.map(day => {
      const merged: ScheduleItem[] = [];
      day.classes.forEach(cls => {
        const prev = merged[merged.length - 1];
        const isContinuous = prev && (parseStart(cls.startTime) - parseEnd(prev.endTime) <= 5);
        const isSameCourse = prev && (prev.courseCode === cls.courseCode);
        const isSameType = prev && ((prev.courseType || "").toLowerCase() === (cls.courseType || "").toLowerCase());
        const isSameRoom = prev && ((prev.roomNo || "").trim().toUpperCase() === (cls.roomNo || "").trim().toUpperCase());

        if (prev && isSameCourse && isSameType && isSameRoom && isContinuous) {
          prev.endTime = cls.endTime;
          if (!prev.slot.includes(cls.slot)) {
            prev.slot = `${prev.slot}-${cls.slot}`;
          }
        } else {
          merged.push({ ...cls });
        }
      });
      return { ...day, classes: merged };
    });
  }, [ttQ.data, myTTQ.data]);

  const classes = useMemo(() => {
    const targetRow = schedule.find(s => {
      const header = String(s.day || "").toUpperCase();
      const match = header.match(/(?:DAY|ORDER|DO)?\s*(\d+|I{1,3}|IV|V)\b/i);
      if (!match) return false;
      const val = match[1];
      const romanMap: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
      const dOrder = romanMap[val.toUpperCase()] || parseInt(val, 10);
      return dOrder === dayOverride;
    });
    return targetRow?.classes || [];
  }, [schedule, dayOverride]);
  const classesWithBreaks = insertBreaks(classes);
  
  const totalClasses = classes.length;
  const firstStart = classes[0] ? fmt12(classes[0].startTime) : "";
  const lastEnd = classes[classes.length - 1] ? fmt12(classes[classes.length - 1].endTime) : "";

  const studentInfo = profile || academicData?.profile || myTTQ.data?.data?.studentInfo || null;
  const [showStudentInfo, setShowStudentInfo] = useState(false);

  // Auto-set batch from studentInfo if available
  useEffect(() => {
    if (studentInfo && studentInfo["Combo / Batch"]) {
      const b = extractBatch(studentInfo["Combo / Batch"]);
      if (b !== batch) {
        setBatch(b);
      }
    }
  }, [studentInfo]);

  const renderStudentInfoModal = () => {
    if (!showStudentInfo || !studentInfo) return null;
    return (
      <div 
        onClick={() => setShowStudentInfo(false)}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
          zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}
      >
        <div onClick={e => e.stopPropagation()} style={{
          background: "var(--bg-surface)", padding: "24px", borderRadius: "24px",
          width: "100%", maxWidth: "450px", border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)", maxHeight: "80vh", overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800 }}>Student Details</div>
            <button onClick={() => setShowStudentInfo(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>×</button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            {["Registration Number", "Name", "Combo / Batch", "Program", "Department", "Semester", "Class Room"].map(key => {
              if (!studentInfo[key]) return null;
              return (
                <div key={key} style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginBottom: "4px" }}>{key}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{studentInfo[key]}</div>
                </div>
              );
            })}
          </div>

          {studentInfo.advisors && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Advisors</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(studentInfo.advisors).map(([key, lines]: AnyValue) => {
                  if (!lines || lines.length === 0) return null;
                  return (
                    <div key={key} style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {lines.map((line: string, i: number) => (
                        <div key={i} style={{ 
                          fontSize: i === 0 ? "14px" : "12px", 
                          fontWeight: i === 0 ? 800 : 600, 
                          color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                          marginBottom: i === 0 ? "4px" : "2px" 
                        }}>{line}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderShareModal = () => {
    if (!showShareModal) return null;
    
    const isMatrix = false;
    const isAura = true;
    
    const colors = {
      bg: isMatrix ? "#0a0a0c" : isAura ? "var(--card-elevated)" : "var(--bg-surface)",
      border: isMatrix ? "rgba(168,194,0,0.2)" : isAura ? "var(--card-border)" : "var(--border)",
      textPrimary: "var(--text-main)",
      textMuted: isMatrix ? "#888" : isAura ? "var(--text-muted)" : "var(--text-muted)",
      accent: isMatrix ? "#a8c200" : isAura ? "#FF75C3" : "var(--accent)",
      secondaryAccent: isMatrix ? "#a8c200" : isAura ? "#8F92FF" : "var(--accent-secondary)",
    };

    return (
      <div 
        onClick={() => setShowShareModal(false)}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
          zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}
      >
        <div 
          onClick={e => e.stopPropagation()} 
          style={{
            background: colors.bg, 
            padding: "28px", 
            borderRadius: "28px",
            width: "100%", 
            maxWidth: "420px", 
            border: `1px solid ${colors.border}`,
            boxShadow: isAura 
              ? `0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(143, 146, 255, 0.08)`
              : `0 20px 40px rgba(0,0,0,0.5)`, 
            maxHeight: "90vh", 
            overflowY: "auto",
            position: "relative"
          }}
        >
          {isAura && (
            <div style={{ position: "absolute", right: "-50px", top: "-50px", width: "150px", height: "150px", background: `radial-gradient(circle, ${colors.secondaryAccent}22 0%, transparent 70%)`, filter: "blur(30px)", pointerEvents: "none" }} />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 900, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "4px" }}>Share Timetable</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: colors.textPrimary }}>Export Schedule</div>
            </div>
            <button 
              onClick={() => setShowShareModal(false)} 
              style={{ 
                background: "transparent", 
                border: "none", 
                color: colors.textMuted, 
                fontSize: "24px", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                padding: "4px"
              }}
            >
              ×
            </button>
          </div>

          <p style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.5, marginBottom: "24px" }}>
            Select how you would like to export your schedule. You can download it directly or share it to other apps.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button
              onClick={() => {
                setShowShareModal(false);
                handleShare();
              }}
              disabled={sharing}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                padding: "18px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                width: "100%",
                outline: "none"
              }}
            >
              <div style={{ 
                width: "44px", height: "44px", borderRadius: "14px", 
                background: `${colors.accent}15`, 
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <Share2 size={20} color={colors.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: colors.textPrimary }}>Export Day {dayOverride} Schedule</div>
                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>
                  Download a beautiful single-day card.
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowShareModal(false);
                handleFullShare();
              }}
              disabled={fullSharing}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${colors.border}`,
                borderRadius: "20px",
                padding: "18px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                width: "100%",
                outline: "none"
              }}
            >
              <div style={{ 
                width: "44px", height: "44px", borderRadius: "14px", 
                background: `${colors.secondaryAccent}15`, 
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <Share2 size={20} color={colors.secondaryAccent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: colors.textPrimary }}>Export Full Timetable</div>
                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>
                  Download a complete grid of all 5 days.
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const studentInitials = studentInfo?.Name ? studentInfo.Name.substring(0, 2).toUpperCase() : "ST";

  const myCourses = myTTQ.data?.data?.courses || myTTQ.data?.data || [];

  return (
    <>
      <AuraTimetable 
        dayOverride={dayOverride} 
        setDayOverride={setDayOverride} 
        batch={batch} 
        setBatch={setBatch} 
        classes={classes} 
        classesWithBreaks={classesWithBreaks} 
        handleShare={handleShare} 
        sharing={sharing} 
        shareRef={shareRef} 
        fullShareRef={fullShareRef} 
        fullSharing={fullSharing} 
        handleFullShare={handleFullShare} 
        schedule={schedule} 
        studentInitials={studentInitials} 
        onShowStudentInfo={() => setShowStudentInfo(true)} 
        setShowShareModal={setShowShareModal} 
        todayInfo={todayInfo} 
        getNextOccurrence={getNextOccurrence}
        isPremium={isPremium}
        isAdmin={isAdmin}
        importantSlots={importantSlots}
        setImportantSlots={setImportantSlots}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedFriend={selectedFriend}
        setSelectedFriend={setSelectedFriend}
        myCourses={myCourses}
        generateFriendTimetable={generateFriendTimetable}
        syncedFriends={syncedFriends}
        setSyncedFriends={setSyncedFriends}
      />
      {renderStudentInfoModal()}
      {renderShareModal()}
    </>
  );

}

export function AuraTimetable({ 
  dayOverride, setDayOverride, batch, setBatch, classes, classesWithBreaks, 
  handleShare, sharing, shareRef, fullShareRef, fullSharing, handleFullShare, 
  schedule, studentInitials, onShowStudentInfo, setShowShareModal, todayInfo, 
  getNextOccurrence, isPremium, isAdmin, importantSlots, setImportantSlots,
  activeTab, setActiveTab, selectedFriend, setSelectedFriend, myCourses, generateFriendTimetable,
  syncedFriends, setSyncedFriends
}: any) {
  const router = useRouter();
  const [currentMin, setCurrentMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMin(new Date().getHours() * 60 + new Date().getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const firstStart = classes[0] ? fmt12(classes[0].startTime) : "";
  const lastEnd = classes[classes.length - 1] ? fmt12(classes[classes.length - 1].endTime) : "";
  const totalClasses = classes.length;

  const [selectedClassDetails, setSelectedClassDetails] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and add class to hide bottom navigation when modal is open
  useEffect(() => {
    if (selectedClassDetails) {
      document.body.classList.add("timetable-sheet-open");
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedClassDetails(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.classList.remove("timetable-sheet-open");
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedClassDetails]);

  // Day buttons auto-scroll into view
  const dayBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const btn = dayBtnRefs.current[dayOverride - 1];
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [dayOverride]);

  const handleAddFriend = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const exists = syncedFriends.some(
      (f: any) => f.regNo.toUpperCase() === trimmed.toUpperCase() || f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("Friend already added to Quick Connect list.");
      return;
    }
    const isReg = /^[a-zA-Z]{2}\d+$/i.test(trimmed);
    const newFriend = {
      name: isReg ? `Friend (${trimmed.toUpperCase()})` : trimmed,
      regNo: trimmed.toUpperCase(),
      initials: trimmed.substring(0, 2).toUpperCase(),
      status: "approved"
    };
    const updated = [...syncedFriends, newFriend];
    setSyncedFriends(updated);
    setSelectedFriend(newFriend);
  };

  const handleApproveFriend = (regNo: string) => {
    const updated = syncedFriends.map((f: any) => {
      if (f.regNo === regNo) {
        return { ...f, status: "approved" };
      }
      return f;
    });
    setSyncedFriends(updated);
    const updatedFriend = updated.find((f: any) => f.regNo === regNo);
    if (updatedFriend) {
      setSelectedFriend(updatedFriend);
    }
  };

  const handleRemoveFriend = (regNo: string) => {
    const updated = syncedFriends.filter((f: any) => f.regNo !== regNo);
    setSyncedFriends(updated);
    if (selectedFriend?.regNo === regNo) {
      setSelectedFriend(null);
    }
  };

  const AURA = {
    bg: "var(--bg-root)",
    primary: "var(--accent-primary)",
    secondary: "var(--accent-secondary)",
    accent: "#94FFD8",
    card: "var(--card-bg)",
    border: "var(--card-border)",
  };

  const friendTimetable = useMemo(() => {
    if (!selectedFriend) return [];
    return generateFriendTimetable(selectedFriend.regNo || selectedFriend.name, myCourses);
  }, [selectedFriend, myCourses]);

  const friendClasses = useMemo(() => {
    if (!selectedFriend || !friendTimetable) return [];
    const targetRow = friendTimetable.find((s: any) => {
      const header = String(s.day || "");
      const dOrder = parseInt(header.match(/\d+/)?.[0] || "0");
      return dOrder === dayOverride;
    });
    return targetRow?.classes || [];
  }, [friendTimetable, dayOverride, selectedFriend]);

  const comparisonList = useMemo(() => {
    return PERIODS.map((period, pIdx) => {
      const myClass = classes.find((c: any) => {
        const classStart = parseStart(c.startTime);
        const classEnd = parseEnd(c.endTime);
        const periodStart = parseStart(period.start);
        const periodEnd = parseEnd(period.end);
        return classStart < periodEnd && classEnd > periodStart;
      });
      const friendClass = friendClasses.find((c: any) => {
        const classStart = parseStart(c.startTime);
        const classEnd = parseEnd(c.endTime);
        const periodStart = parseStart(period.start);
        const periodEnd = parseEnd(period.end);
        return classStart < periodEnd && classEnd > periodStart;
      });
      const isMyFree = !myClass;
      const isFriendFree = !friendClass;
      const bothFree = isMyFree && isFriendFree;
      return {
        period: pIdx + 1,
        time: `${period.start} - ${period.end}`,
        myStatus: myClass ? (myClass.courseTitle || myClass.courseCode) : "Free",
        friendStatus: friendClass ? (friendClass.courseTitle || friendClass.courseCode) : "Free",
        bothFree,
        isMyFree,
        isFriendFree
      };
    });
  }, [classes, friendClasses]);

  // Contextual Status Logic
  let nowClass: any | null = null;
  let nextClass: any | null = null;
  let classesFinished = false;

  if (todayInfo && dayOverride === todayInfo.dayOrder && !todayInfo.isHoliday) {
    for (const c of classesWithBreaks) {
      if (c.isBreak) continue;
      const s = parseStart(c.startTime);
      const e = parseEnd(c.endTime);
      if (currentMin >= s && currentMin <= e) {
        nowClass = c;
        break;
      }
    }
    if (!nowClass) {
      for (const c of classesWithBreaks) {
        if (c.isBreak) continue;
        if (parseStart(c.startTime) > currentMin) {
          nextClass = c;
          break;
        }
      }
    }
    if (!nowClass && !nextClass && classes.length > 0 && currentMin > parseEnd(classes[classes.length - 1].endTime)) {
      classesFinished = true;
    }
  }

  // Active occurrence info for the selected dayOverride
  const selectedDayOcc = useMemo(() => {
    return getNextOccurrence ? getNextOccurrence(dayOverride) : null;
  }, [getNextOccurrence, dayOverride]);

  const selectedDayDateStr = useMemo(() => {
    if (selectedDayOcc?.isoDate) {
      const parts = selectedDayOcc.isoDate.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
      }
    }
    return `DAY ORDER ${dayOverride}`;
  }, [selectedDayOcc, dayOverride]);

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100dvh", display: "flex", flexDirection: "column", color: "var(--text-main)", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative", width: "100%", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .aura-blob {
          position: fixed; width: 500px; height: 500px;
          border-radius: 50%; filter: blur(140px);
          opacity: 0.10; z-index: 0; pointer-events: none;
          animation: orbit 20s infinite linear;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translate(80px) rotate(0deg); }
          to { transform: rotate(360deg) translate(80px) rotate(-360deg); }
        }

        .timetable-main {
          width: 100%;
          min-width: 0;
          max-width: 680px;
          margin: 0 auto;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Class Card Touch & Feedback */
        .timetable-class-card {
          transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .timetable-class-card:active {
          transform: scale(0.985);
        }

        /* Bottom Sheet Transition Styles */
        .tt-sheet-backdrop {
          transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tt-sheet-panel {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .aura-blob {
            animation: none;
          }
          .timetable-class-card, .tt-sheet-backdrop, .tt-sheet-panel {
            transition: none !important;
          }
        }
      `}} />

      {/* Background Ambience */}
      <div className="aura-blob" style={{ background: AURA.secondary, top: '-180px', right: '-120px' }} />
      <div className="aura-blob" style={{ background: AURA.accent, bottom: '-180px', left: '-120px', animationDelay: '-10s' }} />

      <main 
        className="timetable-main" 
        style={{ 
          flex: 1, 
          position: "relative", 
          zIndex: 1, 
          padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(96px + env(safe-area-inset-bottom, 0px))", 
          color: "var(--text-main)", 
          display: "flex", 
          flexDirection: "column", 
          gap: "10px" 
        }}
      >
        
        {/* Streamlined Compact Header */}
        <div 
          style={{ 
            display: "flex", 
            flexDirection: "column",
            gap: "8px",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(192, 132, 252, 0.04) 100%)", 
            padding: "10px 14px", 
            borderRadius: "20px", 
            border: "1px solid rgba(255, 255, 255, 0.08)", 
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
          }}
        >
          {/* Top Row: Title, Day/Batch, NS & Profile */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", minWidth: 0, gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(192, 132, 252, 0.25), rgba(0, 212, 255, 0.15))",
                border: "1px solid rgba(192, 132, 252, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C084FC",
                flexShrink: 0
              }}>
                <Calendar size={15} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "8.5px", color: AURA.primary, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 900, lineHeight: 1 }}>
                  SEMESTER SCHEDULE
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff", marginTop: "2px", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Day {dayOverride} <span style={{ opacity: 0.35, fontWeight: 400 }}>·</span> Batch {batch}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {isAdmin && (
                <button
                  onClick={() => router.push("/ns")}
                  style={{
                    height: "30px",
                    padding: "0 9px",
                    borderRadius: "10px",
                    background: "rgba(0, 255, 136, 0.12)",
                    color: "#00FF88",
                    border: "1px solid rgba(0, 255, 136, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: 900,
                    fontSize: "10px",
                    cursor: "pointer"
                  }}
                  title="Open Operations Telemetry (/ns)"
                >
                  <Activity size={12} color="#00FF88" />
                  <span>NS</span>
                </button>
              )}

              <button
                onClick={onShowStudentInfo}
                style={{
                  height: "30px",
                  padding: "0 10px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                {studentInitials}
              </button>
            </div>
          </div>

          {/* Bottom Controls: Batch Toggle & Export Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "8.5px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Batch:</span>
              <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "2px", border: "1px solid rgba(255,255,255,0.08)" }}>
                {[1, 2].map(b => (
                  <button 
                    key={b} 
                    onClick={() => setBatch(b)}
                    style={{
                      padding: "3px 9px", 
                      borderRadius: "6px", 
                      border: "none", 
                      fontSize: "9.5px", 
                      fontWeight: 900,
                      background: batch === b ? "linear-gradient(135deg, #C084FC 0%, #00D4FF 100%)" : "transparent",
                      color: batch === b ? "#000" : "rgba(255,255,255,0.5)",
                      cursor: "pointer"
                    }}
                  >
                    B{b}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowShareModal(true)} 
              style={{ 
                background: "linear-gradient(135deg, rgba(192, 132, 252, 0.18) 0%, rgba(255, 94, 126, 0.15) 100%)", 
                border: "1px solid rgba(192, 132, 252, 0.35)", 
                color: "#fff", 
                padding: "4px 10px", 
                borderRadius: "8px", 
                fontSize: "10px", 
                fontWeight: 900, 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: "5px"
              }}
            >
              <Share2 size={11} color="#C084FC" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* View Switcher Toggle (Compact) */}
        <div 
          style={{ 
            display: "flex", 
            background: "rgba(0,0,0,0.45)", 
            borderRadius: "12px", 
            padding: "3px", 
            border: "1px solid rgba(255,255,255,0.07)", 
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <button 
            onClick={() => setActiveTab("schedule")}
            style={{
              flex: 1, 
              padding: "6px 12px", 
              borderRadius: "10px", 
              border: "none", 
              fontSize: "10.5px", 
              fontWeight: 900,
              background: activeTab === "schedule" ? "linear-gradient(135deg, #C084FC 0%, #FF5E7E 100%)" : "transparent",
              color: activeTab === "schedule" ? "#fff" : "rgba(255,255,255,0.5)",
              cursor: "pointer"
            }}
          >
            My Schedule
          </button>
          <button 
            onClick={() => setActiveTab("friends")}
            style={{
              flex: 1, 
              padding: "6px 12px", 
              borderRadius: "10px", 
              border: "none", 
              fontSize: "10.5px", 
              fontWeight: 900,
              background: activeTab === "friends" ? "linear-gradient(135deg, #C084FC 0%, #FF5E7E 100%)" : "transparent",
              color: activeTab === "friends" ? "#fff" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "5px"
            }}
          >
            <span>Friends Sync</span>
            <span style={{ 
              fontSize: "7px", 
              fontWeight: 950, 
              background: "linear-gradient(135deg, #FFCC00 0%, #FF9500 100%)", 
              color: "#000", 
              padding: "1px 4px", 
              borderRadius: "3px", 
              textTransform: "uppercase"
            }}>
              PRO
            </span>
          </button>
        </div>

        {activeTab === "schedule" ? (
          <>
            {/* Contextual Smart Status Header (NOW / NEXT / Finished) */}
            {todayInfo && (nowClass || nextClass || classesFinished) && (
              <div>
                {nowClass ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", background: "rgba(148, 255, 216, 0.08)", border: `1px solid ${AURA.accent}40`, padding: "9px 12px", borderRadius: "14px" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: AURA.accent, boxShadow: `0 0 8px ${AURA.accent}`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 900, color: AURA.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>NOW HAPPENING</span>
                        <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>
                          {Math.max(0, parseEnd(nowClass.endTime) - currentMin)}m left
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nowClass.courseTitle.toLowerCase()}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                        {nowClass.roomNo} · {fmt12(nowClass.startTime)} – {fmt12(nowClass.endTime)}
                      </div>
                    </div>
                  </div>
                ) : nextClass ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "9px 12px", borderRadius: "14px" }}>
                    <div style={{ fontSize: "14px", flexShrink: 0 }}>⏳</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "9px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1px" }}>UPCOMING NEXT</div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nextClass.courseTitle.toLowerCase()}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                        Starts at {fmt12(nextClass.startTime)} · {nextClass.roomNo}
                      </div>
                    </div>
                  </div>
                ) : classesFinished ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", background: "rgba(52, 199, 89, 0.08)", border: "1px solid rgba(52, 199, 89, 0.25)", padding: "9px 12px", borderRadius: "14px" }}>
                    <div style={{ fontSize: "14px", color: "#34c759", flexShrink: 0 }}>✓</div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#34c759" }}>Classes finished for today</div>
                      <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>All scheduled sessions completed</div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Compact Clean Date Summary */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              background: "rgba(255, 255, 255, 0.02)", 
              border: `1px solid ${AURA.border}`, 
              borderRadius: "14px", 
              padding: "8px 12px",
              gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                <div style={{ 
                  width: "6px", height: "6px", borderRadius: "50%", 
                  background: (selectedDayOcc?.isHoliday || todayInfo?.isHoliday) && dayOverride === todayInfo?.dayOrder ? "#FF7597" : AURA.accent, 
                  boxShadow: `0 0 6px ${(selectedDayOcc?.isHoliday || todayInfo?.isHoliday) && dayOverride === todayInfo?.dayOrder ? "#FF7597" : AURA.accent}`,
                  flexShrink: 0
                }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 900, color: "var(--text-main)", letterSpacing: "0.02em" }}>
                    {selectedDayDateStr}
                  </div>
                  <div style={{ fontSize: "9.5px", color: "var(--text-muted)", fontWeight: 600, marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {totalClasses > 0 ? `${totalClasses} classes · ${firstStart} – ${lastEnd}` : "No classes scheduled"}
                  </div>
                </div>
              </div>
              {todayInfo?.dayOrder && dayOverride !== todayInfo.dayOrder && (
                <button 
                  onClick={() => setDayOverride(todayInfo.dayOrder as number)}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: AURA.accent, padding: "4px 8px", borderRadius: "8px", fontSize: "9.5px", fontWeight: 800,
                    cursor: "pointer", flexShrink: 0
                  }}
                >
                  Today
                </button>
              )}
            </div>

            {/* Horizontal D1–D5 Day Selector */}
            <div 
              className="hide-scroll" 
              style={{ 
                display: "flex", 
                gap: "6px", 
                overflowX: "auto", 
                width: "100%",
                paddingBottom: "2px",
                WebkitOverflowScrolling: "touch"
              }}
            >
              {[1, 2, 3, 4, 5].map(d => {
                const occ = getNextOccurrence ? getNextOccurrence(d) : null;
                let dayName = "";
                let dateNum = "";
                if (occ?.isoDate) {
                  const parts = occ.isoDate.split("-");
                  if (parts.length === 3) {
                    const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    dayName = dt.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                    dateNum = parts[2];
                  }
                }
                const isSelected = dayOverride === d;
                const isToday = todayInfo?.dayOrder === d;
                
                return (
                  <button 
                    key={d} 
                    ref={el => { dayBtnRefs.current[d - 1] = el; }}
                    onClick={() => setDayOverride(d)} 
                    style={{
                      padding: "8px 10px", 
                      minWidth: "56px", 
                      flex: "1 0 auto",
                      maxWidth: "80px",
                      borderRadius: "12px",
                      background: isSelected 
                        ? `linear-gradient(135deg, ${AURA.secondary}ee, ${AURA.primary}ee)` 
                        : "rgba(255,255,255,0.03)",
                      color: isSelected ? "#fff" : "var(--text-muted)",
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center",
                      cursor: "pointer", 
                      border: isSelected ? "1px solid rgba(255,255,255,0.2)" : (isToday ? "1px dashed rgba(148, 255, 216, 0.4)" : "1px solid rgba(255,255,255,0.05)"),
                      boxShadow: isSelected ? `0 4px 14px ${AURA.secondary}40` : "none",
                      position: "relative"
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 900, lineHeight: 1 }}>D{d}</div>
                    <div style={{ fontSize: "8.5px", fontWeight: 700, opacity: isSelected ? 0.95 : 0.6, marginTop: "3px", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                      {dateNum ? `${dateNum} ${dayName}` : (isToday ? "TODAY" : `DAY ${d}`)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Timeline Classes List */}
            {totalClasses === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "36px 16px", fontSize: "13px", fontWeight: 700, background: "rgba(255,255,255,0.02)", borderRadius: "18px", border: "1px dashed rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "28px", marginBottom: "6px" }}>🎉</div>
                No classes scheduled for Day {dayOverride}<br/>
                <span style={{ fontSize: "11px", opacity: 0.6, fontWeight: 500 }}>Enjoy your free time!</span>
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: "14px", display: "flex", flexDirection: "column", gap: totalClasses <= 3 ? "13px" : "8px" }}>
                {/* Vertical Timeline Guide Line */}
                <div style={{ position: "absolute", left: "0", top: "12px", bottom: "12px", width: "2px", background: "linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.02))" }} />
                
                {classesWithBreaks.map((item: any, i: number) => {
                  if (item.isBreak) {
                    return (
                      <div key={`break-${i}`} style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative", margin: "2px 0", opacity: 0.65 }}>
                        <div style={{ position: "absolute", left: "-16px", width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "8.5px", color: AURA.secondary, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>Break</span>
                          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", flex: 1 }} />
                          <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>{fmt12(item.startTime)} – {fmt12(item.endTime)}</span>
                        </div>
                      </div>
                    );
                  }

                  const isLab = isLabSession(item, myCourses);
                  const isActive = (todayInfo && dayOverride === todayInfo.dayOrder && currentMin >= parseStart(item.startTime) && currentMin <= parseEnd(item.endTime));
                  const slotKey = `${dayOverride}-${item.courseCode}-${item.startTime}`;
                  const isImportant = !!importantSlots[slotKey];
                  const durMins = Math.max(0, parseEnd(item.endTime) - parseStart(item.startTime));
                  const durText = durMins >= 60 
                    ? `${Math.floor(durMins / 60)}h${durMins % 60 ? ` ${durMins % 60}m` : ""}` 
                    : `${durMins}m`;
                  const isExtendedSlot = durMins >= 85;

                  return (
                    <div key={i} style={{ position: "relative" }}>
                      {/* Timeline Dot */}
                      <div style={{ 
                        position: "absolute", 
                        left: "-17px", 
                        top: "16px", 
                        width: "8px", 
                        height: "8px", 
                        borderRadius: "50%", 
                        background: isActive ? AURA.accent : (isImportant ? "#FFD700" : (isLab ? "#FF75C3" : AURA.secondary)), 
                        border: "2px solid var(--app-bg)", 
                        zIndex: 2,
                        boxShadow: isActive ? `0 0 8px ${AURA.accent}` : "none"
                      }} />
                      
                      {/* Interactive Compact Class Card */}
                      <div 
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedClassDetails(item)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedClassDetails(item); }}
                        className="timetable-class-card" 
                        style={{ 
                          padding: "12px 14px", 
                          borderRadius: "16px",
                          border: isActive 
                            ? `1px solid ${AURA.accent}60` 
                            : (isImportant 
                                ? "1px solid rgba(255, 215, 0, 0.35)" 
                                : (isLab ? "1px solid rgba(255, 117, 195, 0.3)" : "1px solid rgba(255, 255, 255, 0.07)")),
                          background: isLab 
                            ? "linear-gradient(135deg, rgba(255, 117, 195, 0.08) 0%, rgba(244, 114, 182, 0.02) 100%)" 
                            : (isActive ? "rgba(148, 255, 216, 0.04)" : "rgba(255, 255, 255, 0.02)"),
                          boxShadow: isActive 
                            ? `0 0 16px ${AURA.accent}15` 
                            : (isImportant ? "0 0 14px rgba(255, 215, 0, 0.05)" : "none"),
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          position: "relative",
                          overflow: "hidden"
                        }}
                      >
                        {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${AURA.accent}, transparent)` }} />}
                        
                        {/* Card Header: Time, Duration & Badges / Star */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0, gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isActive ? AURA.accent : "rgba(255,255,255,0.7)", fontSize: "10.5px", fontWeight: 800 }}>
                            <span>{fmt12(item.startTime)} – {fmt12(item.endTime)}</span>
                            {isExtendedSlot && (
                              <span style={{ 
                                fontSize: "8px", 
                                color: isLab ? "#FF75C3" : AURA.secondary, 
                                fontWeight: 800, 
                                background: isLab ? "rgba(255, 117, 195, 0.12)" : "rgba(192, 132, 252, 0.12)", 
                                border: isLab ? "1px solid rgba(255, 117, 195, 0.25)" : "1px solid rgba(192, 132, 252, 0.25)",
                                padding: "0.5px 4px", 
                                borderRadius: "4px" 
                              }}>
                                {durText}
                              </span>
                            )}
                            {isActive && (
                              <span style={{ 
                                fontSize: "7.5px", 
                                color: "#000", 
                                background: AURA.accent, 
                                fontWeight: 950, 
                                padding: "1px 5px", 
                                borderRadius: "4px", 
                                textTransform: "uppercase" 
                              }}>
                                NOW
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPremium) {
                                  alert("Premium Feature: Flag important review classes, tests, or quizzes. Upgrade to Premium to unlock this feature!");
                                  router.push('/premium');
                                } else {
                                  setImportantSlots((prev: Record<string, boolean>) => ({
                                    ...prev,
                                    [slotKey]: !prev[slotKey]
                                  }));
                                }
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "2px",
                                color: isImportant ? "#FFD700" : "rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                outline: "none",
                                minWidth: "22px",
                                minHeight: "22px",
                                justifyContent: "center"
                              }}
                              aria-label="Toggle star favorite"
                            >
                              <Star size={13} fill={isImportant ? "#FFD700" : "none"} />
                            </button>
                          </div>
                        </div>

                        {/* Subject Title (2 lines max with ellipsis) */}
                        <div style={{ 
                          fontSize: "13.5px", 
                          fontWeight: 900, 
                          color: "var(--text-main)", 
                          lineHeight: 1.25, 
                          textTransform: "capitalize", 
                          letterSpacing: "-0.01em",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {item.courseTitle.toLowerCase()}
                        </div>
                        
                        {/* Room & Lab Tags */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
                            {item.roomNo || "TBA"}
                          </span>
                          {isLab && (
                            <span style={{ 
                              fontSize: "7.5px", 
                              color: "#FF75C3", 
                              textTransform: "uppercase", 
                              fontWeight: 950, 
                              background: "rgba(255, 117, 195, 0.15)", 
                              padding: "1px 5px", 
                              borderRadius: "4px",
                              border: "1px solid rgba(255, 117, 195, 0.25)"
                            }}>
                              LAB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Friends Sync View */
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "18px", border: `1px solid ${AURA.border}` }}>
              <h3 style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-main)", marginBottom: "3px" }}>Nexus Sync Engine</h3>
              <p style={{ fontSize: "10.5px", color: "var(--text-muted)", marginBottom: "12px", fontWeight: 600 }}>Compare schedule with classmates to find free slots together.</p>
              
              {/* Search input */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <input 
                  id="friend-search-input"
                  type="text" 
                  placeholder="Friend Name or Reg No..." 
                  style={{
                    flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#fff",
                    outline: "none"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddFriend(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById("friend-search-input") as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleAddFriend(input.value);
                      input.value = "";
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px", padding: "0 12px", color: "#fff", fontSize: "11px",
                    fontWeight: 800, cursor: "pointer"
                  }}
                >
                  Add
                </button>
              </div>

              {/* Quick Connect list */}
              <div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Synced Friends</div>
                {syncedFriends.length === 0 ? (
                  <div style={{ padding: "14px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "12px", fontWeight: 600 }}>
                    No friends added yet. Enter a registration number above to sync.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))", gap: "8px" }}>
                    {syncedFriends.map((friend: any) => (
                      <div
                        key={friend.regNo}
                        onClick={() => setSelectedFriend(friend)}
                        style={{
                          background: selectedFriend?.regNo === friend.regNo ? "rgba(148, 255, 216, 0.08)" : "rgba(255,255,255,0.02)",
                          border: selectedFriend?.regNo === friend.regNo ? `1.5px solid ${AURA.accent}` : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "12px", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px",
                          textAlign: "left", cursor: "pointer", position: "relative"
                        }}
                      >
                        <div style={{
                          width: "24px", height: "24px", borderRadius: "8px",
                          background: selectedFriend?.regNo === friend.regNo ? AURA.accent : "rgba(255,255,255,0.06)",
                          color: selectedFriend?.regNo === friend.regNo ? "#000" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "9px", fontWeight: 900
                        }}>
                          {friend.initials}
                        </div>
                        <div style={{ minWidth: 0, flex: 1, paddingRight: "14px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {friend.name}
                          </div>
                          <div style={{ fontSize: "8.5px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>
                            {friend.regNo}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFriend(friend.regNo);
                          }}
                          style={{
                            position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                            fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", outline: "none", padding: "2px"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Friend comparison results */}
            {selectedFriend && (
              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "18px", padding: "14px", border: `1px solid ${AURA.border}` }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff", marginBottom: "10px" }}>
                  Schedule Overlap · Day {dayOverride} ({selectedFriend.name})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {comparisonList.map((slot: any) => (
                    <div 
                      key={slot.period}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 10px", borderRadius: "10px",
                        background: slot.bothFree ? "rgba(148, 255, 216, 0.08)" : "rgba(255,255,255,0.02)",
                        border: slot.bothFree ? `1px solid ${AURA.accent}40` : "1px solid rgba(255,255,255,0.04)"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{slot.time}</div>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#fff" }}>You: {slot.myStatus}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {slot.bothFree ? (
                          <span style={{ fontSize: "8.5px", fontWeight: 900, color: "#000", background: AURA.accent, padding: "2px 6px", borderRadius: "4px" }}>
                            BOTH FREE 🎉
                          </span>
                        ) : (
                          <span style={{ fontSize: "9.5px", color: "var(--text-muted)", fontWeight: 700 }}>
                            {selectedFriend.name.split(' ')[0]}: {slot.friendStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden Share Containers */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={shareRef} style={{ width: "420px", background: "#0c0a14", padding: "32px", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "9px", color: AURA.primary, fontWeight: 900, letterSpacing: "0.2em", marginBottom: "2px" }}>SRM NEXUS</div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff" }}>Day {dayOverride} Schedule</div>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: AURA.accent }}>DO {dayOverride}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {classesWithBreaks.map((item: any, i: number) => {
                if (item.isBreak) return null;
                const isLab = isLabSession(item, myCourses);
                return (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "85px", fontSize: "9.5px", fontWeight: 800, color: "rgba(255,255,255,0.7)", textAlign: "right" }}>
                      <div>{fmt12(item.startTime)}</div>
                      <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>to {fmt12(item.endTime)}</div>
                    </div>
                    <div style={{ flex: 1, background: isLab ? "rgba(255, 117, 195, 0.1)" : "rgba(255,255,255,0.03)", border: isLab ? "1px solid rgba(255, 117, 195, 0.3)" : "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 12px" }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 900, color: "#fff", textTransform: "capitalize" }}>{item.courseTitle.toLowerCase()}</div>
                      <div style={{ fontSize: "9.5px", color: isLab ? "#FF75C3" : AURA.secondary, fontWeight: 700, marginTop: "2px" }}>{item.roomNo || "TBA"} • {item.courseCode}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hidden Full Share Card */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={fullShareRef} style={{ width: "1100px", background: "#0c0a14", padding: "48px", position: "relative", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px" }}>
              <div>
                <div style={{ fontSize: "12px", color: AURA.accent, fontWeight: 900, letterSpacing: "0.2em", marginBottom: "6px" }}>SRM NEXUS PORTAL</div>
                <div style={{ fontSize: "36px", fontWeight: 900, color: "#fff" }}>Semester Timetable</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "20px", fontWeight: 900, color: AURA.secondary }}>BATCH {batch}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
              {[1, 2, 3, 4, 5].map(d => (
                <div key={d} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "18px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "12px", color: AURA.primary, fontWeight: 900, marginBottom: "14px", textTransform: "uppercase", textAlign: "center" }}>Day Order {d}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {(schedule[d - 1]?.classes || []).map((cls: any, i: number) => {
                      const isLab = isLabSession(cls, myCourses);
                      return (
                        <div key={i} style={{ background: isLab ? "rgba(255, 117, 195, 0.1)" : "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "10px", border: isLab ? "1px solid rgba(255, 117, 195, 0.3)" : "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 900, color: isLab ? "#FF75C3" : "#fff", textTransform: "capitalize" }}>{cls.courseTitle.toLowerCase()}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5px", color: "rgba(255,255,255,0.6)", fontWeight: 700, marginTop: "2px" }}>
                            <span>{fmt12(cls.startTime)}</span>
                            <span>{cls.roomNo || "TBA"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Polish Class Details Bottom Sheet using React Portal */}
      {mounted && createPortal(
        <div 
          className="tt-sheet-backdrop"
          style={{
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            background: "rgba(0, 0, 0, 0.72)", 
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            zIndex: 100000, 
            opacity: selectedClassDetails ? 1 : 0,
            pointerEvents: selectedClassDetails ? "auto" : "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end"
          }} 
          onClick={() => setSelectedClassDetails(null)}
        >
          <div 
            className="tt-sheet-panel"
            style={{
              width: "100%",
              maxWidth: "520px",
              margin: "0 auto",
              background: "#0d0a17", 
              borderTop: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "24px 24px 0 0", 
              maxHeight: "85vh",
              display: "flex", 
              flexDirection: "column",
              boxShadow: "0 -12px 48px rgba(0,0,0,0.8)",
              transform: selectedClassDetails ? "translateY(0)" : "translateY(100%)",
              position: "relative",
              overflow: "hidden"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div style={{ width: "36px", height: "4px", background: "rgba(255,255,255,0.25)", borderRadius: "2px", margin: "10px auto 4px", flexShrink: 0 }} />

            {selectedClassDetails && (() => {
              const isLab = isLabSession(selectedClassDetails, myCourses);
              const slotKey = `${dayOverride}-${selectedClassDetails.courseCode}-${selectedClassDetails.startTime}`;
              const isImportant = !!importantSlots[slotKey];

              return (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "14px", 
                  overflowY: "auto", 
                  padding: "12px 20px calc(24px + env(safe-area-inset-bottom, 0px))" 
                }}>
                  {/* Top Bar: Time, Lab Badge & Close (X) */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: AURA.accent, fontWeight: 900, letterSpacing: "0.02em" }}>
                        {fmt12(selectedClassDetails.startTime)} – {fmt12(selectedClassDetails.endTime)}
                      </span>
                      {isLab && (
                        <span style={{ 
                          fontSize: "8.5px", 
                          color: "#FF75C3", 
                          textTransform: "uppercase", 
                          fontWeight: 950, 
                          background: "rgba(255, 117, 195, 0.15)", 
                          padding: "2px 7px", 
                          borderRadius: "6px", 
                          border: "1px solid rgba(255, 117, 195, 0.3)" 
                        }}>
                          Lab Session
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedClassDetails(null)}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "rgba(255, 255, 255, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                      aria-label="Close sheet"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  
                  {/* Full Course Title */}
                  <div style={{ 
                    fontSize: "20px", 
                    fontWeight: 900, 
                    color: "#fff", 
                    textTransform: "capitalize", 
                    lineHeight: 1.25, 
                    letterSpacing: "-0.3px",
                    wordBreak: "break-word",
                    overflowWrap: "break-word"
                  }}>
                    {selectedClassDetails.courseTitle.toLowerCase()}
                  </div>
                  
                  {/* Metadata Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "8.5px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800, marginBottom: "3px" }}>Course Code</div>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: AURA.secondary, wordBreak: "break-word" }}>{selectedClassDetails.courseCode}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "8.5px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800, marginBottom: "3px" }}>Room</div>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: "#fff", wordBreak: "break-word" }}>{selectedClassDetails.roomNo || "TBA"}</div>
                    </div>
                    
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "14px", gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: "8.5px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800, marginBottom: "3px" }}>Faculty</div>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: "#fff", wordBreak: "break-word", overflowWrap: "break-word", lineHeight: 1.35 }}>
                        {(selectedClassDetails.facultyName || "TBA").replace(/\s*\(\d+\)/, "")}
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "8.5px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800, marginBottom: "3px" }}>Slot</div>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: "#fff" }}>{selectedClassDetails.slot || "—"}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", borderRadius: "14px" }}>
                      <div style={{ fontSize: "8.5px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800, marginBottom: "3px" }}>Type</div>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: "#fff" }}>{selectedClassDetails.courseType || "Theory"}</div>
                    </div>
                  </div>

                  {/* Star / Important Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPremium) {
                        alert("Premium Feature: Flag important review classes, tests, or quizzes. Upgrade to Premium to unlock this feature!");
                        router.push('/premium');
                      } else {
                        setImportantSlots((prev: Record<string, boolean>) => ({
                          ...prev,
                          [slotKey]: !prev[slotKey]
                        }));
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "14px",
                      background: isImportant ? "rgba(255, 215, 0, 0.12)" : "rgba(255, 255, 255, 0.04)",
                      border: isImportant ? "1px solid rgba(255, 215, 0, 0.35)" : "1px solid rgba(255, 255, 255, 0.08)",
                      color: isImportant ? "#FFD700" : "rgba(255, 255, 255, 0.85)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    <Star size={14} fill={isImportant ? "#FFD700" : "none"} />
                    <span>{isImportant ? "Flagged as Important Class" : "Mark as Important Class"}</span>
                  </button>
                  
                  {/* Close button */}
                  <button 
                    type="button"
                    onClick={() => setSelectedClassDetails(null)}
                    style={{ 
                      width: "100%", 
                      padding: "13px", 
                      background: "rgba(255,255,255,0.06)", 
                      border: "1px solid rgba(255,255,255,0.12)", 
                      borderRadius: "14px", 
                      color: "#fff", 
                      fontSize: "13px", 
                      fontWeight: 900, 
                      cursor: "pointer" 
                    }}
                  >
                    Done
                  </button>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function fmtTimeOnly(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "p" : "a"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]}${suffix}`; }

