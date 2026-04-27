import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  authToken: string | null;
  refreshToken: string | null;
  profile: any;
  academicData: any;
  email: string | null;
  hasChosenTheme: boolean;
  _hasHydrated: boolean;
  setAuthData: (authToken: string, refreshToken: string, email: string) => void;
  setAuthToken: (token: string) => void;
  setProfile: (profile: any) => void;
  setAcademicData: (data: any) => void;
  setHasChosenTheme: (val: boolean) => void;
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
      email: null,
      hasChosenTheme: false,
      _hasHydrated: false,
      setAuthData: (authToken, refreshToken, email) => {
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("refreshToken", refreshToken);
        if (email) localStorage.setItem("userEmail", email);
        set({ authToken, refreshToken, email });
      },
      setAuthToken: (authToken) => {
        localStorage.setItem("authToken", authToken);
        set({ authToken });
      },
      setProfile: (profile) => set({ profile }),
      setAcademicData: (data) => set({ academicData: data }),
      setHasChosenTheme: (hasChosenTheme) => set({ hasChosenTheme }),
      logout: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userEmail");
        set({ authToken: null, refreshToken: null, email: null, profile: null, academicData: null, hasChosenTheme: false });
      },
      clearSession: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        set({ authToken: null, refreshToken: null, profile: null, academicData: null, hasChosenTheme: false });
      },
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "srmx-auth",
      partialize: (state) =>
        ({
          authToken: state.authToken,
          refreshToken: state.refreshToken,
          email: state.email,
          profile: state.profile,
          academicData: state.academicData,
          hasChosenTheme: state.hasChosenTheme,
        }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
