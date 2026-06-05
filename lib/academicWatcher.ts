/**
 * lib/academicWatcher.ts
 * Frontend Academic Event Watcher
 * Detects drops and changes, forwarding them to the backend dispatcher.
 */

interface AttendanceSubject {
  "Attn %"?: string | number;
  pct?: string | number;
  "Course Title"?: string;
  courseTitle?: string;
  courseName?: string;
  "Course Code"?: string;
  courseCode?: string;
}

interface MarksEntry {
  subjectName?: string;
  "Subject Name"?: string;
  testMark?: string | number;
  scoredMark?: string | number;
}

/**
 * Triggers notification dispatch on the backend.
 */
async function triggerBackendDispatch(
  category: string,
  variables: Record<string, any>
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("[academicWatcher] No auth token found. Cannot trigger backend dispatch.");
      return;
    }

    const res = await fetch("/api/notifications/dispatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": token,
      },
      body: JSON.stringify({
        category,
        preferredTone: "funny_friend",
        variables,
      }),
    });

    if (!res.ok) {
      console.warn(`[academicWatcher] Backend dispatch failed with status: ${res.status}`);
    }
  } catch (err) {
    console.error("[academicWatcher] Failed to trigger backend dispatch:", err);
  }
}

/**
 * Run after academic data sync. Checks for:
 * 1. Attendance < 75% per subject → triggers backend attendance warning
 * 2. New/changed marks → triggers backend marks update notification
 */
export function runAcademicWatcher(
  attendance: AttendanceSubject[] = [],
  marks: MarksEntry[] = []
): void {
  if (typeof window === "undefined") return;

  checkAttendanceAlerts(attendance);
  checkMarksAlerts(marks);
}

function checkAttendanceAlerts(attendance: AttendanceSubject[]): void {
  if (!attendance?.length) return;

  attendance.forEach((sub) => {
    const pctRaw = sub["Attn %"] ?? sub.pct;
    if (pctRaw === undefined || pctRaw === null) return;

    const pct = parseFloat(String(pctRaw));
    if (isNaN(pct) || pct >= 75) return;

    const name =
      sub["Course Title"] || sub.courseTitle || sub.courseName ||
      sub["Course Code"] || sub.courseCode || "A subject";

    // Category based on attendance severity
    const category = pct < 65 ? "attendance_danger" : "attendance_low";

    // Trigger backend notification dispatch
    triggerBackendDispatch(category, {
      subject: name,
      attendance: pct.toFixed(1),
      requiredAttendance: 75,
      studentName: "Nithish",
    });
  });
}

function checkMarksAlerts(marks: MarksEntry[]): void {
  if (!marks?.length) return;

  const currentHash = marks
    .map((m) => `${m["Subject Name"] || m.subjectName || ""}:${m.scoredMark ?? m.testMark ?? ""}`)
    .join("|");

  const previousHash = localStorage.getItem("nexus_marks_hash");

  if (!previousHash) {
    localStorage.setItem("nexus_marks_hash", currentHash);
    return;
  }

  if (previousHash !== currentHash) {
    localStorage.setItem("nexus_marks_hash", currentHash);

    // Trigger backend notification dispatch for marks update
    triggerBackendDispatch("marks_update", {
      studentName: "Nithish",
    });
  }
}
