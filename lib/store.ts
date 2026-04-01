import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  profile: any;
  _hasHydrated: boolean;
  setToken: (token: string) => void;
  setProfile: (profile: any) => void;
  logout: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      _hasHydrated: false,
      setToken: (token) => {
        localStorage.setItem("srmx_token", token);
        set({ token });
      },
      setProfile: (profile) => set({ profile }),
      logout: () => {
        localStorage.removeItem("srmx_token");
        set({ token: null, profile: null });
      },
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "srmx-auth",
      partialize: (state) => ({ token: state.token, profile: state.profile }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
