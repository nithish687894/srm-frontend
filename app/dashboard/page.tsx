"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useThemeStore } from "@/lib/themeStore";
import { motion } from "framer-motion";
import { extractBatch } from "@/lib/utils";
import PortalSyncModal from "@/components/PortalSyncModal";
import StudentPortalPrompt from "@/components/StudentPortalPrompt";
import { ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import HackerDashboard from "@/components/hacker-os/HackerDashboard";
import AuraDashboard from "@/components/aura-theme/AuraDashboard";

// Dynamic imports for performance optimization
const MatrixDashboard = dynamic(() => import("@/components/MatrixDashboard"), { ssr: false });
const CosmosDashboard = dynamic(() => import("@/components/CosmosDashboard"), { ssr: false });

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

function buildSlotToCourseMap(myTT: any[]) {
  const map: Record<string, any> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function buildSchedule(gridRows: any[], slotMap: Record<string, any>, attendance: any[] = []): { day: string; classes: ScheduleItem[] }[] {
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
      classes.push({ slot: group.cells.map(c => c.slot).join("-"), startTime: startRange.start, endTime: endRange.end, courseTitle: course.courseTitle, courseCode: course.courseCode, roomNo: course.roomNo, facultyName: course.facultyName, courseType: course.courseType });
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
        classes.push({ slot: s, startTime: start, endTime: end, courseTitle: course.courseTitle, courseCode: course.courseCode, roomNo: course.roomNo, facultyName: course.facultyName, courseType: course.courseType });
        break;
      }
    });

    classes.sort((a, b) => parseStart(a.startTime) - parseStart(b.startTime));
    return { day: row[0] as string, classes };
  });
}

function MiniGridTile({ slot }: { slot: any }) {
  if (!slot || slot.isEmpty) return <div style={{ background: "transparent", borderRadius: "16px", height: "88px", border: "1px dashed #333333" }} />;
  const isActive = isNowIn(slot.startTime, slot.endTime);
  const isNso = slot.courseCode.includes("NSO") || slot.courseType.toLowerCase().includes("practical");
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      style={{ background: isNso ? "#0d1a2a" : "#1c1c1c", borderRadius: "16px", height: "88px", padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: isActive ? "1.5px solid #a8c200" : "none", cursor: 'pointer' }}>
      <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: "8px", color: "#888888", marginBottom: "4px", fontWeight: "bold" }}>{slot.courseCode.substring(0, 5)} • {slot.roomNo?.split(",")[0]?.substring(0, 4) || "TBA"}</div>
        <span style={{ fontSize: "11px", fontWeight: "900", color: isNso ? "#00aaff" : "#ffffff", textAlign: "center", lineHeight: 1.1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textTransform: "capitalize", wordBreak: "break-word" }}>{slot.courseTitle.toLowerCase()}</span>
      </div>
      <div style={{ fontSize: "9px", color: "#888888", textAlign: "center", fontWeight: "bold" }}>
        {fmtTimeOnly(slot.startTime) === fmtTimeOnly(slot.endTime) ? fmtTimeOnly(slot.startTime) : `${fmtTimeOnly(slot.startTime)} - ${fmtTimeOnly(slot.endTime)}`}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { email, setProfile, academicData, setAcademicData, studentPortalConnected, setStudentPortalConnected, setStudentPortalData, studentPortalData } = useAuthStore();
  const [data, setData] = useState<any>(academicData || null);
  const [loading, setLoading] = useState(!academicData);
  const [ttData, setTTData] = useState<any>(null);
  const [myTTData, setMyTTData] = useState<any>(null);
  const [calData, setCalData] = useState<any>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const renderAcademicIntegrityHub = (mode: "default" | "matrix" | "aura" = "default") => {
    const isMatrix = mode === "matrix";
    const isAura = mode === "aura";
    // Use studentPortalData from Zustand as fallback when local state hasn't synced yet
    const spData = data?.studentPortal || studentPortalData;
    const hasData = studentPortalConnected && !!spData && !!spData.marks && !!spData.profile;
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
            <div style={{ fontSize: "10px", fontWeight: 900, color: isAura ? "#FF75C3" : isMatrix ? "#a8c200" : "#00ff88", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "4px" }}>Official Performance</div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#fff" }}>Academic Intelligence Hub</h3>
          </div>
          <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <ShieldCheck size={20} color={isAura ? "#8F92FF" : isMatrix ? "#a8c200" : "#00ff88"} />
          </div>
        </div>

        {hasData ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>{spData?.marks?.failed?.length || 0}</div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase" }}>Arrears</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>{spData?.marks?.marks?.length || 0}</div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase" }}>Grades Logged</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "20px", fontWeight: "900", color: isAura ? "#FF75C3" : isMatrix ? "#a8c200" : "#00ff88" }}>{spData?.marks?.sgpa || spData?.marks?.SGPA || data?.academia?.profile?.["SGPA"] || "—"}</div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase" }}>SGPA</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "20px", fontWeight: "900", color: isAura ? "#FF75C3" : isMatrix ? "#a8c200" : "#00ff88" }}>{spData?.marks?.cgpa || spData?.marks?.CGPA || data?.academia?.profile?.["CGPA"] || "—"}</div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase" }}>CGPA</div>
            </div>
          </div>
        ) : studentPortalConnected ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            {syncError ? (
              <>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#EF4444", marginBottom: "8px" }}>Sync Failed</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>{syncError}</div>
                <button 
                  onClick={() => setIsSyncModalOpen(true)}
                  style={{ padding: "8px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", cursor: "pointer" }}
                >
                  Retry Unlock
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Synchronizing Portal...</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Updating academic intelligence hub...</div>
              </>
            )}
          </div>
        ) : (
          <StudentPortalPrompt inline onConnect={() => setIsSyncModalOpen(true)} />
        )}
      </div>
    );
  };
  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [broadcast, setBroadcast] = useState<any>(null);
  const [batch, setBatch] = useState<number>(() => {
    const raw = academicData?.profile?.["Combo / Batch"] || "";
    return extractBatch(raw);
  });


  useEffect(() => {
    if (!ready) return;
    dataAPI.getUnified()
      .then(d => {
        if (d && d.success) {
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
    dataAPI.getTimetable(batch).then(d => setTTData(d)).catch(() => { });
    dataAPI.getCalendar().then(d => setCalData(d)).catch(() => { });
    dataAPI.getMyTimetable().then(d => setMyTTData(d)).catch(() => { });
    dataAPI.getBroadcast().then(d => setBroadcast(d)).catch(() => { });
  }, [ready, batch]);

  const att = data?.attendance || [];
  const marks = data?.marks || [];

  // Calculate top stats
  const totalCourses = att.length;
  const avgAtt = att.length ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1) : "—";
  const riskCount = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;

  // Aggregate Hours
  const totalHours = att.reduce((s: number, c: any) => s + (parseInt(c["Hours Conducted"]) || 0), 0);
  const presentHours = att.reduce((s: number, c: any) => s + (parseInt(c["Hours Attended"]) || (parseInt(c["Hours Conducted"]) - parseInt(c["Hours Absent"])) || 0), 0);
  const absentHours = att.reduce((s: number, c: any) => s + (parseInt(c["Hours Absent"]) || 0), 0);

  // Calculate average marks
  const totalScored = marks.reduce((s: number, m: any) => s + (m.tests?.reduce((a: number, t: any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s: number, m: any) => s + (m.tests?.reduce((a: number, t: any) => { const [, mx] = t.test.split("/"); return a + (parseFloat(mx) || 0); }, 0) || 0), 0);
  const avgMarks = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : "—";

  // Recent 5 marks without 0 place holders
  const recentMarksList: any[] = [];
  marks.forEach((m: any) => {
    m.tests?.forEach((t: any) => {
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
    const events: any[] = [];
    const sortedDays = Array.from(byDate.values()).sort((a: any, b: any) => a.isoDate.localeCompare(b.isoDate));
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
          let eventTitle = d.event && d.event !== "-" ? d.event : d.isHoliday ? "University Holiday" : `Academic Cycle: Day Order ${d.dayOrder}`;
          
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

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nextClass = dayOffset === 0
    ? targetClasses.find((c: ScheduleItem) => parseStart(c.startTime) > nowMin || isNowIn(c.startTime, c.endTime))
    : targetClasses[0];

  const gridSlots = useMemo(() => {
    if (!ttData?.data?.rows || targetClasses.length === 0) return Array(10).fill(null);
    const timeRow = ttData.data.rows.find((r: any) => r[0] === "FROM");
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

  const studentInfo = myTTData?.data?.studentInfo || null;

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
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>Student Details</div>
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

  if (loading && !data) return (
    <div className="page-root" style={{ 
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
      background: "#000", position: "fixed", inset: 0, zIndex: 1000, overflow: 'hidden'
    }}>
      {/* Background Neural Field */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #111 0%, #000 100%)' }}
        />
      </div>

      {/* Animated Aura Blobs for Loading */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15], rotate: [0, 180, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: '#FF75C3', filter: 'blur(100px)', zIndex: 0 }}
      />
      <motion.div 
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1], rotate: [360, 180, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: '#8F92FF', filter: 'blur(120px)', zIndex: 0 }}
      />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(255,255,255,0.05)", backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', display: "flex", alignItems: "center", justifyContent: "center", margin: '0 auto 32px', boxShadow: '0 0 30px rgba(143, 146, 255, 0.2)' }}
        >
          <img src="/nexus-logo.png" alt="Logo" style={{ width: "40px", height: "40px", filter: 'drop-shadow(0 0 10px #8F92FF)' }} />
        </motion.div>

        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: "10px", fontWeight: 900, letterSpacing: "0.5em", color: "#fff", textTransform: "uppercase", marginBottom: "8px" }}
        >
          Initializing Aura Space
        </motion.div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Syncing academic nebula...</div>
      </div>
    </div>
  );

  const themeProps = { 
    data, riskCount, avgAtt, avgMarks, totalCourses, 
    targetClasses, nextClass, recentTop5, initials, 
    firstName, dayOrder, isHoliday, dayOffset, setDayOffset,
    onShowStudentInfo: () => setShowStudentInfo(true),
    broadcast, setIsSyncModalOpen, renderAcademicIntegrityHub,
    userBatch: batch, totalHours, presentHours, absentHours, nowMin,
    fmtTimeOnly, fmt12, parseStart, parseEnd, isNowIn, BATCH_PERIODS, BroadcastBanner
  };

  const activeDashboard = useMemo(() => {
    if (!mounted) return null;
    switch (theme) {
      case "matrix": return <MatrixDashboard {...themeProps} />;
      case "cosmos": return <CosmosDashboard {...themeProps} />;
      default: return (
        <AuraDashboard 
          data={data} avgAtt={avgAtt} avgMarks={avgMarks} firstName={firstName} 
          nextClass={nextClass} onShowStudentInfo={() => setShowStudentInfo(true)}
          broadcast={broadcast} renderAcademicIntegrityHub={renderAcademicIntegrityHub}
          upcomingEvents={upcomingEvents}
        />
      );
    }
  }, [mounted, theme, data, themeProps, upcomingEvents, firstName, nextClass, broadcast]);

  if (!mounted) {
    return (
      <div className="page-root" style={{ background: "#050508", height: "100vh", width: "100vw", overflow: 'hidden' }} />
    );
  }

  return (
    <>
      {activeDashboard}
      <PortalSyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSuccess={() => {}} netId="" />
      {renderStudentInfoModal()}
    </>
  );
}


function BroadcastBanner({ broadcast }: any) {
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
