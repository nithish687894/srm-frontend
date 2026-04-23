"use client";
import { ThemeType, useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

const THEMES: { id: ThemeType; name: string; description: string; bg: string; accent: string }[] = [
  { 
    id: "matrix", 
    name: "Matrix", 
    description: "Dark. Minimal. Focused.", 
    bg: "#0a0a0a", 
    accent: "#a8c200" 
  },
  { 
    id: "editorial", 
    name: "Editorial", 
    description: "Bold. Magazine. Premium.", 
    bg: "#f5f2eb", 
    accent: "#c0392b" 
  },
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
    <div className="page-root" style={{ background: "#f5f2eb", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", color: "#111" }}>
      <div style={{ padding: "60px 24px 40px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "40px", fontWeight: 900, letterSpacing: "-0.02em" }}>Personalize</h1>
        <p style={{ color: "#666", fontSize: "14px", fontWeight: 500 }}>Select your visual interface</p>
      </div>

      <div style={{ 
        flex: 1, 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "20px",
        padding: "0 20px"
      }}>
        {THEMES.map((t) => (
          <div 
            key={t.id}
            onClick={() => setSelected(t.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <div style={{
              flex: 1,
              background: t.bg,
              border: selected === t.id ? "2px solid #111" : "1px solid rgba(0,0,0,0.1)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}>
              {/* Mini Preview Dot */}
              <div style={{ width: "12px", height: "12px", background: t.accent, borderRadius: "50%", marginBottom: "16px" }} />
              
              {/* Mock UI Elements */}
              <div style={{ width: "100%", height: "2px", background: selected === t.id ? "#111" : "rgba(0,0,0,0.1)", marginBottom: "8px" }} />
              <div style={{ width: "60%", height: "2px", background: selected === t.id ? "#111" : "rgba(0,0,0,0.1)", marginBottom: "8px" }} />
              <div style={{ width: "80%", height: "2px", background: selected === t.id ? "#111" : "rgba(0,0,0,0.1)" }} />
              
              {selected === t.id && (
                <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "12px" }}>✓</div>
              )}
            </div>
            
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.name}</div>
              <div style={{ fontSize: "11px", color: "#999", fontWeight: 500, marginTop: "2px" }}>{t.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "40px 24px 60px" }}>
        <button 
          onClick={handleApply}
          style={{
            width: "100%",
            padding: "20px",
            background: "#111",
            color: "#fff",
            border: "none",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Activate Interface
        </button>
      </div>
    </div>
  );
}
