"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Calculator, 
  CalendarOff, 
  ChevronLeft, 
  ChevronRight,
  Sparkles, 
  GraduationCap, 
  Clock, 
  Calendar,
  Zap,
  Target,
  Search,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Flame
} from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import LoadingSkeleton from "@/components/aura-theme/LoadingSkeleton";
import { WhatIfCalculator } from "@/components/aura-theme/WhatIfCalculator";

type ToolCategory = "all" | "attendance" | "grades" | "schedule" | "ai";

interface ToolItem {
  id: string;
  name: string;
  badge: string;
  category: ToolCategory;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
  isExternal?: boolean;
  highlight?: boolean;
}

const TOOL_ITEMS: ToolItem[] = [
  {
    id: "bunk-budget",
    name: "Bunk Budget Calculator",
    badge: "MOST POPULAR",
    category: "attendance",
    desc: "Calculate exactly how many classes you can skip while maintaining a safe 75% attendance.",
    icon: CalendarOff,
    color: "#FF9500",
    bg: "rgba(255, 149, 0, 0.12)",
    href: "/tools/srm-attendance-calculator",
    highlight: true,
  },
  {
    id: "cgpa-calculator",
    name: "SRM CGPA & SGPA Predictor",
    badge: "2018 & 2021 REGS",
    category: "grades",
    desc: "Accurate semester grade forecast supporting both 2018 and 2021 academic regulations.",
    icon: Calculator,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.12)",
    href: "/tools/srm-cgpa-calculator",
    highlight: true,
  },
  {
    id: "gpa-planner",
    name: "GPA & Target Planner",
    badge: "SEMESTER FORECAST",
    category: "grades",
    desc: "Set target grades and simulate required marks across all theory and lab courses.",
    icon: GraduationCap,
    color: "#FF2D55",
    bg: "rgba(255, 45, 85, 0.12)",
    href: "/gpa",
  },
  {
    id: "ai-tutor",
    name: "AI Academic Companion",
    badge: "SMART AI",
    category: "ai",
    desc: "Instant academic context helper, syllabus breakdown, and interactive subject assistance.",
    icon: Sparkles,
    color: "#BF5AF2",
    bg: "rgba(191, 90, 242, 0.12)",
    href: "/ai",
  },
  {
    id: "timetable",
    name: "Master Timetable",
    badge: "DAY ORDERS 1-5",
    category: "schedule",
    desc: "Daily timetable grid, batch switcher, lab slots, and room locations.",
    icon: Clock,
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.12)",
    href: "/timetable",
  },
  {
    id: "calendar",
    name: "Academic Calendar",
    badge: "EXAMS & HOLIDAYS",
    category: "schedule",
    desc: "Official SRM calendar, exam schedules, holidays, and academic Day Order tracking.",
    icon: Calendar,
    color: "#00E5FF",
    bg: "rgba(0, 229, 255, 0.12)",
    href: "/calendar",
  },
  {
    id: "friends-sync",
    name: "Friends Free Time Solver",
    badge: "PRO SYNC",
    category: "schedule",
    desc: "Find overlapping free hours and shared course slots with classmates automatically.",
    icon: Users,
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    href: "/friends",
  },
  {
    id: "marks-hub",
    name: "Internal Marks Breakdown",
    badge: "CLA & TEST SCORES",
    category: "grades",
    desc: "Detailed CLA 1-3 scores, lab internals, and semester assessment performance.",
    icon: Award,
    color: "#E11D48",
    bg: "rgba(225, 29, 72, 0.12)",
    href: "/marks",
  },
];

export default function ToolsHubPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<"lumina" | "light">("lumina");
  const [activeCategory, setActiveCategory] = useState<ToolCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickTab, setActiveQuickTab] = useState<"bunk" | "gpa" | "simulator">("bunk");

  // Quick Bunk Calculator State
  const [quickConducted, setQuickConducted] = useState<number | "">(32);
  const [quickAttended, setQuickAttended] = useState<number | "">(27);

  // Quick Target GPA Calculator State
  const [currentCgpa, setCurrentCgpa] = useState<number | "">(8.2);
  const [completedCredits, setCompletedCredits] = useState<number | "">(60);
  const [targetCgpa, setTargetCgpa] = useState<number | "">(8.8);
  const [semCredits, setSemCredits] = useState<number | "">(20);

  const academicData = useAuthStore((state) => state.academicData);

  // Auto-fill from user attendance data if present
  useEffect(() => {
    if (academicData?.attendance && Array.isArray(academicData.attendance) && academicData.attendance.length > 0) {
      const firstValid = academicData.attendance.find((a: any) => (a.conducted || a.hoursConducted) > 0);
      if (firstValid) {
        const cond = Number(firstValid.conducted || firstValid.hoursConducted) || 30;
        const att = Number(firstValid.attended || firstValid.hoursAttended || firstValid.hoursPresent) || 25;
        setQuickConducted(cond);
        setQuickAttended(att);
      }
    }
  }, [academicData]);

  useEffect(() => { 
    const id = setTimeout(() => setMounted(true), 0); 
    return () => clearTimeout(id); 
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolve = () => {
      if (theme === "system") {
        setResolvedTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "lumina");
      } else {
        setResolvedTheme(theme === "light" ? "light" : "lumina");
      }
    };
    resolve();
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      media.addEventListener("change", resolve);
      return () => media.removeEventListener("change", resolve);
    }
  }, [theme, mounted]);

  const isLumina = resolvedTheme === "lumina";
  const pageText = isLumina ? "#fff" : "#17111f";
  const mutedText = isLumina ? "rgba(255,255,255,0.60)" : "rgba(23,17,31,0.62)";
  const cardBg = isLumina
    ? "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
    : "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(245,240,255,0.92))";
  const cardBorder = isLumina ? "rgba(255,255,255,0.09)" : "rgba(88,61,145,0.16)";
  const fieldBg = isLumina ? "rgba(0,0,0,0.35)" : "rgba(88,61,145,0.06)";
  const fieldBorder = isLumina ? "rgba(255,255,255,0.12)" : "rgba(88,61,145,0.18)";

  // Quick Bunk Calculations
  const cond = typeof quickConducted === "number" ? Math.max(0, quickConducted) : 0;
  const att = typeof quickAttended === "number" ? Math.min(cond, Math.max(0, quickAttended)) : 0;
  const currentPct = cond > 0 ? (att / cond) * 100 : 100;
  const skipsAllowed = Math.max(0, Math.floor((att - 0.75 * cond) / 0.75));
  const classesNeeded = Math.max(0, Math.ceil(3 * cond - 4 * att));
  const isSafe = currentPct >= 75;

  // Quick GPA Goal Calculations
  const curCg = typeof currentCgpa === "number" ? currentCgpa : 0;
  const compCr = typeof completedCredits === "number" ? completedCredits : 0;
  const tgtCg = typeof targetCgpa === "number" ? targetCgpa : 0;
  const semCr = typeof semCredits === "number" ? Math.max(1, semCredits) : 20;
  const requiredSgpa = semCr > 0 ? ((tgtCg * (compCr + semCr)) - (curCg * compCr)) / semCr : 0;
  const isGpaFeasible = requiredSgpa <= 10.0;

  // Filtered tools
  const filteredTools = useMemo(() => {
    return TOOL_ITEMS.filter((t) => {
      const matchesCat = activeCategory === "all" || t.category === activeCategory;
      const matchesSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);


  return (
    <div style={{ 
      background: isLumina ? "#050508" : "radial-gradient(circle at 20% 0%, rgba(191,90,242,0.08), transparent 40%), #f8f6fc", 
      minHeight: "100dvh", 
      display: "flex", 
      flexDirection: "column", 
      color: pageText, 
      fontFamily: "'Plus Jakarta Sans', sans-serif" 
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(150px);
          opacity: 0.12; z-index: 0; pointer-events: none;
        }

        .tools-card {
          border-radius: 24px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .tools-card:hover {
          transform: translateY(-3px);
          border-color: ${isLumina ? "rgba(216,180,254,0.30)" : "rgba(124,58,237,0.35)"} !important;
          box-shadow: ${isLumina ? "0 20px 40px rgba(0,0,0,0.45)" : "0 20px 40px rgba(124,58,237,0.12)"};
        }
        .tools-card:active {
          transform: scale(0.985);
        }

        .quick-tab-btn {
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .cat-chip {
          padding: 7px 14px;
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .calc-input {
          width: 100%;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 850;
          outline: none;
          transition: border-color 0.2s;
        }
        .calc-input:focus {
          border-color: #BF5AF2 !important;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 680px) {
          .tools-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 1024px) {
          .tools-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}} />

      {isLumina && (
        <>
          <div className="aura-blob" style={{ background: "#FF75C3", top: '-180px', left: '-100px' }} />
          <div className="aura-blob" style={{ background: "#8F92FF", bottom: '-180px', right: '-100px' }} />
        </>
      )}

      {/* TOP HEADER */}
      <header style={{ 
        flexShrink: 0, 
        padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 14px", 
        position: 'relative', 
        zIndex: 10, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: "1160px",
        width: "100%",
        margin: "0 auto"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => router.push("/dashboard")} 
            style={{ 
              background: isLumina ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)', 
              border: `1px solid ${cardBorder}`, 
              color: pageText, 
              width: '42px', 
              height: '42px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              backdropFilter: 'blur(18px)' 
            }}
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: "24px", fontWeight: 950, margin: 0, letterSpacing: '-0.04em' }}>Academic Suite</h1>
              <span style={{ 
                background: 'linear-gradient(135deg, #BF5AF2, #FF2D55)', 
                color: '#fff', 
                fontSize: '9.5px', 
                fontWeight: 900, 
                padding: '2px 8px', 
                borderRadius: '100px',
                letterSpacing: '0.05em'
              }}>PRO</span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 700, color: mutedText }}>
              Fast calculators, smart predictors, and daily student tools
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ 
        flex: 1, 
        overflowY: "auto", 
        WebkitOverflowScrolling: "touch", 
        padding: "0 18px 120px", 
        position: 'relative', 
        zIndex: 1,
        maxWidth: "1160px",
        width: "100%",
        margin: "0 auto"
      }}>

        {/* ─── 1. INTERACTIVE QUICK CALCULATOR CONSOLE ─────────────────── */}
        <section style={{
          borderRadius: "28px",
          padding: "20px",
          margin: "8px 0 24px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          backdropFilter: "blur(24px)",
          boxShadow: isLumina ? "0 20px 48px rgba(0,0,0,0.35)" : "0 20px 40px rgba(88,61,145,0.08)",
        }}>
          {/* Quick Tab Switcher */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ 
                width: "36px", height: "36px", borderRadius: "12px", 
                background: "rgba(191,90,242,0.15)", color: "#BF5AF2", 
                display: "flex", alignItems: "center", justifyContent: "center" 
              }}>
                <Zap size={18} />
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>Instant Smart Consoles</h2>
            </div>

            <div style={{ 
              display: "inline-flex", 
              gap: "4px", 
              background: isLumina ? "rgba(0,0,0,0.4)" : "rgba(88,61,145,0.08)", 
              padding: "4px", 
              borderRadius: "100px",
              border: `1px solid ${cardBorder}`
            }}>
              <button
                onClick={() => setActiveQuickTab("bunk")}
                className="quick-tab-btn"
                style={{
                  background: activeQuickTab === "bunk" ? (isLumina ? "rgba(255,255,255,0.12)" : "#fff") : "transparent",
                  color: activeQuickTab === "bunk" ? (isLumina ? "#fff" : "#17111f") : mutedText,
                  boxShadow: activeQuickTab === "bunk" ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
                }}
              >
                <CalendarOff size={13} color="#FF9500" />
                <span>Bunk Budget</span>
              </button>

              <button
                onClick={() => setActiveQuickTab("gpa")}
                className="quick-tab-btn"
                style={{
                  background: activeQuickTab === "gpa" ? (isLumina ? "rgba(255,255,255,0.12)" : "#fff") : "transparent",
                  color: activeQuickTab === "gpa" ? (isLumina ? "#fff" : "#17111f") : mutedText,
                  boxShadow: activeQuickTab === "gpa" ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
                }}
              >
                <Target size={13} color="#38BDF8" />
                <span>Target CGPA</span>
              </button>

              <button
                onClick={() => setActiveQuickTab("simulator")}
                className="quick-tab-btn"
                style={{
                  background: activeQuickTab === "simulator" ? (isLumina ? "rgba(255,255,255,0.12)" : "#fff") : "transparent",
                  color: activeQuickTab === "simulator" ? (isLumina ? "#fff" : "#17111f") : mutedText,
                  boxShadow: activeQuickTab === "simulator" ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
                }}
              >
                <Sparkles size={13} color="#BF5AF2" />
                <span>Goal Simulator</span>
              </button>
            </div>
          </div>

          {/* TAB 1: INSTANT BUNK BUDGET */}
          {activeQuickTab === "bunk" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 14px", fontSize: "13px", color: mutedText, fontWeight: 700, lineHeight: 1.5 }}>
                  Calculate how many classes you can afford to skip while keeping your attendance above the mandatory 75% threshold.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: mutedText, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Conducted
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quickConducted}
                      onChange={(e) => setQuickConducted(e.target.value === "" ? "" : Number(e.target.value))}
                      className="calc-input"
                      style={{ background: fieldBg, border: `1px solid ${fieldBorder}`, color: pageText }}
                      placeholder="e.g. 32"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: mutedText, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Attended
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quickAttended}
                      onChange={(e) => setQuickAttended(e.target.value === "" ? "" : Number(e.target.value))}
                      className="calc-input"
                      style={{ background: fieldBg, border: `1px solid ${fieldBorder}`, color: pageText }}
                      placeholder="e.g. 27"
                    />
                  </div>
                </div>
              </div>

              {/* Bunk Result Card */}
              <div style={{
                background: isSafe ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${isSafe ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                borderRadius: "20px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: isSafe ? "#10B981" : "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                    {isSafe ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    {isSafe ? "Safe Zone" : "Attendance Shortage"}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: "20px", fontWeight: 950, color: isSafe ? "#10B981" : "#EF4444" }}>
                    {currentPct.toFixed(1)}%
                  </span>
                </div>

                <div style={{ fontSize: "14px", fontWeight: 800, color: pageText, lineHeight: 1.4 }}>
                  {isSafe ? (
                    <span>
                      You can safely bunk <strong style={{ color: "#FF9500", fontSize: "17px" }}>{skipsAllowed}</strong> more {skipsAllowed === 1 ? "class" : "classes"} without falling below 75%.
                    </span>
                  ) : (
                    <span>
                      You must attend the next <strong style={{ color: "#EF4444", fontSize: "17px" }}>{classesNeeded}</strong> consecutive {classesNeeded === 1 ? "class" : "classes"} to recover back to 75%.
                    </span>
                  )}
                </div>

                <Link
                  href="/tools/srm-attendance-calculator"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: isLumina ? "#D8B4FE" : "#7C3AED",
                    fontSize: "12px",
                    fontWeight: 850,
                    textDecoration: "none",
                    marginTop: "4px"
                  }}
                >
                  <span>Open Full Subject-by-Subject Bunk Budget</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: TARGET CGPA GOAL */}
          {activeQuickTab === "gpa" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 14px", fontSize: "13px", color: mutedText, fontWeight: 700, lineHeight: 1.5 }}>
                  Find the exact SGPA you need to achieve this semester to reach your dream overall CGPA.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: mutedText, marginBottom: "4px", textTransform: "uppercase" }}>Current CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={currentCgpa}
                      onChange={(e) => setCurrentCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                      className="calc-input"
                      style={{ background: fieldBg, border: `1px solid ${fieldBorder}`, color: pageText }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: mutedText, marginBottom: "4px", textTransform: "uppercase" }}>Earned Credits</label>
                    <input
                      type="number"
                      min="0"
                      value={completedCredits}
                      onChange={(e) => setCompletedCredits(e.target.value === "" ? "" : Number(e.target.value))}
                      className="calc-input"
                      style={{ background: fieldBg, border: `1px solid ${fieldBorder}`, color: pageText }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: mutedText, marginBottom: "4px", textTransform: "uppercase" }}>Target CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={targetCgpa}
                      onChange={(e) => setTargetCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                      className="calc-input"
                      style={{ background: fieldBg, border: `1px solid ${fieldBorder}`, color: pageText }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: mutedText, marginBottom: "4px", textTransform: "uppercase" }}>Sem Credits</label>
                    <input
                      type="number"
                      min="1"
                      value={semCredits}
                      onChange={(e) => setSemCredits(e.target.value === "" ? "" : Number(e.target.value))}
                      className="calc-input"
                      style={{ background: fieldBg, border: `1px solid ${fieldBorder}`, color: pageText }}
                    />
                  </div>
                </div>
              </div>

              {/* GPA Goal Result Card */}
              <div style={{
                background: isGpaFeasible ? "rgba(56, 189, 248, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${isGpaFeasible ? "rgba(56, 189, 248, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                borderRadius: "20px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: isGpaFeasible ? "#38BDF8" : "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {isGpaFeasible ? "Required Semester SGPA" : "Goal Exceeds Max SGPA (10.0)"}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: "22px", fontWeight: 950, color: isGpaFeasible ? "#38BDF8" : "#EF4444" }}>
                    {isGpaFeasible ? requiredSgpa.toFixed(2) : "> 10.0"}
                  </span>
                </div>

                <p style={{ fontSize: "13.5px", fontWeight: 750, color: pageText, margin: 0, lineHeight: 1.45 }}>
                  {isGpaFeasible ? (
                    <span>
                      Score at least <strong style={{ color: "#38BDF8" }}>{requiredSgpa.toFixed(2)} SGPA</strong> in your {semCr} credits this semester to achieve your target of <strong>{tgtCg} CGPA</strong>.
                    </span>
                  ) : (
                    <span>
                      This target requires higher than a perfect 10.0 SGPA in a single semester. Consider spreading the target across multiple semesters.
                    </span>
                  )}
                </p>

                <Link
                  href="/tools/srm-cgpa-calculator"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: isLumina ? "#D8B4FE" : "#7C3AED",
                    fontSize: "12px",
                    fontWeight: 850,
                    textDecoration: "none",
                    marginTop: "4px"
                  }}
                >
                  <span>Open Full Multi-Semester CGPA Predictor</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 3: GOAL SIMULATOR */}
          {activeQuickTab === "simulator" && (
            <div style={{ marginTop: "10px" }}>
              <WhatIfCalculator />
            </div>
          )}
        </section>

        {/* ─── 2. SEARCH & CATEGORY FILTER BAR ─────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: "12px", 
              fontWeight: 950, 
              letterSpacing: "0.15em", 
              textTransform: "uppercase", 
              color: isLumina ? "rgba(216,180,254,0.85)" : "rgba(88,61,145,0.85)" 
            }}>
              Academic Tools Directory ({filteredTools.length})
            </h2>

            {/* Search Input */}
            <div style={{ 
              position: "relative", 
              display: "flex", 
              alignItems: "center",
              minWidth: "220px"
            }}>
              <Search size={14} color={mutedText} style={{ position: "absolute", left: "12px", pointerEvents: "none" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  borderRadius: "100px",
                  border: `1px solid ${cardBorder}`,
                  background: fieldBg,
                  color: pageText,
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {(
              [
                { id: "all", label: "All Tools" },
                { id: "attendance", label: "Attendance & Bunk" },
                { id: "grades", label: "GPA & Marks" },
                { id: "schedule", label: "Timetable & Calendar" },
                { id: "ai", label: "AI Tools" },
              ] as { id: ToolCategory; label: string }[]
            ).map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="cat-chip"
                  style={{
                    background: active 
                      ? (isLumina ? "rgba(216,180,254,0.20)" : "rgba(124,58,237,0.15)") 
                      : (isLumina ? "rgba(255,255,255,0.04)" : "rgba(88,61,145,0.06)"),
                    color: active 
                      ? (isLumina ? "#D8B4FE" : "#7C3AED") 
                      : mutedText,
                    border: `1px solid ${active ? (isLumina ? "rgba(216,180,254,0.4)" : "rgba(124,58,237,0.4)") : cardBorder}`
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 3. POWER TOOLS GRID ─────────────────────────────────────── */}
        <div className="tools-grid">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div 
                key={tool.id} 
                onClick={() => router.push(tool.href)} 
                style={{ 
                  background: cardBg,
                  border: `1px solid ${tool.highlight ? `${tool.color}35` : cardBorder}`, 
                  boxShadow: tool.highlight ? `0 14px 36px ${tool.color}14` : undefined,
                  color: pageText
                }}
                className="tools-card"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '16px', 
                      background: tool.bg, 
                      color: tool.color, 
                      border: `1px solid ${tool.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>

                    <span style={{ 
                      fontSize: '9.5px', 
                      fontWeight: 900, 
                      color: tool.color, 
                      background: tool.bg, 
                      padding: '4px 9px', 
                      borderRadius: '100px',
                      letterSpacing: '0.06em',
                      border: `1px solid ${tool.color}25`
                    }}>
                      {tool.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "16.5px", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                    {tool.name}
                  </h3>

                  <p style={{ fontSize: "12.5px", color: mutedText, lineHeight: 1.55, margin: 0, fontWeight: 650 }}>
                    {tool.desc}
                  </p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginTop: '18px', 
                  paddingTop: '12px',
                  borderTop: `1px solid ${isLumina ? "rgba(255,255,255,0.05)" : "rgba(88,61,145,0.08)"}`
                }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: tool.color }}>
                    Open Tool
                  </span>
                  <ArrowRight size={15} color={tool.color} />
                </div>
              </div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "48px 20px", 
            background: cardBg, 
            borderRadius: "24px", 
            border: `1px solid ${cardBorder}`,
            marginTop: "10px" 
          }}>
            <p style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 800 }}>No tools found matching "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              style={{
                background: "rgba(191,90,242,0.15)",
                color: "#D8B4FE",
                border: "1px solid rgba(191,90,242,0.3)",
                padding: "8px 16px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Clear Search
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
