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
    radial-gradient(circle at 50% -10%, rgba(255, 117, 195, 0.09), transparent 60%),
    radial-gradient(circle at 100% 100%, rgba(167, 139, 250, 0.04), transparent 45%),
    #030306
  `,
  blobs: [
    { color: "rgba(255, 117, 195, 0.06)", top: "-20%", left: "10%" },
    { color: "rgba(167, 139, 250, 0.04)", bottom: "10%", right: "-10%", delay: "-8s" },
    { color: "rgba(255, 75, 114, 0.03)", top: "30%", right: "20%", delay: "-16s" }
  ],
  cardBorder: "rgba(255, 117, 195, 0.06)",
  starrySky: true
};

export const afternoonTheme: AuraThemeConfig = {
  type: "afternoon",
  greeting: "Good Afternoon",
  bg: `
    radial-gradient(circle at 50% -10%, rgba(236, 72, 153, 0.09), transparent 60%),
    radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.04), transparent 45%),
    #020204
  `,
  blobs: [
    { color: "rgba(236, 72, 153, 0.06)", top: "-20%", left: "10%" },
    { color: "rgba(139, 92, 246, 0.04)", bottom: "10%", right: "-10%", delay: "-8s" },
    { color: "rgba(255, 117, 195, 0.03)", top: "30%", right: "20%", delay: "-16s" }
  ],
  cardBorder: "rgba(236, 72, 153, 0.05)",
  starrySky: true
};

export const nightTheme: AuraThemeConfig = {
  type: "night",
  greeting: "Good Evening",
  bg: `
    radial-gradient(circle at 50% -10%, rgba(147, 51, 234, 0.09), transparent 60%),
    radial-gradient(circle at 100% 100%, rgba(255, 75, 114, 0.05), transparent 45%),
    #010103
  `,
  blobs: [
    { color: "rgba(147, 51, 234, 0.06)", top: "-20%", left: "10%" },
    { color: "rgba(255, 75, 114, 0.05)", bottom: "10%", right: "-10%", delay: "-8s" },
    { color: "rgba(255, 117, 195, 0.04)", top: "30%", right: "20%", delay: "-16s" }
  ],
  cardBorder: "rgba(255, 117, 195, 0.05)",
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
