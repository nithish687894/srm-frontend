"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, CalendarOff, TrendingUp, ChevronLeft, Home, Award, Activity, MoreHorizontal } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import Sidebar from "@/components/Sidebar";

const THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPurple: "#bf00ff",
  accentCyan: "#00d4ff",
};

const AURA_COLORS = {
  bg: "#050508",
  primary: "#FF75C3",
  secondary: "#8F92FF",
  accent: "#94FFD8",
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
};

export default function ToolsHubPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();
  const isLumina = theme === "lumina";

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

  if (!mounted) return <div style={{ background: '#050505', height: '100vh' }} />;

  return (
    <div style={{ background: isLumina ? AURA_COLORS.bg : THEME.bg, height: "100vh", display: "flex", flexDirection: "column", color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        
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
      `}} />

      {isLumina && (
        <>
          <div className="aura-blob" style={{ background: AURA_COLORS.primary, top: '-200px', left: '-100px' }} />
          <div className="aura-blob" style={{ background: AURA_COLORS.secondary, bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />
        </>
      )}

      {/* HEADER */}
      <header style={{ flexShrink: 0, padding: "60px 24px 20px", position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Nexus Tools</h1>
      </header>

      <main style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 24px 120px", position: 'relative', zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          
          {/* Attendance Calculator */}
          <div onClick={() => router.push('/tools/srm-attendance-calculator')} style={{ 
            background: isLumina ? "rgba(255,255,255,0.02)" : THEME.surface,
            border: isLumina ? "1px solid rgba(255,255,255,0.05)" : `1px solid ${THEME.border}`, 
            borderRadius: "24px", padding: "24px", cursor: "pointer", position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
               <div style={{ width: "48px", height: "48px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <CalendarOff size={24} />
               </div>
               <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: '#fff' }}>Bunk Budget</h2>
                  <div style={{ fontSize: "10px", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>ATTENDANCE_CALC</div>
               </div>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>
              Instantly calculate exactly how many classes you can afford to skip while safely maintaining your 75% requirement.
            </p>
          </div>

          {/* CGPA Calculator */}
          <div onClick={() => router.push('/tools/srm-cgpa-calculator')} style={{ 
            background: isLumina ? "rgba(255,255,255,0.02)" : THEME.surface,
            border: isLumina ? "1px solid rgba(255,255,255,0.05)" : `1px solid ${THEME.border}`, 
            borderRadius: "24px", padding: "24px", cursor: "pointer", position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
               <div style={{ width: "48px", height: "48px", background: isLumina ? "rgba(148, 255, 216, 0.1)" : "rgba(59, 130, 246, 0.1)", color: isLumina ? AURA_COLORS.accent : "#3b82f6", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <Calculator size={24} />
               </div>
               <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: '#fff' }}>Grade Predictor</h2>
                  <div style={{ fontSize: "10px", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>GPA_CGPA_CALC</div>
               </div>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>
              Accurate GPA calculations supporting both 2018 and 2021 grading regulations. Predict your final academic standing.
            </p>
          </div>

        </div>
      </main>

      <Sidebar />
    </div>
  );
}
