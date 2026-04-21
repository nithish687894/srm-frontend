"use client";
import { ThemeType, useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const THEMES: { id: ThemeType; name: string; mood: string; color: string }[] = [
  { id: "matrix", name: "Matrix", mood: "Hacker / Digital", color: "#a8c200" },
  { id: "jarvis", name: "Jarvis", mood: "Iron Man / HUD", color: "#00A8FF" },
  { id: "ghost", name: "Ghost", mood: "Editorial / Minimal", color: "#111111" },
  { id: "ember", name: "Ember", mood: "Gaming / Underground", color: "#FF6B00" },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
  const [selected, setSelected] = useState<ThemeType>(theme);
  const router = useRouter();

  const handleApply = () => {
    setTheme(selected);
    router.push("/dashboard");
  };

  return (
    <div className="page-root" style={{ background: "#000", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "40px 24px 20px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.03em" }}>YOUR INTERFACE</h1>
        <p style={{ color: "#666", fontSize: "14px" }}>Choose how your app looks and feels</p>
      </div>

      <div style={{ 
        flex: 1, 
        display: "flex", 
        overflowX: "auto", 
        padding: "20px", 
        gap: "20px",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch"
      }}>
        {THEMES.map((t) => (
          <div 
            key={t.id}
            onClick={() => setSelected(t.id)}
            style={{
              minWidth: "80%",
              height: "70vh",
              background: "#111",
              borderRadius: "24px",
              scrollSnapAlign: "center",
              position: "relative",
              border: selected === t.id ? `3px solid ${t.color}` : "1px solid #222",
              padding: "4px",
              transition: "all 0.3s ease",
              cursor: "pointer",
              boxShadow: selected === t.id ? `0 0 30px ${t.color}33` : "none"
            }}
          >
            <div style={{ 
              width: "100%", 
              height: "100%", 
              borderRadius: "20px", 
              overflow: "hidden",
              position: "relative",
              background: t.id === "ghost" ? "#fff" : "#000"
            }}>
              {/* Mock Dashboard Preview */}
              <div style={{ padding: "24px" }}>
                 <div style={{ 
                   height: "120px", 
                   width: "120px", 
                   borderRadius: t.id === "ghost" ? "0" : "50%",
                   border: `4px solid ${t.color}`,
                   margin: "0 auto 20px",
                   display: "flex", alignItems: "center", justifyContent: "center",
                   color: t.id === "ghost" ? "#000" : "#fff",
                   fontWeight: 900, fontSize: "24px"
                 }}>85%</div>

                 <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                   {[1, 2].map(i => (
                     <div key={i} style={{
                        height: "80px",
                        background: t.id === "ghost" ? "#f5f5f7" : "#1a1a1a",
                        borderRadius: t.id === "matrix" ? "16px" : "0",
                        clipPath: t.id === "jarvis" ? "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" : t.id === "ember" ? "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)" : "none",
                        border: t.id === "jarvis" ? `1px solid ${t.color}` : "none",
                        borderBottom: t.id === "ghost" ? "1px solid #ddd" : "none"
                     }} />
                   ))}
                 </div>
              </div>
            </div>
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase" }}>{t.name}</div>
              <div style={{ fontSize: "12px", color: t.color, fontWeight: 700 }}>{t.mood}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "24px" }}>
        <button 
          onClick={handleApply}
          style={{
            width: "100%",
            padding: "20px",
            borderRadius: "16px",
            background: THEMES.find(t => t.id === selected)?.color || "#fff",
            color: selected === "ghost" ? "#fff" : "#000",
            border: "none",
            fontSize: "18px",
            fontWeight: 900,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          APPLY THEME
        </button>
      </div>
    </div>
  );
}
