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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,700;0,900;1,300;1,700&family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        body.theme-cosmos {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0f0f13;
          margin: 0;
          color: #f0f0ff;
        }

        .theme-cosmos {
          --bg: #0f0f13;
          --bg-surface: #16161d;
          --bg-elevated: #1e1e28;
          --bg-card: #1a1a24;
          --text-primary: #f0f0ff;
          --text-secondary: #8888aa;
          --text-muted: #55556a;
          --accent: #7c3aed;
          --accent-soft: rgba(124,58,237,0.15);
          --accent-glow: rgba(124,58,237,0.3);
          --accent-red: #ef4444;
          --accent-green: #22c55e;
          --border: rgba(255,255,255,0.07);
          --border-accent: rgba(124,58,237,0.4);
          --nav-bg: rgba(15,15,19,0.95);
          --nav-blur: 20px;
          --font-body: 'Plus Jakarta Sans', sans-serif;
          --radius: 16px;
          background: var(--bg);
          color: var(--text-primary);
        }


        body.theme-editorial {
          font-family: 'DM Sans', sans-serif;
          background: #f5f2eb;
          margin: 0;
        }
      `}</style>
      <div className={`theme-${currentTheme}`} style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </>
  );
}
