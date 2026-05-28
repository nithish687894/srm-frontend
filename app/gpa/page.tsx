"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { 
  Calculator, TrendingUp, AlertCircle, Sparkles, 
  Target, Award, Zap, ChevronRight, HelpCircle, 
  Check, RefreshCcw, Sliders, CheckCircle2, Info
} from "lucide-react";

// SRM Grade boundaries and points
const GRADE_TABLE = [
  { min: 91, grade: "O",  points: 10, color: "#10B981", label: "Outstanding" },      // Emerald Green
  { min: 81, grade: "A+", points: 9,  color: "#BF5AF2", label: "Excellent" },        // Purple
  { min: 71, grade: "A",  points: 8,  color: "#00E5FF", label: "Very Good" },        // Cyan
  { min: 61, grade: "B+", points: 7,  color: "#FF9500", label: "Good" },             // Amber
  { min: 56, grade: "B",  points: 6,  color: "#64748B", label: "Above Average" },    // Slate Gray
  { min: 50, grade: "C",  points: 5,  color: "#475569", label: "Average" },          // Dark Slate
  { min: 40, grade: "P",  points: 4,  color: "#F87171", label: "Pass" },             // Light Red
  { min: 0,  grade: "F",  points: 0,  color: "#EF4444", label: "Fail / Arrear" },    // Crimson Red
];

// Helper to determine grade based on rounded total score
function getGrade(totalScore: number) {
  const score = Math.round(totalScore);
  return GRADE_TABLE.find(g => score >= g.min) || GRADE_TABLE[GRADE_TABLE.length - 1];
}

// Custom theme styling profiles
const THEME_CONFIG = {
  aura: {
    bg: "#050508",
    textColor: "#ffffff",
    titleGradient: "linear-gradient(135deg, #FF2D55, #BF5AF2)",
    cardBg: "rgba(255, 255, 255, 0.02)",
    cardBorder: "1px solid rgba(191, 90, 242, 0.15)",
    cardBorderHover: "1px solid rgba(191, 90, 242, 0.35)",
    accentColor: "#BF5AF2",
    accentPink: "#FF2D55",
    accentGlow: "rgba(191, 90, 242, 0.3)",
    fontFamily: "'Inter', sans-serif",
    gaugeGradient: ["#FF2D55", "#BF5AF2"],
    scrollThumb: "rgba(191, 90, 242, 0.3)"
  },
  matrix: {
    bg: "#000000",
    textColor: "#00FF33",
    titleGradient: "linear-gradient(135deg, #00FF33, #a8c200)",
    cardBg: "#050805",
    cardBorder: "1px solid rgba(168, 194, 0, 0.3)",
    cardBorderHover: "1px solid #00FF33",
    accentColor: "#a8c200",
    accentPink: "#00FF33",
    accentGlow: "rgba(168, 194, 0, 0.5)",
    fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
    gaugeGradient: ["#a8c200", "#00FF33"],
    scrollThumb: "rgba(168, 194, 0, 0.4)"
  },
  cosmos: {
    bg: "#07070F",
    textColor: "#f0f0ff",
    titleGradient: "linear-gradient(135deg, #00D2FF, #7C3AED)",
    cardBg: "rgba(13, 13, 27, 0.5)",
    cardBorder: "1px solid rgba(0, 210, 255, 0.12)",
    cardBorderHover: "1px solid rgba(0, 210, 255, 0.35)",
    accentColor: "#00D2FF",
    accentPink: "#7C3AED",
    accentGlow: "rgba(0, 210, 255, 0.25)",
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    gaugeGradient: ["#00D2FF", "#7C3AED"],
    scrollThumb: "rgba(0, 210, 255, 0.3)"
  }
};

export default function GPAPage() {
  const [attendance, setAttendance] = useState<AnyValue[]>([]);
  const [marks, setMarks] = useState<AnyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [internals, setInternals] = useState<Record<string, number>>({});
  const [externals, setExternals] = useState<Record<string, number>>({});
  const [targetGpa, setTargetGpa] = useState<number>(9.00);
  
  const router = useRouter();
  const { ready } = useAuth();
  const theme = useThemeStore((state) => state.theme) || "aura";
  const academicData = useAuthStore((state) => state.academicData);
  const studentPortalData = useAuthStore((state) => state.studentPortalData);

  const activeConfig = THEME_CONFIG[theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.aura;

  // Initial data hydration & preloader
  useEffect(() => {
    if (!ready) return;

    // Phase 1: Rapid hydration from cached Zustand store to avoid blocking loader
    const cachedAttendance = academicData?.attendance?.length 
      ? academicData.attendance 
      : (studentPortalData?.attendance || []);
      
    const cachedMarks = academicData?.marks?.length 
      ? academicData.marks 
      : (studentPortalData?.marks || []);

    if (cachedAttendance.length > 0) {
      const initInt: Record<string, number> = {};
      const initExt: Record<string, number> = {};
      
      cachedMarks.forEach((mk: AnyValue) => {
        const scored = mk.tests?.reduce((s: number, t: AnyValue) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
        const maxTotal = mk.tests?.reduce((s: number, t: AnyValue) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
        if (maxTotal > 0) {
          // SRM scale internals to 60 marks
          initInt[mk.courseCode] = Math.min(60, Math.round((scored / maxTotal) * 60));
        } else {
          initInt[mk.courseCode] = 45; // sensible default
        }
        initExt[mk.courseCode] = 55; // sensible default external (out of 75)
      });
      
      setTimeout(() => {
        setAttendance(cachedAttendance);
        setMarks(cachedMarks);
        setInternals(initInt);
        setExternals(initExt);
        setLoading(false);
      }, 0);
    }

    // Phase 2: Background refresh for real-time correctness
    Promise.all([dataAPI.getAttendance(), dataAPI.getMarks()])
      .then(([a, m]) => {
        const freshAttendance = a.data || a || [];
        const freshMarks = m.data || m || [];
        
        setAttendance(freshAttendance);
        setMarks(freshMarks);
        
        const initInt: Record<string, number> = {};
        const initExt: Record<string, number> = {};
        
        freshMarks.forEach((mk: AnyValue) => {
          const scored = mk.tests?.reduce((s: number, t: AnyValue) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
          const maxTotal = mk.tests?.reduce((s: number, t: AnyValue) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
          if (maxTotal > 0) {
            initInt[mk.courseCode] = Math.min(60, Math.round((scored / maxTotal) * 60));
          } else {
            initInt[mk.courseCode] = 45;
          }
          initExt[mk.courseCode] = externals[mk.courseCode] ?? 55;
        });

        // Set fallbacks for courses not in marks list
        freshAttendance.forEach((c: AnyValue) => {
          const code = c["Course Code"];
          if (c["Category"] === "Theory") {
            if (initInt[code] === undefined) initInt[code] = internals[code] ?? 45;
            if (initExt[code] === undefined) initExt[code] = externals[code] ?? 55;
          }
        });
        
        setInternals(initInt);
        setExternals(initExt);
        setLoading(false);
      })
      .catch((err) => {
        console.error("GPA page background refresh failed", err);
        if (cachedAttendance.length === 0) {
          router.push("/dashboard");
        } else {
          setLoading(false);
        }
      });
  }, [ready]);

  // Filter theory subjects
  const theorySubjects = useMemo(() => {
    return attendance.filter(c => c["Category"] === "Theory");
  }, [attendance]);

  // Process rows with SRM scoring logic
  const rows = useMemo(() => {
    return theorySubjects.map(c => {
      const code = c["Course Code"];
      const intMark = internals[code] ?? 45;
      const extMark = externals[code] ?? 55;
      
      // SRM Conversion: Internal (out of 60) + External (out of 75 scaled to 40)
      const scaledExternal = (extMark * 40) / 75;
      const total = intMark + scaledExternal;
      const roundedTotal = Math.round(total);
      const grade = getGrade(roundedTotal);
      
      return { 
        code, 
        title: c["Course Title"], 
        intMark, 
        extMark, 
        scaledExternal, 
        total: roundedTotal, 
        grade 
      };
    });
  }, [theorySubjects, internals, externals]);

  // Calculate live GPA
  const simulatedGpa = useMemo(() => {
    if (rows.length === 0) return 0;
    const totalPoints = rows.reduce((s, r) => s + r.grade.points, 0);
    return totalPoints / rows.length;
  }, [rows]);

  const gpaStatus = useMemo(() => {
    if (simulatedGpa >= 9.0) return { label: "OUTSTANDING", color: "#10B981" };
    if (simulatedGpa >= 8.0) return { label: "EXCELLENT", color: "#BF5AF2" };
    if (simulatedGpa >= 7.0) return { label: "VERY GOOD", color: "#00E5FF" };
    if (simulatedGpa >= 6.0) return { label: "GOOD", color: "#FF9500" };
    if (simulatedGpa >= 5.0) return { label: "AVERAGE", color: "#64748B" };
    return { label: "NEEDS IMPROVEMENT", color: "#EF4444" };
  }, [simulatedGpa]);

  // Dynamic Programming Target GPA Solver
  const solvedResult = useMemo(() => {
    const n = theorySubjects.length;
    if (n === 0) return null;
    
    // Total grade points needed to reach target GPA
    const targetPointsNeeded = Math.ceil(targetGpa * n);
    
    // For each course, map all achievable grades and the minimum external mark required
    const coursesOptions = theorySubjects.map(c => {
      const code = c["Course Code"];
      const I = internals[code] ?? 45;
      
      // Map all grade levels to required external score (0 to 75)
      const options = GRADE_TABLE.map(g => {
        // Rounding adjustment: I + E * 40 / 75 >= g.min - 0.5
        const E = Math.max(0, Math.ceil((g.min - 0.5 - I) * 1.875));
        return { 
          grade: g.grade, 
          points: g.points, 
          extNeeded: E, 
          color: g.color 
        };
      }).filter(opt => opt.extNeeded <= 75); // Filter out impossible grades
      
      options.sort((a, b) => a.points - b.points);
      return { code, title: c["Course Title"], options, internal: I };
    });

    const maxPoints = n * 10;
    const dp: number[][] = Array(n + 1).fill(0).map(() => Array(maxPoints + 1).fill(Infinity));
    const parent: AnyValue[][] = Array(n + 1).fill(0).map(() => Array(maxPoints + 1).fill(null));
    
    dp[0][0] = 0;
    
    for (let i = 0; i < n; i++) {
      const c = coursesOptions[i];
      for (let s = 0; s <= maxPoints; s++) {
        if (dp[i][s] === Infinity) continue;
        
        for (const opt of c.options) {
          const nextS = s + opt.points;
          if (nextS > maxPoints) continue;
          
          const nextCost = dp[i][s] + opt.extNeeded;
          if (nextCost < dp[i][nextS]) {
            dp[i + 1][nextS] = nextCost;
            parent[i + 1][nextS] = { prevS: s, option: opt };
          }
        }
      }
    }

    // Find the best points combination >= targetPointsNeeded that minimizes total cost
    let bestPoints = -1;
    let minCost = Infinity;
    for (let s = targetPointsNeeded; s <= maxPoints; s++) {
      if (dp[n][s] < minCost) {
        minCost = dp[n][s];
        bestPoints = s;
      }
    }

    if (minCost === Infinity) {
      return { feasible: false, avgExternal: 0, recommendations: {} };
    }

    // Backtrack to find optimal marks path
    const recommendations: Record<string, { grade: string; extNeeded: number; points: number; color: string }> = {};
    let currS = bestPoints;
    for (let i = n; i > 0; i--) {
      const p = parent[i][currS];
      if (!p) break;
      const code = coursesOptions[i - 1].code;
      recommendations[code] = {
        grade: p.option.grade,
        extNeeded: p.option.extNeeded,
        points: p.option.points,
        color: p.option.color
      };
      currS = p.prevS;
    }

    return {
      feasible: true,
      avgExternal: minCost / n,
      totalExternalNeeded: minCost,
      achievedGpa: bestPoints / n,
      recommendations
    };
  }, [theorySubjects, internals, targetGpa]);

  // Apply the optimal simulation directly to sliders
  const applyOptimalSimulation = () => {
    if (!solvedResult || !solvedResult.feasible) return;
    const nextExt: Record<string, number> = {};
    const recommendations = (solvedResult.recommendations || {}) as Record<string, AnyValue>;
    Object.keys(recommendations).forEach(code => {
      nextExt[code] = recommendations[code].extNeeded;
    });
    setExternals(p => ({ ...p, ...nextExt }));
  };

  if (loading) {
    return (
      <div className={`page-root theme-${theme}`} style={{
        background: activeConfig.bg,
        color: activeConfig.textColor,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: activeConfig.fontFamily
      }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCcw size={40} className="animate-spin" style={{ color: activeConfig.accentColor, marginBottom: "16px" }} />
          <div style={{ letterSpacing: "0.15em", fontSize: "12px", textTransform: "uppercase", opacity: 0.8 }}>Initializing Predictor HUD...</div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // Circular gauge setup
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (simulatedGpa / 10) * circumference;

  return (
    <div className={`page-root theme-${theme} ${theme === "matrix" ? "matrix-crt" : ""}`} style={{
      background: activeConfig.bg,
      color: activeConfig.textColor,
      fontFamily: activeConfig.fontFamily,
      minHeight: "100vh",
      position: "relative",
      overflowX: "hidden",
      paddingBottom: "120px"
    }}>
      {/* Background aesthetics */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .matrix-crt::after {
          content: " ";
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.22) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.05));
          z-index: 99999;
          background-size: 100% 4px, 6px 100%;
          pointer-events: none;
        }
        .gpa-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gpa-card:hover {
          transform: translateY(-2px);
        }
        .glow-btn {
          box-shadow: 0 0 15px ${activeConfig.accentGlow};
          transition: all 0.2s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 25px ${activeConfig.accentGlow};
          transform: scale(1.02);
        }
        .glow-btn:active {
          transform: scale(0.98);
        }
        input[type="range"] {
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          height: 6px;
          outline: none;
          transition: background 250ms ease;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${activeConfig.accentColor};
          box-shadow: 0 0 10px ${activeConfig.accentGlow};
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        .gpa-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .gpa-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .gpa-scroll::-webkit-scrollbar-thumb {
          background: ${activeConfig.scrollThumb};
          border-radius: 99px;
        }
        @media (min-width: 1024px) {
          .gpa-grid-layout {
            display: grid;
            grid-template-columns: 380px 1fr;
            gap: 32px;
            align-items: start;
          }
        }
      `}} />

      {theme === "aura" && (
        <div style={{
          position: "absolute",
          top: "-5%",
          left: "25%",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          background: "conic-gradient(from 180deg at 50% 50%, #FF2D55 0deg, #BF5AF2 120deg, #00E5FF 240deg, #FF2D55 360deg)",
          filter: "blur(130px)",
          opacity: 0.14,
          pointerEvents: "none",
          zIndex: 0,
          animation: "spin 25s linear infinite"
        }} />
      )}

      {theme === "cosmos" && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(circle at 15% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 40%), radial-gradient(circle at 85% 80%, rgba(0, 210, 255, 0.08) 0%, transparent 40%)",
          pointerEvents: "none",
          zIndex: 0
        }} />
      )}

      <Sidebar />

      <main className="page-main" style={{ position: "relative", zIndex: 1 }}>
        <div className="page-content" style={{ padding: "24px 20px" }}>
          
          {/* Header section */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <div>
              <div style={{ 
                fontSize: "10px", 
                letterSpacing: "0.25em", 
                color: activeConfig.accentColor, 
                fontWeight: 900, 
                textTransform: "uppercase",
                marginBottom: "4px"
              }}>
                {theme === "matrix" ? "SYSTEM::FORECAST_ENGINE" : "Academic Intelligence"}
              </div>
              <h1 style={{ 
                fontSize: "32px", 
                fontWeight: 900, 
                letterSpacing: "-1px", 
                margin: 0,
                backgroundImage: activeConfig.titleGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: theme === "matrix" ? "none" : "transparent",
              }}>
                GPA Sim & Goal Seeker
              </h1>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              background: activeConfig.cardBg, 
              border: activeConfig.cardBorder,
              padding: "8px 14px", 
              borderRadius: "14px",
              fontSize: "12px",
              fontWeight: 800
            }}>
              <Zap size={14} style={{ color: activeConfig.accentColor }} />
              <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{theme} Active</span>
            </div>
          </div>

          <div className="gpa-grid-layout">
            
            {/* Left Column: Gauges and Seeker Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
              
              {/* Circular Gauge Card */}
              <div style={{
                background: activeConfig.cardBg,
                border: activeConfig.cardBorder,
                borderRadius: "24px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                boxShadow: theme === "aura" ? "0 8px 32px 0 rgba(0, 0, 0, 0.3)" : "none"
              }}>
                <div style={{ position: "relative", width: "160px", height: "160px", marginBottom: "16px" }}>
                  {/* Gauge SVG */}
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={activeConfig.gaugeGradient[0]} />
                        <stop offset="100%" stopColor={activeConfig.gaugeGradient[1]} />
                      </linearGradient>
                    </defs>
                    {/* Background Track */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth={strokeWidth}
                    />
                    {/* Active Sweep */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="url(#gaugeGrad)"
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                      style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    />
                  </svg>
                  
                  {/* Center Text */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>GPA</span>
                    <span style={{ 
                      fontSize: "36px", 
                      fontWeight: 900, 
                      lineHeight: 1, 
                      letterSpacing: "-1px",
                      color: "#fff",
                      textShadow: theme !== "matrix" ? `0 0 15px ${activeConfig.accentColor}55` : "none"
                    }}>
                      {simulatedGpa.toFixed(2)}
                    </span>
                    <span style={{ fontSize: "9px", fontWeight: 900, color: gpaStatus.color, letterSpacing: "0.05em", marginTop: "4px" }}>
                      {gpaStatus.label}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", width: "100%", justifyContent: "center", marginTop: "8px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "8px 12px", flex: 1 }}>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800 }}>Subjects</div>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#fff", marginTop: "2px" }}>{rows.length}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "8px 12px", flex: 1 }}>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800 }}>Scale</div>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: activeConfig.accentColor, marginTop: "2px" }}>SRM 10.0</div>
                  </div>
                </div>
              </div>

              {/* Goal Seeker Card */}
              <div style={{
                background: activeConfig.cardBg,
                border: activeConfig.cardBorder,
                borderRadius: "24px",
                padding: "28px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ 
                    width: "36px", 
                    height: "36px", 
                    borderRadius: "10px", 
                    background: `rgba(${theme === "matrix" ? "168,194,0" : "0,210,255"}, 0.1)`, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <Target size={18} style={{ color: activeConfig.accentColor }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900 }}>Target Goal Seeker</h3>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>Optimal Solver Engine</div>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>Dream GPA Target</span>
                    <span style={{ fontSize: "24px", fontWeight: 900, color: activeConfig.accentColor }}>{targetGpa.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={4.00} 
                    max={10.00} 
                    step={0.05} 
                    value={targetGpa} 
                    onChange={e => setTargetGpa(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: activeConfig.accentColor }}
                  />
                </div>

                {solvedResult && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {solvedResult.feasible ? (
                      <>
                        <div style={{ 
                          background: "rgba(16, 185, 129, 0.08)", 
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          padding: "16px", 
                          borderRadius: "16px" 
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981", fontWeight: 900, fontSize: "13px" }}>
                            <CheckCircle2 size={16} />
                            FEASIBLE GOAL
                          </div>
                          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                            Requires an average final exam mark of <strong style={{ color: "#fff" }}>{Math.round(solvedResult.avgExternal)} / 75</strong> across your courses.
                          </p>
                        </div>

                        <button 
                          onClick={applyOptimalSimulation}
                          className="glow-btn"
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "14px",
                            background: activeConfig.accentColor,
                            color: theme === "matrix" ? "#000" : "#fff",
                            fontSize: "12px",
                            fontWeight: 900,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                          }}
                        >
                          <Sparkles size={14} />
                          Apply Optimal Simulation
                        </button>
                      </>
                    ) : (
                      <div style={{ 
                        background: "rgba(239, 68, 68, 0.08)", 
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        padding: "16px", 
                        borderRadius: "16px" 
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#EF4444", fontWeight: 900, fontSize: "13px" }}>
                          <AlertCircle size={16} />
                          UNFEASIBLE GOAL
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                          Scoring a perfect 75/75 in all final exams is not enough to hit {targetGpa.toFixed(2)}. Boost your internal scores in the simulator to unlock this target!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SRM Grade reference list */}
              <div style={{
                background: activeConfig.cardBg,
                border: activeConfig.cardBorder,
                borderRadius: "24px",
                padding: "24px",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px"
              }}>
                <div style={{ gridColumn: "1 / -1", fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                  SRM Academic Grade System
                </div>
                {GRADE_TABLE.filter(g => g.grade !== "F").map(g => (
                  <div key={g.grade} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: "16px", fontWeight: 900, color: g.color }}>{g.grade}</span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "10px", color: "#fff", fontWeight: 800 }}>{g.points} Points</span>
                      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>&ge; {g.min} marks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Course Sliders List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ 
                fontSize: "11px", 
                color: "rgba(255,255,255,0.4)", 
                textTransform: "uppercase", 
                letterSpacing: "0.15em", 
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Sliders size={12} style={{ color: activeConfig.accentColor }} />
                Interactive Subject Simulators
              </div>

              {rows.map((r) => {
                const reco = (solvedResult?.recommendations as Record<string, AnyValue>)?.[r.code];
                
                return (
                  <div 
                    key={r.code} 
                    className="gpa-card"
                    style={{
                      borderRadius: "24px", 
                      padding: "24px",
                      background: activeConfig.cardBg,
                      border: activeConfig.cardBorder,
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "18px"
                    }}
                  >
                    
                    {/* Course details & Grade display */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "200px" }}>
                        {/* Grade display */}
                        <div style={{ 
                          width: "56px", 
                          height: "56px", 
                          borderRadius: "16px", 
                          background: `rgba(${theme === "matrix" ? "168,194,0" : "255,255,255"}, 0.03)`,
                          border: `1px solid ${r.grade.color}3D`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 0 10px ${r.grade.color}22`
                        }}>
                          <span style={{ fontSize: "22px", fontWeight: 900, color: r.grade.color }}>{r.grade.grade}</span>
                          <span style={{ fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>{r.grade.points} PTS</span>
                        </div>
                        
                        {/* Name & code */}
                        <div>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: "15px", 
                            fontWeight: 800, 
                            color: "#fff", 
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            wordBreak: "break-word"
                          }}>
                            {r.title}
                          </h4>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: "0.02em", marginTop: "2px", display: "inline-block" }}>
                            {r.code} • Theory Course
                          </span>
                        </div>
                      </div>

                      {/* Cumulative Total */}
                      <div style={{ 
                        textAlign: "right", 
                        background: "rgba(255,255,255,0.02)", 
                        border: "1px solid rgba(255,255,255,0.03)", 
                        padding: "8px 16px", 
                        borderRadius: "14px" 
                      }}>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 800 }}>Total Score</div>
                        <div style={{ fontSize: "28px", fontWeight: 900, color: r.grade.color }}>{r.total} <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>/ 100</span></div>
                      </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.04)", margin: 0 }} />

                    {/* Sim Sliders row */}
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
                      gap: "24px" 
                    }}>
                      
                      {/* Internal Slider */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>Internals</span>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: "#fff" }}>
                            {r.intMark} <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>/ 60</span>
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min={0} 
                          max={60} 
                          value={r.intMark}
                          onChange={e => setInternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                          style={{ width: "100%", accentColor: activeConfig.accentPink }}
                        />
                        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                          Aggregated from cycle exams & coursework.
                        </span>
                      </div>

                      {/* External Slider */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>External Exam</span>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: activeConfig.accentColor }}>
                            {r.extMark} <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>/ 75</span>
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min={0} 
                          max={75} 
                          value={r.extMark}
                          onChange={e => setExternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                          style={{ width: "100%", accentColor: activeConfig.accentColor }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                          <span>SRM End Semester Exam</span>
                          <span>Scaled score: <strong style={{ color: "#fff" }}>{r.scaledExternal.toFixed(1)} / 40</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Individual goal seek recommendations */}
                    {reco && (
                      <div style={{ 
                        background: "rgba(255,255,255,0.01)", 
                        border: "1px solid rgba(255,255,255,0.03)", 
                        padding: "12px 16px", 
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Info size={12} style={{ color: reco.color }} />
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                            Target Solver Recommendation:
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 800 }}>
                          Target Grade: <span style={{ color: reco.color, fontWeight: 900 }}>{reco.grade}</span> 
                          <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 6px" }}>•</span> 
                          Exam Score Needed: <strong style={{ color: reco.color }}>&ge; {reco.extNeeded} / 75</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="watermark" style={{
            opacity: 0.02,
            fontSize: "90px",
            fontWeight: 950,
            textAlign: "center",
            position: "absolute",
            bottom: "40px",
            left: 0,
            right: 0,
            pointerEvents: "none",
            userSelect: "none"
          }}>
            LUMINA FORESIGHT
          </div>

        </div>
      </main>
    </div>
  );
}
