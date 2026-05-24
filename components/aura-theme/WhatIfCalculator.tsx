"use client";
import { useState, useMemo, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex } from "@/lib/calendarIndex";
import { 
  Calculator, TrendingUp, AlertCircle, ArrowRight, Clock, 
  Calendar, Award, Sparkles, CheckCircle2, Target, Flame, 
  Zap, RotateCcw, HelpCircle, ChevronRight, Check
} from "lucide-react";

const AURA = {
  bg: "#050508",
  cyan: "#00E5FF",    // Attendance / Cyan
  pink: "#FF2D55",    // Academic / Pink
  amber: "#FF9500",   // Warning / Amber
  emerald: "#34C759", // Success / Emerald
  purple: "#BF5AF2",  // AI & Goals / Purple
  red: "#FF3B3B",     // Danger / Red
  primary: "#FF2D55", // Main action pink
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.45)",
  subBright: "rgba(255, 255, 255, 0.70)",
  border: "rgba(192, 132, 252, 0.25)",
  borderGlow: "rgba(192, 132, 252, 0.5)",
  cardBg: "rgba(255, 255, 255, 0.02)",
};

const getGradeLetter = (pct: number) => {
  if (pct >= 90) return { letter: "S", label: "Outstanding", color: AURA.emerald };
  if (pct >= 80) return { letter: "A", label: "Excellent", color: AURA.purple };
  if (pct >= 70) return { letter: "B", label: "Very Good", color: AURA.cyan };
  if (pct >= 60) return { letter: "C", label: "Good", color: AURA.amber };
  if (pct >= 50) return { letter: "D", label: "Satisfactory", color: AURA.subBright };
  if (pct >= 40) return { letter: "E", label: "Pass", color: AURA.sub };
  return { letter: "F", label: "Fail / Arrear", color: AURA.red };
};

function buildSlotToCourseMap(myTT: AnyValue[]) {
  const map: Record<string, AnyValue> = {};
  myTT.forEach(c => { 
    (c.slots || []).forEach((s: string) => { 
      if (s) map[s.toUpperCase()] = c; 
    }); 
  });
  return map;
}

export function WhatIfCalculator({ marks: initialMarks }: AnyValue) {
  // 1. Core Zustand Integrations for zero-lag hydration
  const academicData = useAuthStore((state) => state.academicData);
  const studentPortalData = useAuthStore((state) => state.studentPortalData);

  const marks = useMemo(() => {
    return initialMarks || academicData?.marks || studentPortalData?.marks?.marks || [];
  }, [initialMarks, academicData?.marks, studentPortalData?.marks?.marks]);

  const attendance = useMemo(() => {
    return academicData?.attendance || studentPortalData?.attendance || [];
  }, [academicData?.attendance, studentPortalData?.attendance]);

  // 2. Local State for Predictor Consoles
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"marks" | "attendance">("marks");
  
  // Marks forecasting state
  const [selectedSubject, setSelectedSubject] = useState<AnyValue>(null);
  const [hypotheticalScores, setHypotheticalScores] = useState<Record<string, number>>({});
  const [targetSubjectAverage, setTargetSubjectAverage] = useState<number>(80);
  const [endSemEstimate, setEndSemEstimate] = useState<number | "">("");

  // Attendance forecasting state
  const [targetAttendancePercent, setTargetAttendancePercent] = useState<number>(75);
  
  // Calendar data states for autonomous skip computations
  const [calData, setCalData] = useState<AnyValue>(null);
  const [ttData, setTTData] = useState<AnyValue>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [calendarPredictions, setCalendarPredictions] = useState<AnyValue[] | null>(null);
  const [isCalSyncing, setIsCalSyncing] = useState(false);

  // Load calendar index & timetables asynchronously if not provided (allows tool to work on AnyValue page)
  useEffect(() => {
    if (!isOpen) return;
    
    const syncId = setTimeout(() => setIsCalSyncing(true), 0);
    const rawBatch = academicData?.profile?.["Combo / Batch"] || "";
    const batchNum = parseInt(rawBatch.match(/\d+/)?.[0] || "1");

    Promise.all([
      dataAPI.getCalendar(),
      dataAPI.getTimetable(batchNum),
      dataAPI.getMyTimetable()
    ])
      .then(([cal, tt, myTT]) => {
        setCalData(cal);
        const courses = myTT?.data?.courses || myTT?.data || [];
        setTTData({ rows: tt?.data?.rows || [], myTT: courses });
      })
      .catch(err => console.warn("Academic timeline indexing skipped or offline:", err))
      .finally(() => setIsCalSyncing(false));

    return () => clearTimeout(syncId);
  }, [isOpen, academicData?.profile]);

  const calIndex = useMemo(() => {
    if (!calData) return null;
    try { return buildCalendarIndex(calData); } catch { return null; }
  }, [calData]);

  // Generate 30 days for predictor (excluding weekends)
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

  // 3. Subject memo parsers
  const marksSubjects = useMemo(() => {
    if (!marks || !Array.isArray(marks)) return [];
    return marks.filter((m: AnyValue) => m.tests && m.tests.length > 0);
  }, [marks]);

  const attendanceSubjects = useMemo(() => {
    if (!attendance || !Array.isArray(attendance)) return [];
    return attendance.map((a: AnyValue) => {
      const conducted = parseInt(a["Hours Conducted"]) || 0;
      const absent = parseInt(a["Hours Absent"]) || 0;
      const attended = parseInt(a["Hours Attended"]) || Math.max(0, conducted - absent);
      const pct = parseFloat(a["Attn %"]) || (conducted > 0 ? (attended / conducted) * 100 : 0);
      return { ...a, conducted, attended, absent, pct };
    });
  }, [attendance]);

  // 4. Goal-seeking target calculator & forecasting memo
  const marksForecaster = useMemo(() => {
    if (!selectedSubject) return null;

    let totalCompScored = 0;
    let totalCompMax = 0;
    let totalPendMax = 0;

    const testCategories = selectedSubject.tests?.map((test: AnyValue, idx: number) => {
      const max = parseFloat((test.test || "T/100").split("/")[1]) || 100;
      // Define a test as completed if it has an actual numerical value or "Abs"
      const isCompleted = test.score !== undefined && test.score !== null && test.score !== "" && test.score !== "—" && test.score !== "— ";
      
      let actualScore = 0;
      if (isCompleted) {
        actualScore = test.score === "Abs" ? 0 : parseFloat(test.score) || 0;
        totalCompScored += actualScore;
        totalCompMax += max;
      } else {
        totalPendMax += max;
      }

      return {
        testName: test.test,
        max,
        isCompleted,
        actualScore,
        index: idx
      };
    }) || [];

    // Current subject average based strictly on completed tests
    const currentSubjectAvg = totalCompMax > 0 ? (totalCompScored / totalCompMax) * 100 : 0;

    // Detect End Semester Exam weight
    const totalMax = totalCompMax + totalPendMax; // e.g. 60
    const endSemWeight = Math.max(0, 100 - totalMax); // e.g. 40

    // Sum of hypothetical scores for pending internals (if AnyValue)
    let totalPendHypothetical = 0;
    testCategories.forEach((test: AnyValue) => {
      if (!test.isCompleted) {
        totalPendHypothetical += hypotheticalScores[`test_${test.index}`] ?? 0;
      }
    });

    let endSemContrib = 0;
    let projectedSubjectAvg = 0;
    let isEndSemEntered = false;

    if (endSemWeight > 0) {
      if (endSemEstimate !== "") {
        endSemContrib = (Number(endSemEstimate) / 100) * endSemWeight;
        isEndSemEntered = true;
      }
    } else {
      isEndSemEntered = true; // No end sem exam, so it is always considered "entered"
    }

    // Projected subject average based on sliders
    const projectedTotal = totalCompScored + totalPendHypothetical;

    if (isEndSemEntered) {
      if (endSemWeight > 0) {
        projectedSubjectAvg = projectedTotal + endSemContrib;
      } else {
        projectedSubjectAvg = totalMax > 0 ? (projectedTotal / totalMax) * 100 : 0;
      }
    } else {
      projectedSubjectAvg = -1; // Flag as not entered
    }

    const improvement = isEndSemEntered ? (projectedSubjectAvg - currentSubjectAvg) : 0;

    // GOAL SEEK: Calculate scores required to reach targetSubjectAverage
    let isGoalFeasible = true;
    let goalRemainingLabel = "";

    if (endSemWeight > 0) {
      // Goal seek needs to account for the End Semester Exam scaled mark
      const requiredFromEndSemContrib = targetSubjectAverage - totalCompScored - totalPendHypothetical;
      
      if (requiredFromEndSemContrib <= 0) {
        isGoalFeasible = true;
        goalRemainingLabel = "Goal already achieved with current/simulated internal marks!";
      } else {
        const requiredEndSemScore = (requiredFromEndSemContrib / endSemWeight) * 100;
        if (requiredEndSemScore > 100) {
          isGoalFeasible = false;
          goalRemainingLabel = `Impossible (Requires ${requiredEndSemScore.toFixed(1)}/100 in End Sem, which exceeds 100%)`;
        } else {
          isGoalFeasible = true;
          goalRemainingLabel = `Requires ${requiredEndSemScore.toFixed(1)}/100 in the End Semester Exam (counts for ${requiredFromEndSemContrib.toFixed(1)} / ${endSemWeight} overall marks)`;
        }
      }
    } else {
      // Standard calculation for courses without an End Semester Exam
      const targetPercentDecimal = targetSubjectAverage / 100;
      const totalRequiredScore = targetPercentDecimal * totalMax;
      const pendingRequiredScore = Math.max(0, totalRequiredScore - totalCompScored);

      if (totalPendMax === 0) {
        isGoalFeasible = currentSubjectAvg >= targetSubjectAverage;
        goalRemainingLabel = isGoalFeasible ? "Goal Achieved!" : "Cannot reach goal (no pending tests remaining)";
      } else if (pendingRequiredScore > totalPendMax) {
        isGoalFeasible = false;
        goalRemainingLabel = `Impossible (Requires ${pendingRequiredScore.toFixed(1)}/${totalPendMax} marks, which exceeds 100%)`;
      } else {
        isGoalFeasible = true;
        goalRemainingLabel = `Requires ${pendingRequiredScore.toFixed(1)} / ${totalPendMax} marks (${((pendingRequiredScore / totalPendMax) * 100).toFixed(1)}% average on remaining tests)`;
      }
    }

    return {
      testCategories,
      currentSubjectAvg,
      projectedSubjectAvg,
      totalMax,
      improvement,
      isGoalFeasible,
      goalRemainingLabel,
      endSemWeight
    };
  }, [selectedSubject, hypotheticalScores, targetSubjectAverage, endSemEstimate]);

  // 5. Attendance skip buffers & recovery targets memo
  const attendanceForecasts = useMemo(() => {
    return attendanceSubjects.map((sub: AnyValue) => {
      const { conducted, attended, absent, pct } = sub;
      const targetDec = targetAttendancePercent / 100;

      let safeSkips = 0;
      let recoveryClasses = 0;
      
      if (pct >= targetAttendancePercent) {
        // Safe Skips: (attended) / (conducted + M) >= targetDec => attended / targetDec >= conducted + M => M <= attended/targetDec - conducted
        safeSkips = Math.max(0, Math.floor((attended / targetDec) - conducted));
      } else {
        // Recovery Target: (attended + N) / (conducted + N) >= targetDec => N(1 - targetDec) >= targetDec * conducted - attended
        // N >= (targetDec * conducted - attended) / (1 - targetDec)
        recoveryClasses = Math.max(0, Math.ceil((targetDec * conducted - attended) / (1 - targetDec)));
      }

      return {
        ...sub,
        safeSkips,
        recoveryClasses,
        status: getGradeLetter(pct)
      };
    });
  }, [attendanceSubjects, targetAttendancePercent]);

  // 6. Runs the interactive calendar-based skips prediction
  const calculateCalendarPredictions = () => {
    if (!calIndex || !ttData || attendanceSubjects.length === 0) return;
    
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

    const results = attendanceSubjects.map((c: AnyValue) => {
      const code = c["Course Code"];
      const cond = c.conducted;
      const abs = c.absent;
      const pres = c.attended;
      
      const futureMissing = missedClasses[code] || 0;
      const projCond = cond + futureMissing;
      const projPct = projCond === 0 ? 0 : (pres / projCond) * 100;
      
      let marginLabel = "";
      let marginSafe = false;

      if (projPct >= 75) {
        const M = Math.floor((pres / 0.75) - projCond);
        marginLabel = `Safe (Buffer: ${M} classes)`;
        marginSafe = true;
      } else {
        const N = Math.ceil(3 * projCond - 4 * pres);
        marginLabel = c.pct < 75 
          ? `Already at risk — avoid skipping` 
          : `Risky — will drop below 75% (need ${N} classes to recover)`;
        marginSafe = false;
      }

      return {
        code,
        title: c["Course Title"],
        currentPct: c.pct,
        projPct,
        marginLabel,
        marginSafe,
        futureMissing
      };
    }).filter(r => r.futureMissing > 0 || r.currentPct < 75);

    setCalendarPredictions(results);
  };

  const handleScoreChange = (testIdx: number, value: string, max: number) => {
    const num = parseFloat(value) || 0;
    setHypotheticalScores((prev) => ({
      ...prev,
      [`test_${testIdx}`]: Math.max(0, Math.min(max, num)),
    }));
  };

  // UI closed fallback trigger button
  if (!isOpen) {
    const avgAttendanceNum = attendanceSubjects.length
      ? attendanceSubjects.reduce((acc, c) => acc + c.pct, 0) / attendanceSubjects.length
      : 0;

    return (
      <div
        onClick={() => setIsOpen(true)}
        style={{
          background: "linear-gradient(135deg, rgba(192, 132, 252, 0.16) 0%, rgba(255, 117, 195, 0.08) 100%)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(192, 132, 252, 0.35)",
          borderRadius: "32px",
          padding: "24px",
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 15px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(192, 132, 252, 0.26) 0%, rgba(255, 117, 195, 0.15) 100%)";
          e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.55)";
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(192, 132, 252, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(192, 132, 252, 0.16) 0%, rgba(255, 117, 195, 0.08) 100%)";
          e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.35)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 15px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "18px",
              background: "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)"
            }}
          >
            <Calculator size={26} color={AURA.purple} className="shimmer-text" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: "15px", fontWeight: 900, color: AURA.text, margin: 0 }}>Unified Academic Planner</h3>
              <span style={{ fontSize: '8px', fontWeight: 900, background: 'rgba(192, 132, 252,0.15)', color: AURA.primary, padding: '3px 8px', borderRadius: '100px', border: '1px solid rgba(192, 132, 252,0.3)', letterSpacing: '0.05em' }}>FORESIGHT v2.0</span>
            </div>
            <p style={{ fontSize: "11px", color: AURA.sub, margin: "4px 0 0", fontWeight: 650 }}>
              Forecast target marks, grades, and safe skip/recovery counts
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }} className="tabular-nums">
            <span style={{ fontSize: '14px', fontWeight: 900, color: avgAttendanceNum >= 75 ? AURA.cyan : AURA.red }}>
              {avgAttendanceNum.toFixed(1)}% Attn
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: AURA.sub }}>
              {marksSubjects.length} subjects loaded
            </span>
          </div>
          <ArrowRight size={22} color={AURA.primary} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(55px) saturate(180%)",
        WebkitBackdropFilter: "blur(55px) saturate(180%)",
        border: "1px solid rgba(192, 132, 252, 0.35)",
        borderRadius: "32px",
        padding: "28px",
        boxShadow: "0 30px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        position: 'relative'
      }}
    >
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={18} color={AURA.primary} className="floating" />
          <h3 style={{ fontSize: "16px", fontWeight: 900, color: AURA.text, margin: 0, letterSpacing: '-0.5px' }}>
            Unified Foresight Console
          </h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setSelectedSubject(null);
            setHypotheticalScores({});
            setSelectedDates(new Set());
            setCalendarPredictions(null);
            setEndSemEstimate("");
          }}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1.5px solid rgba(255,255,255,0.08)",
            color: AURA.subBright,
            cursor: "pointer",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: "14px",
            fontWeight: 800,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = AURA.pink; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = AURA.subBright; }}
        >
          ✕
        </button>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => { setActiveTab("marks"); setSelectedSubject(null); }}
          style={{
            background: activeTab === "marks" ? "rgba(192, 132, 252, 0.15)" : "transparent",
            border: `1.5px solid ${activeTab === "marks" ? "rgba(192, 132, 252, 0.35)" : "transparent"}`,
            borderRadius: '12px',
            color: activeTab === "marks" ? "#fff" : AURA.subBright,
            padding: '10px',
            fontSize: '12px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.25s'
          }}
        >
          <Award size={14} color={activeTab === "marks" ? AURA.pink : AURA.sub} />
          <span>Marks & Goal Seek</span>
        </button>

        <button
          onClick={() => { setActiveTab("attendance"); setSelectedSubject(null); }}
          style={{
            background: activeTab === "attendance" ? "rgba(192, 132, 252, 0.15)" : "transparent",
            border: `1.5px solid ${activeTab === "attendance" ? "rgba(192, 132, 252, 0.35)" : "transparent"}`,
            borderRadius: '12px',
            color: activeTab === "attendance" ? "#fff" : AURA.subBright,
            padding: '10px',
            fontSize: '12px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.25s'
          }}
        >
          <Clock size={14} color={activeTab === "attendance" ? AURA.cyan : AURA.sub} />
          <span>Attendance & Skips</span>
        </button>
      </div>

      {/* TABS CONTAINER */}
      {activeTab === "marks" ? (
        /* MARKS & GOAL SEEK TAB */
        <div>
          {!selectedSubject ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <HelpCircle size={14} color={AURA.purple} />
                <span style={{ fontSize: "12px", color: AURA.subBright, fontWeight: 700 }}>
                  Select a subject to forecast exam grades & target scores:
                </span>
              </div>
              
              {marksSubjects.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: AURA.sub, fontSize: '12px', fontWeight: 650, background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                  No internal marks data available for simulator.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }} className="hide-scrollbar">
                  {marksSubjects.map((sub: AnyValue, idx: number) => {
                    // Quick calculate score metrics
                    const completedTests = sub.tests?.filter((t: AnyValue) => t.score !== undefined && t.score !== null && t.score !== "" && t.score !== "—" && t.score !== "— ") || [];
                    const hasPending = (sub.tests?.length || 0) > completedTests.length;
                    const totalScored = completedTests.reduce((acc: number, t: AnyValue) => acc + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0);
                    const totalMax = completedTests.reduce((acc: number, t: AnyValue) => acc + (parseFloat((t.test || "T/100").split("/")[1]) || 100), 0);
                    const avg = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSubject(sub)}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          color: AURA.text,
                          padding: "16px 20px",
                          borderRadius: "18px",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                          e.currentTarget.style.borderColor = "rgba(192, 132, 252, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingRight: '12px' }}>
                          <span style={{ fontSize: "13px", fontWeight: 800, color: '#fff', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {(sub.title || sub.courseTitle || "").split(/\s+/).map((w: string) => w.length <= 4 && /^[A-Z0-9]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: "10px", color: AURA.sub, fontWeight: 700 }}>
                              {sub.courseCode || sub.code}
                            </span>
                            {hasPending && (
                              <span style={{ fontSize: '8px', color: AURA.amber, background: 'rgba(255,149,0,0.1)', padding: '2px 8px', borderRadius: '100px', fontWeight: 900 }}>PENDING TESTS</span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }} className="tabular-nums">
                          <span style={{ fontSize: '15px', fontWeight: 900, color: getGradeLetter(avg).color }}>
                            {avg > 0 ? `${avg.toFixed(1)}%` : "N/A"}
                          </span>
                          <span style={{ fontSize: '8px', fontWeight: 800, color: AURA.sub }}>
                            {completedTests.length} of {sub.tests?.length} graded
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Selected subject active marks slider forecasts */
            <div>
              {/* Back to list */}
              <button
                onClick={() => { setSelectedSubject(null); setHypotheticalScores({}); setEndSemEstimate(""); }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: AURA.text,
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '20px'
                }}
              >
                ← Back to Subjects
              </button>

              <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 4px', color: '#fff' }}>
                {(selectedSubject.title || selectedSubject.courseTitle || "").split(/\s+/).map((w: string) => w.length <= 4 && /^[A-Z0-9]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
              </h4>
              <p style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>
                {selectedSubject.courseCode || selectedSubject.code} · Current Average: {marksForecaster?.currentSubjectAvg.toFixed(1)}%
              </p>

              {/* Grid: Live Simulation Slider controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {marksForecaster?.testCategories.map((test: AnyValue) => {
                  if (test.isCompleted) {
                    return (
                      <div 
                        key={test.index}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '14px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={14} color={AURA.emerald} />
                          <span style={{ fontSize: '12px', fontWeight: 800, color: AURA.subBright }}>{test.testName}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }} className="tabular-nums">
                          Graded: {test.actualScore} / {test.max}
                        </span>
                      </div>
                    );
                  }

                  const hypVal = hypotheticalScores[`test_${test.index}`] ?? 0;
                  return (
                    <div 
                      key={test.index}
                      style={{
                        background: 'rgba(192, 132, 252,0.03)',
                        border: '1px solid rgba(192, 132, 252,0.15)',
                        borderRadius: '16px',
                        padding: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: AURA.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Zap size={12} color={AURA.amber} className="floating" />
                          {test.testName} (Hypothetical)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input 
                            type="number" 
                            min={0} 
                            max={test.max}
                            step={0.5}
                            value={hypVal}
                            onChange={(e) => handleScoreChange(test.index, e.target.value, test.max)}
                            style={{
                              width: '50px',
                              padding: '4px 8px',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(192, 132, 252,0.3)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 900,
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                          <span style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700 }}>/ {test.max}</span>
                        </div>
                      </div>
                      
                      <input 
                        type="range"
                        min={0}
                        max={test.max}
                        step={0.5}
                        value={hypVal}
                        onChange={(e) => handleScoreChange(test.index, e.target.value, test.max)}
                        style={{
                          width: '100%',
                          accentColor: AURA.primary,
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  );
                })}

                {marksForecaster && marksForecaster.endSemWeight > 0 && (
                  <div 
                    style={{
                      background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.08) 0%, rgba(255, 117, 195, 0.04) 100%)',
                      border: '1px solid rgba(192, 132, 252, 0.25)',
                      borderRadius: '16px',
                      padding: '16px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: AURA.purple, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={12} color={AURA.purple} className="floating" />
                        End-Semester Exam (Estimated)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="number" 
                          min={0} 
                          max={100}
                          placeholder="—"
                          value={endSemEstimate}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setEndSemEstimate("");
                            } else {
                              const num = parseFloat(val) || 0;
                              setEndSemEstimate(Math.max(0, Math.min(100, num)));
                            }
                          }}
                          style={{
                            width: '50px',
                            padding: '4px 8px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(192, 132, 252,0.3)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 900,
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700 }}>/ 100</span>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '9.5px', color: AURA.subBright, fontWeight: 650, margin: '0 0 12px' }}>
                      Worth <strong style={{ color: AURA.cyan }}>{marksForecaster.endSemWeight}%</strong> of final grade (scales to <strong style={{ color: AURA.cyan }}>{endSemEstimate !== "" ? ((Number(endSemEstimate)/100) * marksForecaster.endSemWeight).toFixed(1) : "—"} / {marksForecaster.endSemWeight}</strong> marks).
                    </p>

                    <input 
                      type="range"
                      min={0}
                      max={100}
                      value={endSemEstimate === "" ? 0 : endSemEstimate}
                      onChange={(e) => setEndSemEstimate(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: AURA.purple,
                        cursor: 'pointer'
                      }}
                    />
                    
                    {endSemEstimate === "" && (
                      <div style={{ marginTop: '8px', fontSize: '9px', color: AURA.amber, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={10} color={AURA.amber} />
                        Slide or enter a mark to unlock the overall grade forecast.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Simulation Result Card */}
              {marksForecaster && (
                <div style={{ background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.08) 0%, rgba(0, 229, 255, 0.05) 100%)', border: '1px solid rgba(192, 132, 252,0.25)', borderRadius: '20px', padding: '18px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <TrendingUp size={16} color={AURA.primary} />
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>Forecast Projections</span>
                  </div>
                  
                  {marksForecaster.projectedSubjectAvg === -1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', textAlign: 'center' }}>
                      <HelpCircle size={28} color={AURA.purple} style={{ opacity: 0.6, marginBottom: '8px' }} className="floating" />
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Awaiting End-Semester Marks</span>
                      <p style={{ fontSize: '10px', color: AURA.sub, margin: 0, maxWidth: '240px', lineHeight: 1.3 }}>
                        Please slide or enter your estimated End Semester exam mark above to unlock the overall grade projection.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="tabular-nums">
                      <div>
                        <span style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, textTransform: 'uppercase' }}>Simulated Average</span>
                        <p style={{ fontSize: '24px', fontWeight: 950, color: AURA.primary, margin: '4px 0 0' }}>
                          {marksForecaster.projectedSubjectAvg.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, textTransform: 'uppercase' }}>Projected Grade</span>
                        <p style={{ fontSize: '24px', fontWeight: 950, color: getGradeLetter(marksForecaster.projectedSubjectAvg).color, margin: '4px 0 0' }}>
                          {getGradeLetter(marksForecaster.projectedSubjectAvg).letter} <span style={{ fontSize: '10px', fontWeight: 800, verticalAlign: 'middle', opacity: 0.8 }}>({getGradeLetter(marksForecaster.projectedSubjectAvg).label})</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TARGET GOAL SEEK CALCULATOR WIDGET */}
              {marksForecaster && (
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(192, 132, 252,0.2)', borderRadius: '24px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Target size={16} color={AURA.purple} className="floating" />
                    <span style={{ fontSize: '12px', fontWeight: 950, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade & Score Goal Seek</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', color: AURA.subBright, fontWeight: 750 }}>I want to score a subject average of:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="number"
                        min={30}
                        max={100}
                        value={targetSubjectAverage}
                        onChange={(e) => setTargetSubjectAverage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                        style={{
                          width: '56px',
                          padding: '6px 8px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(192, 132, 252,0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 900,
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '12px', color: AURA.sub, fontWeight: 900 }}>%</span>
                    </div>
                  </div>

                  <div style={{ 
                    background: marksForecaster.isGoalFeasible ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 45, 85, 0.08)',
                    border: `1px solid ${marksForecaster.isGoalFeasible ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 45, 85, 0.2)'}`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: marksForecaster.isGoalFeasible ? AURA.emerald : AURA.red, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {marksForecaster.isGoalFeasible ? "GOAL FEASIBILITY: FEASIBLE" : "GOAL FEASIBILITY: IMPOSSIBLE"}
                    </span>
                    <p style={{ fontSize: '12px', fontWeight: 750, color: '#fff', margin: 0, lineHeight: 1.4 }}>
                      {marksForecaster.goalRemainingLabel}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ATTENDANCE FORECASTER TAB */
        <div>
          {/* Global Target Segments */}
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: AURA.subBright }}>Set Target Attendance Threshold:</span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: AURA.cyan }} className="tabular-nums">{targetAttendancePercent}%</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {[75, 80, 85, 90].map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetAttendancePercent(t)}
                  style={{
                    background: targetAttendancePercent === t ? "rgba(0, 229, 255, 0.15)" : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${targetAttendancePercent === t ? "rgba(0, 229, 255, 0.4)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: '10px',
                    color: targetAttendancePercent === t ? "#fff" : AURA.subBright,
                    padding: '8px 0',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t}%
                </button>
              ))}
            </div>
          </div>

          {!selectedSubject ? (
            /* Sub-tab: Skip/Recovery summaries for all courses */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* INTERACTIVE CALENDAR SKIP FORECASTER TRIGGER */}
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(192, 132, 252, 0.05) 100%)',
                  border: '1px solid rgba(0, 229, 255, 0.25)', 
                  borderRadius: '24px', 
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedSubject("calendar")}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '38px', height: '38px', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color={AURA.cyan} style={{ margin: '0 auto' }} />
                  </div>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 900, color: '#fff', margin: 0 }}>Interactive Calendar Skips</h5>
                    <p style={{ fontSize: '10px', color: AURA.sub, margin: '2px 0 0', fontWeight: 650 }}>Select calendar dates to simulate absences</p>
                  </div>
                </div>
                <ChevronRight size={16} color={AURA.cyan} />
              </div>

              {/* List of subjects and safe buffers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }} className="hide-scrollbar">
                {attendanceForecasts.map((sub: AnyValue, idx: number) => {
                  const isSafe = sub.pct >= targetAttendancePercent;
                  const indicatorColor = isSafe ? AURA.emerald : AURA.red;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSubject(sub)}
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        borderRadius: "18px",
                        padding: "14px 18px",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.25s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                        e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, paddingRight: '12px' }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: '#fff', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {(sub["Course Title"] || "").split(/\s+/).map((w: string) => w.length <= 4 && /^[A-Z0-9]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '9px', color: AURA.sub, fontWeight: 700 }}>{sub["Course Code"]}</span>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                          <span style={{ fontSize: '9px', color: indicatorColor, fontWeight: 850 }}>
                            {isSafe ? `CAN SKIP: ${sub.safeSkips}` : `ATTEND NEXT: ${sub.recoveryClasses}`}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }} className="tabular-nums">
                        <span style={{ fontSize: '14px', fontWeight: 900, color: sub.status.color }}>
                          {sub.pct.toFixed(1)}%
                        </span>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: AURA.sub }}>
                          {sub.attended} / {sub.conducted} classes
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedSubject === "calendar" ? (
            /* SPECIAL INLINE VIEW: Calendar-Based Skip Calculator */
            <div>
              <button
                onClick={() => { setSelectedSubject(null); setSelectedDates(new Set()); setCalendarPredictions(null); }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: AURA.text,
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '20px'
                }}
              >
                ← Back to Attendance
              </button>

              <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 6px', color: '#fff' }}>
                Calendar Skips Predictor
              </h4>
              <p style={{ fontSize: '11px', color: AURA.sub, margin: '0 0 16px', fontWeight: 650 }}>
                Select upcoming dates from the Academic Calendar that you plan to skip.
              </p>

              {isCalSyncing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                  <div className="srmx-spinner" style={{ width: '28px', height: '28px' }} />
                </div>
              ) : (
                <div>
                  {/* Calendar Strip (excluding weekends) */}
                  <div
                    className="hide-scrollbar"
                    style={{
                      display: "flex",
                      overflowX: "auto",
                      gap: "8px",
                      paddingBottom: "16px",
                      marginBottom: "20px",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {next30Days.map((d: AnyValue) => {
                      const sel = selectedDates.has(d.iso);
                      const isWknd = [0, 6].includes(d.date.getDay());
                      if (isWknd) return null; // Filter out weekends visually to save space

                      return (
                        <div
                          key={d.iso}
                          onClick={() => toggleDate(d.iso)}
                          style={{
                            flexShrink: 0,
                            width: "48px",
                            height: "64px",
                            borderRadius: "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background: sel
                              ? `linear-gradient(135deg, ${AURA.red}, #b31032)`
                              : "rgba(255, 255, 255, 0.03)",
                            border: `1px solid ${
                              sel ? AURA.red : "rgba(255, 255, 255, 0.08)"
                            }`,
                            cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                            boxShadow: sel ? `0 0 12px rgba(255, 45, 85, 0.35)` : "none",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "9px",
                              color: sel ? "#ffffff" : AURA.sub,
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: "4px"
                            }}
                          >
                            {d.dayStr}
                          </div>
                          <div
                            style={{
                              fontSize: "17px",
                              color: "#ffffff",
                              fontWeight: 900,
                            }}
                            className="tabular-nums"
                          >
                            {d.dateNum}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={calculateCalendarPredictions}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: `linear-gradient(135deg, ${AURA.purple} 0%, ${AURA.primary} 100%)`,
                      borderRadius: "16px",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 10px 20px rgba(192, 132, 252, 0.2)",
                      transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      marginBottom: '24px'
                    }}
                  >
                    Run Skip Simulation
                  </button>

                  {/* Predictions Output list */}
                  {calendarPredictions && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h5 style={{ fontSize: '10px', fontWeight: 900, color: AURA.sub, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                        Forecasted Percentages
                      </h5>

                      {calendarPredictions.length === 0 ? (
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center', fontSize: '11px', color: AURA.sub }}>
                          No skipped sessions on selected days.
                        </div>
                      ) : (
                        calendarPredictions.map((p: AnyValue, idx: number) => {
                          const isProjectedSafe = p.projPct >= 75;
                          const indicatorColor = isProjectedSafe ? AURA.cyan : AURA.red;

                          return (
                            <div
                              key={idx}
                              style={{
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid rgba(255,255,255,0.04)',
                                borderLeft: `3px solid ${indicatorColor}`,
                                borderRadius: '16px',
                                padding: '14px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ flex: 1, paddingRight: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {(p.title || "").split(/\s+/).map((w: string) => w.length <= 4 && /^[A-Z0-9]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: indicatorColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                                  {p.marginLabel}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }} className="tabular-nums">
                                <span style={{ fontSize: '16px', fontWeight: 900, color: indicatorColor }}>
                                  {p.projPct.toFixed(1)}%
                                </span>
                                <span style={{ fontSize: '9px', color: AURA.sub, fontWeight: 700 }}>
                                  Current: {p.currentPct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected subject skip/recovery controls */
            <div>
              <button
                onClick={() => setSelectedSubject(null)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: AURA.text,
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '20px'
                }}
              >
                ← Back to Attendance
              </button>

              <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 4px', color: '#fff' }}>
                {(selectedSubject["Course Title"] || "").split(/\s+/).map((w: string) => w.length <= 4 && /^[A-Z0-9]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
              </h4>
              <p style={{ fontSize: '10px', color: AURA.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>
                {selectedSubject["Course Code"]} · Current: {selectedSubject.pct.toFixed(1)}% ({selectedSubject.attended}/{selectedSubject.conducted} classes)
              </p>

              {/* Detailed metrics box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: AURA.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Present classes</span>
                  <p style={{ fontSize: '20px', fontWeight: 950, color: AURA.emerald, margin: '4px 0 0' }} className="tabular-nums">{selectedSubject.attended}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: AURA.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Absent classes</span>
                  <p style={{ fontSize: '20px', fontWeight: 950, color: AURA.red, margin: '4px 0 0' }} className="tabular-nums">{selectedSubject.absent}</p>
                </div>
              </div>

              {/* Dynamic Action Buffer Banner */}
              {(() => {
                const subFore = attendanceForecasts.find(s => s["Course Code"] === selectedSubject["Course Code"]);
                if (!subFore) return null;
                const isSafe = subFore.pct >= targetAttendancePercent;

                return (
                  <div style={{ 
                    background: isSafe ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 45, 85, 0.08)',
                    border: `1.5px solid ${isSafe ? 'rgba(52, 199, 89, 0.25)' : 'rgba(255, 45, 85, 0.25)'}`,
                    borderRadius: '20px',
                    padding: '18px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertCircle size={14} color={isSafe ? AURA.cyan : AURA.amber} />
                      <span style={{ fontSize: '11px', fontWeight: 950, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Foresight Recommendation
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: AURA.subBright, margin: 0, lineHeight: 1.4 }}>
                      {isSafe 
                        ? `You are currently above your ${targetAttendancePercent}% target. You can safely skip up to ${subFore.safeSkips} more sessions of this subject before dropping below.`
                        : `You are currently below your ${targetAttendancePercent}% target. You must attend the next ${subFore.recoveryClasses} consecutive sessions of this subject to recover and hit your target.`
                      }
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
