import { create } from "zustand";

export type ThemeType = "dark" | "light" | "system" | "lumina";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

function normalizeTheme(theme: unknown): ThemeType {
  if (theme === "light" || theme === "system" || theme === "dark") return theme;
  if (theme === "lumina") return "dark";
  return "dark";
}

function readStoredTheme(): ThemeType {
  if (typeof window === "undefined") return "dark";

  const preference = window.localStorage.getItem("themePreference");
  if (preference) return normalizeTheme(preference);

  const legacy = window.localStorage.getItem("srmx-theme");
  if (!legacy) return "dark";

  try {
    const parsed = JSON.parse(legacy);
    return normalizeTheme(parsed?.state?.theme);
  } catch {
    return normalizeTheme(legacy);
  }
}

export const useThemeStore = create<ThemeStore>()((set) => ({
  theme: readStoredTheme(),
  setTheme: (theme: ThemeType) => {
    const normalized = normalizeTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("themePreference", normalized);
    }
    set({ theme: normalized });
  },
}));
