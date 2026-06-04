import { create } from "zustand";

export type ThemeType = "aura";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()((set) => ({
  theme: "aura",
  setTheme: () => set({ theme: "aura" }),
}));
