"use client";
import { useState, useEffect } from "react";
import { ThemeType, useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";

const THEMES: { id: ThemeType; name: string; sub: string; bg: string; accent: string; hasGlow?: boolean }[] = [
  { 
    id: "aura", 
    name: "Aura", 
    sub: "Elegant. Soft. Aesthetic.", 
    bg: "#08080c", 
    accent: "#FF75C3",
    hasGlow: true
  },
  { 
    id: "matrix", 
    name: "Matrix", 
    sub: "Dark. Minimal. Focused.", 
    bg: "#0a0a0a", 
    accent: "#a8c200" 
  },
  { 
    id: "cosmos", 
    name: "EduVerse", 
    sub: "Dark blue campus workspace UI.", 
    bg: "#0f0f13", 
    accent: "#7c3aed",
    hasGlow: true
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

  return (
    <div style={{ background: "var(--bg)", height: "100vh", width: "100vw", padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px", flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: "24px", cursor: "pointer" }}>←</button>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>Select Theme</h1>
      </div>

      <main style={{ flex: 1, overflowY: "auto", marginBottom: "40px", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {THEMES.map((t) => (
            <div key={t.id} onClick={() => setSelected(t.id)} style={{ cursor: "pointer" }}>
              <div style={{ 
                height: "160px", background: t.bg, borderRadius: "20px", padding: "20px", position: "relative", overflow: "hidden",
                border: selected === t.id ? `2px solid ${t.accent}` : "1px solid var(--border)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: selected === t.id ? "scale(1.02)" : "scale(1)"
              }}>
                {t.hasGlow && (
                  <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: t.accent, filter: "blur(40px)", opacity: 0.3 }} />
                )}
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: t.accent, boxShadow: `0 0 10px ${t.accent}` }} />
                <div style={{ position: "absolute", bottom: "20px", left: "20px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>{t.name}</div>
                </div>
              </div>
              <div style={{ marginTop: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: selected === t.id ? "var(--text-primary)" : "var(--text-muted)" }}>{t.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button 
        onClick={handleApply}
        style={{ 
          width: "100%", padding: "18px", borderRadius: "16px", border: "none", flexShrink: 0,
          background: selected === "matrix" ? "#a8c200" : selected === "aura" ? "#FF75C3" : "#7c3aed",
          color: selected === "matrix" || selected === "aura" ? "#000" : "#fff",
          fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
          cursor: "pointer", transition: "all 0.3s",
          boxShadow: `0 10px 30px ${selected === "matrix" ? "rgba(168,194,0,0.2)" : selected === "aura" ? "rgba(255,117,195,0.3)" : "rgba(124,58,237,0.3)"}`
        }}
      >
        Apply Selection
      </button>
    </div>
  );
}
