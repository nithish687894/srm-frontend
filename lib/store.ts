import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StudentPortalData {
  marks?: AnyValue;
  absent?: AnyValue;
  malpractice?: AnyValue;
  profile?: AnyValue;
  [key: string]: AnyValue;
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
  academicData: AnyValue | null;      // legacy name kept for compat across all pages
  profile: AnyValue | null;

  // Student Portal (captcha-based)
  studentPortalConnected: boolean;
  studentPortalData: StudentPortalData | null;

  // Cached Extended Data
  timetable: AnyValue | null;
  myTimetable: AnyValue | null;
  calendar: AnyValue | null;

  // Academic Alerts
  academicAlertsEnabled: boolean;
  academicAlertsPrompted: boolean;

  // Auth Actions
  setAuthData: (authToken: string, refreshToken: string, email: string) => void;
  setAuthToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;

  // Profile / Academia
  setProfile: (profile: AnyValue) => void;
  setAcademicData: (data: AnyValue) => void;

  // Student Portal
  setStudentPortalConnected: (val: boolean) => void;
  setStudentPortalData: (data: StudentPortalData | null) => void;

  // Cached Setters
  setTimetable: (data: AnyValue | null) => void;
  setMyTimetable: (data: AnyValue | null) => void;
  setCalendar: (data: AnyValue | null) => void;

  // UI
  setHasChosenTheme: (val: boolean) => void;

  // Academic Alerts Setters
  setAcademicAlertsEnabled: (val: boolean) => void;
  setAcademicAlertsPrompted: (val: boolean) => void;

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

      timetable: null,
      myTimetable: null,
      calendar: null,

      academicAlertsEnabled: false,
      academicAlertsPrompted: false,

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

      setAcademicData: (data) => {
        set({
          academicData: data ? { ...data, lastFetchedAt: Date.now() } : null,
          academiaConnected: !!data,
          profile: data?.profile ?? null,
        });
        // Fire phone push notifications if attendance < 75%
        if (data?.attendance && typeof window !== "undefined") {
          import("./academicWatcher").then(({ runAcademicWatcher }) => {
            runAcademicWatcher(data.attendance, []);
          }).catch(() => {});
        }
      },

      // ── Student Portal ────────────────────────────────────────────────────
      setStudentPortalConnected: (connected) =>
        set({ studentPortalConnected: connected }),

      setStudentPortalData: (data) => {
        set({
          studentPortalData: data,
          studentPortalConnected: !!data && data.sessionStatus === "active",
        });
        // Fire phone push notifications if marks updated
        if (data?.marks?.marks && typeof window !== "undefined") {
          import("./academicWatcher").then(({ runAcademicWatcher }) => {
            runAcademicWatcher([], data.marks.marks);
          }).catch(() => {});
        }
      },

      // ── Cached Setters ───────────────────────────────────────────────────
      setTimetable: (timetable) => set({ timetable }),
      setMyTimetable: (myTimetable) => set({ myTimetable }),
      setCalendar: (calendar) => set({ calendar }),

      // ── Academic Alerts Setters ──────────────────────────────────────────
      setAcademicAlertsEnabled: (academicAlertsEnabled) => set({ academicAlertsEnabled }),
      setAcademicAlertsPrompted: (academicAlertsPrompted) => set({ academicAlertsPrompted }),

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
          timetable: null,
          myTimetable: null,
          calendar: null,
          academicAlertsEnabled: false,
          academicAlertsPrompted: false,
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
          timetable: null,
          myTimetable: null,
          calendar: null,
          academicAlertsEnabled: false,
          academicAlertsPrompted: false,
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
          timetable: state.timetable,
          myTimetable: state.myTimetable,
          calendar: state.calendar,
          academicAlertsEnabled: state.academicAlertsEnabled,
          academicAlertsPrompted: state.academicAlertsPrompted,
        }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
