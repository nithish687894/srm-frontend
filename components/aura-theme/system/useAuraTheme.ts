import { useState, useEffect, useMemo } from "react";
import { AuraThemeConfig, getThemeConfigForHour, nightTheme } from "./theme-engine";

export interface Star {
  id: number;
  top: string;
  left: string;
  size: string;
  duration: string;
  delay: string;
  opacity: number;
}

function seededStarValue(seed: number, salt: number) {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function useAuraTheme() {
  const [mounted, setMounted] = useState(false);
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setMounted(true);
      setHour(new Date().getHours());
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const activeTheme = useMemo<AuraThemeConfig>(() => {
    if (!mounted || hour === null) {
      // Safe SSR / Hydration default theme
      return nightTheme;
    }
    return getThemeConfigForHour(hour);
  }, [mounted, hour]);

  const stars = useMemo<Star[]>(() => {
    // Generate stars only when client-side mounted AND theme requires starry sky
    if (!mounted || !activeTheme.starrySky) return [];
    
    // We generate 45 stars
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: `${seededStarValue(i, 1) * 85}%`,
      left: `${seededStarValue(i, 2) * 96}%`,
      size: `${seededStarValue(i, 3) * 2 + 1}px`,
      duration: `${seededStarValue(i, 4) * 3 + 2}s`,
      delay: `${seededStarValue(i, 5) * 5}s`,
      opacity: seededStarValue(i, 6) * 0.7 + 0.3
    }));
  }, [mounted, activeTheme.starrySky]);

  return {
    activeTheme,
    stars,
    mounted
  };
}
