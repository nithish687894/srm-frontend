"use client";

import { useEffect, useState } from "react";

type DataTheme = "midnight" | "aurora" | "campus" | "sage" | "neo";

const THEMES: { id: DataTheme; label: string }[] = [
  { id: "midnight", label: "Midnight" },
  { id: "aurora", label: "Aurora" },
  { id: "campus", label: "Campus" },
  { id: "sage", label: "Sage" },
  { id: "neo", label: "Neo" },
];

const STORAGE_KEY = "srmx-data-theme";

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<DataTheme>("midnight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as DataTheme | null;
    const nextTheme = saved && THEMES.some((t) => t.id === saved) ? saved : "midnight";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setActiveTheme(nextTheme);
  }, []);

  const selectTheme = (theme: DataTheme) => {
    setActiveTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <div style={{ position: "fixed", right: "14px", bottom: "96px", zIndex: 110 }}>
      {isOpen && (
        <div
          style={{
            marginBottom: "10px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "8px",
            minWidth: "144px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            boxShadow: "0 14px 26px rgba(0,0,0,0.35)",
          }}
        >
          {THEMES.map((theme) => {
            const selected = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                style={{
                  border: selected ? "1px solid var(--color-primary)" : "1px solid transparent",
                  borderRadius: "8px",
                  background: selected ? "color-mix(in srgb, var(--color-primary) 18%, transparent)" : "transparent",
                  color: "var(--color-text)",
                  padding: "8px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {theme.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open theme switcher"
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          cursor: "pointer",
          fontSize: "18px",
          boxShadow: "0 10px 24px rgba(0,0,0,0.34)",
        }}
      >
        🎨
      </button>
    </div>
  );
}
