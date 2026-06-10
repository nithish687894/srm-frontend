"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calculator, 
  CalendarOff, 
  ChevronLeft, 
  ChevronRight,
  Sparkles, 
  GraduationCap, 
  Clock, 
  Calendar 
} from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import LoadingSkeleton from "@/components/aura-theme/LoadingSkeleton";
import { WhatIfCalculator } from "@/components/aura-theme/WhatIfCalculator";

const TOOLS = [
  {
    name: "AI Tutor",
    sub: "AI_ACADEMIC_ASSISTANT",
    desc: "Instant academic help, research insights, and interactive course analysis.",
    icon: Sparkles,
    color: "#BF5AF2",
    bg: "rgba(191, 90, 242, 0.1)",
    href: "/ai"
  },
  {
    name: "GPA Planner",
    sub: "GPA_CGPA_PLANNER",
    desc: "Calculate target grades and forecast your GPA/CGPA across semesters.",
    icon: GraduationCap,
    color: "#FF2D55",
    bg: "rgba(255, 45, 85, 0.1)",
    href: "/gpa"
  },
  {
    name: "Timetable",
    sub: "CLASS_SCHEDULE",
    desc: "Access your daily class timings, classroom locations, and batch schedules.",
    icon: Clock,
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.1)",
    href: "/timetable"
  },
  {
    name: "University Calendar",
    sub: "ACADEMIC_CALENDAR",
    desc: "Track exams, holidays, university events, and key academic dates.",
    icon: Calendar,
    color: "#00E5FF",
    bg: "rgba(0, 229, 255, 0.1)",
    href: "/calendar"
  },
  {
    name: "Bunk Budget",
    sub: "ATTENDANCE_CALCULATOR",
    desc: "Calculate exactly how many classes you can skip while maintaining a safe 75% attendance.",
    icon: CalendarOff,
    color: "#FF9500",
    bg: "rgba(255, 149, 0, 0.1)",
    href: "/tools/srm-attendance-calculator"
  },
  {
    name: "Grade Predictor",
    sub: "CGPA_CALCULATOR",
    desc: "Accurate grade forecast supporting both 2018 and 2021 regulations.",
    icon: Calculator,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.1)",
    href: "/tools/srm-cgpa-calculator"
  }
];

export default function ToolsHubPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<"lumina" | "light">("lumina");

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
  const mutedText = isLumina ? "rgba(255,255,255,0.58)" : "rgba(23,17,31,0.60)";
  const cardBg = isLumina
    ? "linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))"
    : "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(243,238,255,0.90))";
  const cardBorder = isLumina ? "rgba(255,255,255,0.08)" : "rgba(88,61,145,0.16)";

  if (!mounted) return <LoadingSkeleton />;

  return (
    <div style={{ background: isLumina ? "#050508" : "radial-gradient(circle at 20% 0%, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)", minHeight: "100dvh", display: "flex", flexDirection: "column", color: pageText, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        .tools-page {
          position: relative;
          overflow-x: hidden;
        }
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(140px);
          opacity: 0.15; z-index: 0; pointer-events: none;
          animation: orbit 20s infinite linear;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translate(100px) rotate(0deg); }
          to { transform: rotate(360deg) translate(100px) rotate(-360deg); }
        }
        .tools-card {
          min-height: 112px;
          box-shadow: ${isLumina ? "0 18px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 18px 38px rgba(88,61,145,0.12), inset 0 1px 0 rgba(255,255,255,0.82)"};
        }
        .tools-card:active {
          transform: scale(0.985);
        }
        .tools-card:hover {
          border-color: ${isLumina ? "rgba(216,180,254,0.18)" : "rgba(88,61,145,0.24)"} !important;
        }
        .tools-icon {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tools-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 720px) {
          .tools-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}} />

      {isLumina && (
        <>
          <div className="aura-blob" style={{ background: "#FF75C3", top: '-200px', left: '-100px' }} />
          <div className="aura-blob" style={{ background: "#8F92FF", bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />
        </>
      )}

      {/* HEADER */}
      <header style={{ flexShrink: 0, padding: "58px 20px 16px", position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: isLumina ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.78)', border: `1px solid ${cardBorder}`, color: pageText, width: '42px', height: '42px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(18px)' }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 950, margin: 0, letterSpacing: '-0.04em' }}>Academic Tools</h1>
          <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: 700, color: mutedText }}>Calculators, planning, and daily academic utilities</p>
        </div>
      </header>

      {/* MAIN HUB */}
      <main className="tools-page" style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 18px 120px", position: 'relative', zIndex: 1 }}>
        <section
          style={{
            borderRadius: "28px",
            padding: "18px",
            margin: "4px 0 18px",
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            backdropFilter: "blur(24px)",
            boxShadow: isLumina ? "0 18px 46px rgba(0,0,0,0.30)" : "0 18px 40px rgba(88,61,145,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "16px", display: "grid", placeItems: "center", color: "#D8B4FE", background: isLumina ? "rgba(191,90,242,0.13)" : "rgba(124,58,237,0.10)", border: `1px solid ${isLumina ? "rgba(216,180,254,0.18)" : "rgba(124,58,237,0.16)"}` }}>
              <Calculator size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 950, letterSpacing: "-0.02em" }}>Goal Simulator</h2>
              <p style={{ margin: "3px 0 0", fontSize: "11px", fontWeight: 700, color: mutedText }}>Forecast marks, GPA, and attendance recovery.</p>
            </div>
          </div>
          <WhatIfCalculator />
        </section>

        <h2 style={{ margin: "0 0 12px 2px", fontSize: "10px", fontWeight: 950, letterSpacing: "0.22em", textTransform: "uppercase", color: isLumina ? "rgba(216,180,254,0.70)" : "rgba(88,61,145,0.72)" }}>
          Quick Tools
        </h2>

        <div className="tools-grid">
          {TOOLS.map((tool, idx) => (
            <div 
              key={idx} 
              onClick={() => router.push(tool.href)} 
              style={{ 
                background: cardBg,
                border: `1px solid ${cardBorder}`, 
                borderRadius: "24px", 
                padding: "18px", 
                cursor: "pointer", 
                position: 'relative', 
                overflow: 'hidden',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                color: pageText
              }}
              className="tools-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="tools-icon" style={{ background: tool.bg, color: tool.color, border: `1px solid ${tool.color}28` }}>
                  <tool.icon size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: pageText, letterSpacing: "-0.01em" }}>{tool.name}</h2>
                  <div style={{ fontSize: "9px", fontWeight: 900, color: isLumina ? "rgba(255,255,255,0.38)" : "rgba(23,17,31,0.45)", textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{tool.sub}</div>
                </div>
                <ChevronRight size={18} color={isLumina ? "rgba(255,255,255,0.30)" : "rgba(23,17,31,0.34)"} />
              </div>
              <p style={{ fontSize: "12px", color: mutedText, lineHeight: 1.55, margin: "12px 0 0", fontWeight: 650 }}>
                {tool.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
