"use client";
import { useThemeStore } from "@/lib/themeStore";
import { useEffect, useState } from "react";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "matrix";

  useEffect(() => {
    if (!mounted) return;
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme, mounted]);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,700;0,900;1,300;1,700&family=DM+Sans:wght@400;500;600&display=swap');

        body.theme-editorial {
          font-family: 'DM Sans', sans-serif;
          background: #f5f2eb;
          margin: 0;
        }

        .theme-editorial {
          --bg: #f5f2eb;
          --bg-surface: #ffffff;
          --bg-elevated: #edeae2;
          --text-primary: #111111;
          --text-secondary: #444444;
          --text-muted: #999999;
          --accent: #c0392b;
          --accent-red: #e74c3c;
          --border: rgba(0,0,0,0.1);
          --nav-bg: rgba(245,242,235,0.96);
          --nav-blur: 20px;
          --font-heading: 'Fraunces', serif;
          --font-body: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text-primary);
        }
      `}</style>
      <div className={`theme-${currentTheme}`} style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </>
  );
}
