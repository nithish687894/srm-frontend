"use client";
import { useThemeStore } from "@/lib/themeStore";
import { useEffect, useState } from "react";
import VersionGuard from "./VersionGuard";
import { usePerfGuard } from "@/hooks/usePerfGuard";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<"lumina" | "light">("lumina");
  const [mounted, setMounted] = useState(false);
  
  // Initialize device-specific performance parameters on application load
  usePerfGuard();

  useEffect(() => { 
    const id = setTimeout(() => setMounted(true), 0); 
    return () => clearTimeout(id); 
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Cache theme to requested localStorage key
    localStorage.setItem("themePreference", theme);

    const resolveAndApply = () => {
      let active: "lumina" | "light" = "lumina";
      if (theme === "system") {
        active = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "lumina";
      } else {
        active = theme;
      }
      setResolvedTheme(active);
      document.body.className = `theme-${active}`;
      document.body.style.background = active === "light" ? '#f5f5f9' : '#050508';
    };

    resolveAndApply();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => resolveAndApply();
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme, mounted]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: ${resolvedTheme === "light" ? '#f5f5f9' : '#050508'}; margin: 0; padding: 0; }
        .theme-lumina { --bg: #050508; --text-primary: #ffffff; --accent: #FF75C3; --accent-secondary: #8F92FF; --accent-purple: #BF5AF2; --accent-cyan: #00E5FF; }
        .theme-light { --bg: #f5f5f9; --text-primary: #111111; --accent: #BF5AF2; --accent-secondary: #6366f1; --accent-purple: #8b5cf6; --accent-cyan: #06b6d4; }
      `}} />
      
      <div 
        className={`theme-${resolvedTheme}`} 
        style={{ minHeight: "100dvh", width: "100%", position: 'relative', zIndex: 1 }}
      >
        <VersionGuard />
        {children}
      </div>
    </>
  );
}
