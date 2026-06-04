"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DynamicGauge from "@/components/DynamicGauge";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { useThemeStore } from "@/lib/themeStore";
import AuraAttendance from "@/components/aura-theme/AuraAttendance";
import { RefreshCcw } from "lucide-react";

function buildSlotToCourseMap(myTT: AnyValue[]) {
  const map: Record<string, AnyValue> = {};
  myTT.forEach(c => { (c.slots || []).forEach((s: string) => { if (s) map[s.toUpperCase()] = c; }); });
  return map;
}

export default function AttendancePage() {
  const { ready } = useAuth();
  const { theme } = useThemeStore();
  // Optimize Zustand subscriptions to eliminate main-thread render lags
  const academicData = useAuthStore((state) => state.academicData);
  const setAcademicData = useAuthStore((state) => state.setAcademicData);
  const [att, setAtt] = useState<AnyValue[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.attendance);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const d = await dataAPI.getAttendance();
      const updated = d.data || [];
      setAtt(updated);
      setAcademicData({ ...academicData, attendance: updated });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const [calData, setCalData] = useState<AnyValue>(null);
  const [ttData, setTTData] = useState<AnyValue>(null);
  
  const [showPredictor, setShowPredictor] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<AnyValue[] | null>(null);
  const [showRiskOnly, setShowRiskOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

  const [now, setNow] = useState(Date.now());
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

  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (academicData?.attendance) setLoading(false);
    dataAPI.getAttendance()
      .then(d => { setAtt(d.data || []); setAcademicData({ ...academicData, attendance: d.data || [] }); setLoading(false); })
      .catch(() => { if (!att.length) router.push("/"); });

    dataAPI.getCalendar().then(d => setCalData(d)).catch(() => {});
    
    // Dynamically get the batch from profile
    const rawBatch = academicData?.profile?.["Combo / Batch"] || "";
    const batchNum = parseInt(rawBatch.match(/\d+/)?.[0] || "1");

    Promise.all([dataAPI.getTimetable(batchNum), dataAPI.getMyTimetable()]).then(([tt, myTT]) => {
      const courses = myTT?.data?.courses || myTT?.data || [];
      setTTData({ rows: tt?.data?.rows || [], myTT: courses });
    }).catch(() => {});
  }, [ready, academicData?.profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShowRiskOnly(params.get("risk") === "1");
  }, []);

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
      const code = c["Course Code"];
      const cond = parseInt(c["Hours Conducted"]) || 0;
      const abs = parseInt(c["Hours Absent"]) || 0;
      const pres = cond - abs;
      const currentPct = parseFloat(c["Attn %"]) || 0;
      
      const futureMissing = missedClasses[code] || 0;
      const projCond = cond + futureMissing;
      const projPct = projCond === 0 ? 0 : (pres / projCond) * 100;
      
      let marginLabel = "";
      let marginSafe = false;
      const alreadyRisk = currentPct < 75;

      if (projPct >= 75) {
        // Can miss how many more?
        // (pres) / (projCond + M) >= 0.75  =>  projCond + M <= pres / 0.75  =>  M <= (pres/0.75) - projCond
        const M = Math.floor((pres / 0.75) - projCond);
        marginLabel = `Safe to skip (buffer: ${M} classes)`;
        marginSafe = true;
      } else {
        // Needs how many to recover?
        // (pres + N) / (projCond + N) >= 0.75 => pres + N >= 0.75 projCond + 0.75 N => 0.25 N >= 0.75 projCond - pres => N >= 3 projCond - 4 pres
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
        title: c["Course Title"],
        currentPct,
        projPct,
        marginLabel,
        marginSafe,
        futureMissing
      };
    }).filter(r => r.futureMissing > 0 || r.currentPct < 75); // Only show affected or at-risk subjects

    setPredictions(results);
  };

  const riskClasses = att.filter(c => parseFloat(c["Attn %"]) < 75);
  const displayAtt = showRiskOnly ? riskClasses : att;
  const avgAtt = att.length
    ? (att.reduce((s, c) => {
        const val = parseFloat(c["Attn %"] || "0");
        return s + (isNaN(val) ? 0 : val);
      }, 0) / att.length).toFixed(1)
    : "—";

  const totalAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Conducted"]) || 0), 0);
  const absentAgg = att.reduce((acc, c) => acc + (parseInt(c["Hours Absent"]) || 0), 0);
  const presentAgg = att.reduce((acc, c) => {
    const p = parseInt(c["Hours Attended"]) || (parseInt(c["Hours Conducted"]) - parseInt(c["Hours Absent"])) || 0;
    return acc + (isNaN(p) ? 0 : p);
  }, 0);

  if (loading && !att.length) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner" />
    </div>
  );

  if (!mounted && typeof window !== "undefined") return <div style={{ background: '#050505', minHeight: '100vh' }} />;

  const themeProps = {
    att, avgAtt, totalAgg, presentAgg, absentAgg, 
    showPredictor, setShowPredictor, next30Days, selectedDates, toggleDate, 
    calculatePredictions, predictions, setSelectedDates, setPredictions, showRiskOnly, timeAgoStr
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#050505", display: "flex", flexDirection: "column", position: "relative" }}>
      <Sidebar />
      <main id="attendance-parent-scroll" style={{ flex: 1, paddingBottom: "100px" }}>
        <AuraAttendance attendance={att} handleSync={handleSync} isSyncing={isSyncing} {...themeProps} />
      </main>
    </div>
  );
}
