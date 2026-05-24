"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useThemeStore } from "@/lib/themeStore";
import { extractBatch } from "@/lib/utils";
import PortalSyncModal from "@/components/PortalSyncModal";
import StudentPortalPrompt from "@/components/StudentPortalPrompt";
import { ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
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

function buildSlotToCourseMap(myTT: AnyValue[]) {
  const map: Record<string, AnyValue> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

function buildSchedule(gridRows: AnyValue[], slotMap: Record<string, AnyValue>, attendance: AnyValue[] = []): { day: string; classes: ScheduleItem[] }[] {
  const timeRow = gridRows.find((r: AnyValue) => r[0] === "FROM");
  const times: string[] = timeRow ? timeRow.slice(1).map((t: string) => t.replace(/\t/g, "").trim().replace(/\n+/g, " ")) : [];
  const dayRows = gridRows.filter((r: AnyValue) => typeof r[0] === "string" && r[0].startsWith("Day"));

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

function MiniGridTile({ slot }: { slot: AnyValue }) {
  if (!slot || slot.isEmpty) return <div style={{ background: "transparent", borderRadius: "16px", height: "88px", border: "1px dashed #333333" }} />;
  const isActive = isNowIn(slot.startTime, slot.endTime);
  const isNso = slot.courseCode.includes("NSO") || slot.courseType.toLowerCase().includes("practical");
  return (
    <div
      style={{ background: isNso ? "#0d1a2a" : "#1c1c1c", borderRadius: "16px", height: "88px", padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: isActive ? "1.5px solid #a8c200" : "none", cursor: 'pointer', transition: "transform 0.1s" }}
      onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
      onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
      onPointerLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: "8px", color: "#888888", marginBottom: "4px", fontWeight: "bold" }}>{slot.courseCode.substring(0, 5)} • {slot.roomNo?.split(",")[0]?.substring(0, 4) || "TBA"}</div>
        <span style={{ fontSize: "11px", fontWeight: "900", color: isNso ? "#00aaff" : "#ffffff", textAlign: "center", lineHeight: 1.1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textTransform: "capitalize", wordBreak: "break-word" }}>{slot.courseTitle.toLowerCase()}</span>
      </div>
      <div style={{ fontSize: "9px", color: "#888888", textAlign: "center", fontWeight: "bold" }}>
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
  const [data, setData] = useState<AnyValue>(academicData || null);
  const [loading, setLoading] = useState(!academicData);
  const [ttData, setTTData] = useState<AnyValue>(null);
  const [myTTData, setMyTTData] = useState<AnyValue>(null);
  const [calData, setCalData] = useState<AnyValue>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentTime] = useState(() => Date.now());
  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

  // Loading logs hydration
  const [loadingLogIndex, setLoadingLogIndex] = useState(0);
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingLogIndex(prev => (prev < 5 ? prev + 1 : 0));
    }, 700);
    return () => clearInterval(interval);
  }, [loading]);

  const formatLastSynced = (dateInput: AnyValue) => {
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
  };

  const renderAcademicIntegrityHub = (mode: "default" | "matrix" | "aura" = "default") => {
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
            <div style={{ fontSize: "10px", fontWeight: 900, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "4px" }}>Official Performance</div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#fff" }}>Academic Intelligence Hub</h3>
            {hasSpData && (
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: studentPortalConnected ? primaryColor : "rgba(255,255,255,0.2)" }} />
                <span>Synced {formatLastSynced(spData?.lastSyncedAt)}</span>
              </div>
            )}
            {!hasSpData && (
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: primaryColor }} />
                <span>Academia OS Active</span>
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
  };
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

  const att = data?.attendance?.length ? data.attendance : (data?.studentPortal?.attendance || studentPortalData?.attendance || []);
  const marks = data?.marks?.length ? data.marks : (data?.studentPortal?.marks || studentPortalData?.marks || []);

  // Calculate top stats
  const totalCourses = att.length;
  const avgAtt = (() => {
    if (!att.length) return "—";
    const totalH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Conducted"]) || 0), 0);
    const presentH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Attended"]) || Math.max(0, (parseInt(c["Hours Conducted"]) || 0) - (parseInt(c["Hours Absent"]) || 0))), 0);
    return totalH > 0 ? ((presentH / totalH) * 100).toFixed(1) : "—";
  })();
  const riskCount = att.filter((c: AnyValue) => parseFloat(c["Attn %"]) < 75).length;

  // Aggregate Hours
  const totalHours = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Conducted"]) || 0), 0);
  const presentHours = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Attended"]) || (parseInt(c["Hours Conducted"]) - parseInt(c["Hours Absent"])) || 0), 0);
  const absentHours = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Absent"]) || 0), 0);

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
    switch (theme) {
      case "matrix": return <MatrixDashboard {...themeProps} />;
      case "cosmos": return <CosmosDashboard {...themeProps} />;
      default: return (
        <AuraDashboard 
          data={data} marks={data?.marks || []} avgAtt={avgAtt} avgMarks={avgMarks} firstName={firstName} 
          nextClass={nextClass} targetClasses={targetClasses} onShowStudentInfo={() => setShowStudentInfo(true)}
          broadcast={broadcast} renderAcademicIntegrityHub={renderAcademicIntegrityHub}
          upcomingEvents={upcomingEvents}
        />
      );
    }
  })();

  if (!mounted) {
    return (
      <div className="page-root" style={{ background: "#050508", height: "100vh", width: "100vw", overflow: 'hidden' }} />
    );
  }

  if (loading && !data) {
    const loadingSteps = [
      "INITIALIZING_SECURE_SESSION",
      "CONNECTING_TO_ACADEMIA_PORTAL",
      "ESTABLISHING_ENCRYPTED_TUNNEL",
      "RETRIEVING_ACADEMIC_RECORDS",
      "OPTIMIZING_TIMETABLE_CACHE",
      "READY_FOR_ACADEMIC_OS"
    ];

    // Compute rolling active terminal logs for dashboard space loader
    const rollingSteps = [];
    const startIdx = Math.max(0, loadingLogIndex - 2);
    const hexCodes = ["0x00A4", "0x1F2B", "0x8C92", "0x7E3A", "0x90BF", "0x4E7C"];
    const prefixes = ["[ BOOT ]", "[ SECURE ]", "[ AUTH ]", "[ SYNC ]", "[ DATA ]", "[ READY ]"];
    for (let i = startIdx; i <= loadingLogIndex; i++) {
      rollingSteps.push({
        index: i,
        hex: hexCodes[i] || "0x0000",
        prefix: prefixes[i] || "[ SYS ]",
        text: loadingSteps[i],
        isLatest: i === loadingLogIndex
      });
    }

    return (
      <div className="page-root" style={{ 
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
        background: "#020204", position: "fixed", inset: 0, zIndex: 1000, overflow: 'hidden'
      }}>
        {/* Dynamic Keyframes injected locally */}
        <style>{`
          @keyframes aura-spin-glow {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes aura-breath-glow {
            0% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.9) rotate(0deg); }
            50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.08) rotate(180deg); }
            100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.9) rotate(360deg); }
          }
          @keyframes aura-logo-float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
          }
          @keyframes aura-rotate-cw {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes aura-rotate-ccw {
            from { transform: rotate(360deg); }
            to { transform: rotate(-360deg); }
          }
          @keyframes aura-terminal-pulse {
            0% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          @keyframes aura-shimmer {
            100% { transform: translateX(100%); }
          }
          @keyframes aura-gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes aura-fade-in {
            from { opacity: 0; filter: blur(5px); transform: translateY(5px); }
            to { opacity: 1; filter: blur(0); transform: translateY(0); }
          }
          @keyframes aura-laser-scan {
            0%, 100% { top: 0%; opacity: 0.1; }
            50% { top: 100%; opacity: 1; filter: drop-shadow(0 0 6px #00E5FF); }
          }
          @keyframes aura-gloss-sweep {
            0% { left: -150%; }
            50% { left: 150%; }
            100% { left: 150%; }
          }
          @keyframes aura-pulse-halo {
            0%, 100% { transform: scale(0.95); opacity: 0.2; }
            50% { transform: scale(1.05); opacity: 0.5; }
          }
          @keyframes aura-pulse-shadow {
            0%, 100% { filter: drop-shadow(0 0 25px rgba(255, 45, 85, 0.45)) drop-shadow(0 0 5px rgba(255, 45, 85, 0.2)); }
            50% { filter: drop-shadow(0 0 40px rgba(0, 229, 255, 0.6)) drop-shadow(0 0 10px rgba(0, 229, 255, 0.3)); }
          }
          @keyframes aura-pulse-dot {
            0%, 100% { opacity: 0.4; transform: scale(0.85); }
            50% { opacity: 1; transform: scale(1.15); }
          }
          @keyframes aura-particle-float {
            0% { transform: translateY(0px) scale(0.5); opacity: 0; }
            20% { opacity: 0.6; }
            80% { opacity: 0.6; }
            100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
          }
          @keyframes aura-cursor-blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
          .aura-loading-text {
            font-size: 26px; 
            font-weight: 950; 
            background: linear-gradient(90deg, #ffffff, #FF2D55, #BF5AF2, #00E5FF, #ffffff);
            background-size: 200% auto;
            color: transparent; 
            -webkit-background-clip: text;
            background-clip: text;
            animation: aura-text-shimmer 4s linear infinite;
            margin-bottom: 4px; 
            text-transform: uppercase;
            letter-spacing: 0.16em;
            text-shadow: 0 0 35px rgba(191, 90, 242, 0.35);
          }
          @keyframes aura-text-shimmer {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
          .aura-badge {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 100px;
            padding: 8px 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03);
            font-size: 8.5px;
            font-family: monospace;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .aura-star {
            position: absolute;
            background: #ffffff;
            border-radius: 50%;
            filter: drop-shadow(0 0 4px #00E5FF);
            animation: aura-particle-float linear infinite;
            opacity: 0;
            pointer-events: none;
          }
          .aura-rolling-log {
            animation: aura-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            margin-bottom: 5px;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>

        {/* Ambient Top Diagnostics Bar */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 15
        }}>
          <div className="aura-badge">
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#00E5FF',
              boxShadow: '0 0 8px #00E5FF',
              animation: 'aura-pulse-dot 1.5s infinite'
            }} />
            <span>Secure Gateway</span>
          </div>

          <div className="aura-badge">
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#34C759',
              boxShadow: '0 0 8px #34C759',
              animation: 'aura-pulse-dot 1.8s infinite'
            }} />
            <span>Aura Space Initialization</span>
          </div>
        </div>

        {/* Background Neural Fields & Star particles */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* Static random styling for stars in loading block */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aura-star"
              style={{
                left: `${(i * 17) % 100}%`,
                bottom: `${(i * 23) % 100}%`,
                width: `${(i % 3) + 1.5}px`,
                height: `${(i % 3) + 1.5}px`,
                animationDelay: `${(i * 0.4) % 4}s`,
                animationDuration: `${((i * 1.5) % 5) + 6}s`,
              }}
            />
          ))}

          {/* Drifting HSL Conic Backdrop */}
          <div 
            style={{
              position: "absolute", top: "50%", left: "50%",
              width: "130vw", height: "130vw", borderRadius: "50%",
              background: "conic-gradient(from 0deg, #FF2D55 0%, #BF5AF2 25%, #00E5FF 50%, #FF2D55 100%)",
              filter: "blur(140px)",
              animation: "aura-spin-glow 24s linear infinite, aura-breath-glow 12s ease-in-out infinite",
              willChange: "transform, opacity",
            }}
          />

          {/* Tech Grid Overlay */}
          <div 
            style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
              backgroundPosition: "center",
              maskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
              opacity: 0.65,
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 10%, #020204 85%)" }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '380px', padding: '0 24px' }}>
          
          {/* Concentric Rotating Science HUD rings */}
          <div 
            style={{ 
              position: 'relative', 
              marginBottom: '42px',
              width: '144px',
              height: '144px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: "aura-logo-float 4.5s ease-in-out infinite",
              willChange: "transform"
            }}
          >
            {/* Outermost Dashed Cyan Tech Ring */}
            <div 
              style={{ 
                position: 'absolute', 
                width: '144px',
                height: '144px',
                borderRadius: '50%', 
                border: '1.2px dashed rgba(0, 229, 255, 0.35)',
                animation: "aura-rotate-cw 18s linear infinite" 
              }}
            />

            {/* Middle Pink Tech Compass Ring */}
            <div 
              style={{ 
                position: 'absolute', 
                width: '124px',
                height: '124px',
                borderRadius: '50%', 
                border: '1.5px dashed rgba(255, 45, 85, 0.2)',
                borderTop: '2px solid rgba(255, 45, 85, 0.75)',
                borderBottom: '2px solid rgba(191, 90, 242, 0.75)',
                animation: "aura-rotate-ccw 9s linear infinite" 
              }}
            />

            {/* Pulsing Solid Tech Halo */}
            <div 
              style={{ 
                position: 'absolute', 
                width: '104px',
                height: '104px',
                borderRadius: '50%', 
                background: 'radial-gradient(circle, rgba(191, 90, 242, 0.05) 0%, transparent 70%)',
                border: '1px solid rgba(191, 90, 242, 0.15)',
                animation: "aura-pulse-halo 4s ease-in-out infinite"
              }}
            />

            {/* Cybernetic Radar Sweeper Line */}
            <div 
              style={{
                position: 'absolute',
                width: '104px',
                height: '104px',
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, rgba(0, 229, 255, 0.15) 0%, transparent 40%)',
                animation: "aura-rotate-cw 4s linear infinite",
                pointerEvents: 'none',
                zIndex: 2
              }}
            />
            
            {/* Premium Glossy Squircle Glass Logo Box */}
            <div
              style={{ 
                position: 'relative',
                width: '84px',
                height: '84px',
                borderRadius: '24px',
                background: 'rgba(5, 5, 8, 0.65)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 45px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
                overflow: 'hidden',
                zIndex: 3
              }}
            >
              {/* Cybernetic Laser scanning line */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #00E5FF 30%, #00E5FF 70%, transparent)',
                animation: 'aura-laser-scan 2.5s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 10
              }} />

              {/* Glass Gloss Sweeper glint */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '35%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
                transform: 'skewX(-25deg)',
                animation: 'aura-gloss-sweep 3.5s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 5
              }} />

              <img src="/nexus-logo.png" alt="Logo" style={{ width: "48px", height: "48px", filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.45))', zIndex: 4 }} />
            </div>
          </div>

          {/* Glowing Status Text */}
          <div className="aura-loading-text">
            SRM NEXUS
          </div>
          <div style={{
            fontSize: '8.5px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            marginBottom: '32px'
          }}>
            Academic Intelligence Suite
          </div>

          {/* Progress bar info layout */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            width: '200px',
            margin: '0 auto 8px',
            fontFamily: 'monospace',
            fontSize: '9.5px',
            fontWeight: 900,
            letterSpacing: '0.05em'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>CONNECTING</span>
            <span style={{ color: '#00E5FF', textShadow: '0 0 8px rgba(0, 229, 255, 0.4)' }} className="tabular-nums">
              {Math.round(((loadingLogIndex + 1) / loadingSteps.length) * 100)}%
            </span>
          </div>
          
          {/* Smooth Shimmering Progress Bar Capacitor */}
          <div 
            style={{ 
              width: '200px', 
              height: '5px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '100px', 
              margin: '0 auto 28px', 
              overflow: 'visible',
              position: 'relative',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
              border: '0.8px solid rgba(255,255,255,0.04)'
            }}
          >
            <div 
              style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #FF2D55, #BF5AF2, #00E5FF, #FF2D55)', 
                backgroundSize: '300% 100%',
                width: `${((loadingLogIndex + 1) / loadingSteps.length) * 100}%`,
                transition: "width 500ms cubic-bezier(0.25, 0.8, 0.25, 1)",
                position: "relative",
                borderRadius: '100px',
                boxShadow: '0 0 12px rgba(0, 229, 255, 0.65)',
                animation: "aura-gradient-shift 4s ease infinite"
              }}
            >
              {/* Glowing Leading edge Pointer Spark */}
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-4px',
                  transform: 'translateY(-50%)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 12px #00E5FF, 0 0 4px #ffffff',
                  animation: 'aura-terminal-pulse 0.4s alternate infinite'
                }}
              />

              {/* Shimmer overlay */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                  animation: 'aura-shimmer 2.2s infinite',
                  transform: 'translateX(-100%)'
                }}
              />
            </div>
          </div>

          {/* Cyberpunk Stacked Scrolling Terminal Console */}
          <div style={{
            width: '240px',
            height: '76px',
            background: 'rgba(5, 5, 8, 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1.2px solid rgba(191, 90, 242, 0.15)',
            borderRadius: '16px',
            padding: '12px 16px',
            margin: '0 auto',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
          }}>
            {rollingSteps.map((log) => (
              <div 
                key={log.index} 
                className="aura-rolling-log"
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: log.isLatest ? '#ffffff' : 'rgba(255,255,255,0.3)',
                  opacity: log.isLatest ? 1 : log.index === loadingLogIndex - 1 ? 0.55 : 0.25,
                  transition: 'all 0.3s'
                }}
              >
                <span style={{ color: log.isLatest ? '#FF2D55' : 'rgba(255, 45, 85, 0.45)', marginRight: '6px' }}>
                  {log.hex}
                </span>
                <span style={{ color: log.isLatest ? '#00E5FF' : 'rgba(0, 229, 255, 0.45)', marginRight: '8px' }}>
                  {log.prefix}
                </span>
                <span style={{ color: log.isLatest ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>
                  {log.text}
                </span>
                {log.isLatest ? (
                  <span style={{
                    display: 'inline-block',
                    width: '5px',
                    height: '9px',
                    background: '#00E5FF',
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                    animation: 'aura-cursor-blink 0.8s infinite'
                  }} />
                ) : (
                  <span style={{ color: '#34C759', marginLeft: '6px', fontSize: '8px' }}>
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Holographic Version readouts */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          fontSize: '8px',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.25em',
          fontWeight: 900,
          textTransform: 'uppercase'
        }}>
          SRM_NEBULA_SECURE_v2.0_SYS_ACTIVE
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {activeDashboard}
        <PortalSyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSuccess={() => {}} netId="" />
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
