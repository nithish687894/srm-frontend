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
  bg: `
    radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.08), transparent 60%),
    radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.03), transparent 45%),
    #030306
  `,
  blobs: [
    { color: "rgba(99, 102, 241, 0.05)", top: "-20%", left: "10%" },
    { color: "rgba(168, 85, 247, 0.03)", bottom: "10%", right: "-10%", delay: "-8s" },
    { color: "rgba(56, 189, 248, 0.02)", top: "30%", right: "20%", delay: "-16s" }
  ],
  cardBorder: "rgba(255, 255, 255, 0.05)",
  starrySky: true
};

export const afternoonTheme: AuraThemeConfig = {
  type: "afternoon",
  greeting: "Good Afternoon",
  bg: `
    radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.07), transparent 60%),
    radial-gradient(circle at 0% 100%, rgba(20, 184, 166, 0.02), transparent 45%),
    #020204
  `,
  blobs: [
    { color: "rgba(59, 130, 246, 0.05)", top: "-20%", left: "10%" },
    { color: "rgba(20, 184, 166, 0.03)", bottom: "10%", right: "-10%", delay: "-8s" },
    { color: "rgba(139, 92, 246, 0.02)", top: "30%", right: "20%", delay: "-16s" }
  ],
  cardBorder: "rgba(255, 255, 255, 0.04)",
  starrySky: true
};

export const nightTheme: AuraThemeConfig = {
  type: "night",
  greeting: "Good Evening",
  bg: `
    radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.1), transparent 60%),
    radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.04), transparent 45%),
    #010103
  `,
  blobs: [
    { color: "rgba(99, 102, 241, 0.06)", top: "-20%", left: "10%" },
    { color: "rgba(236, 72, 153, 0.04)", bottom: "10%", right: "-10%", delay: "-8s" },
    { color: "rgba(168, 85, 247, 0.03)", top: "30%", right: "20%", delay: "-16s" }
  ],
  cardBorder: "rgba(255, 255, 255, 0.05)",
  starrySky: true
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
