"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTimeRange(t: string): { start: string, end: string } {
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
  const [dayOverride, setDayOverride] = useState<number>(1);
  const [batch, setBatch] = useState<number>(() => {
    // Detect batch from profile "Combo / Batch" e.g. "2/1" -> 1
    const raw = academicData?.profile?.["Combo / Batch"] || "";
    const b = parseInt(raw.split("/")[1]);
    return isNaN(b) ? 1 : b;
  });
  const router = useRouter();

  const calQ = useQuery({ queryKey: ["calendar"], queryFn: () => dataAPI.getCalendar(), staleTime: 600000 });
  const myTTQ = useQuery({ queryKey: ["myTT"], queryFn: () => dataAPI.getMyTimetable(), staleTime: 600000, initialData: academicData?.timetable ? { data: academicData.timetable } : undefined });
  const ttQ = useQuery({
    queryKey: ["tt", batch], // include batch in cache key
    queryFn: () => dataAPI.getTimetable(batch), // dynamic batch
    staleTime: 600000,
    initialData: academicData?.timetableBatch && academicData?.timetableBatch === batch ? { data: { rows: academicData.timetableRows } } : undefined
  });

  const schedule = useMemo(() => {
    if (!ttQ.data?.data?.rows || !myTTQ.data?.data) return [];
    const slotMap = buildSlotToCourseMap(myTTQ.data.data);
    const rawSchedule = buildSchedule(ttQ.data.data.rows, slotMap);
    
    // Merge consecutive identical classes and cleanup
    return rawSchedule.map(day => {
      const merged: ScheduleItem[] = [];
      day.classes.forEach(cls => {
        const prev = merged[merged.length - 1];
        if (prev && prev.courseCode === cls.courseCode && prev.courseType === cls.courseType) {
          // If consecutive, just extend the end time
          prev.endTime = cls.endTime;
          // Combine slots if they are different
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

  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
          {/* Batch Selector (Top) */}
          <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(5,5,5,0.85)", backdropFilter: "blur(20px)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1c1c1c" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#666", textTransform: "uppercase", fontWeight: 800, marginBottom: "2px" }}>Semester Schedule</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Day {dayOverride} — Batch {batch}</div>
          </div>
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
        </div>

        <div className="page-content" style={{ paddingBottom: "140px", paddingTop: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px", opacity: 0.5 }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#888", textTransform: "uppercase", fontWeight: 600 }}>Grid Mode: {batch === 1 ? "B1 (Theory Morning)" : "B2 (Lab Morning)"}</div>
          </div>

          {/* Heading */}
          {/* Heading */}
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

          {/* Timeline */}
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

          {/* Day Switcher Bottom */}
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
