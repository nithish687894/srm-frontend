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
    radial-gradient(circle at 15% 10%, rgba(139, 92, 246, 0.28), transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.22), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(255, 117, 195, 0.16), transparent 50%),
    #020205
  `,
  blobs: [
    { color: "rgba(139, 92, 246, 0.35)", top: "-10%", left: "-10%" },
    { color: "rgba(6, 182, 212, 0.28)", bottom: "20%", right: "-10%", delay: "-5s" },
    { color: "rgba(255, 117, 195, 0.26)", top: "40%", right: "-20%", delay: "-10s" }
  ],
  cardBorder: "rgba(255, 117, 195, 0.18)",
  starrySky: true
};

export const afternoonTheme: AuraThemeConfig = {
  type: "afternoon",
  greeting: "Good Afternoon",
  bg: `
    radial-gradient(circle at 15% 10%, rgba(59, 130, 246, 0.28), transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(167, 139, 250, 0.22), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.14), transparent 50%),
    #010103
  `,
  blobs: [
    { color: "rgba(59, 130, 246, 0.35)", top: "-10%", left: "-10%" },
    { color: "rgba(167, 139, 250, 0.28)", bottom: "20%", right: "-10%", delay: "-5s" },
    { color: "rgba(52, 211, 153, 0.26)", top: "40%", right: "-20%", delay: "-10s" }
  ],
  cardBorder: "rgba(59, 130, 246, 0.18)",
  starrySky: true
};

export const nightTheme: AuraThemeConfig = {
  type: "night",
  greeting: "Good Evening",
  bg: `
    radial-gradient(circle at 15% 10%, rgba(147, 51, 234, 0.28), transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.22), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.18), transparent 50%),
    #020104
  `,
  blobs: [
    { color: "rgba(147, 51, 234, 0.35)", top: "-10%", left: "-10%" },
    { color: "rgba(6, 182, 212, 0.28)", bottom: "20%", right: "-10%", delay: "-5s" },
    { color: "rgba(236, 72, 153, 0.3)", top: "40%", right: "-20%", delay: "-10s" }
  ],
  cardBorder: "rgba(236, 72, 153, 0.18)",
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
