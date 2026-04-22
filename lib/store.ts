import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  token: string | null;
  profile: any;
  academicData: any;
  _hasHydrated: boolean;
  rememberMe: boolean;
  setToken: (token: string, remember?: boolean) => void;
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
      rememberMe: true,
      setToken: (token, remember = true) => {
        localStorage.setItem("srmx_token", token);
        set({ token, rememberMe: remember });
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
      storage: {
        getItem: (name) => {
          const val = localStorage.getItem(name) || sessionStorage.getItem(name);
          return val ? JSON.parse(val) : null;
        },
        setItem: (name, value) => {
          const state = value.state as any;
          if (state.rememberMe === false) {
            sessionStorage.setItem(name, JSON.stringify(value));
            localStorage.removeItem(name);
          } else {
            localStorage.setItem(name, JSON.stringify(value));
            sessionStorage.removeItem(name);
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          sessionStorage.removeItem(name);
        },
      },
      partialize: (state) =>
        ({
          token: state.token,
          profile: state.profile,
          academicData: state.academicData,
          rememberMe: state.rememberMe,
        }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
