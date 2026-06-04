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

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

  const currentTheme = "aura";

  useEffect(() => {
    if (!mounted) return;
    document.body.className = `theme-${currentTheme}`;
    document.body.style.background = '#050508';
  }, [currentTheme, mounted]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #050508; margin: 0; padding: 0; }
        .theme-aura { --bg: #050508; --text-primary: #ffffff; --accent: #FF75C3; --accent-secondary: #8F92FF; --accent-purple: #BF5AF2; --accent-cyan: #00E5FF; }
      `}} />
      
      <div 
        className="theme-aura" 
        style={{ minHeight: "100vh", width: "100%", position: 'relative', zIndex: 1 }}
      >
        <VersionGuard />
        {children}
      </div>
    </>
  );
}
