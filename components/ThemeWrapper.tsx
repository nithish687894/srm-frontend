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
    document.body.style.background = "#050508"; 
  }, [currentTheme, mounted]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { background: #050508; margin: 0; padding: 0; }
        .theme-matrix { --bg: #000000; --text-primary: #ffffff; }
        .theme-cosmos { --bg: #0f0f13; --text-primary: #f0f0ff; }
      `}} />
      
      <div 
        className={mounted ? `theme-${theme}` : "theme-aura"} 
        style={{ height: "100vh", width: "100vw", position: 'relative', zIndex: 1, overflow: 'hidden' }}
      >
        <VersionGuard />
        {children}
      </div>
    </>
  );
}
