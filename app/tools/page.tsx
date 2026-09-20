"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Calculator, 
  CalendarOff, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap, 
  Clock, 
  Calendar,
  Sparkles,
  Search,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  Car
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { WhatIfCalculator } from "@/components/aura-theme/WhatIfCalculator";

type ToolCategory = "all" | "attendance" | "grades" | "schedule" | "ai" | "campus";

interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  desc: string;
  icon: React.ElementType;
  href: string;
}

const TOOL_ITEMS: ToolItem[] = [
  {
    id: "bunk-budget",
    name: "Bunk Budget Calculator",
    category: "attendance",
    desc: "Calculate exactly how many classes you can skip while maintaining a safe 75% attendance.",
    icon: CalendarOff,
    href: "/tools/srm-attendance-calculator",
  },
  {
    id: "cgpa-calculator",
    name: "CGPA & SGPA Predictor",
    category: "grades",
    desc: "Accurate semester grade forecast supporting both 2018 and 2021 academic regulations.",
    icon: Calculator,
    href: "/tools/srm-cgpa-calculator",
  },
  {
    id: "gpa-planner",
    name: "GPA & Target Planner",
    category: "grades",
    desc: "Set target grades and simulate required marks across all theory and lab courses.",
    icon: GraduationCap,
    href: "/gpa",
  },
  {
    id: "ai-tutor",
    name: "AI Academic Companion",
    category: "ai",
    desc: "Academic context helper, syllabus breakdown, and interactive subject assistance.",
    icon: Sparkles,
    href: "/ai",
  },
  {
    id: "timetable",
    name: "Master Timetable",
    category: "schedule",
    desc: "Daily timetable grid, batch switcher, lab slots, and room locations.",
    icon: Clock,
    href: "/timetable",
  },
  {
    id: "calendar",
    name: "Academic Calendar",
    category: "schedule",
    desc: "Official SRM calendar, exam schedules, holidays, and academic Day Order tracking.",
    icon: Calendar,
    href: "/calendar",
  },
  {
    id: "friends-sync",
    name: "Friends Free Time Solver",
    category: "schedule",
    desc: "Find overlapping free hours and shared course slots with classmates automatically.",
    icon: Users,
    href: "/friends",
  },
  {
    id: "marks-hub",
    name: "Internal Marks Breakdown",
    category: "grades",
    desc: "Detailed CLA scores, lab internals, and semester assessment performance.",
    icon: Award,
    href: "/marks",
  },
  {
    id: "srm-parking",
    name: "Campus Parking (Gridee)",
    category: "campus",
    desc: "Live SRM parking spot availability, slot shift countdowns, and quick booking access.",
    icon: Car,
    href: "/tools/srm-parking",
  },
];

export default function ToolsHubPage() {
  const router = useRouter();
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
        t.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div style={{ 
      background: "#09090F", 
      minHeight: "100dvh", 
      display: "flex", 
      flexDirection: "column", 
      color: "#F7F5FA", 
      fontFamily: "'Plus Jakarta Sans', sans-serif" 
    }}>
      {/* Top Header */}
      <header style={{ 
        padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px 14px", 
        maxWidth: "760px",
        width: "100%",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button 
            onClick={() => router.push("/dashboard")} 
            style={{ 
              background: "#12121A", 
              border: "1px solid #292532", 
              color: "#F7F5FA", 
              width: "38px", 
              height: "38px", 
              borderRadius: "10px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer", 
              flexShrink: 0
            }}
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <p style={{ margin: "0 0 4px", color: "#60A5FA", fontSize: "11px", fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Academic workspace
            </p>
            <h1 style={{ fontSize: "28px", fontWeight: 850, margin: 0, letterSpacing: "-0.04em", lineHeight: 1 }}>
              Tools
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9C96A7" }}>
              Calculators and academic utilities
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ 
        flex: 1, 
        padding: "8px 16px 120px", 
        maxWidth: "760px",
        width: "100%",
        margin: "0 auto"
      }}>

        {/* 1. Quick Calculator Console */}
        <section style={{
          borderRadius: "14px",
          padding: "18px 20px",
          marginBottom: "24px",
          background: "#12121A",
          border: "1px solid #292532",
        }}>
          {/* Segmented Switcher */}
          <div style={{ 
            display: "inline-flex", 
            gap: "4px", 
            background: "#0E0E15", 
            padding: "4px", 
            borderRadius: "8px",
            border: "1px solid #292532",
            marginBottom: "16px",
            width: "100%",
            maxWidth: "460px"
          }}>
            {[
              { id: "bunk", label: "Bunk Calculator" },
              { id: "gpa", label: "Target CGPA" },
              { id: "simulator", label: "Goal Simulator" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveQuickTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer",
                  background: activeQuickTab === tab.id ? "#2563EB" : "transparent",
                  color: activeQuickTab === tab.id ? "#FFFFFF" : "#8F8998",
                  transition: "background 0.15s ease, color 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: BUNK CALCULATOR */}
          {activeQuickTab === "bunk" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 12px", fontSize: "12.5px", color: "#8F8998", lineHeight: 1.5 }}>
                  Calculate margin before falling below the 75% attendance requirement.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: 750, color: "#8F8998", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Conducted
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quickConducted}
                      onChange={(e) => setQuickConducted(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        fontSize: "14px",
                        fontWeight: 700,
                        background: "#0E0E15",
                        border: "1px solid #292532",
                        color: "#F7F5FA",
                        outline: "none"
                      }}
                      placeholder="e.g. 32"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: 750, color: "#8F8998", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Attended
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quickAttended}
                      onChange={(e) => setQuickAttended(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        fontSize: "14px",
                        fontWeight: 700,
                        background: "#0E0E15",
                        border: "1px solid #292532",
                        color: "#F7F5FA",
                        outline: "none"
                      }}
                      placeholder="e.g. 27"
                    />
                  </div>
                </div>
              </div>

              {/* Bunk Result Card */}
              <div style={{
                background: isSafe ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${isSafe ? "rgba(16, 185, 129, 0.22)" : "rgba(239, 68, 68, 0.22)"}`,
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: isSafe ? "#10B981" : "#EF4444", display: "flex", alignItems: "center", gap: "6px" }}>
                    {isSafe ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {isSafe ? "Safe" : "Below 75%"}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: "18px", fontWeight: 850, color: isSafe ? "#10B981" : "#EF4444" }}>
                    {currentPct.toFixed(1)}%
                  </span>
                </div>

                <div style={{ fontSize: "13px", fontWeight: 650, color: "#D1CBD7", lineHeight: 1.45 }}>
                  {isSafe ? (
                    <span>
                      You have a margin of <strong style={{ color: "#F7F5FA" }}>{skipsAllowed}</strong> class{skipsAllowed === 1 ? "" : "es"} before falling below 75%.
                    </span>
                  ) : (
                    <span>
                      You must attend the next <strong style={{ color: "#EF4444" }}>{classesNeeded}</strong> consecutive class{classesNeeded === 1 ? "" : "es"} to restore 75% attendance.
                    </span>
                  )}
                </div>

                <Link
                  href="/tools/srm-attendance-calculator"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#93C5FD",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                    marginTop: "2px"
                  }}
                >
                  <span>Open course-by-course calculator</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: TARGET CGPA */}
          {activeQuickTab === "gpa" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 12px", fontSize: "12.5px", color: "#8F8998", lineHeight: 1.5 }}>
                  Calculate required semester SGPA to reach your target CGPA.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 750, color: "#8F8998", marginBottom: "4px", textTransform: "uppercase" }}>Current CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={currentCgpa}
                      onChange={(e) => setCurrentCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ width: "100%", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", fontWeight: 700, background: "#0E0E15", border: "1px solid #292532", color: "#F7F5FA", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 750, color: "#8F8998", marginBottom: "4px", textTransform: "uppercase" }}>Earned Credits</label>
                    <input
                      type="number"
                      min="0"
                      value={completedCredits}
                      onChange={(e) => setCompletedCredits(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ width: "100%", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", fontWeight: 700, background: "#0E0E15", border: "1px solid #292532", color: "#F7F5FA", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 750, color: "#8F8998", marginBottom: "4px", textTransform: "uppercase" }}>Target CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={targetCgpa}
                      onChange={(e) => setTargetCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ width: "100%", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", fontWeight: 700, background: "#0E0E15", border: "1px solid #292532", color: "#F7F5FA", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 750, color: "#8F8998", marginBottom: "4px", textTransform: "uppercase" }}>Sem Credits</label>
                    <input
                      type="number"
                      min="1"
                      value={semCredits}
                      onChange={(e) => setSemCredits(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ width: "100%", borderRadius: "8px", padding: "8px 10px", fontSize: "13px", fontWeight: 700, background: "#0E0E15", border: "1px solid #292532", color: "#F7F5FA", outline: "none" }}
                    />
                  </div>
                </div>
              </div>

              {/* GPA Goal Result Card */}
              <div style={{
                background: isGpaFeasible ? "rgba(37, 99, 235, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${isGpaFeasible ? "rgba(37, 99, 235, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: isGpaFeasible ? "#60A5FA" : "#EF4444" }}>
                    {isGpaFeasible ? "Required Semester SGPA" : "Exceeds 10.0 SGPA"}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: "18px", fontWeight: 850, color: isGpaFeasible ? "#60A5FA" : "#EF4444" }}>
                    {isGpaFeasible ? requiredSgpa.toFixed(2) : "> 10.0"}
                  </span>
                </div>

                <p style={{ fontSize: "13px", fontWeight: 650, color: "#D1CBD7", margin: 0, lineHeight: 1.45 }}>
                  {isGpaFeasible ? (
                    <span>
                      Score at least <strong style={{ color: "#60A5FA" }}>{requiredSgpa.toFixed(2)} SGPA</strong> in your {semCr} credits this semester to reach <strong>{tgtCg} CGPA</strong>.
                    </span>
                  ) : (
                    <span>
                      This target requires more than a 10.0 SGPA in a single semester. Consider planning across multiple semesters.
                    </span>
                  )}
                </p>

                <Link
                  href="/tools/srm-cgpa-calculator"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#93C5FD",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    textDecoration: "none",
                    marginTop: "2px"
                  }}
                >
                  <span>Open full CGPA calculator</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 3: GOAL SIMULATOR */}
          {activeQuickTab === "simulator" && (
            <div style={{ marginTop: "6px" }}>
              <WhatIfCalculator />
            </div>
          )}
        </section>

        {/* 2. Tools Directory Header, Search & Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 750, color: "#F7F5FA" }}>
              Directory ({filteredTools.length})
            </h2>

            {/* Search Input */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%", maxWidth: "240px" }}>
              <Search size={14} color="#8F8998" style={{ position: "absolute", left: "10px", pointerEvents: "none" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools…"
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  fontSize: "12px",
                  fontWeight: 650,
                  borderRadius: "8px",
                  border: "1px solid #292532",
                  background: "#12121A",
                  color: "#F7F5FA",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {(
              [
                { id: "all", label: "All" },
                { id: "attendance", label: "Attendance" },
                { id: "grades", label: "Grades" },
                { id: "schedule", label: "Schedule" },
                { id: "campus", label: "Campus" },
                { id: "ai", label: "AI" },
              ] as { id: ToolCategory; label: string }[]
            ).map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 750,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: active ? "#2563EB" : "#12121A",
                    color: active ? "#FFFFFF" : "#B8B2C2",
                    border: active ? "1px solid #2563EB" : "1px solid #292532",
                    transition: "background 0.15s ease, color 0.15s ease"
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tools Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div 
                key={tool.id} 
                onClick={() => router.push(tool.href)} 
                style={{ 
                  background: "#12121A",
                  border: "1px solid #292532", 
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                  transition: "border-color 0.15s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ 
                      width: "32px", 
                      height: "32px", 
                      borderRadius: "8px", 
                      background: "#1A1724", 
                      border: "1px solid #292532",
                      color: "#60A5FA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Icon size={16} />
                    </div>
                    <h3 style={{ fontSize: "14px", fontWeight: 750, margin: 0, color: "#F7F5FA" }}>
                      {tool.name}
                    </h3>
                  </div>

                  <p style={{ fontSize: "12px", color: "#9C96A7", lineHeight: 1.5, margin: 0, fontWeight: 550 }}>
                    {tool.desc}
                  </p>
                </div>

                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  paddingTop: "10px",
                  borderTop: "1px solid #1E1E28"
                }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#60A5FA" }}>
                    Open tool
                  </span>
                  <ChevronRight size={13} color="#60A5FA" />
                </div>
              </div>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div style={{ 
            textAlign: "center", 
            padding: "36px 20px", 
            background: "#12121A", 
            borderRadius: "12px", 
            border: "1px solid #292532",
            marginTop: "10px" 
          }}>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 700, color: "#8F8998" }}>
              No tools found matching "{searchQuery}"
            </p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 750,
                cursor: "pointer"
              }}
            >
              Reset search
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
