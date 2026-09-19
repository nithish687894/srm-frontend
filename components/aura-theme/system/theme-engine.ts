// Aura Design System Theme Engine

export interface OrbConfig {
  color: string;
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  delay?: string;
}

export interface AuraThemeConfig {
  type: "morning" | "afternoon" | "night";
  greeting: string;
  bg: string;
  blobs: OrbConfig[];
  cardBorder: string;
  starrySky?: boolean;
}

export const morningTheme: AuraThemeConfig = {
  type: "morning",
  greeting: "Good Morning",
  bg: "#09090F",
  blobs: [],
  cardBorder: "#292532",
  starrySky: false
};

export const afternoonTheme: AuraThemeConfig = {
  type: "afternoon",
  greeting: "Good Afternoon",
  bg: "#09090F",
  blobs: [],
  cardBorder: "#292532",
  starrySky: false
};

export const nightTheme: AuraThemeConfig = {
  type: "night",
  greeting: "Good Evening",
  bg: "#09090F",
  blobs: [],
  cardBorder: "#292532",
  starrySky: false
};

export function getThemeConfigForHour(hour: number): AuraThemeConfig {
  if (hour >= 5 && hour < 12) {
    return morningTheme;
  } else if (hour >= 12 && hour < 18) {
    return afternoonTheme;
  } else {
    return nightTheme;
  }
}
