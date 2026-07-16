"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { toPng } from "html-to-image";
import { extractBatch } from "@/lib/utils";
import { Share2, Star } from "lucide-react";
// ── Helpers ───────────────────────────────────────────────────────────────────
function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }
function parseStart(t: string) { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEnd(t: string) { const parts = t.split(/\s*[-–]\s*/); const last = parts[parts.length - 1] || ""; const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseTimeRange(t: string): { start: string, end: string } {
  const parts = t.split(/[-–]/).map(s => s.trim());
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: t, end: t };
}

// Stable hash function to generate consistent timetables for mock friends
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function generateFriendTimetable(nameOrReg: string, myCourses: AnyValue[]) {
  const hash = hashCode(nameOrReg || "Akash");
  const days = [1, 2, 3, 4, 5].map(day => {
    const classes: ScheduleItem[] = [];
    const daySeed = hash + day;
    
    PERIODS.forEach((period, pIdx) => {
      const isClass = ((daySeed * (pIdx + 1)) % 10) > 4;
      if (isClass) {
        const courseIndex = (daySeed + pIdx) % Math.max(1, myCourses.length);
        const course = myCourses[courseIndex] || {
          courseTitle: "Professional Elective",
          courseCode: "18CS303T",
          courseType: "Theory",
          facultyName: "Dr. Rajesh Kumar",
          roomNo: "TP402"
        };
        
        classes.push({
          slot: `P${pIdx + 1}`,
          startTime: period.start,
          endTime: period.end,
          courseTitle: course.courseTitle || course.courseName || "Core Course",
          courseCode: course.courseCode || "18CS101T",
          courseType: course.courseType || "Theory",
          facultyName: course.facultyName || "TBA",
          roomNo: course.roomNo || "TBA"
        });
      }
    });
    
    return { day: `Day ${day}`, classes };
  });
  
  return days;
}



const PERIODS = [
  { id: 1, start: "08:00", end: "08:50" },
  { id: 2, start: "08:50", end: "09:40" },
  { id: 3, start: "09:45", end: "10:35" },
  { id: 4, start: "10:40", end: "11:30" },
  { id: 5, start: "11:35", end: "12:25" },
  { id: 6, start: "12:30", end: "13:20" },
  { id: 7, start: "13:25", end: "14:15" },
  { id: 8, start: "14:20", end: "15:10" },
  { id: 9, start: "15:10", end: "16:00" },
  { id: 10, start: "16:00", end: "16:50" },
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
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function buildSchedule(gridRows: AnyValue[], slotMap: Record<string, AnyValue>): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = gridRows.find((r: AnyValue) => r[0] === "FROM");
  const timeStrings: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = gridRows.filter((r: AnyValue) => typeof r[0] === "string" && r[0].startsWith("Day"));

  return dayRows.map((row: AnyValue) => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];
    const seenCourses = new Set<string>();

    const labCells: { idx: number; slot: string; course: AnyValue }[] = [];
    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      const up = s?.toUpperCase() || "";
      if (!s || !/^[PL]\d+/i.test(up)) return;
      const match = up.match(/^[PL]\d+/i);
      const slotCode = match ? match[0] : up;
      const course = slotMap[slotCode];
      if (course) labCells.push({ idx: ci, slot: slotCode, course });
    });

    const labGroups: { cells: { idx: number; slot: string; course: AnyValue }[] }[] = [];
    for (let i = 0; i < labCells.length; i++) {
      const cell = labCells[i];
      const prev = i > 0 ? labCells[i - 1] : null;
      const sameGroup = prev && prev.course.courseCode === cell.course.courseCode && prev.course.courseType === cell.course.courseType && cell.idx === prev.idx + 1;
      if (sameGroup) labGroups[labGroups.length - 1].cells.push(cell);
      else labGroups.push({ cells: [cell] });
    }

    labGroups.forEach(group => {
      const course = group.cells[0].course;
      const startRange = parseTimeRange(timeStrings[group.cells[0].idx] || "");
      const endRange = parseTimeRange(timeStrings[group.cells[group.cells.length - 1].idx] || "");
      classes.push({ slot: group.cells.map((c: AnyValue) => c.slot).join("-"), startTime: startRange.start, endTime: endRange.end, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo });
    });

    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      if (!s || s === "-") return;
      const up = s.toUpperCase();
      if (/^[PL]\d+/i.test(up)) return;
      const parts = up.split("/").map((p: string) => p.trim());
      for (const part of parts) {
        const letter = part.replace(/[^A-Z]/g, "");
        if (!letter || letter === "X") continue;
        const course = slotMap[letter];
        if (!course) continue;
        const key = `${course.courseCode}-theory-${ci}`;
        if (seenCourses.has(key)) continue;
        seenCourses.add(key);
        const { start, end } = parseTimeRange(timeStrings[ci] || "");
        classes.push({ slot: s, startTime: start, endTime: end, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo });
        break;
      }
    });

    // Helper for sorting
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

export default function TimetablePage() {
  const { 
    academicData, 
    profile, 
    timetable: cachedTimetable, 
    myTimetable: cachedMyTimetable, 
    calendar: cachedCalendar, 
    setTimetable, 
    setMyTimetable, 
    setCalendar,
    isPremium 
  } = useAuthStore();
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
    initialData: cachedCalendar ? cachedCalendar : undefined
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

  const autoSelected = useRef(false);
  useEffect(() => {
    if (calQ.data && !autoSelected.current) {
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const { byDate } = buildCalendarIndex(calQ.data);
      const info = byDate.get(todayIso);
      if (info?.dayOrder) {
        const d = info.dayOrder;
        if (d >= 1 && d <= 10) {
          setDayOverride(d);
          autoSelected.current = true;
        }
      }
    }
  }, [calQ.data]);

  const calendarIndex = useMemo(() => {
    if (!calQ.data) return null;
    return buildCalendarIndex(calQ.data);
  }, [calQ.data]);

  const todayInfo = useMemo(() => {
    if (!calendarIndex) return null;
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return calendarIndex.byDate.get(todayIso) || null;
  }, [calendarIndex]);

  const getNextOccurrence = useMemo(() => {
    return (dayOrderNum: number) => {
      if (!calendarIndex) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const occurrences: AnyValue[] = [];
      calendarIndex.byDate.forEach((info) => {
        if (info.dayOrder === dayOrderNum) {
          const parts = info.isoDate.split("-");
          const infoDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          infoDate.setHours(0, 0, 0, 0);
          if (infoDate >= today) {
            occurrences.push(info);
          }
        }
      });
      
      occurrences.sort((a, b) => {
        const aParts = a.isoDate.split("-");
        const bParts = b.isoDate.split("-");
        const aTime = new Date(parseInt(aParts[0]), parseInt(aParts[1]) - 1, parseInt(aParts[2])).getTime();
        const bTime = new Date(parseInt(bParts[0]), parseInt(bParts[1]) - 1, parseInt(bParts[2])).getTime();
        return aTime - bTime;
      });
      
      return occurrences[0] || null;
    };
  }, [calendarIndex]);


  const schedule = useMemo(() => {
    const courses = myTTQ.data?.data?.courses || myTTQ.data?.data || [];
    if (!ttQ.data?.data?.rows || courses.length === 0) return [];

    const slotMap = buildSlotToCourseMap(courses);
    const rawSchedule = buildSchedule(ttQ.data.data.rows, slotMap);
    
    return rawSchedule.map(day => {
      const merged: ScheduleItem[] = [];
      day.classes.forEach(cls => {
        const prev = merged[merged.length - 1];
        if (prev && prev.courseCode === cls.courseCode && prev.courseType === cls.courseType) {
          prev.endTime = cls.endTime;
          if (!prev.slot.includes(cls.slot)) prev.slot = `${prev.slot}, ${cls.slot}`;
        } else {
          merged.push({ ...cls });
        }
      });
      return { ...day, classes: merged };
    });
  }, [ttQ.data, myTTQ.data]);

  const classes = useMemo(() => {
    const targetRow = schedule.find(s => {
      const header = String(s.day || "");
      const dOrder = parseInt(header.match(/\d+/)?.[0] || "0");
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

function AuraTimetable({ 
  dayOverride, setDayOverride, batch, setBatch, classes, classesWithBreaks, 
  handleShare, sharing, shareRef, fullShareRef, fullSharing, handleFullShare, 
  schedule, studentInitials, onShowStudentInfo, setShowShareModal, todayInfo, 
  getNextOccurrence, isPremium, importantSlots, setImportantSlots,
  activeTab, setActiveTab, selectedFriend, setSelectedFriend, myCourses, generateFriendTimetable,
  syncedFriends, setSyncedFriends
}: AnyValue) {
  const router = useRouter();
  const currentMin = new Date().getHours() * 60 + new Date().getMinutes();
  const firstStart = classes[0] ? fmt12(classes[0].startTime) : "";
  const lastEnd = classes[classes.length - 1] ? fmt12(classes[classes.length - 1].endTime) : "";
  const totalClasses = classes.length;

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
      name: isReg ? `Friend (${trimmed})` : trimmed,
      regNo: trimmed.toUpperCase(),
      initials: trimmed.substring(0, 2).toUpperCase(),
      status: "pending"
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
    const targetRow = friendTimetable.find((s: AnyValue) => {
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

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100dvh", display: "flex", flexDirection: "column", color: "var(--text-main)", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(140px);
          opacity: 0.12; z-index: 0; pointer-events: none;
          animation: orbit 20s infinite linear;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translate(100px) rotate(0deg); }
          to { transform: rotate(360deg) translate(100px) rotate(-360deg); }
        }

        .liquid-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .timetable-main {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          overflow-x: clip;
          box-sizing: border-box;
        }

        .schedule-header,
        .schedule-header-copy,
        .schedule-header-actions,
        .schedule-view-switcher,
        .schedule-view-button,
        .day-overview-row,
        .day-overview-copy,
        .today-calendar-copy {
          min-width: 0;
          box-sizing: border-box;
        }

        .schedule-view-switcher {
          width: 100%;
        }

        .schedule-view-button {
          overflow: hidden;
        }

        .day-overview-time {
          font-size: clamp(24px, 7.4vw, 32px);
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .schedule-header {
            padding: 14px !important;
            gap: 10px;
          }

          .schedule-header-copy {
            flex: 1 1 auto;
          }

          .schedule-header-copy > div:last-child {
            font-size: 14px !important;
            white-space: nowrap;
          }

          .schedule-header-actions {
            flex: 0 1 auto;
            gap: 6px !important;
          }

          .schedule-export-button,
          .schedule-batch-button {
            padding: 8px 10px !important;
          }

          .schedule-profile-button {
            width: 38px !important;
            height: 38px !important;
            border-radius: 12px !important;
          }

          .schedule-view-switcher {
            max-width: none !important;
          }

          .schedule-view-button {
            padding: 10px 8px !important;
          }

          .schedule-premium-badge {
            padding-inline: 5px !important;
            flex-shrink: 0;
          }

          .day-overview-card {
            padding: 20px !important;
          }

          .day-overview-row {
            align-items: center !important;
            gap: 12px;
          }

          .day-overview-copy {
            flex: 1 1 auto;
          }

          .day-overview-count {
            width: 56px !important;
            height: 56px !important;
            border-radius: 18px !important;
            flex: 0 0 56px;
          }

          .today-calendar-copy {
            overflow-wrap: anywhere;
          }
        }

        @media (max-width: 370px) {
          .schedule-header {
            align-items: flex-start !important;
            flex-direction: column;
          }

          .schedule-header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .day-overview-time {
            font-size: 22px;
          }
        }
      `}} />

      {/* Animated Aura Blobs */}
      <div className="aura-blob" style={{ background: AURA.secondary, top: '-200px', right: '-100px' }} />
      <div className="aura-blob" style={{ background: AURA.accent, bottom: '-200px', left: '-100px', animationDelay: '-10s' }} />

      <main className="timetable-main" style={{ flex: 1, position: "relative", zIndex: 1, padding: "110px 20px 200px", color: "var(--text-main)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        {/* Header with Batch Selector */}
        <div className="schedule-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", marginTop: "28px", background: "rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
           <div className="schedule-header-copy">
              <div style={{ fontSize: "10px", color: AURA.primary, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>SEMESTER SCHEDULE</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>Day {dayOverride} — Batch {batch}</div>
           </div>
           <div className="schedule-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
             <button 
               className="schedule-export-button"
               onClick={() => setShowShareModal(true)} 
               style={{ 
                 background: AURA.secondary, 
                 border: "none", 
                 color: "#fff", 
                 padding: "8px 14px", 
                 borderRadius: "12px", 
                 fontSize: "11px", 
                 fontWeight: 800, 
                 cursor: "pointer", 
                 transition: "all 0.3s", 
                 boxShadow: `0 4px 15px ${AURA.secondary}44`,
                 display: "flex",
                 alignItems: "center",
                 gap: "6px"
               }}
             >
               <Share2 size={12} color="#fff" />
               Export
             </button>
             <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "14px", padding: "4px", border: "1px solid rgba(255,255,255,0.1)" }}>
               {[1, 2].map(b => (
                 <button className="schedule-batch-button" key={b} onClick={() => setBatch(b)}
                   style={{
                     padding: "8px 14px", borderRadius: "10px", border: "none", fontSize: "12px", fontWeight: 800,
                     background: batch === b ? AURA.accent : "transparent",
                     color: batch === b ? "#000" : "var(--text-muted)",
                     transition: "all 0.3s", cursor: "pointer",
                     boxShadow: batch === b ? `0 4px 15px ${AURA.accent}44` : "none"
                   }}>B{b}</button>
               ))}
             </div>
              <button
                className="schedule-profile-button"
               onClick={onShowStudentInfo}
               style={{
                 width: "40px", height: "40px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", color: "var(--text-main)",
                 border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                 fontWeight: 900, fontSize: "13px", cursor: "pointer", transition: "all 0.3s"
               }}
             >
               {studentInitials}
             </button>
           </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="schedule-view-switcher" style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "16px", padding: "4px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "32px", maxWidth: "340px" }}>
          <button 
            className="schedule-view-button"
            onClick={() => setActiveTab("schedule")}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: "12px", border: "none", fontSize: "12px", fontWeight: 800,
              background: activeTab === "schedule" ? "linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-purple) 100%)" : "transparent",
              color: activeTab === "schedule" ? "#fff" : "var(--text-muted)",
              transition: "all 0.3s ease", cursor: "pointer"
            }}
          >
            My Schedule
          </button>
          <button 
            className="schedule-view-button"
            onClick={() => setActiveTab("friends")}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: "12px", border: "none", fontSize: "12px", fontWeight: 800,
              background: activeTab === "friends" ? "linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-purple) 100%)" : "transparent",
              color: activeTab === "friends" ? "#fff" : "var(--text-muted)",
              transition: "all 0.3s ease", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}
          >
            Friends Sync
            <span className="schedule-premium-badge" style={{ fontSize: "8px", fontWeight: 900, background: "rgba(255,255,255,0.15)", color: "#fff", padding: "2px 6px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Premium</span>
          </button>
        </div>

        {/* Today's Context Banner */}
        {todayInfo ? (
          <div className="liquid-card" style={{ marginBottom: "32px", padding: "16px 20px", border: `1px solid ${AURA.border}`, background: "rgba(255, 255, 255, 0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "8px", height: "8px", borderRadius: "50%", 
                  background: todayInfo.isHoliday ? "#FF7597" : AURA.accent, 
                  boxShadow: `0 0 10px ${todayInfo.isHoliday ? "#FF7597" : AURA.accent}` 
                }} />
                 <div className="today-calendar-copy">
                   <span style={{ fontSize: "10px", color: "var(--text-soft)", fontWeight: 800, letterSpacing: "0.05em" }}>TODAY&apos;S CALENDAR</span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                    {formatDateNicely(todayInfo.isoDate)} — {todayInfo.isHoliday ? `Holiday (${todayInfo.event || "No classes"})` : `Day Order ${todayInfo.dayOrder}`}
                  </div>
                </div>
              </div>
              {todayInfo.dayOrder && dayOverride !== todayInfo.dayOrder && (
                <button 
                  onClick={() => setDayOverride(todayInfo.dayOrder)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: AURA.accent, padding: "6px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 800,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  View Today
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="liquid-card" style={{ marginBottom: "32px", padding: "16px 20px", border: `1px solid ${AURA.border}`, background: "rgba(255, 255, 255, 0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF7597", boxShadow: "0 0 10px #FF7597" }} />
              <div className="today-calendar-copy">
                <span style={{ fontSize: "10px", color: "var(--text-soft)", fontWeight: 800, letterSpacing: "0.05em" }}>TODAY&apos;S CALENDAR</span>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} — Weekend / Holiday (No classes)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" ? (
          <>
            {/* Day Overview Card */}
            {totalClasses > 0 && (
              <div className="liquid-card day-overview-card" style={{ marginBottom: "40px" }}>
                 <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: `radial-gradient(circle, ${AURA.accent}33 0%, transparent 70%)`, filter: "blur(40px)", zIndex: 0 }} />
                 <div className="day-overview-row" style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="day-overview-copy">
                      <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: AURA.accent, marginBottom: "8px" }}>Day Overview</div>
                      <div className="day-overview-time" style={{ fontWeight: 900, letterSpacing: "-1px" }}>
                        {firstStart} - {lastEnd}
                      </div>
                    </div>
                    <div className="day-overview-count" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", width: "60px", height: "60px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ fontSize: "24px", fontWeight: 900, color: AURA.accent, lineHeight: 1 }}>{totalClasses}</div>
                      <div style={{ fontSize: "9px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Classes</div>
                    </div>
                 </div>
              </div>
            )}

            {/* Timeline Classes */}
            {totalClasses === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "60px", fontSize: "14px", fontWeight: 600 }}>No classes scheduled for Day {dayOverride}.</div>
            ) : (
              <div style={{ position: "relative", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ position: "absolute", left: "0", top: "20px", bottom: "20px", width: "2px", background: "linear-gradient(to bottom, var(--card-border), transparent)" }} />
                
                {classesWithBreaks.map((item: AnyValue, i: number) => {
                  if (item.isBreak) {
                    return (
                      <div key={`break-${i}`} style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative", opacity: 0.7 }}>
                        <div style={{ position: "absolute", left: "-19px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--text-soft)", border: "2px solid var(--bg-root)" }} />
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "12px", alignItems: "center", flex: 1 }}>
                           <div style={{ fontSize: "10px", color: AURA.secondary, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Break</div>
                           <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{fmt12(item.startTime)} - {fmt12(item.endTime)}</div>
                        </div>
                      </div>
                    );
                  }

                  const isNso = item.courseCode.includes("NSO") || item.courseType.toLowerCase().includes("practical");
                  const cardColor = isNso ? AURA.primary : AURA.secondary;
                  const isActive = (currentMin >= parseStart(item.startTime) && currentMin <= parseEnd(item.endTime));
                  const slotKey = `${dayOverride}-${item.courseCode}-${item.startTime}`;
                  const isImportant = !!importantSlots[slotKey];

                  return (
                    <div key={i} style={{ position: "relative" }}>
                      <div style={{ 
                        position: "absolute", left: "-21px", top: "24px", width: "12px", height: "12px", borderRadius: "50%", 
                        background: isActive ? AURA.accent : (isImportant ? "#FFD700" : cardColor), border: "3px solid var(--bg-root)", zIndex: 2,
                        boxShadow: isActive ? `0 0 15px ${AURA.accent}` : (isImportant ? "0 0 10px rgba(255, 215, 0, 0.5)" : "none")
                      }} />
                      
                      <div 
                        className="liquid-card" 
                        style={{ 
                          padding: "20px", 
                          border: isActive 
                            ? `1px solid ${AURA.accent}55` 
                            : (isImportant 
                                ? "1px solid rgba(255, 215, 0, 0.4)" 
                                : "1px solid rgba(255, 255, 255, 0.08)"),
                          boxShadow: isImportant 
                            ? "0 0 15px rgba(255, 215, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.02)" 
                            : "none",
                          transition: "all 0.3s ease"
                        }}
                      >
                        {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${AURA.accent}, transparent)` }} />}
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                           <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 700, background: "rgba(0,0,0,0.3)", padding: "4px 10px", borderRadius: "8px" }}>
                             {fmt12(item.startTime)} — {fmt12(item.endTime)}
                           </div>
                           
                           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {isImportant && (
                                <span style={{ 
                                  fontSize: "9px", 
                                  color: "#FFD700", 
                                  textTransform: "uppercase", 
                                  fontWeight: 900, 
                                  background: "rgba(255, 215, 0, 0.1)", 
                                  padding: "4px 8px", 
                                  borderRadius: "8px",
                                  border: "1px solid rgba(255, 215, 0, 0.2)",
                                  letterSpacing: "0.05em"
                                }}>
                                  Important
                                </span>
                              )}
                              <button
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
                                  padding: "4px",
                                  color: isImportant ? "#FFD700" : "rgba(255,255,255,0.25)",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  outline: "none"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.2)";
                                  e.currentTarget.style.color = isImportant ? "#FFD700" : "rgba(255,255,255,0.6)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.color = isImportant ? "#FFD700" : "rgba(255,255,255,0.25)";
                                }}
                              >
                                <Star size={14} fill={isImportant ? "#FFD700" : "none"} />
                              </button>
                              {isNso && <div style={{ fontSize: "9px", color: AURA.primary, textTransform: "uppercase", fontWeight: 800, background: `${AURA.primary}22`, padding: "4px 8px", borderRadius: "8px" }}>Practical</div>}
                           </div>
                        </div>

                        <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--text-main)", lineHeight: 1.2, marginBottom: "8px", textTransform: "capitalize", letterSpacing: "-0.5px" }}>
                          {item.courseTitle.toLowerCase()}
                        </div>
                        
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "9px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800 }}>Course Code</span>
                            <span style={{ fontSize: "12px", color: cardColor, fontWeight: 700 }}>{item.courseCode}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "9px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800 }}>Room</span>
                            <span style={{ fontSize: "12px", color: "var(--text-main)", fontWeight: 700 }}>{item.roomNo || "TBA"}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "9px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800 }}>Faculty</span>
                            <span style={{ fontSize: "12px", color: "var(--text-main)", fontWeight: 700 }}>{(item.facultyName || "TBA").replace(/\s*\(\d+\)/, "")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Friends Selector Card */}
            <div className="liquid-card" style={{ padding: "24px", border: `1px solid ${AURA.border}` }}>
              <h3 style={{ fontSize: "16px", fontWeight: 900, color: "var(--text-main)", marginBottom: "4px" }}>Nexus Sync Engine</h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", fontWeight: 600 }}>Compare your schedule with classmates to find perfect times to meet, study, or grab lunch.</p>
              
              {/* Custom Search field */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input 
                  id="friend-search-input"
                  type="text" 
                  placeholder="Enter Friend's Name or Registration No..." 
                  style={{
                    flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px", padding: "12px 16px", fontSize: "13px", color: "#fff",
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
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px", padding: "0 16px", color: "#fff", fontSize: "13px",
                    fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  Add
                </button>
              </div>

              {/* Dynamic Quick Connect list */}
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-soft)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Synced Friends (Quick Connect)</div>
                {syncedFriends.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "16px", fontWeight: 600 }}>
                    No friends added yet. Enter a name or registration number above to send a sync request.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: "10px" }}>
                    {syncedFriends.map((friend: any) => (
                      <div
                        key={friend.regNo}
                        onClick={() => setSelectedFriend(friend)}
                        style={{
                          background: selectedFriend?.regNo === friend.regNo ? "rgba(148, 255, 216, 0.08)" : "rgba(255,255,255,0.02)",
                          border: selectedFriend?.regNo === friend.regNo ? `1.5px solid ${AURA.accent}` : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "16px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px",
                          textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                          position: "relative"
                        }}
                      >
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "10px",
                          background: selectedFriend?.regNo === friend.regNo ? AURA.accent : "rgba(255,255,255,0.05)",
                          color: selectedFriend?.regNo === friend.regNo ? "#000" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "10px", fontWeight: 900
                        }}>
                          {friend.initials}
                        </div>
                        <div style={{ minWidth: 0, flex: 1, paddingRight: "18px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {friend.name}
                          </div>
                          <div style={{ fontSize: "9px", color: friend.status === "pending" ? "#FF9500" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>
                            {friend.status === "pending" ? "⏳ Pending" : friend.regNo}
                          </div>
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFriend(friend.regNo);
                          }}
                          style={{
                            position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", color: "rgba(255,255,255,0.2)",
                            fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", outline: "none", padding: "4px"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#FF453A"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Friend Comparison Grid */}
            {selectedFriend ? (
              selectedFriend.status === "pending" ? (
                /* Pending Approval Screen */
                <div className="liquid-card" style={{ padding: "40px 24px", border: `1px solid ${AURA.border}`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: "rgba(255, 149, 0, 0.1)", color: "#FF9500",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", marginBottom: "8px"
                  }}>
                    ⏳
                  </div>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>Sync Request Pending</h4>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", maxWidth: "320px", margin: "0 auto", lineHeight: 1.5, fontWeight: 600 }}>
                      Sharing timetables requires mutual consent. We have sent a sync request to <strong>{selectedFriend.name}</strong> ({selectedFriend.regNo}).
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      onClick={() => handleApproveFriend(selectedFriend.regNo)}
                      style={{
                        background: "linear-gradient(135deg, #30d158 0%, #24b045 100%)",
                        color: "#fff", border: "none", borderRadius: "12px", padding: "8px 16px",
                        fontSize: "11px", fontWeight: 800, cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(48, 209, 88, 0.2)"
                      }}
                    >
                      Approve Request (Simulate Friend)
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(selectedFriend.regNo)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px", padding: "8px 16px",
                        fontSize: "11px", fontWeight: 800, cursor: "pointer"
                      }}
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected Friend Comparison Grid */
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Active Comparison Status Header */}
                  <div className="liquid-card" style={{ padding: "20px 24px", border: `1px solid ${AURA.border}`, background: "rgba(255, 255, 255, 0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: "10px", color: AURA.accent, fontWeight: 800, letterSpacing: "0.05em" }}>SYNCED COMPARISON</span>
                        <h4 style={{ fontSize: "18px", fontWeight: 900, color: "#fff", margin: "2px 0 0" }}>
                          You & {selectedFriend.name}
                        </h4>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 600 }}>
                          Found <strong style={{ color: "#34c759", fontWeight: 900 }}>{comparisonList.filter(c => c.bothFree).length}</strong> matching free slots on Day {dayOverride}.
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const firstFree = comparisonList.find(c => c.bothFree);
                          if (firstFree) {
                            alert(`Meetup requested with ${selectedFriend.name} on Day Order ${dayOverride}, Period ${firstFree.period} (${firstFree.time})!`);
                          } else {
                            alert(`Meetup requested with ${selectedFriend.name} for Day Order ${dayOverride}!`);
                          }
                        }}
                        style={{
                          background: `linear-gradient(135deg, ${AURA.secondary}ee, ${AURA.primary}ee)`,
                          color: "#fff", border: "none", borderRadius: "14px", padding: "10px 18px",
                          fontSize: "11px", fontWeight: 900, cursor: "pointer", textTransform: "uppercase",
                          letterSpacing: "0.05em", boxShadow: `0 4px 15px ${AURA.secondary}44`
                        }}
                      >
                        Schedule Meetup
                      </button>
                    </div>
                  </div>

                  {/* The Timeline Comparison List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {comparisonList.map((item, idx) => {
                      const statusColor = item.bothFree 
                        ? "rgba(52, 199, 89, 0.08)"
                        : (item.isMyFree || item.isFriendFree 
                            ? "rgba(255, 255, 255, 0.01)"
                            : "rgba(255, 45, 85, 0.03)");
                      
                      const borderColor = item.bothFree 
                        ? "rgba(52, 199, 89, 0.25)"
                        : (item.isMyFree || item.isFriendFree 
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(255, 45, 85, 0.12)");

                      return (
                        <div key={idx} style={{
                          background: statusColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: "20px",
                          padding: "16px 20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          boxShadow: item.bothFree ? "0 0 20px rgba(52, 199, 89, 0.03)" : "none",
                          position: "relative"
                        }}>
                          {item.bothFree && (
                            <div style={{
                              position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
                              background: "#34c759", borderRadius: "3px 0 0 3px"
                            }} />
                          )}
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase" }}>
                              Period {item.period} ({item.time})
                            </div>
                            {item.bothFree ? (
                              <span style={{
                                background: "#34c759", color: "#000", fontSize: "9px", fontWeight: 900,
                                padding: "3px 8px", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "0.05em"
                              }}>
                                Match! Both Free
                              </span>
                            ) : (
                              <span style={{
                                background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: "9px", fontWeight: 850,
                                padding: "3px 8px", borderRadius: "8px", textTransform: "uppercase"
                              }}>
                                {item.isMyFree ? `${selectedFriend.name} Busy` : item.isFriendFree ? "You Busy" : "Both Busy"}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "8px" }}>
                            <div>
                              <div style={{ fontSize: "8px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800 }}>Your Schedule</div>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: item.isMyFree ? "#34c759" : "var(--text-main)", textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.myStatus.toLowerCase()}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "8px", color: "var(--text-soft)", textTransform: "uppercase", fontWeight: 800 }}>{selectedFriend.name}&apos;s Schedule</div>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: item.isFriendFree ? "#34c759" : "var(--text-main)", textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.friendStatus.toLowerCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div className="liquid-card" style={{ padding: "40px 24px", border: `1px solid ${AURA.border}`, textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>
                  Select a friend from Synced Friends or type their registration number above to begin.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Hidden Share Card */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
           <div ref={shareRef} style={{ width: "450px", background: AURA.bg, padding: "40px", position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <div style={{ position: "absolute", right: "-50px", top: "-50px", width: "200px", height: "200px", background: AURA.secondary, filter: "blur(120px)", opacity: 0.2 }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                 <div>
                    <div style={{ fontSize: "10px", color: AURA.primary, fontWeight: 900, letterSpacing: "0.2em", marginBottom: "4px" }}>SRM NEXUS</div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>Day {dayOverride} Schedule</div>
                 </div>
                 <div style={{ fontSize: "28px", fontWeight: 900, color: AURA.accent }}>DO {dayOverride}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                 {classesWithBreaks.map((item: AnyValue, i: number) => {
                    if (item.isBreak) return null;
                    return (
                       <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <div style={{ width: "80px", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.6)", textAlign: "right" }}>{fmt12(item.startTime)}</div>
                          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px 16px" }}>
                             <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff", marginBottom: "4px", textTransform: "capitalize" }}>{item.courseTitle.toLowerCase()}</div>
                             <div style={{ fontSize: "10px", color: AURA.secondary, fontWeight: 700 }}>{item.roomNo || "TBA"} • {item.courseCode}</div>
                          </div>
                       </div>
                    );
                 })}
              </div>

              <div style={{ marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>GENERATED VIA SRMNEXUS.APP</div>
              </div>
           </div>
        </div>

        {/* Hidden Full Share Card */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
           <div ref={fullShareRef} style={{ width: "1200px", background: AURA.bg, padding: "60px", position: "relative", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px" }}>
                 <div>
                    <div style={{ fontSize: "14px", color: AURA.accent, fontWeight: 900, letterSpacing: "0.2em", marginBottom: "8px" }}>SRM NEXUS PORTAL</div>
                    <div style={{ fontSize: "42px", fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>Semester Timetable</div>
                 </div>
                 <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: AURA.secondary }}>BATCH {batch}</div>
                 </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
                 {[1, 2, 3, 4, 5].map(d => (
                    <div key={d} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                       <div style={{ fontSize: "14px", color: AURA.primary, fontWeight: 900, marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>Day Order {d}</div>
                       <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(schedule[d - 1]?.classes || []).map((cls: AnyValue, i: number) => (
                             <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: "11px", fontWeight: 900, color: "#fff", marginBottom: "4px", textTransform: "capitalize" }}>{cls.courseTitle.toLowerCase()}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                                  <span>{fmt12(cls.startTime)}</span>
                                  <span>{cls.roomNo || "TBA"}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      {/* Day Switcher Bottom Overlay */}
      <div style={{ position: "fixed", bottom: "110px", left: "20px", right: "20px", display: "flex", justifyContent: "center", zIndex: 100 }}>
         <div style={{ background: "rgba(10,10,15,0.8)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "8px", display: "flex", gap: "8px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            {[1, 2, 3, 4, 5].map(d => {
              const occ = getNextOccurrence(d);
              let label = "";
              if (occ) {
                const today = new Date();
                const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                label = occ.isoDate === todayIso ? "Today" : formatDateNicelyShort(occ.isoDate);
              } else {
                label = "N/A";
              }
              const isSelected = dayOverride === d;
              return (
                <button key={d} onClick={() => setDayOverride(d)} style={{
                  padding: "6px 12px", minWidth: "64px", height: "54px", borderRadius: "16px", border: "none",
                  background: isSelected ? `linear-gradient(135deg, ${AURA.secondary}ee, ${AURA.primary}ee)` : "transparent",
                  color: isSelected ? "#fff" : "var(--text-muted)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: isSelected ? `0 8px 24px ${AURA.secondary}44, inset 0 1px 1px rgba(255,255,255,0.2)` : "none",
                  transform: isSelected ? "scale(1.05)" : "scale(1)"
                }}>
                  <div style={{ fontSize: "14px", fontWeight: 900, lineHeight: 1.1 }}>D{d}</div>
                  <div style={{ fontSize: "9px", fontWeight: 700, opacity: isSelected ? 0.9 : 0.6, marginTop: "2px", letterSpacing: "0.02em" }}>{label}</div>
                </button>
              );
            })}
         </div>
      </div>
    </div>
  );
}


function fmtTimeOnly(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "p" : "a"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]}${suffix}`; }

