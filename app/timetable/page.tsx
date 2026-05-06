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
import { motion } from "framer-motion";

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

interface ScheduleItem {
  slot: string; startTime: string; endTime: string;
  courseTitle: string; courseCode: string; courseType: string;
  facultyName: string; roomNo: string;
}

function buildSlotToCourseMap(myTT: any[]) {
  const map: Record<string, any> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function buildSchedule(gridRows: any[], slotMap: Record<string, any>): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = gridRows.find((r: any) => r[0] === "FROM");
  const timeStrings: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
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
      const startRange = parseTimeRange(timeStrings[group.cells[0].idx] || "");
      const endRange = parseTimeRange(timeStrings[group.cells[group.cells.length - 1].idx] || "");
      classes.push({ slot: group.cells.map((c: any) => c.slot).join("-"), startTime: startRange.start, endTime: endRange.end, courseTitle: course.courseTitle, courseCode: course.courseCode, courseType: course.courseType, facultyName: course.facultyName, roomNo: course.roomNo });
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
  const res: any[] = [];
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
  const { academicData } = useAuthStore();
  const { theme } = useThemeStore();
  const [dayOverride, setDayOverride] = useState<number>(1);
  const [batch, setBatch] = useState<number>(() => {
    const raw = academicData?.profile?.["Combo / Batch"] || "";
    return extractBatch(raw);
  });
  const router = useRouter();
  const shareRef = useRef<HTMLDivElement>(null);
  const fullShareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [fullSharing, setFullSharing] = useState(false);

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

  const classes = schedule[dayOverride - 1]?.classes || [];
  const classesWithBreaks = insertBreaks(classes);
  
  const totalClasses = classes.length;
  const firstStart = classes[0] ? fmt12(classes[0].startTime) : "";
  const lastEnd = classes[classes.length - 1] ? fmt12(classes[classes.length - 1].endTime) : "";

  const studentInfo = myTTQ.data?.data?.studentInfo || null;
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
                {Object.entries(studentInfo.advisors).map(([key, lines]: any) => {
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

  const studentInitials = studentInfo?.Name ? studentInfo.Name.substring(0, 2).toUpperCase() : "ST";

  if (theme === "cosmos") return (
    <>
      <CosmosTimetable dayOverride={dayOverride} setDayOverride={setDayOverride} batch={batch} setBatch={setBatch} classes={classes} handleShare={handleShare} sharing={sharing} shareRef={shareRef} fullShareRef={fullShareRef} fullSharing={fullSharing} handleFullShare={handleFullShare} schedule={schedule} studentInitials={studentInitials} onShowStudentInfo={() => setShowStudentInfo(true)} />
      {renderStudentInfoModal()}
    </>
  );

  if (theme === "matrix") return (
    <>
      <MatrixTimetable dayOverride={dayOverride} setDayOverride={setDayOverride} batch={batch} setBatch={setBatch} classes={classes} handleShare={handleShare} sharing={sharing} shareRef={shareRef} fullShareRef={fullShareRef} fullSharing={fullSharing} handleFullShare={handleFullShare} schedule={schedule} studentInitials={studentInitials} onShowStudentInfo={() => setShowStudentInfo(true)} />
      {renderStudentInfoModal()}
    </>
  );

  return (
    <div className="page-root">
      <Sidebar />
      {renderStudentInfoModal()}
      <main className="page-main">
          {/* Batch Selector (Top) */}
          <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(5,5,5,0.85)", backdropFilter: "blur(20px)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1c1c1c" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#666", textTransform: "uppercase", fontWeight: 800, marginBottom: "2px" }}>Semester Schedule</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Day {dayOverride} — Batch {batch}</div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", background: "#111", borderRadius: "14px", padding: "4px", border: "1px solid #222" }}>
              {[1, 2].map(b => (
                <button key={b} onClick={() => setBatch(b)}
                style={{
                  padding: "8px 18px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: 800,
                  background: batch === b ? "#7700ff" : "transparent",
                  color: batch === b ? "#fff" : "#666",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer",
                  boxShadow: batch === b ? "0 4px 12px rgba(119, 0, 255, 0.3)" : "none"
                }}>B{b}</button>
            ))}
            </div>
            <button 
              onClick={() => setShowStudentInfo(true)}
              style={{
                width: "40px", height: "40px", borderRadius: "12px", background: "#222", color: "#fff",
                border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "14px", cursor: "pointer"
              }}
            >
              {studentInitials}
            </button>
          </div>
        </div>

        <div className="page-content" style={{ paddingBottom: "140px", paddingTop: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px", opacity: 0.5 }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", fontWeight: 600 }}>Grid Mode: {batch === 1 ? "B1 (Theory Morning)" : "B2 (Lab Morning)"}</div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "#666666", textTransform: "uppercase" }}>
              Current Day Order
            </div>
            <div style={{ fontSize: "120px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
              {dayOverride}
            </div>
          </div>

          {totalClasses > 0 && (
            <div style={{ background: "#1a2600", borderRadius: "20px", padding: "24px", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#a8c200", textTransform: "uppercase", fontWeight: 600 }}>Day Overview</div>
                <div style={{ fontSize: "32px", fontWeight: 900, color: "#a8c200", lineHeight: 1 }}>{totalClasses}</div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#a8c200", marginTop: "16px" }}>
                {firstStart} - {lastEnd}
              </div>
            </div>
          )}

          {totalClasses === 0 ? (
            <div style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>No classes scheduled.</div>
          ) : (
            <div style={{ position: "relative", paddingLeft: "16px" }}>
              <div style={{ position: "absolute", left: "0", top: "16px", bottom: "16px", width: "1px", background: "#2e2e2e" }} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {classesWithBreaks.map((item, i) => {
                  if (item.isBreak) {
                    return (
                      <div key={`break-${i}`} style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
                        <div style={{ position: "absolute", left: "-18px", width: "5px", height: "5px", borderRadius: "50%", background: "#444" }} />
                        <div style={{ flex: 1, fontSize: "12px", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>short break</div>
                        <div style={{ fontSize: "12px", color: "#555" }}>{fmt12(item.startTime)} - {fmt12(item.endTime)}</div>
                      </div>
                    );
                  }

                  const isNso = item.courseCode.includes("NSO") || item.courseType.toLowerCase().includes("practical");
                  
                  return (
                    <div key={i} style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "-18px", top: "16px", width: "5px", height: "5px", borderRadius: "50%", background: isNso ? "#00aaff" : "#fff" }} />
                      
                      <div style={{ background: isNso ? "#0d1a2a" : "#1e1e1e", borderRadius: "20px", padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#aaaaaa", fontSize: "13px", marginBottom: "12px" }}>
                          {fmt12(item.startTime) === fmt12(item.endTime) ? fmt12(item.startTime) : `${fmt12(item.startTime)} — ${fmt12(item.endTime)}`}
                        </div>
                        {isNso && <div style={{ fontSize: "10px", color: "#00aaff", textTransform: "uppercase", fontWeight: "bold", marginBottom: "4px" }}>TBA</div>}
                        <div style={{ fontSize: "24px", fontWeight: "900", color: isNso ? "#00aaff" : "#ffffff", lineHeight: 1.1, marginBottom: "6px", textTransform: "capitalize" }}>
                          {item.courseTitle.toLowerCase()}
                        </div>
                        <div style={{ fontSize: "12px", color: "#888888", marginBottom: "16px", fontWeight: 700 }}>
                          {item.courseCode}
                        </div>
                        <div style={{ height: "1px", background: "#333333", marginBottom: "16px" }} />
                        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#666666" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>📍 {item.roomNo || "TBA"}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>👤 {(item.facultyName || "TBA").replace(/\s*\(\d+\)/, "")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ position: "fixed", bottom: "85px", left: "20px", right: "20px", display: "flex", justifyContent: "center", zIndex: 10 }}>
            <div style={{ background: "#1c1c1c", borderRadius: "99px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid #2e2e2e", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <span style={{ fontSize: "12px", color: "#7700ff", fontWeight: 800, paddingRight: "4px" }}>DO</span>
              {[1, 2, 3, 4, 5].map(d => (
                <button key={d} onClick={() => setDayOverride(d)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: dayOverride === d ? "#ffffff" : "transparent",
                    color: dayOverride === d ? "#000000" : "#555555",
                    fontSize: "14px", fontWeight: "bold", border: "none", cursor: "pointer",
                    transition: "all 0.2s"
                  }}>{d}</button>
              ))}
            </div>
          </div>
          <div className="watermark">Timetable</div>
        </div>
      </main>
    </div>
  );
}

function MatrixTimetable({ dayOverride, setDayOverride, batch, setBatch, classes, handleShare, sharing, shareRef, fullShareRef, fullSharing, handleFullShare, schedule, studentInitials, onShowStudentInfo }: any) {
  const currentMin = new Date().getHours() * 60 + new Date().getMinutes();
  const firstStart = classes[0] ? fmtTimeOnly(classes[0].startTime) : "";
  const lastEnd = classes[classes.length - 1] ? fmtTimeOnly(classes[classes.length - 1].endTime) : "";

  return (
    <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "120px", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "16px 20px 20px" }}>
        
        {/* Header with Batch Selector */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px", marginTop: "12px" }}>
           <div>
              <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>SEMESTER</div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>Schedule Planner</div>
           </div>
           <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
             <button 
              onClick={handleShare}
              disabled={sharing}
              style={{ background: "#1c1c1c", border: "1px solid #333", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
             >
               {sharing ? "..." : "📸 DAY"}
             </button>
             <button 
              onClick={handleFullShare}
              disabled={fullSharing}
              style={{ background: "#a8c200", border: "none", color: "#000", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 900, cursor: "pointer" }}
             >
               {fullSharing ? "..." : "📸 ALL"}
             </button>
             <div style={{ display: "flex", background: "#111", borderRadius: "14px", padding: "4px", border: "1px solid #222" }}>
              {[1, 2].map(b => (
                <button key={b} onClick={() => setBatch(b)}
                  style={{
                    padding: "8px 14px", borderRadius: "10px", border: "none", fontSize: "11px", fontWeight: 800,
                    background: batch === b ? "#a8c200" : "transparent",
                    color: batch === b ? "#000" : "#666",
                    transition: "all 0.2s", cursor: "pointer"
                  }}>B{b}</button>
              ))}
            </div>
            <button 
              onClick={onShowStudentInfo}
              style={{
                width: "36px", height: "36px", borderRadius: "10px", background: "#1c1c1c", color: "#fff",
                border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "13px", cursor: "pointer"
              }}
            >
              {studentInitials}
            </button>
           </div>
        </div>

        {/* Day Order Big Number */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, marginBottom: "8px" }}>Day Order</div>
          <div style={{ fontSize: "160px", fontWeight: 900, lineHeight: 0.8, letterSpacing: "-0.05em" }}>{dayOverride}</div>
        </div>

        {/* Day Overview Card */}
        {classes.length > 0 && (
          <div style={{ background: "#a8c200", borderRadius: "28px", padding: "28px", marginBottom: "40px", color: "#000" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>Session Timing</div>
                <div style={{ fontSize: "48px", fontWeight: 900, lineHeight: 1 }}>{classes.length}</div>
             </div>
             <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.03em" }}>
                {firstStart} - {lastEnd}
             </div>
          </div>
        )}

        {/* Timeline Classes */}
        <div style={{ position: "relative", paddingLeft: "12px" }}>
           {/* Timeline Line */}
           <div style={{ position: "absolute", left: "0", top: "10px", bottom: "10px", width: "1px", background: "#333" }} />

           <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
               {PERIODS.map((p, pi) => {
                 const pStart = parseStart(p.start);
                 const pEnd = parseEnd(p.end);
                 const cls = classes.find((c: any) => {
                   const cs = parseStart(c.startTime);
                   const ce = parseEnd(c.endTime);
                   return cs < pEnd && ce > pStart;
                 });
                 
                 const isActive = cls ? (currentMin >= parseStart(cls.startTime) && currentMin <= parseEnd(cls.endTime)) : (currentMin >= pStart && currentMin < pEnd);

                 return (
                   <div key={pi} style={{ position: "relative", paddingLeft: "32px", marginBottom: "8px" }}>
                     {/* Period Label */}
                     <div style={{ 
                       position: "absolute", left: "-6px", top: "50%", transform: "translateY(-50%)", 
                       width: "12px", height: "12px", borderRadius: "50%", 
                       background: isActive ? "#a8c200" : "#222", 
                       border: "2px solid #000", zIndex: 5,
                       boxShadow: isActive ? "0 0 12px #a8c200" : "none"
                     }} />
                     
                     <div style={{ 
                       position: "absolute", left: "-32px", top: "50%", transform: "translateY(-50%)", 
                       fontSize: "11px", fontWeight: 900, color: isActive ? "#a8c200" : "#444",
                       width: "24px", textAlign: "right"
                     }}>
                       {p.id}
                     </div>

                     {!cls ? (
                       <div style={{ padding: "16px 0" }}>
                         <div style={{ 
                           height: "2px", width: "100%", borderTop: "2.5px dashed #333", 
                           opacity: isActive ? 1 : 0.4, borderColor: isActive ? "#a8c200" : "#444" 
                         }} />
                       </div>
                     ) : (
                       <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pi * 0.05 }}
                        style={{ 
                         background: "#111", borderRadius: "20px", padding: "16px 20px", 
                         border: isActive ? "1.5px solid #a8c200" : "1.5px solid #222",
                         boxShadow: isActive ? "0 8px 30px rgba(168, 194, 0, 0.1)" : "none"
                       }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                             <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#666", fontSize: "11px", fontWeight: 800 }}>
                                <span style={{ fontSize: "14px" }}>⏱</span> {p.start} — {p.end}
                             </div>
                             <div style={{ fontSize: "10px", fontWeight: 900, color: isActive ? "#a8c200" : "#444", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                Period {p.id}
                             </div>
                          </div>
                          
                          <div style={{ fontSize: "20px", fontWeight: 900, lineHeight: 1.2, marginBottom: "8px", textTransform: "capitalize", letterSpacing: "-0.01em", color: "#fff" }}>
                             {cls.courseTitle.toLowerCase()}
                          </div>

                          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                             <div style={{ fontSize: "11px", color: "#666", fontWeight: 700 }}>{cls.courseCode}</div>
                             <div style={{ fontSize: "11px", color: "#888", fontWeight: 700 }}>📍 {cls.roomNo || "TBA"}</div>
                             <div style={{ fontSize: "11px", color: "#888", fontWeight: 700 }}>👤 {(cls.facultyName || "TBA").split(" ")[0]}</div>
                          </div>
                       </motion.div>
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
                    const cls = classes.find((c: any) => {
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
                             const cls = dayClasses.find((c: any) => {
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
                                         <div style={{ fontSize: "11px", fontWeight: 900, color: "#ddd", lineHeight: 1.1 }}>{cls.courseTitle.split(" ")[0]}</div>
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
        <div style={{ position: "fixed", bottom: "100px", left: "20px", right: "20px", display: "flex", justifyContent: "center", zIndex: 100 }}>
           <div style={{ background: "rgba(20,20,20,0.8)", backdropFilter: "blur(20px)", borderRadius: "99px", padding: "8px", display: "flex", gap: "8px", border: "1px solid #333" }}>
              {[1, 2, 3, 4, 5].map(d => (
                <button key={d} onClick={() => setDayOverride(d)} style={{
                  width: "44px", height: "44px", borderRadius: "50%", border: "none",
                  background: dayOverride === d ? "#a8c200" : "transparent",
                  color: dayOverride === d ? "#000" : "#fff",
                  fontSize: "16px", fontWeight: 900, cursor: "pointer", transition: "all 0.2s"
                }}>{d}</button>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
}

function CosmosTimetable({ dayOverride, setDayOverride, batch, setBatch, classes, handleShare, sharing, shareRef, fullShareRef, fullSharing, handleFullShare, schedule, studentInitials, onShowStudentInfo }: any) {
  const currentMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div style={{ background: "transparent", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FFFFFF" }}>
      <Sidebar />
      <main style={{ padding: "16px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>Timetable</h1>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Batch: {batch}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={handleShare} disabled={sharing} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
              {sharing ? "..." : "DAY"}
            </button>
            <button onClick={handleFullShare} disabled={fullSharing} style={{ background: "var(--accent)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
              {fullSharing ? "..." : "ALL"}
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

        {/* Day Switcher */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "40px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}>
          {[1, 2, 3, 4, 5].map(d => (
            <button key={d} onClick={() => setDayOverride(d)} style={{
              flexShrink: 0, width: "56px", height: "56px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)",
              background: dayOverride === d ? "var(--accent)" : "rgba(255,255,255,0.03)",
              color: dayOverride === d ? "#fff" : "var(--text-secondary)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer",
              boxShadow: dayOverride === d ? "0 8px 20px rgba(26, 117, 255, 0.3)" : "none"
            }}>
              <div style={{ fontSize: "10px", fontWeight: 800, opacity: 0.6, textTransform: "uppercase" }}>Day</div>
              <div style={{ fontSize: "18px", fontWeight: 900 }}>{d}</div>
            </button>
          ))}
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
              const cls = classes.find((c: any) => {
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
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: pi * 0.04 }}
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
                    </motion.div>
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

