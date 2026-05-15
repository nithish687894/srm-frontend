"use client";
import { useThemeStore } from "@/lib/themeStore";
import { useEffect, useState } from "react";
import VersionGuard from "./VersionGuard";

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
      {/* Standard style tag instead of styled-jsx for maximum compatibility */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        body.theme-matrix {
          background: #000000;
          margin: 0;
          color: #ffffff;
        }

        .theme-matrix {
          --bg: #000000;
          --bg-surface: #0a0a0a;
          --bg-elevated: #111111;
          --bg-card: #0a0a0a;
          --text-primary: #ffffff;
          --text-secondary: #888888;
          --text-muted: #444444;
          --accent: #3b82f6;
          --accent-soft: rgba(59,130,246,0.15);
          --accent-glow: rgba(59,130,246,0.3);
          --accent-red: #ef4444;
          --accent-green: #22c55e;
          --border: rgba(255,255,255,0.1);
          --border-accent: rgba(59,130,246,0.4);
          --nav-bg: rgba(0,0,0,0.95);
          --nav-blur: 20px;
          --font-body: 'Plus Jakarta Sans', sans-serif;
          --radius: 16px;
          background: var(--bg);
          color: var(--text-primary);
        }

        body.theme-cosmos {
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
      `}} />
      
      <div 
        className={mounted ? `theme-${theme}` : "theme-matrix"} 
        style={{ minHeight: "100vh" }}
      >
        <VersionGuard />
        {children}
      </div>
    </>
  );
}
