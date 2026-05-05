import React from "react";
import Link from "next/link";
import { Calculator, CalendarOff, TrendingUp } from "lucide-react";

export default function ToolsHubPage() {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "60px 0", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ fontSize: "12px", color: "var(--accent, #a8c200)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "16px" }}>
          Free Public Tools
        </div>
        <h1 style={{ fontSize: "clamp(40px, 8vw, 64px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 24px 0", lineHeight: 1.1 }}>
          The Ultimate <br/> SRM Toolkit
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-secondary, #aaa)", lineHeight: 1.6, marginBottom: "40px" }}>
          Instant, accurate calculators designed specifically for SRM Institute of Science and Technology's 75% attendance rules and 2018/2021 grading regulations.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* Attendance Calculator */}
        <Link href="/tools/srm-attendance-calculator" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ 
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px",
            transition: "transform 0.2s, background 0.2s", cursor: "pointer", height: "100%"
          }} className="tool-card">
            <div style={{ width: "48px", height: "48px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
              <CalendarOff size={24} />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Attendance Calculator</h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted, #888)", lineHeight: 1.6, marginBottom: "24px" }}>
              Find out exactly how many classes you can bunk safely. Input your total classes and attended classes to see your 75% status instantly.
            </p>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent, #a8c200)", display: "flex", alignItems: "center", gap: "8px" }}>
              Calculate Bunk Budget <TrendingUp size={14} />
            </div>
          </div>
        </Link>

        {/* CGPA Calculator */}
        <Link href="/tools/srm-cgpa-calculator" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ 
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px",
            transition: "transform 0.2s, background 0.2s", cursor: "pointer", height: "100%"
          }} className="tool-card">
            <div style={{ width: "48px", height: "48px", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
              <Calculator size={24} />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>CGPA Calculator</h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted, #888)", lineHeight: 1.6, marginBottom: "24px" }}>
              Accurate semester GPA and cumulative CGPA calculator. Supports SRM 2018 and 2021 regulation grading scales.
            </p>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent, #a8c200)", display: "flex", alignItems: "center", gap: "8px" }}>
              Calculate Grades <TrendingUp size={14} />
            </div>
          </div>
        </Link>

      </div>

      <style>{`
        .tool-card:hover {
          transform: translateY(-4px);
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
      `}</style>
    </div>
  );
}
