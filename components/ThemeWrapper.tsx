"use client";
import { useThemeStore } from "@/lib/themeStore";
import { useEffect, useState } from "react";
import VersionGuard from "./VersionGuard";
import { usePerfGuard } from "@/hooks/usePerfGuard";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"lumina" | "light">("lumina");
  
  // Initialize device-specific performance parameters on application load
  usePerfGuard();

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => setSystemTheme(media.matches ? "light" : "lumina");
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const currentTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (!mounted) return;
    document.body.className = `theme-${currentTheme}`;
    document.body.style.background = currentTheme === "light" ? '#f5f5f9' : '#050508';
  }, [currentTheme, mounted]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: ${currentTheme === "light" ? '#f5f5f9' : '#050508'}; margin: 0; padding: 0; }
        .theme-lumina { --bg: #050508; --text-primary: #ffffff; --accent: #FF75C3; --accent-secondary: #8F92FF; --accent-purple: #BF5AF2; --accent-cyan: #00E5FF; }
        .theme-light { --bg: #f5f5f9; --text-primary: #111111; --accent: #BF5AF2; --accent-secondary: #6366f1; --accent-purple: #8b5cf6; --accent-cyan: #06b6d4; }
      `}} />
      
      <div 
        className={`theme-${currentTheme}`} 
        style={{ minHeight: "100vh", width: "100%", position: 'relative', zIndex: 1 }}
      >
        <VersionGuard />
        {children}
      </div>
    </>
  );
}
