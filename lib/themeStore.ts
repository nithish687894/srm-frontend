import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeType = "matrix" | "jarvis" | "ghost" | "ember";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "matrix",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "srmx-theme",
    }
  )
);
