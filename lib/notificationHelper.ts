/**
 * notificationHelper.ts
 *
 * Handles real phone push notifications via the Service Worker.
 * Notifications pop on the phone lock screen / status bar — not just in-app.
 */

import { useAuthStore } from "@/lib/store";

// ── Storage key for persisted notification inbox ──────────────────────────────
const INBOX_KEY = "nexus_notification_inbox";

export interface InboxNotification {
  id: string;
  category: "attendance" | "marks" | "timetable" | "system";
  title: string;
  body: string;
  timestamp: number; // Unix ms
  read: boolean;
}

// ── Read / write inbox (localStorage) ────────────────────────────────────────

export function getInbox(): InboxNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInbox(items: InboxNotification[]) {
  try {
    // Keep only last 50 notifications
    localStorage.setItem(INBOX_KEY, JSON.stringify(items.slice(-50)));
  } catch {
    // Storage quota exceeded — ignore
  }
}

function addToInbox(item: Omit<InboxNotification, "timestamp" | "read">) {
  const inbox = getInbox();
  // Deduplicate by id — don't add if already present within last 6 hours
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  const alreadyExists = inbox.some(
    (n) => n.id === item.id && n.timestamp > sixHoursAgo
  );
  if (alreadyExists) return;

  const newItem: InboxNotification = {
    ...item,
    timestamp: Date.now(),
    read: false,
  };
  saveInbox([...inbox, newItem]);
}

// ── Core: fire a real phone notification via SW ───────────────────────────────

async function sendPhoneNotification(
  title: string,
  body: string,
  options: { icon?: string; badge?: string; tag?: string; url?: string } = {}
) {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const notifOptions = {
    body,
    icon: options.icon || "/nexus-logo.png",
    badge: options.badge || "/favicon-32x32.png",
    tag: options.tag,
    vibrate: [100, 50, 100],
    data: { url: options.url || "/notifications" },
  };

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch (err) {
      console.warn("[Nexus] SW notification failed, using fallback:", err);
    }
  }

  // Fallback — plain Notification API (shows in browser, not on lock screen)
  try {
    const n = new Notification(title, {
      body,
      icon: options.icon || "/nexus-logo.png",
    });
    n.onclick = () => {
      window.focus();
      window.location.href = options.url || "/notifications";
    };
  } catch (err) {
    console.error("[Nexus] Notification API failed:", err);
  }
}

// ── Request permission + enable alerts ───────────────────────────────────────

export async function enableAcademicAlerts(
  showToast: (title: string, body: string, type?: "success" | "error" | "info") => void
) {
  const store = useAuthStore.getState();

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      showToast(
        "Academic alerts enabled ✅",
        "Nexus will notify you about attendance drops and marks updates.",
        "success"
      );

      store.setAcademicAlertsEnabled(true);
      store.setAcademicAlertsPrompted(true);
      localStorage.setItem("academicAlertsEnabled", "true");
      localStorage.setItem("academicAlertsPrompted", "true");

      // Send a one-time welcome notification on the phone
      if (!localStorage.getItem("hasSentWelcomeNotification")) {
        localStorage.setItem("hasSentWelcomeNotification", "true");
        setTimeout(() => {
          sendPhoneNotification(
            "Nexus has your back 😌",
            "We'll notify you when attendance drops or marks update.",
            { url: "/notifications" }
          );
          addToInbox({
            id: "welcome-alerts-enabled",
            category: "system",
            title: "Academic alerts enabled ✅",
            body: "Nexus will notify you about important attendance and marks updates.",
          });
        }, 3000);
      }
    } else if (permission === "denied") {
      showToast(
        "Notifications are off",
        "Enable them in your device Settings → Notifications → Nexus.",
        "info"
      );
      store.setAcademicAlertsEnabled(false);
      store.setAcademicAlertsPrompted(true);
      localStorage.setItem("academicAlertsEnabled", "false");
      localStorage.setItem("academicAlertsPrompted", "true");
    } else {
      store.setAcademicAlertsEnabled(false);
      localStorage.setItem("academicAlertsEnabled", "false");
    }
  } catch (err) {
    console.error("[Nexus] Notification permission error:", err);
    showToast("Permission error", "Could not set up notifications.", "error");
  }
}

// ── Check academic data and fire phone notifications if needed ────────────────

export async function checkAndNotifyAcademicAlerts(
  academicData: AnyValue | null,
  studentPortalData: AnyValue | null
) {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (localStorage.getItem("academicAlertsEnabled") !== "true") return;

  const att: AnyValue[] = academicData?.attendance || [];
  const marks: AnyValue[] = studentPortalData?.marks?.marks || [];
  const now = Date.now();

  // ── 1. Attendance warnings ──────────────────────────────────────────────────
  let riskyCount = 0;
  for (const sub of att) {
    const pct = parseFloat(sub["Attn %"] ?? sub.pct ?? "100") || 0;
    const code = sub["Course Code"] || sub.courseCode || "";
    const title = sub["Course Title"] || sub.courseTitle || sub.courseName || code;

    if (pct < 75) {
      riskyCount++;
      const id = `attn-risk-${code}`;
      const lastKey = `nexus_notif_last_${id}`;
      const lastSent = parseInt(localStorage.getItem(lastKey) || "0", 10);
      // Throttle: only re-notify once per 6 hours per subject
      if (now - lastSent > 6 * 60 * 60 * 1000) {
        localStorage.setItem(lastKey, String(now));
        const notifBody = `${title} is at ${pct}%. Attend next class to avoid shortage.`;
        await sendPhoneNotification("⚠️ Attendance Warning", notifBody, {
          tag: id,
          url: "/attendance",
        });
        addToInbox({
          id,
          category: "attendance",
          title: "⚠️ Attendance Warning",
          body: notifBody,
        });
      }
    }
  }

  // ── 2. Marks update notification ───────────────────────────────────────────
  if (marks.length > 0) {
    const marksKey = `nexus_notif_last_marks`;
    const lastSent = parseInt(localStorage.getItem(marksKey) || "0", 10);
    if (now - lastSent > 12 * 60 * 60 * 1000) {
      localStorage.setItem(marksKey, String(now));
      await sendPhoneNotification(
        "📊 Marks Updated",
        "Your assignment and cycle test marks are now available in Nexus.",
        { tag: "marks-update", url: "/marks" }
      );
      addToInbox({
        id: `marks-update-${Date.now()}`,
        category: "marks",
        title: "📊 Marks Updated",
        body: "Your assignment and cycle test marks are now available in Nexus.",
      });
    }
  }

  // ── 3. All safe notification (once per day) ────────────────────────────────
  if (riskyCount === 0 && att.length > 0) {
    const safeKey = "nexus_notif_last_all-safe";
    const lastSent = parseInt(localStorage.getItem(safeKey) || "0", 10);
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    if (lastSent < oneDayAgo) {
      localStorage.setItem(safeKey, String(now));
      await sendPhoneNotification(
        "✅ Attendance Safe",
        "All subjects are above 75%. Keep it up!",
        { tag: "attn-safe", url: "/attendance" }
      );
      addToInbox({
        id: `attn-safe-${now}`,
        category: "attendance",
        title: "✅ Attendance Safe",
        body: "All subjects are above 75%. Keep it up!",
      });
    }
  }
}
