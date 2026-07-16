import React from "react";
import { AuraThemeConfig } from "../system/theme-engine";
import { Star } from "../system/useAuraTheme";
import GlassNoise from "./GlassNoise";
import StarField from "./StarField";
import OrbLayer from "./OrbLayer";
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
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Detect mobile viewport to skip heavy GPU effects
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
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

  // Skip heavy effects on mobile or light theme
  const showHeavyEffects = !isLight && !isMobile;

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
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...themeVars,
        ...style
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .aura-blob {
          position: fixed; width: 400px; height: 400px;
          border-radius: 50%; filter: blur(100px);
          opacity: 0.3; z-index: 0; pointer-events: none;
          animation: orbit 24s infinite ease-in-out;
          transition: background 1.5s ease-in-out;
          contain: strict;
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translate(60px) scale(1) rotate(0deg); border-radius: 50% 50% 50% 50%; }
          33% { transform: rotate(120deg) translate(90px) scale(1.1) rotate(-120deg); border-radius: 42% 58% 48% 52%; }
          66% { transform: rotate(240deg) translate(75px) scale(0.92) rotate(-240deg); border-radius: 58% 42% 55% 45%; }
          100% { transform: rotate(360deg) translate(60px) scale(1) rotate(-360deg); border-radius: 50% 50% 50% 50%; }
        }
        
        .aura-card, .premium-card, .liquid-card {
          background: rgba(4, 4, 6, 0.72);
          backdrop-filter: blur(40px) saturate(220%);
          -webkit-backdrop-filter: blur(40px) saturate(220%);
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02), 0 20px 40px rgba(0, 0, 0, 0.65);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .aura-card:hover, .premium-card:hover, .liquid-card:hover {
          transform: translateY(-4px);
          background: rgba(12, 12, 16, 0.8);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 30px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(99, 102, 241, 0.03);
        }
        .aura-card:active, .premium-card:active, .liquid-card:active { transform: scale(0.99); }
        
        .ai-border {
          position: absolute; inset: 0; border-radius: inherit;
          padding: 1px;
          background: linear-gradient(45deg, transparent, rgba(192,132,252,0.18), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: border-breathe 4s ease-in-out infinite;
        }
        
        @keyframes border-breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .floating { animation: floating 6s ease-in-out infinite; }
        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.4) 50%, #fff 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.95; transform: scale(1.1); }
        }
        
        .twinkling-star {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          pointer-events: none;
          box-shadow: 0 0 4px #ffffff;
        }
      `}} />

      {/* SVG Grain Noise */}
      <GlassNoise />

      {/* Twinkling Starfield — skip on mobile for GPU savings */}
      {showHeavyEffects && <StarField stars={stars} visible={theme.starrySky} />}

      {/* Rotating Diffused Color Orbs — skip on mobile for GPU savings */}
      {showHeavyEffects && <OrbLayer blobs={theme.blobs} />}

      {/* Wrapped Page Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

