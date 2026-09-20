"use client";
import { useThemeStore } from "@/lib/themeStore";
import { useEffect, useState } from "react";
import VersionGuard from "./VersionGuard";
import { usePerfGuard } from "@/hooks/usePerfGuard";
import { syncPulseTemplates } from "@/lib/pulseEngine";
import { scheduleIdleTask } from "@/lib/scheduleIdle";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<"lumina" | "light">("lumina");
  
  // Initialize device-specific performance parameters on application load
  usePerfGuard();

  useEffect(() => {
    // Notification templates are non-critical; keep them off the startup path.
    const cancelTemplateSync = scheduleIdleTask(() => {
      syncPulseTemplates().catch(() => {});
    }, 3500);

    const resolveAndApply = () => {
      let active: "lumina" | "light" = "lumina";
      if (theme === "system") {
        active = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "lumina";
      } else {
        active = theme === "light" ? "light" : "lumina";
      }
      setResolvedTheme(active);

      if (active === "light") {
        document.documentElement.classList.remove("theme-lumina");
        document.documentElement.classList.add("theme-light");
        document.body.classList.remove("theme-lumina");
        document.body.classList.add("theme-light");
        document.body.style.background = "var(--app-bg)";
      } else {
        // Authoritative theme-lumina is already on <html> and <body> from root layout.
        if (!document.body.classList.contains("theme-lumina")) {
          document.body.classList.remove("theme-light");
          document.body.classList.add("theme-lumina");
        }
        if (!document.documentElement.classList.contains("theme-lumina")) {
          document.documentElement.classList.remove("theme-light");
          document.documentElement.classList.add("theme-lumina");
        }
        document.body.style.background = "#09090F";
      }
    };

    if (theme !== "lumina") {
      resolveAndApply();
    }

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => resolveAndApply();
      media.addEventListener("change", handler);
      return () => {
        cancelTemplateSync();
        media.removeEventListener("change", handler);
      };
    }

    return cancelTemplateSync;
  }, [theme]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: ${resolvedTheme === "light" ? "var(--app-bg)" : "#09090F"}; margin: 0; padding: 0; }
        .theme-lumina { --bg: #09090F; --text-primary: #F7F5FA; --accent: #2563EB; --accent-primary: #2563EB; --accent-secondary: #2563EB; --accent-purple: #2563EB; --accent-pink: #2563EB; --accent-cyan: #2563EB; }
        .theme-light { --bg: #F8FAFC; --text-primary: #111827; --accent: #1D4ED8; --accent-primary: #1D4ED8; --accent-secondary: #1D4ED8; --accent-purple: #1D4ED8; --accent-pink: #1D4ED8; --accent-cyan: #1D4ED8; }
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
