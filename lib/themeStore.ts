import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeType = "lumina" | "light";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "lumina",
      setTheme: (theme: ThemeType) => set({ theme }),
    }),
    {
      name: "srmx-theme",
    }
  )
);
