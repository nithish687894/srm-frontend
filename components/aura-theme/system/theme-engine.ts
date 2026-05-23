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
    radial-gradient(circle at 15% 10%, rgba(249, 115, 22, 0.26), transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(244, 63, 94, 0.22), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(216, 180, 254, 0.12), transparent 50%),
    #06030c
  `,
  blobs: [
    { color: "rgba(249, 115, 22, 0.3)", top: "-10%", left: "-10%" },
    { color: "rgba(244, 63, 94, 0.28)", bottom: "20%", right: "-10%", delay: "-5s" },
    { color: "rgba(139, 92, 246, 0.24)", top: "40%", right: "-20%", delay: "-10s" }
  ],
  cardBorder: "rgba(249, 115, 22, 0.2)"
};

export const afternoonTheme: AuraThemeConfig = {
  type: "afternoon",
  greeting: "Good Afternoon",
  bg: `
    radial-gradient(circle at 15% 10%, rgba(37, 99, 235, 0.28), transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(167, 139, 250, 0.22), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.12), transparent 50%),
    #03020a
  `,
  blobs: [
    { color: "rgba(14, 165, 233, 0.35)", top: "-10%", left: "-10%" },
    { color: "rgba(167, 139, 250, 0.3)", bottom: "20%", right: "-10%", delay: "-5s" },
    { color: "rgba(45, 212, 191, 0.26)", top: "40%", right: "-20%", delay: "-10s" }
  ],
  cardBorder: "rgba(167, 139, 250, 0.2)"
};

export const nightTheme: AuraThemeConfig = {
  type: "night",
  greeting: "Good Evening",
  bg: `
    radial-gradient(circle at 15% 10%, rgba(147, 51, 234, 0.25), transparent 50%),
    radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.22), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.16), transparent 50%),
    #030206
  `,
  blobs: [
    { color: "rgba(168, 85, 247, 0.35)", top: "-10%", left: "-10%" },
    { color: "rgba(6, 182, 212, 0.28)", bottom: "20%", right: "-10%", delay: "-5s" },
    { color: "rgba(59, 130, 246, 0.3)", top: "40%", right: "-20%", delay: "-10s" }
  ],
  cardBorder: "rgba(168, 85, 247, 0.18)",
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
