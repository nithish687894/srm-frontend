/**
 * academicWatcher.ts
 * Watches academic data changes and fires real native phone/PWA push notifications
 * when attendance drops below 75% or marks are updated.
 *
 * Called after every portal sync from the auth store.
 */

import { pushNativeOnce } from "./pushNotify";

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
 * Run after academic data sync. Checks for:
 * 1. Attendance < 75% per subject → phone notification
 * 2. New/changed marks → phone notification
 */
export function runAcademicWatcher(
  attendance: AttendanceSubject[] = [],
  marks: MarksEntry[] = []
): void {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  checkAttendanceAlerts(attendance);
  checkMarksAlerts(marks);
}

function checkAttendanceAlerts(attendance: AttendanceSubject[]): void {
  if (!attendance || attendance.length === 0) return;

  const risky: string[] = [];

  attendance.forEach((sub) => {
    const pctRaw = sub["Attn %"] ?? sub.pct;
    if (pctRaw === undefined || pctRaw === null) return;

    const pct = parseFloat(String(pctRaw));
    if (isNaN(pct)) return;

    const name =
      sub["Course Title"] ||
      sub.courseTitle ||
      sub.courseName ||
      sub["Course Code"] ||
      sub.courseCode ||
      "A subject";

    if (pct < 75) {
      risky.push(name);
      // Fire one phone notification per risky subject (cooldown: 4 hours)
      pushNativeOnce(
        `attn-low-${(sub["Course Code"] || sub.courseCode || name)
          .toString()
          .replace(/\s+/g, "-")
          .toLowerCase()}`,
        {
          title: `⚠️ Low attendance: ${name}`,
          body: `${name} is at ${pct.toFixed(1)}%. Attend next class to avoid getting detained.`,
          url: "/attendance",
          tag: `attn-low-${(sub["Course Code"] || sub.courseCode || name)
            .toString()
            .replace(/\s+/g, "-")
            .toLowerCase()}`,
        },
        4 * 60 * 60 * 1000 // 4 hour cooldown
      );
    }
  });

  // Summary push if multiple subjects are at risk
  if (risky.length > 2) {
    pushNativeOnce(
      "attn-multi-risk-summary",
      {
        title: `⚠️ ${risky.length} subjects need attention`,
        body: `You have low attendance in: ${risky.slice(0, 3).join(", ")}${risky.length > 3 ? ` and ${risky.length - 3} more` : ""}.`,
        url: "/attendance",
        tag: "attn-multi-risk-summary",
      },
      6 * 60 * 60 * 1000 // 6 hour cooldown
    );
  }
}

function checkMarksAlerts(marks: MarksEntry[]): void {
  if (!marks || marks.length === 0) return;

  // Build a hash of current marks to detect changes
  const currentHash = marks
    .map((m) => {
      const name = m["Subject Name"] || m.subjectName || "";
      const score = m.scoredMark ?? m.testMark ?? "";
      return `${name}:${score}`;
    })
    .join("|");

  const previousHash = localStorage.getItem("nexus_marks_hash");

  if (!previousHash) {
    // First time seeing marks — store hash but don't notify yet
    localStorage.setItem("nexus_marks_hash", currentHash);
    return;
  }

  if (previousHash !== currentHash) {
    // Marks have changed since last sync
    localStorage.setItem("nexus_marks_hash", currentHash);

    pushNativeOnce(
      "marks-updated",
      {
        title: "📊 Marks updated",
        body: "New marks have been posted. Check your scores in the Marks section.",
        url: "/marks",
        tag: "marks-updated",
      },
      2 * 60 * 60 * 1000 // 2 hour cooldown
    );
  }
}
