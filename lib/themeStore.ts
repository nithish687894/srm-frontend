import { create } from "zustand";

export type ThemeType = "lumina";

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()((set) => ({
  theme: "lumina",
  setTheme: () => set({ theme: "lumina" }),
}));
