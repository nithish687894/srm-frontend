import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export const metadata = {
  title: "SRM Nexus Tools — Attendance & CGPA Calculators for SRM Academia",
  description: "Calculate your attendance, CGPA, and internal marks with precision using SRM Nexus Tools. The ultimate Nexus Academia companion for SRM University students.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#050505", color: "#fff", minHeight: "100vh", fontFamily: "var(--font-inter), sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Public Navbar */}
      <nav style={{ 
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5, 5, 5, 0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <div style={{ 
          maxWidth: "1200px", margin: "0 auto", padding: "16px 24px", 
          display: "flex", justifyContent: "space-between", alignItems: "center" 
        }}>
          <Link href="/tools" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, var(--accent, #a8c200), #4ade80)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>
              <Sparkles size={16} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
              SRM <span style={{ color: "var(--accent, #a8c200)" }}>Nexus</span> Tools
            </span>
          </Link>
          
          <Link href="/#login" style={{ 
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
            color: "#fff", padding: "8px 16px", borderRadius: "99px", fontSize: "13px", fontWeight: 800, 
            textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
          }}>
            Login to Portal <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "40px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>

      {/* Public Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px 24px", marginTop: "auto" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted, #888)" }}>
            Built by SRM Students. Not officially affiliated with SRMIST.
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/tools/srm-attendance-calculator" style={{ color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>Attendance Calculator</Link>
            <Link href="/tools/srm-cgpa-calculator" style={{ color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>CGPA Calculator</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
