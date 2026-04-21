import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  profile: any;
  academicData: any;
  _hasHydrated: boolean;
  setToken: (token: string) => void;
  setProfile: (profile: any) => void;
  setAcademicData: (data: any) => void;
  logout: () => void;
  clearSession: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      academicData: null,
      _hasHydrated: false,
      setToken: (token) => {
        localStorage.setItem("srmx_token", token);
        set({ token });
      },
      setProfile: (profile) => set({ profile }),
      setAcademicData: (data) => set({ academicData: data }),
      logout: () => {
        localStorage.removeItem("srmx_token");
        set({ token: null, profile: null, academicData: null });
      },
      clearSession: () => {
        localStorage.removeItem("srmx_token");
        set({ token: null, profile: null, academicData: null });
      },
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "srmx-auth",
      partialize: (state) => ({
        token: state.token,
        profile: state.profile,
        academicData: state.academicData,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
