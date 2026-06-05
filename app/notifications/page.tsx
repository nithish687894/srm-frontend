"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import {
  Bell, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles,
  Award, Settings, Trash2, Clock, ShieldCheck
} from "lucide-react";
import {
  getInbox, saveInbox, InboxNotification, enableAcademicAlerts,
  checkAndNotifyAcademicAlerts
} from "@/lib/notificationHelper";
import Toast from "@/components/Toast";

export default function NotificationCenterPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { academicData, studentPortalData, academicAlertsEnabled } = useAuthStore();
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (title: string, body: string, type: "success" | "error" | "info" = "success") =>
    setToast({ title, body, type });

  // Load inbox from localStorage
  const loadInbox = useCallback(() => {
    const items = getInbox();
    // Most recent first
    setNotifications([...items].reverse());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadInbox();
  }, [loadInbox]);

  // Trigger real phone notifications when this page mounts (if enabled)
  useEffect(() => {
    if (!mounted) return;
    if (academicAlertsEnabled) {
      checkAndNotifyAcademicAlerts(academicData, studentPortalData).then(() => {
        loadInbox(); // refresh inbox after sending
      });
    }
  }, [mounted, academicAlertsEnabled, academicData, studentPortalData, loadInbox]);

  const markAllAsRead = () => {
    const inbox = getInbox().map(n => ({ ...n, read: true }));
    saveInbox(inbox);
    loadInbox();
  };

  const clearAll = () => {
    saveInbox([]);
    loadInbox();
  };

  const handleMarkAsRead = (id: string) => {
    const inbox = getInbox().map(n => n.id === id ? { ...n, read: true } : n);
    saveInbox(inbox);
    loadInbox();
  };

  if (!mounted) return null;

  const isLight = theme === "light";
  const accentColor = isLight ? "#BF5AF2" : "#FF75C3";
  const unreadCount = notifications.filter(n => !n.read).length;

  const getCategoryStyles = (cat: InboxNotification["category"]) => {
    switch (cat) {
      case "attendance":
        return { icon: cat === "attendance" ? ShieldCheck : AlertTriangle, color: "#34C759", bg: "rgba(52, 199, 89, 0.08)" };
      case "marks":
        return { icon: Award, color: "#FF9500", bg: "rgba(255, 149, 0, 0.08)" };
      case "timetable":
        return { icon: Clock, color: "#00E5FF", bg: "rgba(0, 229, 255, 0.08)" };
      case "system":
        return { icon: Sparkles, color: accentColor, bg: isLight ? "rgba(191, 90, 242, 0.08)" : "rgba(255, 117, 195, 0.08)" };
      default:
        return { icon: Bell, color: "var(--text-secondary)", bg: "rgba(255, 255, 255, 0.05)" };
    }
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="page-root" style={{ background: "var(--bg)", minHeight: "100dvh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="page-main" style={{ display: "flex", flexDirection: "column", padding: "24px 24px calc(120px + env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={() => router.back()}
                style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", width: "40px", height: "40px",
                  borderRadius: "12px", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer"
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ fontSize: "9px", color: accentColor, letterSpacing: "0.2em", fontWeight: 800, textTransform: "uppercase" }}>Inbox</div>
                <h1 style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
                  Notification Center
                  {unreadCount > 0 && (
                    <span style={{
                      marginLeft: "10px", fontSize: "11px", background: accentColor,
                      color: "#fff", borderRadius: "20px", padding: "2px 8px",
                      fontWeight: 800, verticalAlign: "middle"
                    }}>{unreadCount}</span>
                  )}
                </h1>
              </div>
            </div>
            <button
              onClick={() => router.push("/settings/notifications")}
              style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", width: "40px", height: "40px",
                borderRadius: "12px", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer"
              }}
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Enable alerts banner (if not enabled) */}
          {!academicAlertsEnabled && (
            <div style={{
              background: isLight ? "rgba(191,90,242,0.06)" : "rgba(255,117,195,0.06)",
              border: `1px solid ${accentColor}30`,
              borderRadius: "20px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              gap: "14px",
              alignItems: "center"
            }}>
              <Bell size={22} color={accentColor} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>
                  Enable phone notifications 🔔
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "10px" }}>
                  Get real alerts on your phone when attendance drops or marks update — even when the app is closed.
                </div>
                <button
                  onClick={() => enableAcademicAlerts(showToast)}
                  style={{
                    background: accentColor, border: "none", color: "#fff",
                    borderRadius: "10px", padding: "8px 16px", fontSize: "11px",
                    fontWeight: 800, cursor: "pointer", letterSpacing: "0.05em"
                  }}
                >
                  Turn on notifications
                </button>
              </div>
            </div>
          )}

          {/* Action Sub-Bar */}
          {notifications.length > 0 && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", width: "100%" }}>
              <button
                onClick={markAllAsRead}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: "12px",
                  border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)",
                  color: "var(--text-primary)", fontSize: "11px", fontWeight: 700, cursor: "pointer"
                }}
              >
                Mark all read
              </button>
              <button
                onClick={clearAll}
                style={{
                  padding: "10px 14px", borderRadius: "12px",
                  border: "1px solid rgba(255, 59, 48, 0.15)",
                  background: "rgba(255, 59, 48, 0.05)", color: "#FF3B30",
                  fontSize: "11px", fontWeight: 700,
                  display: "flex", alignItems: "center", gap: "6px", cursor: "pointer"
                }}
              >
                <Trash2 size={12} /> Clear all
              </button>
            </div>
          )}

          {/* Notification List */}
          <div style={{ flex: 1, width: "100%" }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: "80px 24px", textAlign: "center",
                background: isLight ? "rgba(0,0,0,0.01)" : "rgba(255,255,255,0.01)",
                border: "1px solid var(--border)", borderRadius: "32px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "16px"
              }}>
                <div style={{
                  width: "60px", height: "60px", borderRadius: "50%",
                  background: isLight ? "rgba(143,146,255,0.08)" : "rgba(255,255,255,0.03)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)"
                }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-primary)" }}>All clean!</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
                    {academicAlertsEnabled
                      ? "No alerts yet. Notifications will appear here when attendance or marks change."
                      : "Enable phone notifications above to start receiving academic alerts."}
                  </div>
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
                      style={{
                        background: isLight ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.02)",
                        border: item.read ? "1px solid var(--border)" : `1px solid ${accentColor}25`,
                        borderRadius: "20px", padding: "16px 20px",
                        display: "flex", gap: "14px", position: "relative",
                        transition: "all 0.3s", cursor: !item.read ? "pointer" : "default"
                      }}
                    >
                      {!item.read && (
                        <div style={{
                          position: "absolute", top: "20px", right: "20px",
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: accentColor, boxShadow: `0 0 8px ${accentColor}`
                        }} />
                      )}
                      <div style={{
                        width: "38px", height: "38px", borderRadius: "12px",
                        background: styles.bg, display: "flex", alignItems: "center",
                        justifyContent: "center", color: styles.color, flexShrink: 0
                      }}>
                        <CatIcon size={18} />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {item.body}
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginTop: "4px" }}>
                          {formatTime(item.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <Toast title={toast.title} body={toast.body} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
