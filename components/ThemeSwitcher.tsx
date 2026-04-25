"use client";

import { useEffect, useState } from "react";

type ThemeName = "midnight" | "aurora" | "campus" | "sage" | "neo";

const THEMES: { id: ThemeName; label: string }[] = [
  { id: "midnight", label: "Midnight" },
  { id: "aurora", label: "Aurora" },
  { id: "campus", label: "Campus" },
  { id: "sage", label: "Sage" },
  { id: "neo", label: "Neo" },
];

const STORAGE_KEY = "srmx-data-theme";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeName>("midnight");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const savedTheme = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const initialTheme = savedTheme && THEMES.some((t) => t.id === savedTheme) ? savedTheme : "midnight";
    root.setAttribute("data-theme", initialTheme);
    setTheme(initialTheme);
  }, []);

  const applyTheme = (nextTheme: ThemeName) => {
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
    setOpen(false);
  };

  if (!mounted) return null;

  return (
    <div style={{ position: "fixed", right: "14px", bottom: "92px", zIndex: 110 }}>
      {open && (
        <div
          style={{
            marginBottom: "8px",
            padding: "8px",
            borderRadius: "12px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            minWidth: "140px",
          }}
        >
          {THEMES.map((item) => {
            const active = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => applyTheme(item.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: active ? "1px solid var(--color-primary)" : "1px solid transparent",
                  background: active ? "rgba(59,130,246,0.14)" : "transparent",
                  color: "var(--color-text)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Theme switcher"
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          fontSize: "18px",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
        }}
      >
        🎨
      </button>
    </div>
  );
}
