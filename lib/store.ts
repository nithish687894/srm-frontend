import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  authToken: string | null;
  refreshToken: string | null;
  profile: any;
  academicData: any;
  _hasHydrated: boolean;
  setAuthData: (authToken: string, refreshToken: string) => void;
  setAuthToken: (token: string) => void;
  setProfile: (profile: any) => void;
  setAcademicData: (data: any) => void;
  logout: () => void;
  clearSession: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      authToken: null,
      refreshToken: null,
      profile: null,
      academicData: null,
      _hasHydrated: false,
      setAuthData: (authToken, refreshToken) => {
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ authToken, refreshToken });
      },
      setAuthToken: (authToken) => {
        localStorage.setItem("authToken", authToken);
        set({ authToken });
      },
      setProfile: (profile) => set({ profile }),
      setAcademicData: (data) => set({ academicData: data }),
      logout: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        set({ authToken: null, refreshToken: null, profile: null, academicData: null });
      },
      clearSession: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        set({ authToken: null, refreshToken: null, profile: null, academicData: null });
      },
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "srmx-auth",
      partialize: (state) =>
        ({
          authToken: state.authToken,
          refreshToken: state.refreshToken,
          profile: state.profile,
          academicData: state.academicData,
        }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
