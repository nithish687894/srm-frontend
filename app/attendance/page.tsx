"use client";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { dataAPI, authAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import AuraAttendance from "@/components/aura-theme/AuraAttendance";
import { extractBatch } from "@/lib/utils";

const PortalSyncModal = dynamic(() => import("@/components/PortalSyncModal"), { ssr: false });

// Presentation-only data for the demo account. It is never written to Zustand,
// persisted, or sent to an API — live student records keep their normal path.
const DEMO_ATTENDANCE_PREVIEW = [
  { courseCode: "21CS201", courseTitle: "Data Structures and Algorithms", courseType: "Practical", conducted: 40, attended: 31, absent: 9, pct: 77.5 },
  { courseCode: "21CS202", courseTitle: "Operating Systems", courseType: "Theory", conducted: 39, attended: 35, absent: 4, pct: 89.7 },
  { courseCode: "21CS203", courseTitle: "Database Management Systems", courseType: "Theory", conducted: 35, attended: 26, absent: 9, pct: 74.3 },
  { courseCode: "21CS204", courseTitle: "Computer Networks", courseType: "Theory", conducted: 38, attended: 32, absent: 6, pct: 84.2 },
  { courseCode: "21CS205", courseTitle: "Artificial Intelligence", courseType: "Theory", conducted: 41, attended: 36, absent: 5, pct: 87.8 },
  { courseCode: "21CS206", courseTitle: "Machine Learning", courseType: "Practical", conducted: 36, attended: 28, absent: 8, pct: 77.8 },
];

function buildSlotToCourseMap(myTT: AnyValue[]) {
  const map: Record<string, AnyValue> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

export default function AttendancePage() {
  const { ready } = useAuth();
  const {
    academicData,
    setAcademicData,
    timetable: cachedTimetable,
    myTimetable: cachedMyTimetable,
    calendar: cachedCalendar,
    setTimetable,
    setMyTimetable,
    setCalendar,
    connectorStatuses,
    studentPortalData,
    email
  } = useAuthStore();

  const storeAttendance = useMemo(() => {
    if (Array.isArray(academicData?.attendance) && academicData.attendance.length > 0) {
      return academicData.attendance;
    }
    if (Array.isArray(academicData?.studentPortal?.attendance) && academicData.studentPortal.attendance.length > 0) {
      return academicData.studentPortal.attendance;
    }
    if (Array.isArray(studentPortalData?.attendance) && studentPortalData.attendance.length > 0) {
      return studentPortalData.attendance;
    }
    return [];
  }, [academicData, studentPortalData]);

  const [att, setAtt] = useState<AnyValue[]>(storeAttendance);
  const [loading, setLoading] = useState(storeAttendance.length === 0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const studentPortalStatus = connectorStatuses.studentPortal;
  const isSpConnected = studentPortalStatus === "connected";
  const isDemoPreview = (email || "").split("@")[0]?.toLowerCase() === "demo12"
    || academicData?.profile?.email?.toLowerCase?.().startsWith("demo12@")
    || academicData?.profile?.["Name"] === "AURA NEBULA DEMO"
    || academicData?.profile?.["Registration Number"] === "RA2311003010999"
    || (typeof window !== "undefined" && localStorage.getItem("userEmail")?.toLowerCase().includes("demo"));
  const previewAttendance = isDemoPreview && att.length === 0 ? DEMO_ATTENDANCE_PREVIEW : att;

  const refreshAttendance = async () => {
    try {
      const d = await dataAPI.getAttendance();
      if (d && d.success && Array.isArray(d.data)) {
        setAtt(d.data);
        const currentAcademicData = useAuthStore.getState().academicData || {};
        const currentSpData = useAuthStore.getState().studentPortalData || {};
        setAcademicData({
          ...currentAcademicData,
          attendance: d.data,
          studentPortal: {
            ...(currentAcademicData.studentPortal || {}),
            attendance: d.data,
            lastSyncedAt: new Date().toISOString(),
          },
        });
        useAuthStore.getState().setStudentPortalData({
          ...currentSpData,
          attendance: d.data,
          sessionStatus: "active",
          lastSyncedAt: new Date().toISOString(),
        });
        return d.data;
      }
    } catch (e) {
      throw e;
    }
    return [];
  };

  const handleReconnect = () => {
    setIsSyncModalOpen(true);
  };

  const handleSync = async () => {
    if (!isSpConnected) {
      setIsSyncModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      await dataAPI.forceRefresh();
      await refreshAttendance();
    } catch {
      // Keep the existing attendance visible; AuraAttendance already shows sync state.
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePortalSyncSuccess = async () => {
    setIsSyncing(true);
    try {
      await refreshAttendance();
    } catch {
      // The modal has already completed successfully; keep cached attendance visible
      // and let the next page load retry if this follow-up fetch is transiently slow.
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSynced = (dateInput: AnyValue) => {
    if (!dateInput) return "Never";
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return "Recently";
      const seconds = Math.floor((now - d.getTime()) / 1000);
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

  const rawSpData = academicData?.studentPortal;
  const spData = (rawSpData && rawSpData.attendance) ? rawSpData : studentPortalData;
  const lastSyncedStr = formatLastSynced(spData?.lastSyncedAt);
  const lastSyncedMs = useMemo(() => {
    const value = spData?.lastSyncedAt || academicData?.lastFetchedAt;
    if (!value) return null;
    const timestamp = typeof value === "number" ? value : new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }, [spData?.lastSyncedAt, academicData?.lastFetchedAt]);
  const isAttendanceStale = !lastSyncedMs || now - lastSyncedMs > 15 * 60 * 1000;
  const attendanceState = loading && att.length === 0
    ? "loading"
    : att.length === 0 || isAttendanceStale
      ? "unavailable"
      : isSpConnected
        ? "ready"
        : "cached";
  const canUsePredictor = attendanceState === "ready";
  const unavailableMessage = studentPortalStatus === "session_expired"
    ? "Your Student Portal session expired. Reconnect to load current attendance."
    : isSpConnected
      ? "Attendance could not be loaded. Try syncing again."
      : "Connect your Student Portal to load attendance.";

  const [calData, setCalData] = useState<AnyValue>(cachedCalendar || null);
  const [ttData, setTTData] = useState<AnyValue>(() => {
    if (cachedTimetable && cachedMyTimetable) {
      const courses = cachedMyTimetable?.data?.courses || cachedMyTimetable?.data || [];
      return { rows: cachedTimetable?.data?.rows || [], myTT: courses };
    }
    return null;
  });
  
  const [showPredictor, setShowPredictor] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<AnyValue[] | null>(null);
  const [showRiskOnly, setShowRiskOnly] = useState(false);

  useEffect(() => { 
    try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch {}
  }, []);

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(int);
  }, []);

  const lastFetchedAt = academicData?.lastFetchedAt;
  const timeAgoStr = useMemo(() => {
    if (!lastFetchedAt) return "";
    const diff = Math.floor((now - lastFetchedAt) / 60000);
    if (diff < 1) return "Updated just now";
    if (diff === 1) return "Updated 1 min ago";
    if (diff < 60) return `Updated ${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    return `Updated ${hours} hr${hours > 1 ? 's' : ''} ago`;
  }, [now, lastFetchedAt]);

  // Keep local att state synchronized when storeAttendance updates in Zustand
  useEffect(() => {
    if (storeAttendance.length > 0) {
      setAtt(storeAttendance);
      setLoading(false);
    }
  }, [storeAttendance]);

  // A pending request must never leave the page on a permanent skeleton.
  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 7000);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!ready) return;
    if (att.length > 0 || academicData?.attendance) setLoading(false);

    // Sync live dual connector statuses
    authAPI.getConnectors().then((res) => {
      if (res && res.connectors) {
        const sp = res.connectors.studentPortal || res.connectors['student-portal'];
        const aca = res.connectors.academia;
        if (sp) {
          useAuthStore.getState().setConnectorStatuses({
            studentPortal: sp.status === 'active' || sp.status === 'connected' ? 'connected' : (sp.status === 'expired' ? 'session_expired' : 'disconnected'),
            ...(aca ? { academia: aca.status === 'active' || aca.status === 'connected' ? 'connected' : (aca.status === 'expired' ? 'session_expired' : 'disconnected') } : {})
          });
        }
      }
    }).catch(() => {});

    const lastFetched = academicData?.lastFetchedAt || 0;
    const shouldFetchAttendance = att.length === 0 || (isSpConnected && Date.now() - lastFetched > 2 * 60 * 1000);
    if (shouldFetchAttendance) {
      const fetch = isSpConnected && att.length > 0
        ? dataAPI.forceRefresh().then(() => dataAPI.getAttendance())
        : dataAPI.getAttendance();

      fetch
        .then(d => {
          const updated = Array.isArray(d.data) ? d.data : [];
          if (updated.length > 0) {
            setAtt(updated);
            const currentAcademicData = useAuthStore.getState().academicData || {};
            setAcademicData({ ...currentAcademicData, attendance: updated, lastFetchedAt: Date.now() });
          }
        })
        .finally(() => setLoading(false))
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }

    dataAPI.getCalendar().then(d => { setCalData(d); setCalendar(d); }).catch(() => {});
    
    // Dynamically get the batch from profile
    const rawBatch = academicData?.profile?.["Combo / Batch"] || "";
    const batchNum = extractBatch(rawBatch);

    Promise.all([dataAPI.getTimetable(batchNum), dataAPI.getMyTimetable()]).then(([tt, myTT]) => {
      setTimetable(tt);
      setMyTimetable(myTT);
      const courses = Array.isArray(myTT) ? myTT : (Array.isArray(myTT?.data?.courses) ? myTT.data.courses : (Array.isArray(myTT?.courses) ? myTT.courses : (Array.isArray(myTT?.data) ? myTT.data : [])));
      const gridRows = Array.isArray(tt?.data?.rows) ? tt.data.rows : (Array.isArray(tt?.rows) ? tt.rows : (Array.isArray(tt?.data?.data?.rows) ? tt.data.data.rows : (Array.isArray(tt?.data) ? tt.data : [])));
      setTTData({ rows: gridRows, myTT: courses });
    }).catch(() => {});
  }, [ready, academicData?.profile, academicData?.lastFetchedAt, setCalendar, setTimetable, setMyTimetable, isSpConnected, att.length, setAcademicData]);

  const calIndex = useMemo(() => {
    if (!calData) return null;
    try { return buildCalendarIndex(calData); } catch { return null; }
  }, [calData]);

  // Generate 30 days for predictor
  const next30Days = useMemo(() => {
    const days = [];
    const t = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(t);
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        iso,
        dayStr: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d),
        dateNum: d.getDate()
      });
    }
    return days;
  }, []);

  const toggleDate = (iso: string) => {
    const next = new Set(selectedDates);


    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    setSelectedDates(next);
  };

  const calculatePredictions = () => {
    if (!calIndex || !ttData || att.length === 0) return;
    
    // 1. Map DayOrder -> list of course codes
    const doToCourses: Record<number, string[]> = {};
    const slotMap = buildSlotToCourseMap(ttData.myTT);
    const dayRows = ttData.rows.filter((r: AnyValue) => typeof r[0] === "string" && r[0].startsWith("Day"));
    
    dayRows.forEach((row: AnyValue) => {
      const header = String(row[0] || "");
      const dOrder = parseInt(header.match(/\d+/)?.[0] || "0");
      if (dOrder === 0) return;
      
      doToCourses[dOrder] = [];
      const cells: string[] = row.slice(1);
      
      cells.forEach((cell) => {
        const s = cell?.trim()?.toUpperCase();
        if (!s || s === "-") return;
        if (/^[PL]\d+$/i.test(s)) {
          const course = slotMap[s];
          if (course) doToCourses[dOrder].push(course.courseCode);
        } else {
          for (const part of s.split("/")) {
            const letter = part.trim().replace(/[^A-Z]/g, "");
            if (!letter || letter === "X") continue;
            const course = slotMap[letter];
            if (course) {
              doToCourses[dOrder].push(course.courseCode);
              break;
            }
          }
        }
      });
    });

    // 2. Tally missed classes by course code based on selected dates
    const missedClasses: Record<string, number> = {};
    selectedDates.forEach(iso => {
      const info = calIndex.byDate.get(iso);
      if (info && !info.isHoliday && info.dayOrder) {
        const courses = doToCourses[info.dayOrder] || [];
        courses.forEach(c => {
          missedClasses[c] = (missedClasses[c] || 0) + 1;
        });
      }
    });

    // 3. Compute for all subjects
    const results = att.map((c: AnyValue) => {
      const code = c["Course Code"] || c.courseCode || c.code || "";
      const cond = parseInt(c["Hours Conducted"] || c.conducted || c.hoursConducted) || 0;
      const abs = parseInt(c["Hours Absent"] || c.absent || c.hoursAbsent) || 0;
      const pres = parseInt(c["Hours Attended"] || c.attended || c.hoursPresent) || Math.max(0, cond - abs);
      const currentPct = parseFloat(c["Attn %"] || c.pct || c.percentage) || (cond > 0 ? (pres / cond) * 100 : 0);
      
      const futureMissing = missedClasses[code] || 0;
      const projCond = cond + futureMissing;
      const projPct = projCond === 0 ? 0 : (pres / projCond) * 100;
      
      let marginLabel = "";
      let marginSafe = false;
      const alreadyRisk = currentPct < 75;

      if (projPct >= 75) {
        const M = Math.floor((pres / 0.75) - projCond);
        marginLabel = M === 1 ? `Safe to skip 1 class` : `Safe to skip ${M} classes`;
        marginSafe = true;
      } else {
        const N = Math.ceil(3 * projCond - 4 * pres);
        if (alreadyRisk) {
          marginLabel = `Already at risk — do not skip`;
        } else {
          marginLabel = `Will fall below 75% — must attend ${N} more classes to recover`;
        }
        marginSafe = false;
      }

      return {
        code,
        title: c["Course Title"] || c.courseTitle || c.title || code,
        currentPct,
        projPct,
        marginLabel,
        marginSafe,
        futureMissing
      };
    }).filter(r => r.futureMissing > 0 || r.currentPct < 75);

    setPredictions(results);
  };

  const avgAtt = att.length
    ? (att.reduce((s, c) => {
        const val = parseFloat(c["Attn %"] || c.pct || c.percentage || "0");
        return s + (isNaN(val) ? 0 : val);
      }, 0) / att.length).toFixed(1)
    : "—";

  const totalAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Conducted"] || c.conducted || c.hoursConducted) || 0), 0);
  const absentAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Absent"] || c.absent || c.hoursAbsent) || 0), 0);
  const presentAgg = att.reduce((acc, c) => {
    const cond = parseInt(c["Hours Conducted"] || c.conducted || c.hoursConducted) || 0;
    const abs = parseInt(c["Hours Absent"] || c.absent || c.hoursAbsent) || 0;
    const p = parseInt(c["Hours Attended"] || c.attended || c.hoursPresent) || Math.max(0, cond - abs);
    return acc + (isNaN(p) ? 0 : p);
  }, 0);

  const themeProps = {
    att, avgAtt, totalAgg, presentAgg, absentAgg, 
    showPredictor, setShowPredictor, next30Days, selectedDates, toggleDate, 
    calculatePredictions, predictions, setSelectedDates, setPredictions, showRiskOnly, timeAgoStr,
    studentPortalStatus, lastSyncedStr,
    isLoading: !isDemoPreview && loading && att.length === 0,
    attendanceState: isDemoPreview ? "demo" : attendanceState,
    unavailableMessage,
    predictorEnabled: !isDemoPreview && canUsePredictor,
    demoPreview: isDemoPreview
  };

  return (
    <div style={{ minHeight: "100dvh", width: "100%", background: "var(--app-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
      <main id="attendance-parent-scroll" style={{ flex: 1, paddingBottom: "100px" }}>
        <AuraAttendance
          attendance={previewAttendance}
          handleSync={handleSync}
          onReconnect={handleReconnect}
          isSyncing={isSyncing}
          {...themeProps}
        />
      </main>
      {isSyncModalOpen && (
        <PortalSyncModal
          isOpen
          onClose={() => setIsSyncModalOpen(false)}
          onSuccess={handlePortalSyncSuccess}
          netId={(email || "").split("@")[0]}
          type="student-portal"
        />
      )}
    </div>
  );
}
