/**
 * pushNotify.ts
 * Central utility to fire a real native phone/PWA notification banner.
 * Works via Service Worker showNotification (PWA, Android, iOS PWA).
 * Falls back to Notification API for desktop browsers.
 */

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string; // deduplicate: same tag replaces previous notification
}

/**
 * Fire a real native phone/PWA notification banner.
 * - Requires Notification.permission === "granted"
 * - Uses Service Worker if available (PWA mode), else Notification API
 */
export async function pushNative(payload: PushPayload): Promise<void> {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const {
    title,
    body,
    url = "/notifications",
    icon = "/nexus-logo.png",
    tag,
  } = payload;

  const options = {
    body,
    icon,
    badge: "/favicon-32x32.png",
    vibrate: [100, 50, 100],
    tag,
    data: { url },
  } as NotificationOptions & { vibrate?: number[]; badge?: string };

  // Prefer Service Worker showNotification (works in PWA / background)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(title, options);
        return;
      }
    } catch (err) {
      console.warn("[pushNative] SW notification failed, using fallback:", err);
    }
  }

  // Fallback: Notification API (desktop browsers when SW not available)
  try {
    const notif = new Notification(title, { body, icon, tag });
    notif.onclick = (e) => {
      e.preventDefault();
      window.focus();
      window.location.href = url;
    };
  } catch (err) {
    console.error("[pushNative] Notification API failed:", err);
  }
}

/**
 * Convenience: only push if not already pushed with this dedup key today.
 * Stores a "last pushed date" per key in localStorage.
 */
export function pushNativeOnce(
  dedupKey: string,
  payload: PushPayload,
  cooldownMs = 6 * 60 * 60 * 1000 // 6 hours default
): void {
  try {
    const stored = localStorage.getItem(`nexus_push_ts_${dedupKey}`);
    if (stored) {
      const last = parseInt(stored, 10);
      if (Date.now() - last < cooldownMs) return; // still in cooldown
    }
    localStorage.setItem(`nexus_push_ts_${dedupKey}`, String(Date.now()));
    pushNative({ ...payload, tag: dedupKey });
  } catch (e) {
    console.error("[pushNativeOnce]", e);
  }
}
