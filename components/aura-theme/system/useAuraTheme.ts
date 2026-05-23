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

export function useAuraTheme() {
  const [mounted, setMounted] = useState(false);
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setHour(new Date().getHours());
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
      top: `${Math.random() * 85}%`,
      left: `${Math.random() * 96}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 5}s`,
      opacity: Math.random() * 0.7 + 0.3
    }));
  }, [mounted, activeTheme.starrySky]);

  return {
    activeTheme,
    stars,
    mounted
  };
}
