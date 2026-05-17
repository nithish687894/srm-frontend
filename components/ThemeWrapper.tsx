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

  const currentTheme = mounted ? theme : "aura";

  useEffect(() => {
    if (!mounted) return;
    document.body.className = `theme-${currentTheme}`;
    document.body.style.background = currentTheme === 'matrix' ? '#000' : '#050508'; 
  }, [currentTheme, mounted]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #050508; margin: 0; padding: 0; }
        .theme-matrix { --bg: #000000; --text-primary: #ffffff; --accent: #a8c200; }
        .theme-aura { --bg: #050508; --text-primary: #ffffff; --accent: #FF75C3; }
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
