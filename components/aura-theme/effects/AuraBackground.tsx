import React from "react";
import { AuraThemeConfig } from "../system/theme-engine";
import { Star } from "../system/useAuraTheme";
import { AURA_COLORS, AURA_TRANSITIONS } from "../system/theme-tokens";
import { useThemeStore } from "@/lib/themeStore";

interface AuraBackgroundProps {
  theme: AuraThemeConfig;
  stars: Star[];
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function AuraBackground({ theme, stars, children, style = {} }: AuraBackgroundProps) {
  const selectedTheme = useThemeStore((state) => state.theme);
  const [systemLight, setSystemLight] = React.useState(false);
  // Start conservatively so mobile hydration never mounts expensive effects for one frame.
  const [reduceEffects, setReduceEffects] = React.useState(true);

  React.useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduceEffects(
        mobileQuery.matches ||
        motionQuery.matches ||
        document.documentElement.classList.contains("theme-perf-low")
      );
    };

    update();
    mobileQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    window.addEventListener("srmx-perf-mode", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
      window.removeEventListener("srmx-perf-mode", update);
    };
  }, []);

  React.useEffect(() => {
    if (selectedTheme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setSystemLight(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [selectedTheme]);

  const isLight = selectedTheme === "light" || (selectedTheme === "system" && systemLight);
  const themeVars = isLight
    ? {}
    : {
        ["--card-border" as AnyValue]: theme.cardBorder,
        ["--app-bg" as AnyValue]: theme.bg,
      };

  // Academic pages intentionally use no decorative background effects. This
  // keeps focus on timetable, attendance, and marks while reducing GPU work.
  const showHeavyEffects = false;

  return (
    <div 
      className="aura-background-root"
      style={{ 
        background: "var(--app-bg)",
        minHeight: "100dvh",
        display: "flex", 
        flexDirection: "column", 
        color: AURA_COLORS.text, 
        fontFamily: "'Plus Jakarta Sans', sans-serif", 
        position: 'relative',
        transition: AURA_TRANSITIONS.background,
        overflow: 'visible',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...themeVars,
        ...style
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .aura-card, .premium-card, .liquid-card {
          background: #12121A;
          border: 1px solid #292532;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .aura-card:hover, .premium-card:hover, .liquid-card:hover {
          background: #1A1724;
          border-color: #3B3547;
        }
        .aura-card:active, .premium-card:active, .liquid-card:active { transform: scale(0.99); }
        
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }

      `}} />

      {/* SVG turbulence is one of the most expensive continuously painted effects. */}

      {/* Wrapped Page Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

