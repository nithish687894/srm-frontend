import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeType = "lumina" | "light" | "system";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme: ThemeType) => set({ theme }),
    }),
    {
      name: "themePreference",
    }
  )
);
