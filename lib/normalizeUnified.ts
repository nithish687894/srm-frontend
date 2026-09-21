/**
 * lib/normalizeUnified.ts
 *
 * Shared normalizer for the /api/v1/data/unified response.
 * Reused by both the login-page prefetch and the dashboard refresh,
 * guaranteeing the Zustand shape is identical regardless of entry point.
 */
import { useAuthStore } from "./store";
import { extractBatch } from "./utils";

/**
 * Normalizes raw unified API response and writes to Zustand stores.
 * Returns true if the response contained usable data, false otherwise.
 */
export function applyUnifiedResponse(d: AnyValue): boolean {
  if (!d || !d.success) return false;

  const store = useAuthStore.getState();
  const requestEmail = String(store.email || "").toLowerCase();

  // Guard: ignore stale responses from a previous account
  const currentEmail = String(useAuthStore.getState().email || "").toLowerCase();
  if (requestEmail && currentEmail && requestEmail !== currentEmail) return false;

  // Sync premium status from backend
  if (d.isPremium !== undefined) {
    store.setPremium(d.isPremium, d.premiumExpiresAt);
  }

  // Normalize profile to support both camelCase canonical and legacy uppercase keys
  const rawProfile = d.profile || d.academia?.profile || d.studentPortal?.profile;
  const normalizedProfile = rawProfile
    ? {
        ...rawProfile,
        Name: rawProfile.Name || rawProfile.name || "",
        "Registration Number": rawProfile["Registration Number"] || rawProfile.regNumber || "",
        Department: rawProfile.Department || rawProfile.department || "",
        Program: rawProfile.Program || rawProfile.program || "",
        Semester: rawProfile.Semester || rawProfile.semester || "",
        Section: rawProfile.Section || rawProfile.section || "",
        "Combo / Batch": rawProfile["Combo / Batch"] || rawProfile.batch || "",
      }
    : null;

  // Extract canonical datasets
  const attendanceList =
    Array.isArray(d.attendance) && d.attendance.length > 0
      ? d.attendance
      : Array.isArray(d.studentPortal?.attendance)
        ? d.studentPortal.attendance
        : Array.isArray(d.academia?.attendance)
          ? d.academia.attendance
          : [];

  const marksList =
    Array.isArray(d.marks) && d.marks.length > 0
      ? d.marks
      : Array.isArray(d.studentPortal?.marks)
        ? d.studentPortal.marks
        : Array.isArray(d.academia?.marks)
          ? d.academia.marks
          : [];

  const timetableData = d.timetable || d.academia?.timetable || null;
  const calendarData = d.calendar || d.academia?.calendar || [];

  const spStatus =
    d.connectors?.studentPortal?.status || d.studentPortal?.sessionStatus || "disconnected";
  const isSpActive = spStatus === "connected" || spStatus === "active";

  const spObject = d.studentPortal || {
    profile: normalizedProfile,
    attendance: attendanceList,
    marks: marksList,
    sessionStatus: isSpActive ? "active" : spStatus === "session_expired" ? "expired" : "disconnected",
    lastSyncedAt: d.connectors?.studentPortal?.lastFetchedAt || new Date().toISOString(),
  };

  const mergedData = {
    profile: normalizedProfile,
    attendance: attendanceList,
    marks: marksList,
    timetable: timetableData,
    calendar: calendarData,
    studentPortal: spObject,
    lastFetchedAt: Date.now(),
  };

  // Write to Zustand (identical to dashboard's fetchUnifiedData)
  store.setAcademicData(mergedData);
  store.setStudentPortalData(spObject);
  store.setStudentPortalConnected(isSpActive);

  store.setConnectorStatuses({
    studentPortal: isSpActive ? "connected" : spStatus === "session_expired" ? "session_expired" : "disconnected",
    academia: d.connectors?.academia?.status === "connected" ? "connected" : "disconnected",
  });

  if (normalizedProfile) {
    store.setProfile(normalizedProfile);
  }

  const hasAtt = attendanceList.length > 0;
  const hasMarks = marksList.length > 0;
  const hasProf = Boolean(normalizedProfile);

  return hasAtt || hasMarks || hasProf;
}
