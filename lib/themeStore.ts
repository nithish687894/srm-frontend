import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeType = "matrix" | "cosmos" | "aura";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "aura",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "srmx-theme",
    }
  )
);
