"use client";
import { useState, useEffect, useCallback } from "react";
import { useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, 
  Award, Settings, Trash2, Clock
} from "lucide-react";

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  severity?: string;
  tone?: string;
}

interface NotificationAPIItem {
  _id?: string;
  id?: string;
  category?: string;
  title?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
  severity?: string;
  tone?: string;
}

export default function NotificationCenterPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("nexus_cached_notifications_list");
      return cached ? JSON.parse(cached) as NotificationItem[] : [];
    } catch {
      return [];
    }
  });
  const [clearedIds, setClearedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cleared = localStorage.getItem("nexus_cleared_notifications");
      return cleared ? JSON.parse(cleared) as string[] : [];
    } catch {
      return [];
    }
  });

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const res = await fetch("/api/notifications", {
        headers: {
          "x-session-token": token,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.notifications)) {
          const formatted: NotificationItem[] = data.notifications.map((n: NotificationAPIItem) => ({
            id: String(n._id || n.id || `${n.category || "system"}-${n.createdAt || Date.now()}`),
            category: n.category || "system",
            title: n.title || "Notification",
            body: n.body || "",
            timestamp: new Date(n.createdAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: Boolean(n.read),
            severity: n.severity,
            tone: n.tone,
          })).filter((n: NotificationItem) => Boolean(n.id));

          const filtered = formatted.filter((n: NotificationItem) => !clearedIds.includes(n.id));
          setNotifications(filtered);
          localStorage.setItem("nexus_cached_notifications_list", JSON.stringify(filtered));
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [clearedIds]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchNotifications();
    });
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}/read`, {
            method: "PATCH",
            headers: {
              "x-session-token": token,
            },
          })
        )
      );

      const cached = localStorage.getItem("nexus_cached_notifications_list");
      if (cached) {
        const list = JSON.parse(cached) as NotificationItem[];
        const updated = list.map((n) => ({ ...n, read: true }));
        localStorage.setItem("nexus_cached_notifications_list", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const clearAll = () => {
    const allIds = notifications.map((n) => n.id);
    const newCleared = Array.from(new Set([...clearedIds, ...allIds]));
    setClearedIds(newCleared);
    try {
      localStorage.setItem("nexus_cleared_notifications", JSON.stringify(newCleared));
    } catch {}
    setNotifications((prev) => prev.filter((n) => !newCleared.includes(n.id)));
  };

  const handleMarkAsRead = async (id: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "x-session-token": token,
        },
      });

      const cached = localStorage.getItem("nexus_cached_notifications_list");
      if (cached) {
        const list = JSON.parse(cached) as NotificationItem[];
        const updated = list.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        localStorage.setItem("nexus_cached_notifications_list", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const isLight = theme === "light";
  const accentColor = isLight ? "#BF5AF2" : "#FF75C3";

  const getCategoryStyles = (cat: NotificationItem["category"] | string) => {
    switch (cat) {
      case "attendance":
      case "attendance_safe":
        return { icon: CheckCircle2, color: "#34C759", bg: "rgba(52, 199, 89, 0.08)" };
      case "lowAttendance":
      case "attendance_low":
        return { icon: AlertTriangle, color: "#FF9500", bg: "rgba(255, 149, 0, 0.08)" };
      case "attendance_danger":
        return { icon: AlertTriangle, color: "#FF3B30", bg: "rgba(255, 59, 48, 0.08)" };
      case "marks":
      case "marks_update":
        return { icon: Award, color: "#FF9500", bg: "rgba(255, 149, 0, 0.08)" };
      case "timetable":
      case "timetable_change":
      case "class_reminder":
        return { icon: Clock, color: "#00E5FF", bg: "rgba(0, 229, 255, 0.08)" };
      case "system":
      default:
        return { icon: Sparkles, color: accentColor, bg: isLight ? "rgba(191, 90, 242, 0.08)" : "rgba(255, 117, 195, 0.08)" };
    }
  };

  return (
    <div className="page-root" style={{ background: "var(--bg)", minHeight: "100dvh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="page-main" style={{ display: "flex", flexDirection: "column", padding: "24px 24px calc(120px + env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={() => router.back()}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--text-primary)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ fontSize: "9px", color: accentColor, letterSpacing: "0.2em", fontWeight: 800, textTransform: "uppercase" }}>Inbox</div>
                <h1 style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>Notification Center</h1>
              </div>
            </div>
            <button
              onClick={() => router.push("/settings/notifications")}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--text-secondary)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Inbox notifications list */}
          {notifications.length > 0 && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <button
                onClick={markAllAsRead}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-primary)", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
              >
                Mark all read
              </button>
              <button
                onClick={clearAll}
                style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(255, 59, 48, 0.15)", background: "rgba(255, 59, 48, 0.05)", color: "#FF3B30", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", transition: "all 0.2s" }}
              >
                <Trash2 size={12} /> Clear all
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div style={{ padding: "80px 24px", textAlign: "center", background: isLight ? "rgba(0,0,0,0.01)" : "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: isLight ? "rgba(143, 146, 255, 0.08)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-primary)" }}>All clean!</div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>No active notifications or alerts. You are fully up to date.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notifications.map((item) => {
                const styles = getCategoryStyles(item.category);
                const CatIcon = styles.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                    style={{ background: isLight ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.02)", border: item.read ? "1px solid var(--border)" : `1px solid ${accentColor}25`, borderRadius: "20px", padding: "16px 20px", display: "flex", gap: "14px", position: "relative", transition: "all 0.3s", cursor: !item.read ? "pointer" : "default" }}
                  >
                    {!item.read && (
                      <div style={{ position: "absolute", top: "20px", right: "20px", width: "6px", height: "6px", borderRadius: "50%", background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                    )}
                    <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: styles.bg, display: "flex", alignItems: "center", justifyContent: "center", color: styles.color, flexShrink: 0 }}>
                      <CatIcon size={18} />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>{item.title}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.body}</div>
                      <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginTop: "4px" }}>{item.timestamp}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
