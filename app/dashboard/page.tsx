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
import UnsplashBackground from "@/components/UnsplashBackground";
import StudentPortalPrompt from "@/components/StudentPortalPrompt";
import { ShieldCheck } from "lucide-react";

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
  const { email, setProfile, academicData, setAcademicData, studentPortalConnected, setStudentPortalConnected, setStudentPortalData } = useAuthStore();
  const [data, setData] = useState<any>(academicData || null);
  const [loading, setLoading] = useState(!academicData);
  const [ttData, setTTData] = useState<any>(null);
  const [myTTData, setMyTTData] = useState<any>(null);
  const [calData, setCalData] = useState<any>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [mounted, setMounted] = useState(false);

  const renderAcademicIntegrityHub = (isMatrix = false) => {
    const hasData = studentPortalConnected && !!data?.studentPortal?.marks;
    return (
      <div style={{ 
        background: isMatrix ? "#1c1c1c" : "linear-gradient(135deg, rgba(0, 255, 136, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)",
        border: isMatrix ? "1px solid #333" : "1px solid rgba(255, 255, 255, 0.05)", 
        borderRadius: "24px", padding: "24px", marginBottom: "32px",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 900, color: isMatrix ? "#a8c200" : "#00ff88", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "4px" }}>Official Performance</div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#fff" }}>Academic Intelligence Hub</h3>
          </div>
          <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <ShieldCheck size={20} color={isMatrix ? "#a8c200" : "#00ff88"} />
          </div>
        </div>

        {hasData ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>{data?.studentPortal?.marks?.failed?.length || 0}</div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase" }}>Arrears Tracked</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "16px" }}>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>{data?.studentPortal?.marks?.marks?.filter((m: any) => m.grade === 'U').length || 0}</div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#666", textTransform: "uppercase" }}>Official Grades</div>
            </div>
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
    setMounted(true);
  }, []);

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

  const { byDate } = useMemo(() => {
    if (!calData) return { byDate: new Map() };
    try { return buildCalendarIndex(calData); } catch { return { byDate: new Map() }; }
  }, [calData]);

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
    return schedule[dayOrder - 1]?.classes || [];
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

  if (!mounted || (loading && !data)) return (
    <div className="page-root" style={{ 
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
      background: "#000", gap: "32px", position: "fixed", inset: 0, zIndex: 1000 
    }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ 
          width: "120px", height: "120px", borderRadius: "30px", 
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 50px rgba(59, 130, 246, 0.2)"
        }}
      >
        <img src="/nexus-logo.png" alt="Logo" style={{ width: "60px", height: "60px" }} />
      </motion.div>
      <div style={{ textAlign: "center" }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.5em", color: "#fff", textTransform: "uppercase", marginBottom: "12px" }}
        >
          Decrypting Academic Data
        </motion.div>
        <div style={{ width: "200px", height: "2px", background: "rgba(255,255,255,0.05)", borderRadius: "1px", margin: "0 auto", overflow: "hidden" }}>
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ width: "50%", height: "100%", background: "linear-gradient(90deg, transparent, #3b82f6, transparent)" }}
          />
        </div>
      </div>
    </div>
  );

  if (theme === "cosmos") return (
    <>
      <CosmosDashboard data={data} riskCount={riskCount} avgAtt={avgAtt} avgMarks={avgMarks} totalCourses={totalCourses} targetClasses={targetClasses} nextClass={nextClass} recentTop5={recentTop5} initials={initials} firstName={firstName} dayOrder={dayOrder} isHoliday={isHoliday} onShowStudentInfo={() => setShowStudentInfo(true)} broadcast={broadcast} setIsSyncModalOpen={setIsSyncModalOpen} renderAcademicIntegrityHub={renderAcademicIntegrityHub} userBatch={batch} totalHours={totalHours} presentHours={presentHours} absentHours={absentHours} />
      <PortalSyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSuccess={() => { dataAPI.getUnified().then(d => { if (d?.success) { const merged = { ...d.academia, studentPortal: d.studentPortal }; setData(merged); setAcademicData(merged); } }).catch(() => {}); }} netId={academicData?.profile?.["Student ID"] || academicData?.profile?.["Registration Number"] || ""} />
      {renderStudentInfoModal()}
    </>
  );

  if (theme === "matrix") return (
    <>
      <MatrixDashboard data={data} riskCount={riskCount} avgAtt={avgAtt} avgMarks={avgMarks} totalCourses={totalCourses} targetClasses={targetClasses} nextClass={nextClass} initials={initials} firstName={firstName} dayOrder={dayOrder} isHoliday={isHoliday} dayOffset={dayOffset} setDayOffset={setDayOffset} onShowStudentInfo={() => setShowStudentInfo(true)} broadcast={broadcast} nowMin={nowMin} setIsSyncModalOpen={setIsSyncModalOpen} renderAcademicIntegrityHub={renderAcademicIntegrityHub} userBatch={batch} totalHours={totalHours} presentHours={presentHours} absentHours={absentHours} />
      <PortalSyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSuccess={() => { dataAPI.getUnified().then(d => { if (d?.success) { const merged = { ...d.academia, studentPortal: d.studentPortal }; setData(merged); setAcademicData(merged); } }).catch(() => {}); }} netId={academicData?.profile?.["Student ID"] || academicData?.profile?.["Registration Number"] || ""} />
      {renderStudentInfoModal()}
    </>
  );

  return (
    <div className="page-root">
      <UnsplashBackground query="university campus night cyberpunk" />
      <Sidebar />
      {renderStudentInfoModal()}
      <PortalSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        onSuccess={() => { dataAPI.getUnified().then(d => { if (d?.success) { const merged = { ...d.academia, studentPortal: d.studentPortal }; setData(merged); setAcademicData(merged); } }).catch(() => {}); }}
        netId={email?.split('@')[0] || academicData?.profile?.['Student ID'] || academicData?.profile?.['Registration Number'] || ""}
      />
      <main className="page-main" style={{ position: 'relative', zIndex: 1 }}>
        <div className="page-content" data-section="Portal" style={{ paddingBottom: "120px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div 
              onClick={() => setShowStudentInfo(true)}
              style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#1c1c1c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
              {initials}
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ fontSize: "12px", color: "#666666", marginBottom: "2px" }}>Welcome Back</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", letterSpacing: "-0.5px" }}>{firstName}</div>
              
              {/* Sync Button */}
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                style={{ 
                  marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", 
                  padding: "6px 12px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.1)", 
                  border: "1px solid rgba(59, 130, 246, 0.2)", color: "#3b82f6", 
                  fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" 
                }}
              >
                <ShieldCheck size={14} />
                Unlock Official History
              </button>
            </div>
          </div>

          {/* New: Unified History Card */}
          {renderAcademicIntegrityHub()}

          {/* Top Stats Cards */}
          {(() => {
            const stats = [
              { label: "Attendance", value: `${avgAtt}%`, color: "var(--accent)", href: "/attendance" },
              { label: "Avg Marks", value: `${avgMarks}%`, color: "var(--text-primary)", href: "/marks" },
              { label: "At Risk", value: riskCount, color: riskCount > 0 ? "var(--accent-red)" : "var(--text-secondary)", href: "/attendance?risk=1" },
              { label: "Courses", value: totalCourses, color: "var(--text-secondary)" },
            ];

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "32px" }}>
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    whileTap={s.href ? { scale: 0.94 } : {}}
                    className="min-card"
                    onClick={s.href ? () => router.push(s.href) : undefined}
                    style={{ padding: "16px 12px", textAlign: "center", border: "none", cursor: s.href ? "pointer" : "default" }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color, marginBottom: "4px" }}>{s.value}</div>
                    <div style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>
            );
          })()}

          {/* Date / Day Order Selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
              {isHoliday ? `Holiday • ${dayOffset === 0 ? "Today" : "Later"}` : `Day Order ${dayOrder} • ${dayOffset === 0 ? "Today" : "Later"}`}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setDayOffset(o => o - 1)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}>‹</button>
              <button onClick={() => setDayOffset(o => o + 1)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}>›</button>
            </div>
          </div>

          {/* Next Up / Today's Schedule */}
          {targetClasses.length > 0 ? (
            <>
              {nextClass ? (
                <div style={{ marginBottom: "32px", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", position: "relative", zIndex: 10 }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800 }}>Next Up</span>
                    <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 800, background: "var(--bg-surface)", padding: "4px 12px", borderRadius: "12px", border: "1px solid var(--border)" }}>{nextClass.roomNo || "TBA"}</span>
                  </div>
                  <div className="font-heading" style={{
                    fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 0.9,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    wordBreak: "break-word", textTransform: "uppercase", marginBottom: "20px", marginTop: "12px"
                  }}>
                    {nextClass.courseTitle}
                  </div>
                  <div className="min-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>STATUS • <span style={{ fontWeight: 900 }}>{nextClass.courseCode.substring(0, 5)}</span></div>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 900 }}>
                      {fmtTimeOnly(nextClass.startTime) === fmtTimeOnly(nextClass.endTime) ? fmtTimeOnly(nextClass.startTime) : `${fmtTimeOnly(nextClass.startTime)} — ${fmtTimeOnly(nextClass.endTime)}`}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Mini Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "40px" }}>
                {gridSlots.map((s, i) => (
                  <MiniGridTile key={i} slot={s} />
                ))}
              </div>
            </>
          ) : (
            <div style={{ background: "#1c1c1c", borderRadius: "20px", padding: "40px", textAlign: "center", marginBottom: "40px" }}>
              <div style={{ fontSize: "32px", color: "#333", marginBottom: "16px" }}>☕</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>No Classes Scheduled</div>
              <div style={{ fontSize: "12px", color: "#888888", marginTop: "8px" }}>Enjoy your free time.</div>
            </div>
          )}

          {/* Action Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {riskCount > 0 && (
              <div onClick={() => router.push("/attendance")} style={{ background: "#1a0000", border: "2px dashed #ff3b3b", borderRadius: "24px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#ff3b3b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>Academic Emergency</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#ff3b3b", lineHeight: 1 }}>{riskCount} Subjects At Risk</div>
                  <div style={{ fontSize: "12px", color: "#ff3b3b", fontStyle: "italic", marginTop: "8px" }}>Tap to view details</div>
                </div>
                <div style={{ color: "#ff3b3b", fontSize: "24px" }}>›</div>
              </div>
            )}

            <div onClick={() => router.push("/marks")} className="min-card" style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>Recent Marks</div>
                <div style={{ color: "var(--text-primary)", fontSize: "24px" }}>›</div>
              </div>
              {recentTop5.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {recentTop5.map((rm, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>{rm.courseCode}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>{rm.label}</div>
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: "16px", color: "var(--accent)" }}>
                        {rm.score}/{rm.max}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>No recent assessments recorded.</div>
              )}
            </div>
          </div>

          <div className="watermark">Dashboard</div>
        </div>
      </main>
    </div>
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


function MatrixDashboard({ data, riskCount, avgAtt, avgMarks, totalCourses, targetClasses, nextClass, initials, firstName, dayOrder, isHoliday, dayOffset, setDayOffset, onShowStudentInfo, broadcast, nowMin, setIsSyncModalOpen, renderAcademicIntegrityHub, userBatch, totalHours, presentHours, absentHours }: any) {
  const PERIODS = BATCH_PERIODS[userBatch as keyof typeof BATCH_PERIODS] || BATCH_PERIODS[1];
  const router = useRouter();
  const profile = data?.profile || {};
  const regNo = profile["Registration Number"] || "UNKNOWN";
  const batchDisplay = profile["Combo / Batch"] || profile["Batch"] || (userBatch ? `Batch ${userBatch}` : "N/A");

  const firstStart = targetClasses[0] ? fmtTimeOnly(targetClasses[0].startTime) : "";
  const lastEnd = targetClasses[targetClasses.length - 1] ? fmtTimeOnly(targetClasses[targetClasses.length - 1].endTime) : "";

  // Find best attendance
  const bestAtt = data?.attendance?.length ? [...data.attendance].sort((a: any, b: any) => parseFloat(b["Attn %"]) - parseFloat(a["Attn %"]))[0] : null;

  return (
    <div style={{ background: "#000000", minHeight: "100vh", paddingBottom: "120px", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main style={{ padding: "16px 20px 20px" }}>

        {/* System Status / Profile Intro */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#a8c200", letterSpacing: "0.2em", fontWeight: 900, marginBottom: "4px" }}>SYSTEM INITIALIZED</div>
              <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>{firstName.toUpperCase()}</div>
              <div style={{ fontSize: "11px", color: "#666", fontWeight: 800, marginTop: "6px" }}>ID: {regNo} • {batchDisplay}</div>
            </div>
            <div>
              <div 
                onClick={onShowStudentInfo}
                style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#1c1c1c", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900, cursor: "pointer" }}>
                 {initials}
              </div>
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                style={{ marginTop: "8px", background: "rgba(168, 194, 0, 0.1)", border: "1px solid rgba(168, 194, 0, 0.2)", color: "#a8c200", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" }}
              >
                Unlock History
              </button>
            </div>
          </div>
        </div>

        {/* Hero Performance Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          <motion.div whileTap={{ scale: 0.94 }} onClick={() => router.push("/attendance")} style={{ background: "#1c1c1c", borderRadius: "24px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: "10px", color: "#666", fontWeight: 900, textTransform: "uppercase", marginBottom: "12px" }}>Attnd</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#a8c200" }}>{avgAtt}%</div>
          </motion.div>
          <motion.div whileTap={{ scale: 0.94 }} onClick={() => router.push("/marks")} style={{ background: "#1c1c1c", borderRadius: "24px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: "10px", color: "#666", fontWeight: 900, textTransform: "uppercase", marginBottom: "12px" }}>Marks</div>
            <div style={{ fontSize: "24px", fontWeight: 900 }}>{avgMarks}%</div>
          </motion.div>
          <motion.div whileTap={{ scale: 0.94 }} onClick={() => router.push("/attendance?risk=1")} style={{ background: riskCount > 0 ? "#221111" : "#1c1c1c", borderRadius: "24px", padding: "20px", textAlign: "center", border: riskCount > 0 ? "1px solid #ff3b3b" : "none", cursor: "pointer" }}>
            <div style={{ fontSize: "10px", color: "#666", fontWeight: 900, textTransform: "uppercase", marginBottom: "12px" }}>Risk</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: riskCount > 0 ? "#ff3b3b" : "#fff" }}>{riskCount}</div>
          </motion.div>
        </div>

        {/* Highlights / Best Section */}
        {bestAtt && (
          <div style={{ background: "#1c1c1c", borderRadius: "28px", padding: "24px", marginBottom: "40px", border: "1px solid #333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#a8c200", letterSpacing: "0.15em", fontWeight: 900 }}>ACADEMIC PEAK</div>
              <div style={{ background: "#a8c200", color: "#000", fontSize: "10px", fontWeight: 900, padding: "4px 10px", borderRadius: "8px" }}>TOP TIER</div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, lineHeight: 1.2, marginBottom: "8px" }}>{bestAtt["Course Title"]}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#a8c200" }}>{bestAtt["Attn %"]}%</div>
              <div style={{ fontSize: "12px", color: "#666", fontWeight: 800 }}>ATTENDANCE RECORD</div>
            </div>
          </div>
        )}

        {/* New: Unified History Card */}
        {renderAcademicIntegrityHub(true)}

        {/* Header */}
        <BroadcastBanner broadcast={broadcast} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <button onClick={() => setDayOffset((o: any) => o - 1)} style={{ background: "#1c1c1c", border: "1px solid #333", color: "#fff", width: "44px", height: "44px", borderRadius: "14px", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            <button onClick={() => setDayOffset((o: any) => o + 1)} style={{ background: "#1c1c1c", border: "1px solid #333", color: "#fff", width: "44px", height: "44px", borderRadius: "14px", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>{dayOffset === 0 ? "TODAY" : "SCHEDULE"}</div>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>Day Order {dayOrder || "—"}</div>
          </div>
        </div>

        {/* Timeline Classes */}
        <div style={{ position: "relative", paddingLeft: "12px" }}>
          <div style={{ position: "absolute", left: "0", top: "10px", bottom: "10px", width: "1px", background: "#333" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {(() => {
              if (isHoliday) return <div style={{ padding: "40px 0", color: "#444", fontWeight: 700, textAlign: "center" }}>No classes - Holiday</div>;
              
              return PERIODS.map((p, pi) => {
                const pStart = parseStart(p.start);
                const pEnd = parseEnd(p.end);
                const cls = targetClasses.find((c: any) => {
                  const cs = parseStart(c.startTime);
                  const ce = parseEnd(c.endTime);
                  return cs < pEnd && ce > pStart;
                });
                
                const isActive = cls ? isNowIn(cls.startTime, cls.endTime) : (nowMin >= pStart && nowMin < pEnd);

                return (
                  <div key={pi} style={{ position: "relative", paddingLeft: "32px", marginBottom: "8px" }}>
                    {/* Period Label */}
                    <div style={{ 
                      position: "absolute", left: "-6px", top: "50%", transform: "translateY(-50%)", 
                      width: "12px", height: "12px", borderRadius: "50%", 
                      background: isActive ? "#a8c200" : "#222", 
                      border: "2px solid #000", zIndex: 5,
                      boxShadow: isActive ? "0 0 10px #a8c200" : "none"
                    }} />
                    
                    <div style={{ 
                      position: "absolute", left: "-32px", top: "50%", transform: "translateY(-50%)", 
                      fontSize: "10px", fontWeight: 900, color: isActive ? "#a8c200" : "#444",
                      width: "20px", textAlign: "right"
                    }}>
                      {p.id}
                    </div>

                    {!cls ? (
                      /* Free Period */
                      <div style={{ padding: "12px 0" }}>
                        <div style={{ 
                          height: "1px", width: "100%", borderTop: "2px dashed #333", 
                          opacity: isActive ? 1 : 0.4, borderColor: isActive ? "#a8c200" : "#333" 
                        }} />
                      </div>
                    ) : (
                      /* Class Card */
                      <motion.div 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push("/timetable")}
                        style={{ 
                          background: "#121212", borderRadius: "18px", padding: "16px 20px", 
                          border: isActive ? "1px solid #a8c200" : "1px solid #222",
                          cursor: "pointer", position: "relative", overflow: "hidden"
                        }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 800, color: "#666", textTransform: "uppercase" }}>
                            {p.start} — {p.end}
                          </div>
                          <div style={{ fontSize: "10px", fontWeight: 900, color: isActive ? "#a8c200" : "#444" }}>
                            PERIOD {p.id}
                          </div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff", textTransform: "capitalize", letterSpacing: "-0.01em", marginBottom: "2px" }}>
                          {cls.courseTitle.toLowerCase()}
                        </div>
                        <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: "#666", fontWeight: 800 }}>
                          <span>{cls.courseCode}</span>
                          <span>•</span>
                          <span>{cls.roomNo || "TBA"}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="watermark" style={{ bottom: "140px" }}>Dashboard</div>
        <div style={{ height: "40px" }} />
      </main>
    </div>
  );
}

function CosmosDashboard({ data, riskCount, avgAtt, avgMarks, totalCourses, targetClasses, nextClass, recentTop5, initials, firstName, dayOrder, isHoliday, onShowStudentInfo, broadcast, setIsSyncModalOpen, renderAcademicIntegrityHub, userBatch, totalHours, presentHours, absentHours }: any) {
  const router = useRouter();
  const marksPct = parseFloat(avgMarks as string) || 0;
  const profile = data?.profile || {};
  const regNo = profile["Registration Number"] || "";
  const batchDisplay = profile["Combo / Batch"] || profile["Batch"] || (userBatch ? `Batch ${userBatch}` : "");

  return (
    <div style={{ background: "transparent", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FFFFFF" }}>
      <Sidebar />
      <main style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", gap: "12px" }}>
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg, #eef2ff 0%, #a5b4fc 50%, #fbcfe8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome back, {firstName}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Let&apos;s continue where you left off
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isHoliday ? "Today: Holiday" : `Today: Day Order ${dayOrder || "—"}`}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <div 
              onClick={onShowStudentInfo}
              style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #3055d7, #d946ef)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 15px rgba(217, 70, 239, 0.28)", cursor: "pointer" }}>
              {initials}
            </div>
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "4px 8px", borderRadius: "8px", fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}
            >
              Unlock More
            </button>
          </div>
        </div>

        <div className="min-card" style={{ padding: "10px 14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", borderRadius: "999px", background: "rgba(13, 20, 46, 0.6)" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "12px" }}>
            <span style={{ opacity: 0.8 }}>🔎</span>
            Search courses, assessments...
          </div>
          <div style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: "999px", padding: "6px 14px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", boxShadow: "0 2px 10px rgba(139, 92, 246, 0.35)" }}>
            AI Tutor
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "Enrolled", value: totalCourses, sub: "Courses", tone: "#00f0ff", shadow: "rgba(0, 240, 255, 0.16)" },
            { label: "Attendance", value: `${avgAtt}%`, sub: "Health", tone: "#f59e0b", shadow: "rgba(245, 158, 11, 0.16)", href: "/attendance" },
            { label: "Academics", value: `${avgMarks}%`, sub: "Average", tone: "#00E676", shadow: "rgba(0, 230, 118, 0.16)", href: "/marks" },
            { label: "At Risk", value: riskCount, sub: "Focus", tone: "#d946ef", shadow: "rgba(217, 70, 239, 0.18)", href: "/attendance?risk=1" },
          ].map((card, i) => (
            <div key={i} className="min-card" onClick={card.href ? () => router.push(card.href) : undefined} style={{ padding: "12px", borderRadius: "16px", borderTop: `1px solid ${card.tone}`, boxShadow: `0 8px 18px ${card.shadow}`, cursor: card.href ? "pointer" : "default" }}>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{card.label}</div>
              <div style={{ fontSize: "24px", fontWeight: 800, lineHeight: 1.1, color: "#fff" }}>{card.value}</div>
              <div style={{ fontSize: "10px", color: card.tone, marginTop: "6px", fontWeight: 700 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div className="min-card" style={{ padding: "18px", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1.1 }}>Continue Learning</div>
              <button onClick={() => router.push("/marks")} style={{ background: "none", border: "none", color: "#00f0ff", cursor: "pointer", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>View All</button>
            </div>
            <div style={{ background: "linear-gradient(145deg, rgba(59,130,246,0.15), rgba(124,58,237,0.12))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px", color: "#fff" }}>{nextClass?.courseTitle || "No upcoming class"}</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>{nextClass?.courseCode || "Schedule is clear for now"}</div>
              <div style={{ marginTop: "14px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}>
                <div style={{ width: "72%", height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #00f0ff, #d946ef)", boxShadow: "0 0 10px rgba(217, 70, 239, 0.4)" }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            {renderAcademicIntegrityHub()}
          </div>

          <div className="min-card" style={{ padding: "18px", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1.1 }}>Today&apos;s Schedule</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  {isHoliday ? "Holiday" : `Day ${dayOrder || "—"}`}
                </span>
                <button onClick={() => router.push("/timetable")} style={{ background: "none", border: "none", color: "#00f0ff", cursor: "pointer", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Calendar</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {targetClasses.length === 0 && (
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No classes planned.</div>
              )}
              {targetClasses.slice(0, 3).map((cls: any, i: number) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: "10px", background: "rgba(13, 20, 46, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "10px 12px", alignItems: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--accent-secondary)", fontWeight: 800, lineHeight: 1.2 }}>{fmt12(cls.startTime).replace(" ", "\n")}</div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{cls.courseTitle}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 600 }}>{cls.roomNo || "TBA"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {[
            { key: "marks", label: "Marks", value: `${avgMarks}%`, pct: marksPct, color: "#60A5FA", onClick: () => router.push("/marks") },
            { key: "risk", label: "Risk", value: `${riskCount}`, pct: Math.min((riskCount / Math.max(totalCourses || 1, 1)) * 100, 100), color: "#EF4444", onClick: () => router.push("/attendance?risk=1") },
            { key: "Recent", label: "Recent", value: `${recentTop5.length}`, pct: Math.min((recentTop5.length / 5) * 100, 100), color: "#8B5CF6" },
          ].map((s) => {
            const r = 18;
            const c = 2 * Math.PI * r;
            const offset = c * (1 - s.pct / 100);
            return (
              <div key={s.key} onClick={s.onClick} className="min-card" style={{ padding: "10px 8px", textAlign: "center", cursor: s.onClick ? "pointer" : "default", background: "rgba(255,255,255,0.03)" }}>
                <svg width="50" height="50" viewBox="0 0 50 50" style={{ marginBottom: "6px" }}>
                  <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                  <circle cx="25" cy="25" r={r} fill="none" stroke={s.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 25 25)" />
                </svg>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "3px", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "12px" }}>
          {regNo} {batchDisplay ? `• ${batchDisplay}` : ""}
        </div>
      </main>
    </div>
  );
}
