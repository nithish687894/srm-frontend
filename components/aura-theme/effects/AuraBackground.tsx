"use client";
import React from "react";
import { AuraThemeConfig } from "../system/theme-engine";
import { Star } from "../system/useAuraTheme";
import { AURA_COLORS } from "../system/theme-tokens";
import { useThemeStore } from "@/lib/themeStore";

interface AuraBackgroundProps {
  theme: AuraThemeConfig;
  stars: Star[];
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function AuraBackground({ theme, children, style = {} }: AuraBackgroundProps) {
  const selectedTheme = useThemeStore((state) => state.theme);
  const [systemLight, setSystemLight] = React.useState(false);

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

  return (
    <div 
      className="aura-background-root"
      style={{ 
        background: "var(--app-bg)",
        color: AURA_COLORS.text, 
        fontFamily: "var(--font-main), Inter, sans-serif", 
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...themeVars,
        ...style
      }}
    >
      {children}
    </div>
  );
}
