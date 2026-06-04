"use client";
import { useState, useEffect } from "react";
import { ThemeType, useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const THEMES: { id: ThemeType; name: string; sub: string; bg: string; accent: string; hasGlow?: boolean }[] = [
  {
    id: "system",
    name: "System Default",
    sub: "Match device scheme.",
    bg: "linear-gradient(135deg, #0b0717 0%, #e2e2ec 100%)",
    accent: "#8F92FF",
    hasGlow: false
  },
  { 
    id: "lumina", 
    name: "Lumina (Dark)", 
    sub: "Elegant. Soft. Dark.", 
    bg: "#08080c", 
    accent: "#FF75C3",
    hasGlow: true
  },
  {
    id: "light",
    name: "Lumina Light",
    sub: "Clean. High Contrast.",
    bg: "#f5f5f9",
    accent: "#BF5AF2",
    hasGlow: false
  }
];

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const router = useRouter();
  const [selected, setSelected] = useState<ThemeType>(theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setMounted(true);
      setSelected(theme);
    }, 0);
    return () => clearTimeout(id);
  }, [theme]);

  const handleApply = () => {
    setTheme(selected);
    router.back();
  };

  if (!mounted) return null;

  const isLight = selected === "light";
  const isSystem = selected === "system";
  const applyBg = isLight ? "#BF5AF2" : isSystem ? "#8F92FF" : "#FF75C3";
  const applyColor = isLight || isSystem ? "#fff" : "#000";
  const applyGlow = isLight 
    ? "rgba(191,90,242,0.25)" 
    : isSystem 
      ? "rgba(143,146,255,0.25)" 
      : "rgba(255,117,195,0.25)";

  return (
    <div className="page-root" style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <main className="page-main" style={{ display: "flex", flexDirection: "column", padding: "24px", flex: 1 }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", height: "100%" }}>
          
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px", flexShrink: 0 }}>
            <button 
              onClick={() => router.back()} 
              style={{ 
                background: "rgba(255,255,255,0.03)", 
                border: "1px solid var(--border)", 
                color: "var(--text-primary)", 
                width: "40px", 
                height: "40px", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                cursor: "pointer" 
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>Select Theme</h1>
          </div>

          {/* Theme Grid */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "40px" }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
              width: "100%", 
              gap: "16px" 
            }}>
              {THEMES.map((t) => (
                <div key={t.id} onClick={() => setSelected(t.id)} style={{ cursor: "pointer" }}>
                  <div style={{ 
                    height: "140px", background: t.bg, borderRadius: "20px", padding: "20px", position: "relative", overflow: "hidden",
                    border: selected === t.id ? `2.5px solid ${t.accent}` : "1.5px solid var(--border)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: selected === t.id ? "scale(1.02)" : "scale(1)",
                    boxShadow: selected === t.id ? `0 10px 30px rgba(${t.id === "light" ? "191,90,242" : t.id === "system" ? "143,146,255" : "255,117,195"}, 0.12)` : "none"
                  }}>
                    {t.hasGlow && (
                      <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: t.accent, filter: "blur(30px)", opacity: 0.35 }} />
                    )}
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: t.accent, boxShadow: `0 0 10px ${t.accent}` }} />
                    <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: t.id === "light" ? "#111" : "#fff" }}>{t.name}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: selected === t.id ? "var(--text-primary)" : "var(--text-muted)" }}>{t.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleApply}
            style={{ 
              width: "100%", padding: "18px", borderRadius: "16px", border: "none", flexShrink: 0,
              background: applyBg,
              color: applyColor,
              fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
              cursor: "pointer", transition: "all 0.3s",
              boxShadow: `0 10px 30px ${applyGlow}`
            }}
          >
            Apply Selection
          </button>
        </div>
      </main>
    </div>
  );
}
