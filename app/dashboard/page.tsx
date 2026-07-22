"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useThemeStore } from "@/lib/themeStore";
import { extractBatch } from "@/lib/utils";
import { ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import AuraDashboard from "@/components/aura-theme/AuraDashboard";
const PortalSyncModal = dynamic(() => import("@/components/PortalSyncModal"), { ssr: false });
import LoadingSkeleton from "@/components/aura-theme/LoadingSkeleton";

function to24(h: number) { return h >= 1 && h <= 7 ? h + 12 : h; }
function parseStart(t: string) { const m = t.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function parseEnd(t: string) { const parts = t.split(/\s*[-–]\s*/); const last = parts[parts.length - 1] || ""; const m = last.match(/(\d+):(\d+)/); return m ? to24(parseInt(m[1])) * 60 + parseInt(m[2]) : 0; }
function isNowIn(st: string, en: string) { const now = new Date().getHours() * 60 + new Date().getMinutes(); return now >= parseStart(st) && now <= parseEnd(en); }
function fmt12(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "PM" : "AM"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]} ${suffix}`; }
function fmtTimeOnly(t: string) { const m = t.match(/(\d+):(\d+)/); if (!m) return t; const h24 = to24(parseInt(m[1])); const suffix = h24 >= 12 ? "p" : "a"; const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24; return `${h12}:${m[2]}${suffix}`; }

function parseTimeRange(t: string): { start: string, end: string } {
  const parts = t.split(/[-–]/).map(s => s.trim());
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: t, end: t };
}

const BATCH_PERIODS = {
  1: [
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
  ],
  2: [
    { id: 1, start: "13:15", end: "14:05" },
    { id: 2, start: "14:05", end: "14:55" },
    { id: 3, start: "15:00", end: "15:50" },
    { id: 4, start: "15:50", end: "16:40" },
    { id: 5, start: "16:45", end: "17:35" },
    { id: 6, start: "17:35", end: "18:25" },
    { id: 7, start: "18:30", end: "19:20" },
    { id: 8, start: "19:20", end: "20:10" },
    { id: 9, start: "20:10", end: "21:00" },
    { id: 10, start: "21:00", end: "21:50" },
  ]
};

interface ScheduleItem { slot: string; startTime: string; endTime: string; courseTitle: string; courseCode: string; roomNo: string; facultyName: string; courseType: string; }

function buildSlotToCourseMap(myTT: AnyValue[]) {
  const map: Record<string, AnyValue> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function buildSchedule(gridRows: AnyValue[], slotMap: Record<string, AnyValue>, attendance: AnyValue[] = []): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = gridRows.find((r: AnyValue) => r[0] === "FROM");
  const times: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = gridRows.filter((r: AnyValue) => typeof r[0] === "string" && r[0].startsWith("Day"));

  const resolveTitle = (code: string, fallback: string) => {
    const found = attendance.find((c: AnyValue) => (c["Course Code"] || c.courseCode) === code);
    return found?.["Course Title"] || found?.courseTitle || found?.courseName || fallback;
  };

  return dayRows.map((row: AnyValue) => {
    const cells: string[] = row.slice(1);
    const classes: ScheduleItem[] = [];
    const seenCourses = new Set<string>();

    const labCells: { idx: number; slot: string; course: AnyValue }[] = [];
    cells.forEach((cell, ci) => {
      const s = cell?.trim();
      const up = s?.toUpperCase() || "";
      if (!s || !/^[PL]\d+$/i.test(up)) return;
      const course = slotMap[up];
      if (course) labCells.push({ idx: ci, slot: up, course });
    });

    const labGroups: { cells: { idx: number; slot: string; course: AnyValue }[] }[] = [];
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
      const startRange = parseTimeRange(times[group.cells[0].idx] || "");
      const endRange = parseTimeRange(times[group.cells[group.cells.length - 1].idx] || "");
      classes.push({ slot: group.cells.map(c => c.slot).join("-"), startTime: startRange.start, endTime: endRange.end, courseTitle: resolveTitle(course.courseCode, course.courseTitle || course.courseCode), courseCode: course.courseCode, roomNo: course.roomNo, facultyName: course.facultyName, courseType: course.courseType });
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
        const { start, end } = parseTimeRange(times[ci] || "");
        classes.push({ slot: s, startTime: start, endTime: end, courseTitle: resolveTitle(course.courseCode, course.courseTitle || course.courseCode), courseCode: course.courseCode, roomNo: course.roomNo, facultyName: course.facultyName, courseType: course.courseType });
        break;
      }
    });

    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

function getPrimaryClassroom(courses: AnyValue[], studentClassroom?: string): string {
  if (studentClassroom && studentClassroom.trim()) {
    return studentClassroom.trim().toUpperCase();
  }
  const roomCounts: Record<string, number> = {};
  (courses || []).forEach((c: AnyValue) => {
    const room = (c.roomNo || c.room || "").trim().toUpperCase();
    if (room && room !== "TBA" && room !== "-") {
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

function isLabSession(item: AnyValue, allCourses?: AnyValue[]) {
  if (!item) return false;
  const type = (item.courseType || "").toLowerCase();
  const title = (item.courseTitle || "").toLowerCase();
  const code = (item.courseCode || "").toUpperCase();
  const slot = (item.slot || "").toUpperCase();
  const room = (item.roomNo || item.room || "").trim().toUpperCase();

  // 1. Explicit courseType check (Practical, Lab, Laboratory)
  if (type.includes("practical") || type.includes("lab") || type.includes("laboratory")) {
    return true;
  }
  // 2. Course title containing "lab", "laboratory", or "practical"
  if (/\b(lab|laboratory|practical)\b/i.test(title)) {
    return true;
  }
  // 3. NSO course code check
  if (code.includes("NSO")) {
    return true;
  }
  // 4. SRM Lab Course Code ending with 'L' or 'P' (e.g. 18CS303L, 21CSC204L)
  if (/^[A-Z0-9]+[LP]$/i.test(code) && !code.endsWith("T")) {
    return true;
  }
  // 5. SRM Lab slot codes explicitly start with 'L' (e.g. L1, L31, L1-L2, L31+L32)
  if (/^L\d+/i.test(slot) || /\bL\d+\b/i.test(slot)) {
    return true;
  }
  // 6. Room number explicitly contains Lab indicators (e.g. "TP101 LAB", "COMP LAB", "LAB 3", "WORKSHOP")
  if (/\b(lab|laboratory|comp|workshop|w\/s)\b/i.test(room)) {
    return true;
  }

  // 7. Same-Subject Room Difference & Primary Classroom Tie-Breaker:
  if (allCourses && allCourses.length > 0 && room && room !== "TBA" && room !== "-") {
    const normTitle = (item.courseTitle || "").trim().toLowerCase();
    const normCode = (item.courseCode || "").trim().toUpperCase();
    const baseCode = normCode.replace(/[TLP]$/, "");

    const sameSubjectItems = allCourses.filter((c: AnyValue) => {
      const cTitle = (c.courseTitle || c.title || c.courseName || "").trim().toLowerCase();
      const cCode = (c.courseCode || c.code || "").trim().toUpperCase();
      const cBaseCode = cCode.replace(/[TLP]$/, "");

      return (
        (normTitle && cTitle === normTitle) || 
        (normCode && cCode === normCode) ||
        (baseCode && cBaseCode && baseCode === cBaseCode)
      );
    });

    if (sameSubjectItems.length > 1) {
      const roomsForSubject = sameSubjectItems
        .map((c: AnyValue) => (c.roomNo || c.room || "").trim().toUpperCase())
        .filter((r: string) => r && r !== "TBA" && r !== "-");

      const uniqueRooms = Array.from(new Set(roomsForSubject));

      if (uniqueRooms.length > 1) {
        const primaryRoom = getPrimaryClassroom(allCourses);

        if (primaryRoom && uniqueRooms.includes(primaryRoom)) {
          if (room !== primaryRoom) {
            return true;
          }
        } else {
          const roomCounts: Record<string, number> = {};
          roomsForSubject.forEach((r: string) => {
            roomCounts[r] = (roomCounts[r] || 0) + 1;
          });

          let mainSubjectRoom = "";
          let maxCount = 0;
          Object.entries(roomCounts).forEach(([r, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mainSubjectRoom = r;
            }
          });

          if (mainSubjectRoom && room !== mainSubjectRoom) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function MiniGridTile({ slot, allCourses }: { slot: AnyValue, allCourses?: AnyValue[] }) {
  if (!slot || slot.isEmpty) return <div style={{ background: "transparent", borderRadius: "16px", height: "88px", border: "1px dashed #333333" }} />;
  const isActive = isNowIn(slot.startTime, slot.endTime);
  const isLab = isLabSession(slot, allCourses);
  return (
    <div
      style={{
        background: isLab ? "linear-gradient(135deg, rgba(255, 117, 195, 0.18) 0%, #1e111d 100%)" : "#1c1c1c",
        borderRadius: "16px",
        height: "88px",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: isActive ? "1.5px solid #a8c200" : (isLab ? "1px solid rgba(255, 117, 195, 0.35)" : "none"),
        cursor: 'pointer',
        transition: "transform 0.1s"
      }}
      onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
      onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
      onPointerLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: "8px", color: isLab ? "#FF75C3" : "#888888", marginBottom: "4px", fontWeight: "bold" }}>
          {slot.courseCode.substring(0, 5)} • {slot.roomNo?.split(",")[0]?.substring(0, 4) || "TBA"}
        </div>
        <span style={{ fontSize: "11px", fontWeight: "900", color: isLab ? "#FF75C3" : "#ffffff", textAlign: "center", lineHeight: 1.1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textTransform: "capitalize", wordBreak: "break-word" }}>
          {slot.courseTitle.toLowerCase()}
        </span>
      </div>
      <div style={{ fontSize: "9px", color: isLab ? "rgba(255, 117, 195, 0.85)" : "#888888", textAlign: "center", fontWeight: "bold" }}>
        {fmtTimeOnly(slot.startTime) === fmtTimeOnly(slot.endTime) ? fmtTimeOnly(slot.startTime) : `${fmtTimeOnly(slot.startTime)} - ${fmtTimeOnly(slot.endTime)}`}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { ready } = useAuth();
  const router = useRouter();
  // Enforce granular store selectors to avoid main-thread rendering bottlenecks
  const theme = useThemeStore((state) => state.theme);
  
  const email = useAuthStore((state) => state.email);
  const setProfile = useAuthStore((state) => state.setProfile);
  const academicData = useAuthStore((state) => state.academicData);
  const setAcademicData = useAuthStore((state) => state.setAcademicData);
  const studentPortalConnected = useAuthStore((state) => state.studentPortalConnected);
  const setStudentPortalConnected = useAuthStore((state) => state.setStudentPortalConnected);
  const setStudentPortalData = useAuthStore((state) => state.setStudentPortalData);
  const studentPortalData = useAuthStore((state) => state.studentPortalData);

  // Cache selectors and setters
  const cachedTimetable = useAuthStore((state) => state.timetable);
  const cachedMyTimetable = useAuthStore((state) => state.myTimetable);
  const cachedCalendar = useAuthStore((state) => state.calendar);
  const setTimetable = useAuthStore((state) => state.setTimetable);
  const setMyTimetable = useAuthStore((state) => state.setMyTimetable);
  const setCalendar = useAuthStore((state) => state.setCalendar);
  const setPremium = useAuthStore((state) => state.setPremium);

  const [data, setData] = useState<AnyValue>(academicData || null);
  const [loading, setLoading] = useState(!academicData);
  const [ttData, setTTData] = useState<AnyValue>(cachedTimetable || null);
  const [myTTData, setMyTTData] = useState<AnyValue>(cachedMyTimetable || null);
  const [calData, setCalData] = useState<AnyValue>(cachedCalendar || null);
  const [dayOffset, setDayOffset] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const currentTime = now.getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);



  const formatLastSynced = useCallback((dateInput: AnyValue) => {
    if (!dateInput) return "Never";
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return "Recently";
      
      const seconds = Math.floor((currentTime - d.getTime()) / 1000);
      if (seconds < 60) return "Just now";
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      return d.toLocaleDateString();
    } catch {
      return "Recently";
    }
  }, [currentTime]);

  const att = data?.attendance?.length ? data.attendance : (data?.studentPortal?.attendance || studentPortalData?.attendance || []);
  const marks = data?.marks?.length ? data.marks : (data?.studentPortal?.marks || studentPortalData?.marks || []);

  const renderAcademicIntegrityHub = useCallback((mode: "default" | "matrix" | "aura" = "default") => {
    const isMatrix = mode === "matrix";
    const isAura = mode === "aura";
    // Fall back to local Zustand cache if the newly fetched object is empty or expired
    const rawSpData = data?.studentPortal;
    const fallbackSpData = studentPortalData;
    const spData = (rawSpData && rawSpData.marks && rawSpData.profile) ? rawSpData : fallbackSpData;
    const hasSpData = !!spData && !!spData.marks && !!spData.profile;
    const primaryColor = isAura ? "#FF75C3" : isMatrix ? "#a8c200" : "#00ff88";

    return (
      <div style={{ 
        background: isAura ? "rgba(255, 255, 255, 0.02)" : isMatrix ? "#1c1c1c" : "linear-gradient(135deg, rgba(0, 255, 136, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)",
        backdropFilter: isAura ? "blur(40px)" : "none",
        WebkitBackdropFilter: isAura ? "blur(40px)" : "none",
        border: isAura || isMatrix ? `1px solid ${isAura ? "rgba(255, 255, 255, 0.08)" : "#333"}` : "1px solid rgba(255, 255, 255, 0.05)", 
        borderRadius: "32px", padding: "24px", marginBottom: "32px",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 900, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "4px" }}>My Performance</div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#fff" }}>My Academic Status</h3>
            {hasSpData && (
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.72)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: studentPortalConnected ? primaryColor : "rgba(255,255,255,0.2)" }} />
                <span>Synced {formatLastSynced(spData?.lastSyncedAt)}</span>
              </div>
            )}
            {!hasSpData && (
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.72)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: primaryColor }} />
                <span>Academic OS Active</span>
              </div>
            )}
          </div>
          <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <ShieldCheck size={20} color={isAura ? "#8F92FF" : isMatrix ? "#a8c200" : "#00ff88"} />
          </div>
        </div>

        {hasSpData && !studentPortalConnected && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isAura 
              ? "rgba(255, 149, 0, 0.05)" 
              : isMatrix 
                ? "rgba(168, 194, 0, 0.05)" 
                : "rgba(0, 255, 136, 0.04)",
            border: `1px solid ${
              isAura 
                ? "rgba(255, 149, 0, 0.2)" 
                : isMatrix 
                  ? "rgba(168, 194, 0, 0.2)" 
                  : "rgba(0, 255, 136, 0.15)"
            }`,
            borderRadius: "16px",
            padding: "12px 16px",
            marginBottom: "16px",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              <AlertCircle 
                size={16} 
                color={isAura ? "#FF9500" : isMatrix ? "#a8c200" : "#00ff88"} 
                style={{ flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ 
                  fontSize: "11px", 
                  fontWeight: 900, 
                  color: isAura ? "#FF9500" : isMatrix ? "#a8c200" : "#00ff88", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em" 
                }}>
                  Viewing Offline Cache
                </span>
                <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600, marginTop: "2px" }}>
                  Session expired. Reconnect to sync fresh grades & arrears.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              style={{
                background: isAura ? "#FF9500" : isMatrix ? "#a8c200" : "#00ff88",
                color: "#000",
                border: "none",
                padding: "6px 14px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                boxShadow: `0 0 15px ${
                  isAura 
                    ? "rgba(255, 149, 0, 0.2)" 
                    : isMatrix 
                      ? "rgba(168, 194, 0, 0.2)" 
                      : "rgba(0, 255, 136, 0.2)"
                }`,
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <RefreshCw size={10} strokeWidth={3} />
              <span>Sync</span>
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: !hasSpData ? "20px" : "0px" }}>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>
              {hasSpData ? (spData?.marks?.failed?.length || 0) : "—"}
            </div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase", marginTop: "2px" }}>
              Arrears {!hasSpData && "(Portal Link)"}
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>
              {hasSpData ? (spData?.marks?.marks?.length || 0) : (marks?.length || 0)}
            </div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase", marginTop: "2px" }}>
              Grades Logged
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isAura ? "#FF75C3" : isMatrix ? "#a8c200" : "#00ff88" }}>
              {spData?.marks?.sgpa || spData?.marks?.SGPA || data?.profile?.["SGPA"] || data?.profile?.["sgpa"] || "—"}
            </div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase", marginTop: "2px" }}>SGPA</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isAura ? "#FF75C3" : isMatrix ? "#a8c200" : "#00ff88" }}>
              {spData?.marks?.cgpa || spData?.marks?.CGPA || data?.profile?.["CGPA"] || data?.profile?.["cgpa"] || "—"}
            </div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase", marginTop: "2px" }}>CGPA</div>
          </div>
        </div>

        {!hasSpData && (
          <div style={{
            marginTop: "12px",
            background: isAura 
              ? "linear-gradient(135deg, rgba(255,117,195,0.08) 0%, rgba(167,139,250,0.05) 100%)" 
              : isMatrix 
                ? "rgba(168, 194, 0, 0.05)" 
                : "linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, rgba(56, 189, 248, 0.05) 100%)",
            border: `1px solid ${
              isAura 
                ? "rgba(255, 117, 195, 0.15)" 
                : isMatrix 
                  ? "rgba(168, 194, 0, 0.2)" 
                  : "rgba(0, 255, 136, 0.15)"
            }`,
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
            textAlign: "center"
          }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 600, lineHeight: 1.4 }}>
              Link your <strong>SRM Student Portal</strong> (optional) to unlock historical Arrears tracking and official semester grade logs.
            </span>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              style={{
                background: isAura ? "linear-gradient(135deg, #FF75C3 0%, #A78BFA 100%)" : isMatrix ? "#a8c200" : "#00ff88",
                color: "#000",
                border: "none",
                padding: "8px 18px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                boxShadow: `0 4px 15px rgba(${isAura ? "255, 117, 195" : isMatrix ? "168, 194, 0" : "0, 255, 136"}, 0.2)`
              }}
            >
              Link Student Portal
            </button>
          </div>
        )}
      </div>
    );
  }, [data, studentPortalData, studentPortalConnected, marks, formatLastSynced]);
  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [broadcast, setBroadcast] = useState<AnyValue>(null);
  const [batch, setBatch] = useState<number>(() => {
    const raw = academicData?.profile?.["Combo / Batch"] || "";
    return extractBatch(raw);
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sync") === "1" || params.get("sync") === "true") {
        setIsSyncModalOpen(true);
        // Clean up URL query parameters without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    }
  }, []);

  // Sync local states with cached Zustand data after store hydration
  useEffect(() => {
    if (academicData) {
      if (academicData !== data) {
        setData(academicData);
      }
      const raw = academicData.profile?.["Combo / Batch"] || "";
      const b = extractBatch(raw);
      if (b !== batch) {
        setBatch(b);
      }
    }
    if (cachedTimetable && !ttData) {
      setTTData(cachedTimetable);
    }
    if (cachedMyTimetable && !myTTData) {
      setMyTTData(cachedMyTimetable);
    }
    if (cachedCalendar && !calData) {
      setCalData(cachedCalendar);
    }
  }, [academicData, data, batch, cachedTimetable, ttData, cachedMyTimetable, myTTData, cachedCalendar, calData]);

  useEffect(() => {
    if (!ready) return;
    dataAPI.getUnified()
      .then(d => {
        if (d && d.success) {
          // Sync premium status from backend
          if (d.isPremium !== undefined) {
            setPremium(d.isPremium, d.premiumExpiresAt);
          }

          // Phase 2: Merge the data so existing components (which expect 'academia' format) still work
          const mergedData = {
            ...d.academia,
            studentPortal: d.studentPortal
          };
          setData(mergedData);
          setAcademicData(mergedData);
          
          if (d.studentPortal) {
            setStudentPortalData(d.studentPortal);
            if (!d.studentPortal.profile || !d.studentPortal.marks) {
              setSyncError("Portal session expired or data missing. Please try again.");
            } else {
              setSyncError(null);
            }
          }
          
          if (d.academia?.profile) {
            setProfile(d.academia.profile);
            const b = extractBatch(d.academia.profile["Combo / Batch"] || "");
            setBatch(b);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (!data) router.push("/");
        else setLoading(false);
      });
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    dataAPI.getTimetable(batch).then(d => { setTTData(d); setTimetable(d); }).catch(() => { });
    dataAPI.getCalendar().then(d => { setCalData(d); setCalendar(d); }).catch(() => { });
    dataAPI.getMyTimetable().then(d => { setMyTTData(d); setMyTimetable(d); }).catch(() => { });
    dataAPI.getBroadcast().then(d => setBroadcast(d)).catch(() => { });
  }, [ready, batch]);

  // Calculate top stats
  const totalCourses = att.length;
  const avgAtt = (() => {
    if (!att.length) return "—";
    const totalH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Conducted"] || c.conducted) || 0), 0);
    if (totalH > 0) {
      const presentH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Attended"] || c.attended) || Math.max(0, (parseInt(c["Hours Conducted"] || c.conducted) || 0) - (parseInt(c["Hours Absent"] || c.absent) || 0))), 0);
      return ((presentH / totalH) * 100).toFixed(1);
    }
    const validPctCourses = att.filter((c: AnyValue) => {
      const p = c["Attn %"] || c.pct;
      return p !== undefined && p !== null && p !== "null";
    });
    if (validPctCourses.length > 0) {
      const sumPct = validPctCourses.reduce((s: number, c: AnyValue) => s + (parseFloat(c["Attn %"] || c.pct) || 0), 0);
      return (sumPct / validPctCourses.length).toFixed(1);
    }
    return "—";
  })();
  const riskCount = att.filter((c: AnyValue) => {
    const pStr = c["Attn %"] || c.pct;
    if (pStr === undefined || pStr === null || pStr === "null") return false;
    const pct = parseFloat(pStr) || 0;
    return pct < 75;
  }).length;

  // Aggregate Hours
  const totalHours = att.reduce((s: number, c: AnyValue) => {
    const cond = parseInt(c["Hours Conducted"] || c.conducted) || 0;
    const pctStr = c["Attn %"] || c.pct;
    if (cond === 0 && pctStr !== undefined && pctStr !== null && pctStr !== "null") return s + 30;
    return s + cond;
  }, 0);
  const presentHours = att.reduce((s: number, c: AnyValue) => {
    const cond = parseInt(c["Hours Conducted"] || c.conducted) || 0;
    const absent = parseInt(c["Hours Absent"] || c.absent) || 0;
    const pctStr = c["Attn %"] || c.pct;
    if (cond === 0 && pctStr !== undefined && pctStr !== null && pctStr !== "null") {
      const pct = parseFloat(pctStr) || 0;
      return s + Math.round(30 * (pct / 100));
    }
    return s + (parseInt(c["Hours Attended"] || c.attended) || (cond - absent) || 0);
  }, 0);
  const absentHours = Math.max(0, totalHours - presentHours);

  // Calculate average marks
  const totalScored = marks.reduce((s: number, m: AnyValue) => s + (m.tests?.reduce((a: number, t: AnyValue) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s: number, m: AnyValue) => s + (m.tests?.reduce((a: number, t: AnyValue) => { const [, mx] = t.test.split("/"); return a + (parseFloat(mx) || 0); }, 0) || 0), 0);
  const avgMarks = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : "—";

  // Recent 5 marks without 0 place holders
  const recentMarksList: AnyValue[] = [];
  marks.forEach((m: AnyValue) => {
    m.tests?.forEach((t: AnyValue) => {
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

  const { months, byDate } = useMemo(() => {
    if (!calData) return { months: { ODD: [], EVEN: [] }, byDate: new Map() };
    try { return buildCalendarIndex(calData); } catch { return { months: { ODD: [], EVEN: [] }, byDate: new Map() }; }
  }, [calData]);

  const upcomingEvents = useMemo(() => {
    const events: AnyValue[] = [];
    const sortedDays = Array.from(byDate.values()).sort((a: AnyValue, b: AnyValue) => a.isoDate.localeCompare(b.isoDate));
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    
    // Find the current active semester based on today's date
    const currentMonth = now.getMonth();
    const activeSem = (currentMonth >= 6) ? "ODD" : "EVEN";

    for (const d of sortedDays) {
      if (d.isoDate >= todayStr) {
        const isSignificant = (d.event && d.event !== "-") || d.isHoliday;
        // Significant event OR it's the very next academic day of the ACTIVE semester
        const isNextAcademicDay = d.dayOrder && events.length === 0 && d.semester === activeSem; 
        
        if (isSignificant || isNextAcademicDay) {
          const eventTitle = d.event && d.event !== "-" ? d.event : d.isHoliday ? "University Holiday" : `Academic Cycle: Day Order ${d.dayOrder}`;
          
          events.push({
            ...d,
            event: eventTitle
          });
          if (events.length >= 3) break;
        }
      }
    }
    return events;
  }, [byDate]);

  const tomorrowDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const tomorrowCalInfo = byDate.get(tomorrowDate);
  const tomorrowDateObj = new Date(tomorrowDate + "T00:00:00");
  const tomorrowDayOfWeek = tomorrowDateObj.getDay();
  const tomorrowIsWeekend = [0, 6].includes(tomorrowDayOfWeek);
  const tomorrowIsHoliday = tomorrowCalInfo ? !!tomorrowCalInfo.isHoliday : tomorrowIsWeekend;
  const tomorrowDayOrder = tomorrowCalInfo?.dayOrder || (!tomorrowIsHoliday && tomorrowDayOfWeek >= 1 && tomorrowDayOfWeek <= 5 ? tomorrowDayOfWeek : null);

  const tomorrowClasses = useMemo(() => {
    if (!ttData?.data?.rows || !myTTData?.data || tomorrowIsHoliday || !tomorrowDayOrder) return [];
    const rows = ttData.data.rows;
    const courses = myTTData.data?.courses || myTTData.data || [];
    const slotMap = buildSlotToCourseMap(courses);
    const schedule = buildSchedule(rows, slotMap, att);
    const targetRow = schedule.find(s => {
      const header = String(s.day || "");
      const dOrder = parseInt(header.match(/\d+/)?.[0] || "0");
      return dOrder === tomorrowDayOrder;
    });
    return targetRow?.classes || [];
  }, [ttData, myTTData, att, tomorrowDayOrder, tomorrowIsHoliday]);

  const tomorrowSkipStats = useMemo(() => {
    if (tomorrowIsHoliday || !tomorrowDayOrder || tomorrowClasses.length === 0) {
      return { isHoliday: true, dayOrder: null, safe: 0, risky: 0, classes: [] };
    }
    
    let safe = 0;
    let risky = 0;
    
    const enrichedClasses = tomorrowClasses.map((cls) => {
      const courseCode = cls.courseCode;
      const course = att.find((c: AnyValue) => (c["Course Code"] || c.courseCode) === courseCode);
      let isRisky = false;
      let currentAttendance = 100;
      let afterSkipAttendance = 100;
      
      if (course) {
        let cond = parseInt(course["Hours Conducted"] || course.conducted) || 0;
        const absent = parseInt(course["Hours Absent"] || course.absent) || 0;
        let present = parseInt(course["Hours Attended"] || course.attended) || Math.max(0, cond - absent);
        const pctStr = course["Attn %"] || course.pct;
        const pct = pctStr !== undefined && pctStr !== null && pctStr !== "null" ? parseFloat(pctStr) : null;
        
        if (pct !== null) {
          currentAttendance = pct;
          if (cond === 0 && pct > 0) {
            cond = 30;
            present = Math.round(cond * (pct / 100));
          }
          afterSkipAttendance = (present / (cond + 1)) * 100;
          isRisky = afterSkipAttendance < 75;
        }
      }
      
      if (isRisky) {
        risky++;
      } else {
        safe++;
      }
      
      return { 
        ...cls, 
        isRisky,
        currentAttendance: Math.round(currentAttendance),
        afterSkipAttendance: Math.round(afterSkipAttendance)
      };
    });
    
    return {
      isHoliday: false,
      dayOrder: tomorrowDayOrder,
      safe,
      risky,
      classes: enrichedClasses
    };
  }, [tomorrowIsHoliday, tomorrowDayOrder, tomorrowClasses, att]);

  const nextRiskyClassText = useMemo(() => {
    const riskyCls = tomorrowClasses.find((cls) => {
      const course = att.find((c: AnyValue) => (c["Course Code"] || c.courseCode) === cls.courseCode);
      if (course) {
        let cond = parseInt(course["Hours Conducted"] || course.conducted) || 0;
        const absent = parseInt(course["Hours Absent"] || course.absent) || 0;
        let present = parseInt(course["Hours Attended"] || course.attended) || Math.max(0, cond - absent);
        const pctStr = course["Attn %"] || course.pct;
        const pct = pctStr !== undefined && pctStr !== null && pctStr !== "null" ? parseFloat(pctStr) : null;
        
        if (pct !== null) {
          if (cond === 0 && pct > 0) {
            cond = 30;
            present = Math.round(cond * (pct / 100));
          }
          const afterSkip = (present / (cond + 1)) * 100;
          return afterSkip < 75;
        }
      }
      return false;
    });
    if (riskyCls) {
      const parts = riskyCls.courseTitle.split(' ');
      const name = parts.length > 2 ? parts.slice(0, 3).join(' ') : riskyCls.courseTitle;
      return `${name} tomorrow`;
    }
    return "None tomorrow";
  }, [tomorrowClasses, att]);

  const totalSafeSkips = useMemo(() => {
    return att.reduce((sum: number, c: AnyValue) => {
      let cond = parseInt(c["Hours Conducted"] || c.conducted) || 0;
      const absent = parseInt(c["Hours Absent"] || c.absent) || 0;
      let present = parseInt(c["Hours Attended"] || c.attended) || Math.max(0, cond - absent);
      const pctStr = c["Attn %"] || c.pct;
      const pct = parseFloat(pctStr) || 0;
      
      if (pctStr === undefined || pctStr === null || pctStr === "null") return sum;

      if (cond === 0 && pct > 0) {
        cond = 30;
        present = Math.round(cond * (pct / 100));
      }

      if (pct >= 75) {
        return sum + Math.max(0, Math.floor((present / 0.75) - cond));
      }
      return sum;
    }, 0);
  }, [att]);

  const safeSubjectsCount = useMemo(() => {
    return att.filter((c: AnyValue) => {
      const pctStr = c["Attn %"] || c.pct;
      if (pctStr === undefined || pctStr === null || pctStr === "null") return true;
      const pct = parseFloat(pctStr) || 0;
      return pct >= 75;
    }).length;
  }, [att]);

  const riskySubjectsCount = useMemo(() => {
    return att.filter((c: AnyValue) => {
      const pctStr = c["Attn %"] || c.pct;
      if (pctStr === undefined || pctStr === null || pctStr === "null") return false;
      const pct = parseFloat(pctStr) || 0;
      return pct < 75;
    }).length;
  }, [att]);

  const marksTargetBrief = useMemo(() => {
    if (!marks || marks.length === 0) return "Awaiting internal marks sync";
    
    const subject = marks.find((m: AnyValue) => m.tests && m.tests.length > 0);
    if (!subject) return "All grades finalized";
    
    let totalCompScored = 0;
    let totalCompMax = 0;
    let totalPendMax = 0;
    
    subject.tests.forEach((test: AnyValue) => {
      const max = parseFloat((test.test || "T/100").split("/")[1]) || 100;
      const isCompleted = test.score !== undefined && test.score !== null && test.score !== "" && test.score !== "—" && test.score !== "— ";
      if (isCompleted) {
        totalCompScored += test.score === "Abs" ? 0 : parseFloat(test.score) || 0;
        totalCompMax += max;
      } else {
        totalPendMax += max;
      }
    });
    
    const endSemWeight = Math.max(0, 100 - (totalCompMax + totalPendMax));
    if (endSemWeight > 0) {
      const targetScore = 80; 
      const requiredFromEndSem = targetScore - totalCompScored;
      if (requiredFromEndSem <= 0) {
        return `Need 40/100 in End Sem for A/S grade`;
      } else {
        const requiredEndSemScore = (requiredFromEndSem / endSemWeight) * 100;
        if (requiredEndSemScore > 100) {
          const targetScoreB = 70;
          const requiredFromEndSemB = targetScoreB - totalCompScored;
          const requiredEndSemScoreB = (requiredFromEndSemB / endSemWeight) * 100;
          if (requiredEndSemScoreB > 100) {
            return `Need 50/100 in End Sem to pass`;
          }
          return `Need ${Math.ceil(requiredEndSemScoreB)}/100 in End Sem for B grade`;
        }
        return `Need ${Math.ceil(requiredEndSemScore)}/100 in End Sem for A grade`;
      }
    }
    
    return `Internals average: ${((totalCompScored / Math.max(1, totalCompMax)) * 100).toFixed(1)}%`;
  }, [marks]);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [dayOffset]);

  const targetCalInfo = byDate.get(targetDate);
  const targetDateObj = new Date(targetDate + "T00:00:00");
  const targetDayOfWeek = targetDateObj.getDay();
  const isWeekend = [0, 6].includes(targetDayOfWeek);
  const isHoliday = targetCalInfo ? !!targetCalInfo.isHoliday : isWeekend;
  const dayOrder = targetCalInfo?.dayOrder || (!isHoliday && targetDayOfWeek >= 1 && targetDayOfWeek <= 5 ? targetDayOfWeek : null);

  const targetClasses = useMemo(() => {
    if (!ttData?.data?.rows || !myTTData?.data || isHoliday || !dayOrder) return [];
    const rows = ttData.data.rows;
    const courses = myTTData.data?.courses || myTTData.data || [];
    const slotMap = buildSlotToCourseMap(courses);
    const schedule = buildSchedule(rows, slotMap, att);
    // Find the row that matches Day Order X
    const targetRow = schedule.find(s => {
      const header = String(s.day || "");
      const dOrder = parseInt(header.match(/\d+/)?.[0] || "0");
      return dOrder === dayOrder;
    });
    return targetRow?.classes || [];
  }, [ttData, myTTData, att, dayOrder, isHoliday]);

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const sortedTargetClasses = useMemo(() => {
    return [...targetClasses].sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
  }, [targetClasses]);

  const sortedTomorrowClasses = useMemo(() => {
    return [...tomorrowClasses].sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
  }, [tomorrowClasses]);

  const currentClass = dayOffset === 0
    ? sortedTargetClasses.find((cls: ScheduleItem) => {
        const start = parseStart(cls.startTime);
        const end = parseEnd(cls.endTime);
        return nowMin >= start && nowMin < end;
      })
    : undefined;

  const nextClassToday = dayOffset === 0
    ? sortedTargetClasses.find((cls: ScheduleItem) => parseStart(cls.startTime) > nowMin)
    : undefined;

  let nextClass: ScheduleItem | undefined = undefined;
  let isNextClassTomorrow = false;
  let timeUntilNextClass: number | null = null;

  if (dayOffset === 0) {
    if (nextClassToday) {
      nextClass = nextClassToday;
      timeUntilNextClass = parseStart(nextClassToday.startTime) - nowMin;
    } else if (sortedTomorrowClasses.length > 0) {
      nextClass = sortedTomorrowClasses[0];
      isNextClassTomorrow = true;
      timeUntilNextClass = (24 * 60 - nowMin) + parseStart(nextClass.startTime);
    }
  } else {
    nextClass = sortedTargetClasses[0];
  }

  const currentClassMeta = useMemo(() => {
    return {
      endsInMinutes: currentClass ? parseEnd(currentClass.endTime) - nowMin : null
    };
  }, [currentClass, nowMin]);

  const nextClassMeta = useMemo(() => {
    return {
      isTomorrow: isNextClassTomorrow,
      startsInMinutes: timeUntilNextClass
    };
  }, [isNextClassTomorrow, timeUntilNextClass]);

  const gridSlots = useMemo(() => {
    if (!ttData?.data?.rows || targetClasses.length === 0) return Array(10).fill(null);
    const timeRow = ttData.data.rows.find((r: AnyValue) => r[0] === "FROM");
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

  const studentInfo = myTTData?.data?.studentInfo || data?.profile || null;

  const renderStudentInfoModal = () => {
    if (!showStudentInfo || !studentInfo) return null;
    return (
      <div 
        onClick={() => setShowStudentInfo(false)}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}
      >
        <div onClick={e => e.stopPropagation()} style={{
          background: "rgba(10, 10, 15, 0.95)", padding: "28px", borderRadius: "28px",
          width: "100%", maxWidth: "450px", border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.02)", maxHeight: "80vh", overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>Student Details</div>
            <button onClick={() => setShowStudentInfo(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            {["Registration Number", "Name", "Combo / Batch", "Program", "Department", "Semester", "Class Room"].map(key => {
              const value = studentInfo[key] || 
                            studentInfo[key.toLowerCase()] || 
                            studentInfo[key.replace(/\s+/g, '')] ||
                            studentInfo[key.replace(/\s+/g, '').toLowerCase()];
              if (!value) return null;
              return (
                <div key={key} style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800, marginBottom: "4px" }}>{key}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{value}</div>
                </div>
              );
            })}
          </div>

          {studentInfo.advisors && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#FF75C3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Advisors</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(studentInfo.advisors).map(([key, lines]: AnyValue) => {
                  if (!lines || lines.length === 0) return null;
                  return (
                    <div key={key} style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {lines.map((line: string, i: number) => (
                        <div key={i} style={{ 
                          fontSize: i === 0 ? "14px" : "12px", 
                          fontWeight: i === 0 ? 800 : 600, 
                          color: i === 0 ? "#fff" : "rgba(255,255,255,0.6)",
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

  const themeProps = { 
    data, riskCount, avgAtt, avgMarks, totalCourses, 
    targetClasses, nextClass, recentTop5, initials, 
    firstName, dayOrder, isHoliday, dayOffset, setDayOffset,
    onShowStudentInfo: () => setShowStudentInfo(true),
    broadcast, setIsSyncModalOpen, renderAcademicIntegrityHub,
    userBatch: batch, totalHours, presentHours, absentHours, nowMin,
    fmtTimeOnly, fmt12, parseStart, parseEnd, isNowIn, BATCH_PERIODS, BroadcastBanner
  };

  const activeDashboard = (() => {
    if (!mounted) return null;
    return (
      <AuraDashboard 
        data={data} marks={data?.marks || []} avgAtt={avgAtt} avgMarks={avgMarks} firstName={firstName} 
        currentClass={currentClass}
        nextClass={nextClass}
        currentClassMeta={currentClassMeta}
        nextClassMeta={nextClassMeta}
        targetClasses={targetClasses} onShowStudentInfo={() => setShowStudentInfo(true)}
        broadcast={broadcast} renderAcademicIntegrityHub={renderAcademicIntegrityHub}
        upcomingEvents={upcomingEvents}
        tomorrowSkipStats={tomorrowSkipStats}
        totalSafeSkips={totalSafeSkips}
        nextRiskyClassText={nextRiskyClassText}
        marksTargetBrief={marksTargetBrief}
        safeSubjectsCount={safeSubjectsCount}
        riskySubjectsCount={riskySubjectsCount}
        onConnectPortal={() => setIsSyncModalOpen(true)}
      />
    );
  })();

  if (!mounted) {
    return (
      <div className="page-root" style={{ background: "#050508", height: "100vh", width: "100%", overflow: 'hidden' }} />
    );
  }

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  return (
    <div style={{ height: "100vh", width: "100%", background: "#000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <main
        className="dashboard-scroll-region"
        style={{
          flex: 1,
          width: "100%",
          minWidth: 0,
          maxWidth: "100%",
          overflowX: "hidden",
          overflowY: "auto",
          overscrollBehaviorX: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {activeDashboard}
        {isSyncModalOpen && (
          <PortalSyncModal isOpen onClose={() => setIsSyncModalOpen(false)} onSuccess={() => {}} netId="" />
        )}
        {renderStudentInfoModal()}
      </main>
    </div>
  );
}

function BroadcastBanner({ broadcast }: AnyValue) {
  if (!broadcast || !broadcast.active || !broadcast.message) return null;
  const colors: Record<string, { bg: string, text: string, border: string }> = {
    info: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" },
    success: { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981", border: "rgba(16, 185, 129, 0.2)" },
    warning: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "rgba(239, 68, 68, 0.2)" }
  };
  const theme = colors[broadcast.type] || colors.info;

  return (
    <div style={{
      background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: "16px", padding: "16px",
      marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", animation: "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      <div style={{ color: theme.text }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
      </div>
      <div>
        <div style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: theme.text, marginBottom: "4px" }}>System Announcement</div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>{broadcast.message}</div>
      </div>
    </div>
  );
}
