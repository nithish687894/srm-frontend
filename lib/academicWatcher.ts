/**
 * lib/academicWatcher.ts
 * Watches academic data changes and fires real native phone/PWA push notifications
 * via Firebase FCM when attendance drops below 75% or marks are updated.
 *
 * Called after every portal sync from the auth store.
 */

import { getStoredFCMToken } from "./fcmManager";

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
 * Send a push via the Render backend (Firebase Admin → FCM).
 * Falls back to browser Notification API if no FCM token or backend unavailable.
 *
 * Backend endpoint: POST {NEXT_PUBLIC_API_URL}/api/send-notification
 * Body: { token, title, body, url, tag }
 */
async function sendPush(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<void> {
  const token = getStoredFCMToken();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  if (token && backendUrl) {
    try {
      await fetch(`${backendUrl}/api/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...payload }),
      });
      return;
    } catch (err) {
      console.warn("[academicWatcher] FCM via Render failed, falling back:", err);
    }
  }

  // Fallback: direct browser notification (works when app is open/foreground)
  if (Notification.permission === "granted") {
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg?.showNotification) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: "/nexus-logo.png",
          badge: "/favicon-32x32.png",
          data: { url: payload.url || "/notifications" },
          tag: payload.tag,
        } as NotificationOptions & { badge?: string });
      } else {
        new Notification(payload.title, { body: payload.body, icon: "/nexus-logo.png" });
      }
    } catch {}
  }
}

/**
 * Deduplicated send — only pushes once per cooldown window per key.
 */
function sendOnce(
  key: string,
  payload: { title: string; body: string; url?: string; tag?: string },
  cooldownMs = 4 * 60 * 60 * 1000
): void {
  try {
    const stored = localStorage.getItem(`nexus_push_ts_${key}`);
    if (stored && Date.now() - parseInt(stored, 10) < cooldownMs) return;
    localStorage.setItem(`nexus_push_ts_${key}`, String(Date.now()));
    sendPush({ ...payload, tag: key });
  } catch {}
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
  if (!attendance?.length) return;

  const risky: string[] = [];

  attendance.forEach((sub) => {
    const pctRaw = sub["Attn %"] ?? sub.pct;
    if (pctRaw === undefined || pctRaw === null) return;

    const pct = parseFloat(String(pctRaw));
    if (isNaN(pct) || pct >= 75) return;

    const name =
      sub["Course Title"] || sub.courseTitle || sub.courseName ||
      sub["Course Code"] || sub.courseCode || "A subject";
    const code = String(sub["Course Code"] || sub.courseCode || name)
      .replace(/\s+/g, "-").toLowerCase();

    risky.push(name);

    sendOnce(
      `attn-low-${code}`,
      {
        title: `⚠️ Low attendance: ${name}`,
        body: `${name} is at ${pct.toFixed(1)}%. Attend next class to avoid getting detained.`,
        url: "/attendance",
      },
      4 * 60 * 60 * 1000
    );
  });

  if (risky.length > 2) {
    sendOnce(
      "attn-multi-risk-summary",
      {
        title: `⚠️ ${risky.length} subjects need attention`,
        body: `Low attendance in: ${risky.slice(0, 3).join(", ")}${risky.length > 3 ? ` and ${risky.length - 3} more` : ""}.`,
        url: "/attendance",
      },
      6 * 60 * 60 * 1000
    );
  }
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
    sendOnce(
      "marks-updated",
      {
        title: "📊 Marks updated",
        body: "New marks have been posted. Check your scores in the Marks section.",
        url: "/marks",
      },
      2 * 60 * 60 * 1000
    );
  }
}
