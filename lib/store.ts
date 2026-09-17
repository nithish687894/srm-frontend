import { create } from "zustand";
import { persist } from "zustand/middleware";

function normalizeOwnerEmail(email?: string | null) {
  return String(email || "").trim().toLowerCase();
}

const STUDENT_DATA_CACHE_VERSION = 3;

function studentDataReset() {
  return {
    profile: null,
    academicData: null,
    academiaConnected: false,
    studentPortalConnected: false,
    studentPortalData: null,
    connectorStatuses: {
      academia: "disconnected" as ConnectorStatus,
      studentPortal: "disconnected" as ConnectorStatus,
    },
    timetable: null,
    myTimetable: null,
    calendar: null,
    dataOwnerEmail: null,
    studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StudentPortalData {
  marks?: AnyValue;
  absent?: AnyValue;
  malpractice?: AnyValue;
  profile?: AnyValue;
  [key: string]: AnyValue;
}

export type ConnectorStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "password_required"
  | "session_expired"
  | "captcha_required"
  | "rate_limited"
  | "unavailable"
  | "error";

export interface ConnectorState {
  academia: ConnectorStatus;
  studentPortal: ConnectorStatus;
}

export interface AuthStore {
  // Auth
  authToken: string | null;
  refreshToken: string | null;
  email: string | null;
  dataOwnerEmail: string | null;
  studentDataCacheVersion: number;
  hasChosenTheme: boolean;
  _hasHydrated: boolean;

  // Independent Connector States
  connectorStatuses: ConnectorState;

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

  // Premium Status
  isPremium: boolean;
  premiumExpiresAt: string | null;

  // Auth Actions
  setAuthData: (authToken: string, refreshToken: string, email: string) => void;
  setAuthToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setConnectorStatus: (type: "academia" | "studentPortal", status: ConnectorStatus) => void;
  setConnectorStatuses: (statuses: Partial<ConnectorState>) => void;

  // Profile / Academia
  setProfile: (profile: AnyValue) => void;
  setAcademicData: (data: AnyValue) => void;
  setAcademiaConnected: (val: boolean) => void;

  // Student Portal
  setStudentPortalConnected: (val: boolean) => void;
  setStudentPortalData: (data: StudentPortalData | null) => void;

  // Cached Setters
  setTimetable: (data: AnyValue | null) => void;
  setMyTimetable: (data: AnyValue | null) => void;
  setCalendar: (data: AnyValue | null) => void;
  clearStudentData: () => void;

  // UI
  setHasChosenTheme: (val: boolean) => void;

  // Academic Alerts Setters
  setAcademicAlertsEnabled: (val: boolean) => void;
  setAcademicAlertsPrompted: (val: boolean) => void;

  // Premium Actions
  setPremium: (isPremium: boolean, expiresAt: string | null) => void;

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
      dataOwnerEmail: null,
      studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION,
      hasChosenTheme: false,
      _hasHydrated: false,

      connectorStatuses: {
        academia: "disconnected",
        studentPortal: "disconnected",
      },

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

      isPremium: true,
      premiumExpiresAt: null,

      // ── Auth Actions ──────────────────────────────────────────────────────
      setAuthData: (authToken, refreshToken, email) => {
        const normalizedEmail = normalizeOwnerEmail(email);
        if (typeof window !== "undefined") {
          localStorage.setItem("authToken", authToken);
          localStorage.setItem("refreshToken", refreshToken);
          if (email) localStorage.setItem("userEmail", email);
        }
        set((state) => {
          const previousEmail = normalizeOwnerEmail(state.email);
          const identityChanged = Boolean(previousEmail && normalizedEmail && previousEmail !== normalizedEmail);
          return {
            ...(identityChanged ? studentDataReset() : {}),
            authToken,
            refreshToken,
            email,
            dataOwnerEmail: normalizedEmail || null,
            studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION,
            profile: null,
            academicData: null,
            academiaConnected: false,
            studentPortalConnected: false,
            studentPortalData: null,
            connectorStatuses: {
              academia: "connected",
              studentPortal: "disconnected",
            },
            timetable: null,
            myTimetable: null,
            calendar: null,
            isPremium: true,
            premiumExpiresAt: null,
          };
        });
      },

      setAuthToken: (authToken) => {
        if (typeof window !== "undefined") localStorage.setItem("authToken", authToken);
        set({ authToken });
      },

      setRefreshToken: (refreshToken) => {
        if (typeof window !== "undefined") localStorage.setItem("refreshToken", refreshToken);
        set({ refreshToken });
      },

      setConnectorStatus: (type, status) => {
        set((state) => ({
          connectorStatuses: {
            ...state.connectorStatuses,
            [type]: status,
          },
          ...(type === "academia" ? { academiaConnected: status === "connected" } : {}),
          ...(type === "studentPortal" ? { studentPortalConnected: status === "connected" } : {}),
        }));
      },

      setConnectorStatuses: (statuses) => {
        set((state) => ({
          connectorStatuses: {
            ...state.connectorStatuses,
            ...statuses,
          },
          ...(statuses.academia !== undefined ? { academiaConnected: statuses.academia === "connected" } : {}),
          ...(statuses.studentPortal !== undefined ? { studentPortalConnected: statuses.studentPortal === "connected" } : {}),
        }));
      },

      // ── Profile / Academia ────────────────────────────────────────────────
      setProfile: (profile) => set({ profile }),

      setAcademicData: (data) => {
        set((state) => ({
          academicData: data ? { ...data, lastFetchedAt: Date.now() } : null,
          academiaConnected: !!data,
          profile: data?.profile ?? null,
          dataOwnerEmail: data ? normalizeOwnerEmail(state.email) || state.dataOwnerEmail : state.dataOwnerEmail,
          studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION,
        }));
        // Fire phone push notifications if attendance < 75%
        if (data?.attendance && typeof window !== "undefined") {
          import("./academicWatcher").then(({ runAcademicWatcher }) => {
            runAcademicWatcher(data.attendance, []);
          }).catch(() => {});
        }
      },

      setAcademiaConnected: (connected) =>
        set({ academiaConnected: connected }),

      // ── Student Portal ────────────────────────────────────────────────────
      setStudentPortalConnected: (connected) =>
        set({ studentPortalConnected: connected }),

      setStudentPortalData: (data) => {
        set((state) => ({
          studentPortalData: data,
          studentPortalConnected: !!data && data.sessionStatus === "active",
          dataOwnerEmail: data ? normalizeOwnerEmail(state.email) || state.dataOwnerEmail : state.dataOwnerEmail,
          studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION,
        }));
        // Fire phone push notifications if marks updated
        if (data?.marks?.marks && typeof window !== "undefined") {
          import("./academicWatcher").then(({ runAcademicWatcher }) => {
            runAcademicWatcher([], data.marks.marks);
          }).catch(() => {});
        }
      },

      // ── Cached Setters ───────────────────────────────────────────────────
      setTimetable: (timetable) => set((state) => ({ timetable, dataOwnerEmail: timetable ? normalizeOwnerEmail(state.email) || state.dataOwnerEmail : state.dataOwnerEmail, studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION })),
      setMyTimetable: (myTimetable) => set((state) => ({ myTimetable, dataOwnerEmail: myTimetable ? normalizeOwnerEmail(state.email) || state.dataOwnerEmail : state.dataOwnerEmail, studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION })),
      setCalendar: (calendar) => set((state) => ({ calendar, dataOwnerEmail: calendar ? normalizeOwnerEmail(state.email) || state.dataOwnerEmail : state.dataOwnerEmail, studentDataCacheVersion: STUDENT_DATA_CACHE_VERSION })),
      clearStudentData: () => set(studentDataReset()),

      // ── Academic Alerts Setters ──────────────────────────────────────────
      setAcademicAlertsEnabled: (academicAlertsEnabled) => set({ academicAlertsEnabled }),
      setAcademicAlertsPrompted: (academicAlertsPrompted) => set({ academicAlertsPrompted }),

      // ── Premium Actions ──────────────────────────────────────────────────
      setPremium: (isPremium, premiumExpiresAt) => set({ isPremium, premiumExpiresAt }),

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
          ...studentDataReset(),
          hasChosenTheme: false,
          academicAlertsEnabled: false,
          academicAlertsPrompted: false,
          isPremium: true,
          premiumExpiresAt: null,
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
          ...studentDataReset(),
          hasChosenTheme: false,
          academicAlertsEnabled: false,
          academicAlertsPrompted: false,
          isPremium: true,
          premiumExpiresAt: null,
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
          dataOwnerEmail: state.dataOwnerEmail,
          studentDataCacheVersion: state.studentDataCacheVersion,
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
          isPremium: state.isPremium,
          premiumExpiresAt: state.premiumExpiresAt,
        }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        if (state) {
          const owner = normalizeOwnerEmail(state.dataOwnerEmail);
          const email = normalizeOwnerEmail(state.email);
          const hasStudentCache = Boolean(
            state.profile ||
            state.academicData ||
            state.studentPortalData ||
            state.timetable ||
            state.myTimetable ||
            state.calendar
          );
          const cacheVersion = Number(state.studentDataCacheVersion || 0);
          if (hasStudentCache && (cacheVersion !== STUDENT_DATA_CACHE_VERSION || !owner || (email && owner !== email))) {
            state.clearStudentData();
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);
