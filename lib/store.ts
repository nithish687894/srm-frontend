import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StudentPortalData {
  marks?: any;
  absent?: any;
  malpractice?: any;
  profile?: any;
  [key: string]: any;
}

export interface AuthStore {
  // Auth
  authToken: string | null;
  refreshToken: string | null;
  email: string | null;
  hasChosenTheme: boolean;
  _hasHydrated: boolean;

  // Academia (Zoho SSO data)
  academiaConnected: boolean;
  academicData: any | null;      // legacy name kept for compat across all pages
  profile: any | null;

  // Student Portal (captcha-based)
  studentPortalConnected: boolean;
  studentPortalData: StudentPortalData | null;

  // Auth Actions
  setAuthData: (authToken: string, refreshToken: string, email: string) => void;
  setAuthToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;

  // Profile / Academia
  setProfile: (profile: any) => void;
  setAcademicData: (data: any) => void;

  // Student Portal
  setStudentPortalConnected: (val: boolean) => void;
  setStudentPortalData: (data: StudentPortalData | null) => void;

  // UI
  setHasChosenTheme: (val: boolean) => void;

  // Session
  logout: () => void;
  clearSession: () => void;
  setHasHydrated: (val: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      authToken: null,
      refreshToken: null,
      email: null,
      hasChosenTheme: false,
      _hasHydrated: false,

      academiaConnected: false,
      academicData: null,
      profile: null,

      studentPortalConnected: false,
      studentPortalData: null,

      // ── Auth Actions ──────────────────────────────────────────────────────
      setAuthData: (authToken, refreshToken, email) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", authToken);
          localStorage.setItem("refreshToken", refreshToken);
          if (email) localStorage.setItem("userEmail", email);
        }
        set({ authToken, refreshToken, email });
      },

      setAuthToken: (authToken) => {
        if (typeof window !== "undefined") localStorage.setItem("authToken", authToken);
        set({ authToken });
      },

      setRefreshToken: (refreshToken) => {
        if (typeof window !== "undefined") localStorage.setItem("refreshToken", refreshToken);
        set({ refreshToken });
      },

      // ── Profile / Academia ────────────────────────────────────────────────
      setProfile: (profile) => set({ profile }),

      setAcademicData: (data) =>
        set({
          academicData: data ? { ...data, lastFetchedAt: Date.now() } : null,
          academiaConnected: !!data,
          profile: data?.profile ?? null,
        }),

      // ── Student Portal ────────────────────────────────────────────────────
      setStudentPortalConnected: (connected) =>
        set({ studentPortalConnected: connected }),

      setStudentPortalData: (data) =>
        set({
          studentPortalData: data,
          studentPortalConnected: !!data && data.sessionStatus === "active",
        }),

      // ── UI ────────────────────────────────────────────────────────────────
      setHasChosenTheme: (hasChosenTheme) => set({ hasChosenTheme }),

      // ── Session ───────────────────────────────────────────────────────────
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userEmail");
        }
        set({
          authToken: null,
          refreshToken: null,
          email: null,
          profile: null,
          academicData: null,
          academiaConnected: false,
          studentPortalConnected: false,
          studentPortalData: null,
          hasChosenTheme: false,
        });
      },

      clearSession: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
        }
        set({
          authToken: null,
          refreshToken: null,
          profile: null,
          academicData: null,
          academiaConnected: false,
          studentPortalConnected: false,
          studentPortalData: null,
          hasChosenTheme: false,
        });
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
          academiaConnected: state.academiaConnected,
          hasChosenTheme: state.hasChosenTheme,
          studentPortalConnected: state.studentPortalConnected,
          studentPortalData: state.studentPortalData,
        }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
