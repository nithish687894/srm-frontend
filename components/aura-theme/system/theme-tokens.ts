// Aura Design System Tokens

export const AURA_COLORS = {
  bg: "var(--app-bg, #050508)",
  cyan: "var(--accent-cyan, #38BDF8)",      // Soothing sky-blue / cyan accents
  pink: "var(--accent, #FF75C3)",      // Highly vibrant, glowing hot pink
  primary: "var(--accent-primary, #FFA3D3)",   // Dreamy, crystalline soft pastel pink
  secondary: "var(--accent-secondary, #A78BFA)", // Elegant pastel lavender
  purple: "var(--accent-purple, #C084FC)",    // Lumina brand soft amethyst purple
  accent: "var(--accent-secondary, #A7F3D0)",    // Calming mint accent
  amber: "#FBBF24",     // Soothing golden amber (warning status)
  emerald: "#34D399",   // Calm pastel emerald
  green: "#34D399",     // Safe status (soft green)
  red: "#FF4B72",       // Rich neon ruby red (critical warning)
  text: "var(--text-main, #ffffff)",
  sub: "var(--text-muted, rgba(255, 255, 255, 0.52))",
  subBright: "var(--text-muted, rgba(255, 255, 255, 0.72))",
};

export const AURA_TRANSITIONS = {
  default: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  background: "background 1.5s ease-in-out",
  card: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
};

export const AURA_SHADOWS = {
  card: "inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 20px 40px rgba(0,0,0,0.5)",
  cardHover: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 30px 50px rgba(0,0,0,0.6)",
};
