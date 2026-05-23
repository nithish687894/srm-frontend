"use client";
import { useThemeStore } from "@/lib/themeStore";
import { useEffect, useState } from "react";
import VersionGuard from "./VersionGuard";
import { usePerfGuard } from "@/hooks/usePerfGuard";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  
  // Initialize device-specific performance parameters on application load
  usePerfGuard();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "aura";

  useEffect(() => {
    if (!mounted) return;
    document.body.className = `theme-${currentTheme}`;
    // Set initial background — detailed background is in globals.css body.theme-* rules
    if (currentTheme === 'matrix') {
      document.body.style.background = '#000';
    } else if (currentTheme === 'aura') {
      document.body.style.background = '#050508';
    } else {
      document.body.style.background = '#0A061F';
    }
  }, [currentTheme, mounted]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #050508; margin: 0; padding: 0; }
        .theme-matrix { --bg: #000000; --text-primary: #ffffff; --accent: #a8c200; }
        .theme-aura { --bg: #050508; --text-primary: #ffffff; --accent: #FF75C3; --accent-secondary: #8F92FF; --accent-purple: #BF5AF2; --accent-cyan: #00E5FF; }
        .theme-cosmos { --bg: #0f0f13; --text-primary: #f0f0ff; --accent: #7c3aed; }
      `}} />
      
      <div 
        className={mounted ? `theme-${theme}` : "theme-aura"} 
        style={{ minHeight: "100vh", width: "100%", position: 'relative', zIndex: 1 }}
      >
        <VersionGuard />
        {children}
      </div>
    </>
  );
}
