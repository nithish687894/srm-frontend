"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { toPng } from "html-to-image";
import { extractBatch } from "@/lib/utils";
import { Share2 } from "lucide-react";
// ── Helpers ───────────────────────────────────────────────────────────────────
function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }
function parseStart(t: string) { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEnd(t: string) { const parts = t.split(/\s*[-–]\s*/); const last = parts[parts.length - 1] || ""; const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseTimeRange(t: string): { start: string, end: string } {
  const parts = t.split(/[-–]/).map(s => s.trim());
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: t, end: t };
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
  const { academicData, profile } = useAuthStore();
  const { theme } = useThemeStore();
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

  const calQ = useQuery({ queryKey: ["calendar"], queryFn: () => dataAPI.getCalendar(), staleTime: 600000 });
  const myTTQ = useQuery({ queryKey: ["myTT"], queryFn: () => dataAPI.getMyTimetable(), staleTime: 600000, initialData: academicData?.timetable ? { data: academicData.timetable } : undefined });
  const ttQ = useQuery({
    queryKey: ["tt", batch], 
    queryFn: () => dataAPI.getTimetable(batch),
    staleTime: 600000,
    initialData: academicData?.timetableBatch && academicData?.timetableBatch === batch ? { data: { rows: academicData.timetableRows } } : undefined
  });

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
    
    const isMatrix = theme === "matrix";
    const isAura = theme === "aura";
    
    const colors = {
      bg: isMatrix ? "#0a0a0c" : isAura ? "#0f0a15" : "var(--bg-surface)",
      border: isMatrix ? "rgba(168,194,0,0.2)" : isAura ? "rgba(255,255,255,0.08)" : "var(--border)",
      textPrimary: "#fff",
      textMuted: isMatrix ? "#888" : isAura ? "rgba(255,255,255,0.6)" : "var(--text-muted)",
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

  if (theme === "cosmos") return (
    <>
      <CosmosTimetable dayOverride={dayOverride} setDayOverride={setDayOverride} batch={batch} setBatch={setBatch} classes={classes} handleShare={handleShare} sharing={sharing} shareRef={shareRef} fullShareRef={fullShareRef} fullSharing={fullSharing} handleFullShare={handleFullShare} schedule={schedule} studentInitials={studentInitials} onShowStudentInfo={() => setShowStudentInfo(true)} setShowShareModal={setShowShareModal} todayInfo={todayInfo} getNextOccurrence={getNextOccurrence} />
      {renderStudentInfoModal()}
      {renderShareModal()}
    </>
  );

  if (theme === "matrix") return (
    <>
      <MatrixTimetable dayOverride={dayOverride} setDayOverride={setDayOverride} batch={batch} setBatch={setBatch} classes={classes} handleShare={handleShare} sharing={sharing} shareRef={shareRef} fullShareRef={fullShareRef} fullSharing={fullSharing} handleFullShare={handleFullShare} schedule={schedule} studentInitials={studentInitials} onShowStudentInfo={() => setShowStudentInfo(true)} setShowShareModal={setShowShareModal} todayInfo={todayInfo} getNextOccurrence={getNextOccurrence} />
      {renderStudentInfoModal()}
      {renderShareModal()}
    </>
  );

  return (
    <>
      <AuraTimetable dayOverride={dayOverride} setDayOverride={setDayOverride} batch={batch} setBatch={setBatch} classes={classes} classesWithBreaks={classesWithBreaks} handleShare={handleShare} sharing={sharing} shareRef={shareRef} fullShareRef={fullShareRef} fullSharing={fullSharing} handleFullShare={handleFullShare} schedule={schedule} studentInitials={studentInitials} onShowStudentInfo={() => setShowStudentInfo(true)} setShowShareModal={setShowShareModal} todayInfo={todayInfo} getNextOccurrence={getNextOccurrence} />
      {renderStudentInfoModal()}
      {renderShareModal()}
    </>
  );

}

function AuraTimetable({ dayOverride, setDayOverride, batch, setBatch, classes, classesWithBreaks, handleShare, sharing, shareRef, fullShareRef, fullSharing, handleFullShare, schedule, studentInitials, onShowStudentInfo, setShowShareModal, todayInfo, getNextOccurrence }: AnyValue) {
  const currentMin = new Date().getHours() * 60 + new Date().getMinutes();
  const firstStart = classes[0] ? fmt12(classes[0].startTime) : "";
  const lastEnd = classes[classes.length - 1] ? fmt12(classes[classes.length - 1].endTime) : "";
  const totalClasses = classes.length;

  const AURA = {
    bg: "#050508",
    primary: "#FF75C3",
    secondary: "#8F92FF",
    accent: "#94FFD8",
    card: "rgba(255, 255, 255, 0.02)",
    border: "rgba(255, 255, 255, 0.08)",
  };

  return (
    <div style={{ background: AURA.bg, minHeight: "100vh", display: "flex", flexDirection: "column", color: "#ffffff", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      <Sidebar />
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
      `}} />

      {/* Animated Aura Blobs */}
      <div className="aura-blob" style={{ background: AURA.secondary, top: '-200px', right: '-100px' }} />
      <div className="aura-blob" style={{ background: AURA.accent, bottom: '-200px', left: '-100px', animationDelay: '-10s' }} />

      <main style={{ flex: 1, position: "relative", zIndex: 1, padding: "110px 20px 200px", color: "#ffffff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        {/* Header with Batch Selector */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", marginTop: "28px", background: "rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
           <div>
              <div style={{ fontSize: "10px", color: AURA.primary, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>SEMESTER SCHEDULE</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>Day {dayOverride} — Batch {batch}</div>
           </div>
           <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
             <button 
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
                 <button key={b} onClick={() => setBatch(b)}
                   style={{
                     padding: "8px 14px", borderRadius: "10px", border: "none", fontSize: "12px", fontWeight: 800,
                     background: batch === b ? AURA.accent : "transparent",
                     color: batch === b ? "#000" : "rgba(255,255,255,0.5)",
                     transition: "all 0.3s", cursor: "pointer",
                     boxShadow: batch === b ? `0 4px 15px ${AURA.accent}44` : "none"
                   }}>B{b}</button>
               ))}
             </div>
             <button 
               onClick={onShowStudentInfo}
               style={{
                 width: "40px", height: "40px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", color: "#fff",
                 border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                 fontWeight: 900, fontSize: "13px", cursor: "pointer", transition: "all 0.3s"
               }}
             >
               {studentInitials}
             </button>
           </div>
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
                <div>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: "0.05em" }}>TODAY&apos;S CALENDAR</span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
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
              <div>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: "0.05em" }}>TODAY&apos;S CALENDAR</span>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} — Weekend / Holiday (No classes)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Overview Card */}
        {totalClasses > 0 && (
          <div className="liquid-card" style={{ marginBottom: "40px" }}>
             <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: `radial-gradient(circle, ${AURA.accent}33 0%, transparent 70%)`, filter: "blur(40px)", zIndex: 0 }} />
             <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: AURA.accent, marginBottom: "8px" }}>Day Overview</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-1px" }}>
                    {firstStart} - {lastEnd}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", width: "60px", height: "60px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: AURA.accent, lineHeight: 1 }}>{totalClasses}</div>
                  <div style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Classes</div>
                </div>
             </div>
          </div>
        )}

        {/* Timeline Classes */}
        {totalClasses === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginTop: "60px", fontSize: "14px", fontWeight: 600 }}>No classes scheduled for Day {dayOverride}.</div>
        ) : (
          <div style={{ position: "relative", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ position: "absolute", left: "0", top: "20px", bottom: "20px", width: "2px", background: "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.02))" }} />
            
            {classesWithBreaks.map((item: AnyValue, i: number) => {
              if (item.isBreak) {
                return (
                  <div key={`break-${i}`} style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative", opacity: 0.7 }}>
                    <div style={{ position: "absolute", left: "-19px", width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid #050508" }} />
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "12px", alignItems: "center", flex: 1 }}>
                       <div style={{ fontSize: "10px", color: AURA.secondary, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Break</div>
                       <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{fmt12(item.startTime)} - {fmt12(item.endTime)}</div>
                    </div>
                  </div>
                );
              }

              const isNso = item.courseCode.includes("NSO") || item.courseType.toLowerCase().includes("practical");
              const cardColor = isNso ? AURA.primary : AURA.secondary;
              const isActive = (currentMin >= parseStart(item.startTime) && currentMin <= parseEnd(item.endTime));

              return (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ 
                    position: "absolute", left: "-21px", top: "24px", width: "12px", height: "12px", borderRadius: "50%", 
                    background: isActive ? AURA.accent : cardColor, border: "3px solid #050508", zIndex: 2,
                    boxShadow: isActive ? `0 0 15px ${AURA.accent}` : "none"
                  }} />
                  
                  <div className="liquid-card" style={{ padding: "20px", border: isActive ? `1px solid ${AURA.accent}55` : "1px solid rgba(255, 255, 255, 0.08)" }}>
                    {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${AURA.accent}, transparent)` }} />}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                       <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 700, background: "rgba(0,0,0,0.3)", padding: "4px 10px", borderRadius: "8px" }}>
                         {fmt12(item.startTime)} — {fmt12(item.endTime)}
                       </div>
                       {isNso && <div style={{ fontSize: "9px", color: AURA.primary, textTransform: "uppercase", fontWeight: 800, background: `${AURA.primary}22`, padding: "4px 8px", borderRadius: "8px" }}>Practical</div>}
                    </div>

                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff", lineHeight: 1.2, marginBottom: "8px", textTransform: "capitalize", letterSpacing: "-0.5px" }}>
                      {item.courseTitle.toLowerCase()}
                    </div>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800 }}>Course Code</span>
                        <span style={{ fontSize: "12px", color: cardColor, fontWeight: 700 }}>{item.courseCode}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800 }}>Room</span>
                        <span style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>{item.roomNo || "TBA"}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800 }}>Faculty</span>
                        <span style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>{(item.facultyName || "TBA").replace(/\s*\(\d+\)/, "")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
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

function MatrixTimetable({ dayOverride, setDayOverride, batch, setBatch, classes, handleShare, sharing, shareRef, fullShareRef, fullSharing, handleFullShare, schedule, studentInitials, onShowStudentInfo, setShowShareModal, todayInfo, getNextOccurrence }: AnyValue) {
  const currentMin = new Date().getHours() * 60 + new Date().getMinutes();
  const firstStart = classes[0] ? fmtTimeOnly(classes[0].startTime) : "";
  const lastEnd = classes[classes.length - 1] ? fmtTimeOnly(classes[classes.length - 1].endTime) : "";

  return (
    <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "160px", color: "#ffffff", fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      <Sidebar />
      <style dangerouslySetInnerHTML={{ __html: `
        
        .card-matrix {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media(hover: hover) {
          .card-matrix:hover {
            border-color: rgba(168, 194, 0, 0.25) !important;
            box-shadow: inset 0 0 25px rgba(168, 194, 0, 0.05), 0 15px 35px rgba(0,0,0,0.5) !important;
            transform: translateY(-2px);
          }
        }
        .btn-matrix {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-matrix:active {
          transform: scale(0.92);
        }
      `}} />

      {/* Gigantic Structure Backdrop Watermark */}
      <div style={{
        position: 'absolute', right: '-120px', top: '150px',
        fontSize: '120px', fontWeight: 900, color: 'rgba(255,255,255,0.02)',
        fontFamily: "'Plus Jakarta Sans', sans-serif", pointerEvents: 'none',
        userSelect: 'none', zIndex: 0, letterSpacing: '-0.05em'
      }}>
        PLANNER
      </div>

      <main style={{ padding: "110px 24px 160px", position: 'relative', zIndex: 1 }}>
        
        {/* Header with Batch Selector */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", marginTop: "28px", background: "rgba(255,255,255,0.02)", padding: "16px 20px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
           <div>
              <div style={{ fontSize: "9px", color: "#a8c200", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 900 }}>SEMESTER SCHEDULE</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: '#fff', marginTop: '2px' }}>Planner • Batch {batch}</div>
           </div>
           <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
             <button 
              onClick={() => setShowShareModal(true)}
              className="btn-matrix"
              style={{ 
                background: "#a8c200", 
                border: "none", 
                color: "#000", 
                padding: "8px 14px", 
                borderRadius: "12px", 
                fontSize: "11px", 
                fontWeight: 900, 
                cursor: "pointer", 
                boxShadow: "0 4px 15px rgba(168,194,0,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
             >
               <Share2 size={12} color="#000" />
               Export
             </button>
             <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "14px", padding: "4px", border: "1px solid rgba(255,255,255,0.08)" }}>
              {[1, 2].map(b => (
                <button key={b} onClick={() => setBatch(b)}
                  style={{
                    padding: "8px 14px", borderRadius: "10px", border: "none", fontSize: "11px", fontWeight: 800,
                    background: batch === b ? "#a8c200" : "transparent",
                    color: batch === b ? "#000" : "rgba(255,255,255,0.5)",
                    transition: "all 0.2s", cursor: "pointer"
                  }}>B{b}</button>
              ))}
            </div>
            <button 
              onClick={onShowStudentInfo}
              className="btn-matrix"
              style={{
                width: "40px", height: "40px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "13px", cursor: "pointer"
              }}
            >
              {studentInitials}
            </button>
           </div>
        </div>

        {/* Day Order Big Number */}
        <div style={{ textAlign: "center", marginBottom: "24px", position: "relative" }}>
          <div style={{ fontSize: "9px", color: "#a8c200", textTransform: "uppercase", letterSpacing: "0.25em", fontWeight: 900, marginBottom: "4px" }}>DAY ORDER</div>
          <div style={{ fontSize: "120px", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.06em", color: "#ffffff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{dayOverride}</div>
        </div>

        {/* Today's Context Banner for Matrix */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "36px" }}>
          {todayInfo ? (
            <div style={{
              background: "rgba(168,194,0,0.02)",
              border: "1px solid rgba(168,194,0,0.2)",
              borderRadius: "16px",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              maxWidth: "500px",
              width: "100%",
              justifyContent: "space-between",
              boxShadow: "inset 0 0 15px rgba(168,194,0,0.03)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ 
                  width: "6px", height: "6px", borderRadius: "50%", 
                  background: todayInfo.isHoliday ? "#ff3366" : "#a8c200", 
                  boxShadow: `0 0 8px ${todayInfo.isHoliday ? "#ff3366" : "#a8c200"}` 
                }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "8px", color: "#888", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>CALENDAR STATUS</div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                    {formatDateNicely(todayInfo.isoDate)} — {todayInfo.isHoliday ? `Holiday (${todayInfo.event || "No classes"})` : `Day Order ${todayInfo.dayOrder}`}
                  </div>
                </div>
              </div>
              {todayInfo.dayOrder && dayOverride !== todayInfo.dayOrder && (
                <button 
                  onClick={() => setDayOverride(todayInfo.dayOrder)}
                  className="btn-matrix"
                  style={{
                    background: "rgba(168,194,0,0.1)", border: "1px solid rgba(168,194,0,0.3)",
                    color: "#a8c200", padding: "6px 12px", borderRadius: "10px", fontSize: "10px", fontWeight: 900,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  GOTO TODAY
                </button>
              )}
            </div>
          ) : (
            <div style={{
              background: "rgba(255,51,102,0.02)",
              border: "1px solid rgba(255,51,102,0.2)",
              borderRadius: "16px",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "inset 0 0 15px rgba(255,51,102,0.03)"
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff3366", boxShadow: "0 0 8px #ff3366" }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "8px", color: "#888", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>CALENDAR STATUS</div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} — Weekend / Academic Holiday
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Day Overview Card */}
        {classes.length > 0 && (
          <div style={{ 
            background: "#1c1c1c", 
            border: '1px solid rgba(168,194,0,0.2)', 
            borderRadius: "28px", 
            padding: "24px 28px", 
            marginBottom: "40px", 
            boxShadow: 'inset 0 0 25px rgba(168,194,0,0.05), 0 10px 30px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#a8c200" }}>LECTURE SESSION TIMING</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168,194,0,0.1)', border: '1px solid rgba(168,194,0,0.2)', color: '#a8c200', fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderRadius: '8px' }}>
                  {classes.length} PERIODS
                </div>
             </div>
             <div style={{ fontSize: "32px", fontWeight: 900, color: '#fff', letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {firstStart} - {lastEnd}
             </div>
          </div>
        )}

        {/* Timeline Classes */}
        <div style={{ position: "relative", paddingLeft: "12px" }}>
           {/* Timeline Line */}
           <div style={{ position: "absolute", left: "0", top: "10px", bottom: "10px", width: "2px", background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))", borderRadius: '2px' }} />

           <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
               {PERIODS.map((p, pi) => {
                 const pStart = parseStart(p.start);
                 const pEnd = parseEnd(p.end);
                 const cls = classes.find((c: AnyValue) => {
                   const cs = parseStart(c.startTime);
                   const ce = parseEnd(c.endTime);
                   return cs < pEnd && ce > pStart;
                 });
                 
                 const isActive = cls ? (currentMin >= parseStart(cls.startTime) && currentMin <= parseEnd(cls.endTime)) : (currentMin >= pStart && currentMin < pEnd);

                 return (
                   <div key={pi} style={{ position: "relative", paddingLeft: "32px" }}>
                     {/* Period Label */}
                     <div style={{ 
                       position: "absolute", left: "-6px", top: "50%", transform: "translateY(-50%)", 
                       width: "14px", height: "14px", borderRadius: "50%", 
                       background: isActive ? "#a8c200" : "#222", 
                       border: "3px solid #000", zIndex: 5,
                       boxShadow: isActive ? "0 0 15px #a8c200, 0 0 5px #fff" : "none"
                     }} />
                     
                     <div style={{ 
                       position: "absolute", left: "-32px", top: "50%", transform: "translateY(-50%)", 
                       fontSize: "11px", fontWeight: 900, color: isActive ? "#a8c200" : "#444",
                       width: "24px", textAlign: "right", fontFamily: "'Plus Jakarta Sans', sans-serif"
                     }}>
                       {p.id}
                     </div>

                     {!cls ? (
                       <div style={{ padding: "20px 0" }}>
                         <div style={{ 
                           height: "2px", width: "100%", borderTop: "2.5px dashed #333", 
                           opacity: isActive ? 1 : 0.35, borderColor: isActive ? "#a8c200" : "#333" 
                         }} />
                       </div>
                     ) : (
                       <div
                         className="card-matrix"
                         style={{ 
                          background: "#1c1c1c", 
                          borderRadius: "20px", 
                          padding: "18px 20px", 
                          border: isActive ? "1.5px solid rgba(168,194,0,0.4)" : "1.5px solid #333",
                          boxShadow: isActive ? "inset 0 0 20px rgba(168,194,0,0.05), 0 8px 30px rgba(0,0,0,0.4)" : "none",
                          position: 'relative', overflow: 'hidden'
                        }}>
                          {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #a8c200, transparent)" }} />}
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                             <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isActive ? "#a8c200" : "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 800 }}>
                                <span style={{ fontSize: "12px" }}>⏱</span> {p.start} — {p.end}
                             </div>
                             <div style={{ fontSize: "8.5px", fontWeight: 900, color: isActive ? "#a8c200" : "#666", textTransform: "uppercase", letterSpacing: "0.1em", background: isActive ? 'rgba(168,194,0,0.1)' : 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '6px' }}>
                                Period {p.id}
                             </div>
                          </div>
                          
                          <div style={{ fontSize: "18px", fontWeight: 900, lineHeight: 1.3, marginBottom: "12px", textTransform: "capitalize", letterSpacing: "-0.01em", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                             {cls.courseTitle.toLowerCase()}
                          </div>

                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                             <div style={{ background: "rgba(255,255,255,0.02)", border: '1px solid #2b2b2b', padding: "4px 10px", borderRadius: "8px", fontSize: "10px", color: "#888", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                               {cls.courseCode}
                             </div>
                             <div style={{ background: "rgba(255,255,255,0.02)", border: '1px solid #2b2b2b', padding: "4px 10px", borderRadius: "8px", fontSize: "10px", color: "#fff", fontWeight: 700 }}>
                               📍 {cls.roomNo || "TBA"}
                             </div>
                             <div style={{ background: "rgba(255,255,255,0.02)", border: '1px solid #2b2b2b', padding: "4px 10px", borderRadius: "8px", fontSize: "10px", color: "#fff", fontWeight: 700 }}>
                               👤 {(cls.facultyName || "TBA").split(" ")[0]}
                             </div>
                          </div>
                       </div>
                     )}
                   </div>
                 );
               })}
           </div>
        </div>

        {/* Hidden Share Card */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
           <div ref={shareRef} style={{ width: "450px", background: "#050505", padding: "40px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-50px", top: "-50px", width: "200px", height: "200px", background: "#a8c200", filter: "blur(120px)", opacity: 0.15 }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                 <div>
                    <div style={{ fontSize: "10px", color: "#a8c200", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "4px" }}>SRM NEXUS • SRMNEXUS.APP</div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff" }}>Day {dayOverride} Schedule</div>
                 </div>
                 <div style={{ fontSize: "28px", fontWeight: 900, color: "#a8c200" }}>DO {dayOverride}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                 {PERIODS.map((p, pi) => {
                    const pStart = parseStart(p.start);
                    const pEnd = parseEnd(p.end);
                    const cls = classes.find((c: AnyValue) => {
                      const cs = parseStart(c.startTime);
                      const ce = parseEnd(c.endTime);
                      return cs < pEnd && ce > pStart;
                    });

                    return (
                       <div key={pi} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <div style={{ width: "20px", fontSize: "10px", fontWeight: 900, color: "#444", textAlign: "right" }}>{p.id}</div>
                          {!cls ? (
                             <div style={{ flex: 1, height: "1px", borderTop: "2px dashed #222" }} />
                          ) : (
                             <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "10px 14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                   <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>{cls.courseTitle}</div>
                                   <div style={{ fontSize: "9px", color: "#666", fontWeight: 800 }}>{p.start}</div>
                                </div>
                                <div style={{ fontSize: "10px", color: "#888", fontWeight: 700 }}>{cls.roomNo || "TBA"} • {cls.courseCode}</div>
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>

              <div style={{ marginTop: "40px", borderTop: "1px solid #111", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div style={{ fontSize: "10px", color: "#444", fontWeight: 700 }}>GENERATED VIA SRMNEXUS.APP</div>
                 <div style={{ fontSize: "10px", color: "#444", fontWeight: 700 }}>© 2026 NEXUS CORE</div>
              </div>
           </div>
        </div>

        {/* Hidden Full Schedule Card */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
           <div ref={fullShareRef} style={{ width: "1200px", background: "#050505", padding: "60px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px" }}>
                 <div>
                    <div style={{ fontSize: "14px", color: "#a8c200", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "8px" }}>SRM NEXUS PORTAL</div>
                    <div style={{ fontSize: "42px", fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>Complete Semester Timetable</div>
                 </div>
                 <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#a8c200" }}>BATCH {batch}</div>
                    <div style={{ fontSize: "12px", color: "#666", fontWeight: 700 }}>Secure access via srmnexus.app</div>
                 </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
                 {[1, 2, 3, 4, 5].map(d => (
                    <div key={d} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                       <div style={{ fontSize: "12px", color: "#a8c200", fontWeight: 900, marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>Day Order {d}</div>
                       <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {PERIODS.map((p, pi) => {
                             const pStart = parseStart(p.start);
                             const pEnd = parseEnd(p.end);
                             const dayClasses = schedule[d - 1]?.classes || [];
                             const cls = dayClasses.find((c: AnyValue) => {
                               const cs = parseStart(c.startTime);
                               const ce = parseEnd(c.endTime);
                               return cs < pEnd && ce > pStart;
                             });

                             return (
                                <div key={pi} style={{ display: "flex", gap: "10px", alignItems: "center", minHeight: "40px" }}>
                                   <div style={{ width: "12px", fontSize: "9px", fontWeight: 900, color: "#444" }}>{p.id}</div>
                                   {!cls ? (
                                      <div style={{ flex: 1, height: "1px", borderTop: "1.5px dashed #222" }} />
                                   ) : (
                                      <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                         <div style={{ fontSize: "10px", fontWeight: 900, color: "#ddd", lineHeight: 1.1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textTransform: "capitalize" }}>{cls.courseTitle.toLowerCase()}</div>
                                         <div style={{ fontSize: "8px", color: "#666", fontWeight: 700 }}>{cls.roomNo || "TBA"}</div>
                                      </div>
                                   )}
                                </div>
                             );
                          })}
                       </div>
                    </div>
                 ))}
              </div>

              <div style={{ marginTop: "60px", borderTop: "1px solid #111", paddingTop: "32px", textAlign: "center" }}>
                 <div style={{ fontSize: "12px", color: "#333", fontWeight: 800, letterSpacing: "0.1em" }}>GENERATED EXCLUSIVELY AT SRMNEXUS.APP • THE NEXT GENERATION STUDENT EXPERIENCE</div>
              </div>
           </div>
        </div>

        {/* Day Switcher Bottom Overlay */}
        <div style={{ position: "fixed", bottom: "110px", left: "20px", right: "20px", display: "flex", justifyContent: "center", zIndex: 100 }}>
           <div style={{ background: "rgba(10,10,12,0.85)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "8px", display: "flex", gap: "8px", border: "1px solid #333", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              {[1, 2, 3, 4, 5].map(d => {
                const occ = getNextOccurrence(d);
                let label = "";
                if (occ) {
                  const today = new Date();
                  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  label = occ.isoDate === todayIso ? "TODAY" : formatDateNicelyShort(occ.isoDate).toUpperCase();
                } else {
                  label = "N/A";
                }
                const isSelected = dayOverride === d;
                return (
                  <button 
                    key={d} 
                    onClick={() => setDayOverride(d)} 
                    className="btn-matrix"
                    style={{
                      padding: "6px 12px", minWidth: "64px", height: "54px", borderRadius: "16px", border: "none",
                      background: isSelected ? "#a8c200" : "transparent",
                      color: isSelected ? "#000" : "rgba(255,255,255,0.5)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 0.2s",
                      boxShadow: isSelected ? "0 4px 15px rgba(168,194,0,0.3)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: 900, lineHeight: 1.1 }}>D{d}</span>
                    <span style={{ fontSize: "8.5px", fontWeight: 800, opacity: isSelected ? 0.9 : 0.5, marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
                  </button>
                );
              })}
           </div>
        </div>
      </main>
    </div>
  );
}

function CosmosTimetable({ dayOverride, setDayOverride, batch, setBatch, classes, handleShare, sharing, shareRef, fullShareRef, fullSharing, handleFullShare, schedule, studentInitials, onShowStudentInfo, setShowShareModal, todayInfo, getNextOccurrence }: AnyValue) {
  const currentMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div style={{ background: "transparent", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FFFFFF" }}>
      <Sidebar />
      <main style={{ padding: "100px 16px 100px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>Timetable</h1>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Batch: {batch}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button 
              onClick={() => setShowShareModal(true)} 
              style={{ 
                background: "var(--accent)", 
                border: "none", 
                color: "#fff", 
                padding: "8px 14px", 
                borderRadius: "12px", 
                fontSize: "11px", 
                fontWeight: 800, 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Share2 size={12} color="#fff" />
              Export
            </button>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "14px", padding: "4px", border: "1px solid rgba(255,255,255,0.1)" }}>
              {[1, 2].map(b => (
                <button key={b} onClick={() => setBatch(b)} style={{
                  padding: "8px 12px", borderRadius: "10px", border: "none", fontSize: "11px", fontWeight: 800,
                  background: batch === b ? "var(--accent)" : "transparent",
                  color: batch === b ? "#fff" : "var(--text-muted)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer"
                }}>B{b}</button>
              ))}
            </div>
            <button 
              onClick={onShowStudentInfo}
              style={{
                width: "36px", height: "36px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "13px", cursor: "pointer"
              }}
            >
              {studentInitials}
            </button>
          </div>
        </div>

        {/* Today's Context Banner for Cosmos */}
        {todayInfo ? (
          <div style={{
            background: "rgba(26, 117, 255, 0.02)",
            border: "1px solid rgba(26, 117, 255, 0.15)",
            borderRadius: "20px",
            padding: "16px 20px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ 
                width: "8px", height: "8px", borderRadius: "50%", 
                background: todayInfo.isHoliday ? "#FF3B70" : "var(--accent)", 
                boxShadow: `0 0 10px ${todayInfo.isHoliday ? "#FF3B70" : "var(--accent)"}` 
              }} />
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>STARDATE LOG</span>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {formatDateNicely(todayInfo.isoDate)} — {todayInfo.isHoliday ? `Academic Holiday (${todayInfo.event || "Off-duty"})` : `Day Order ${todayInfo.dayOrder}`}
                </div>
              </div>
            </div>
            {todayInfo.dayOrder && dayOverride !== todayInfo.dayOrder && (
              <button 
                onClick={() => setDayOverride(todayInfo.dayOrder)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--accent)", padding: "6px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 800,
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                Orbit Today
              </button>
            )}
          </div>
        ) : (
          <div style={{
            background: "rgba(255, 59, 112, 0.02)",
            border: "1px solid rgba(255, 59, 112, 0.15)",
            borderRadius: "20px",
            padding: "16px 20px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF3B70", boxShadow: "0 0 10px #FF3B70" }} />
            <div style={{ textAlign: "left" }}>
              <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>STARDATE LOG</span>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} — Standby Mode (Weekend/Holiday)
              </div>
            </div>
          </div>
        )}

        {/* Day Switcher */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "40px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}>
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
                flexShrink: 0, width: "70px", height: "56px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)",
                background: isSelected ? "var(--accent)" : "rgba(255,255,255,0.03)",
                color: isSelected ? "#fff" : "var(--text-secondary)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer",
                boxShadow: isSelected ? "0 8px 20px rgba(26, 117, 255, 0.3)" : "none"
              }}>
                <div style={{ fontSize: "9px", fontWeight: 800, opacity: 0.6, textTransform: "uppercase" }}>Day {d}</div>
                <div style={{ fontSize: "11px", fontWeight: 800, opacity: isSelected ? 0.95 : 0.5, marginTop: "2px" }}>{label}</div>
              </button>
            );
          })}
        </div>

        {/* Timeline View */}
        <div style={{ position: "relative", paddingLeft: "24px" }}>
          {/* Vertical Timeline Line */}
          <div style={{ 
            position: "absolute", left: "4px", top: "8px", bottom: "8px", width: "2px", 
            background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-secondary) 100%)",
            opacity: 0.2, borderRadius: "2px"
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {PERIODS.map((p, pi) => {
              const pStart = parseStart(p.start);
              const pEnd = parseEnd(p.end);
              const cls = classes.find((c: AnyValue) => {
                const cs = parseStart(c.startTime);
                const ce = parseEnd(c.endTime);
                return cs < pEnd && ce > pStart;
              });
              
              const active = cls ? (currentMin >= parseStart(cls.startTime) && currentMin <= parseEnd(cls.endTime)) : (currentMin >= pStart && currentMin < pEnd);
              const past = currentMin >= pEnd;

              return (
                <div key={pi} style={{ position: "relative", paddingLeft: "12px" }}>
                  {/* Timeline Dot */}
                  <div style={{ 
                    position: "absolute", left: "-24px", top: "50%", transform: "translateY(-50%)", width: "10px", height: "10px", borderRadius: "50%",
                    background: active ? "var(--accent-secondary)" : past ? "var(--text-muted)" : "var(--accent)",
                    boxShadow: active ? "0 0 15px var(--accent-secondary)" : "none",
                    border: "2px solid var(--bg-root)", zIndex: 5
                  }} />

                  <div style={{ 
                    position: "absolute", left: "-60px", top: "50%", transform: "translateY(-50%)", 
                    fontSize: "11px", fontWeight: 900, color: active ? "var(--accent-secondary)" : "var(--text-muted)",
                    width: "30px", textAlign: "right"
                  }}>
                    {p.id}
                  </div>

                  {!cls ? (
                    <div style={{ padding: "16px 0" }}>
                      <div style={{ 
                        height: "2px", width: "100%", borderTop: "2px dashed rgba(255,255,255,0.1)", 
                        opacity: active ? 1 : 0.4, borderColor: active ? "var(--accent-secondary)" : "rgba(255,255,255,0.1)" 
                      }} />
                    </div>
                  ) : (
                    <div 
                      className="min-card" 
                      style={{ 
                        padding: "16px 20px", 
                        borderLeft: active ? "4px solid var(--accent-secondary)" : "1px solid rgba(255,255,255,0.05)",
                        opacity: past ? 0.6 : 1,
                        transition: "all 0.3s ease"
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            <div style={{ fontSize: "11px", color: active ? "var(--accent-secondary)" : "var(--text-secondary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                              {p.start} — {p.end}
                            </div>
                            <div style={{ fontSize: "10px", fontWeight: 900, color: active ? "var(--accent-secondary)" : "var(--text-muted)" }}>P{p.id}</div>
                          </div>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", marginTop: "6px", lineHeight: 1.2 }}>{cls.courseTitle}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                          📍 {cls.roomNo}
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                          👤 {cls.facultyName?.split(" ")[0]}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700 }}>
                          {cls.courseCode}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function fmtTimeOnly(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "p" : "a"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]}${suffix}`; }

