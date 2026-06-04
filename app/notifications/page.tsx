"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import { 
  Bell, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, 
  Award, Settings, Trash2, Clock
} from "lucide-react";

interface NotificationItem {
  id: string;
  category: "attendance" | "marks" | "timetable" | "lowAttendance" | "system";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationCenterPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { academicData, studentPortalData, academicAlertsEnabled } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const cleared = localStorage.getItem("nexus_cleared_notifications");
      if (cleared) {
        setClearedIds(JSON.parse(cleared));
      }
      const read = localStorage.getItem("nexus_read_notifications");
      if (read) {
        setReadIds(JSON.parse(read));
      }
    } catch (e) {
      console.error("Failed to load local notification states:", e);
    }
    setMounted(true);
  }, []);

  const generateNotifications = useCallback(() => {
    const items: NotificationItem[] = [];
    const att = academicData?.attendance || [];
    const spMarks = studentPortalData?.marks?.marks || [];
    
    // 1. Check Attendance Warnings
    if (att.length > 0) {
      let riskyCount = 0;
      att.forEach((sub: AnyValue) => {
        const pctStr = sub["Attn %"] || sub.pct;
        if (pctStr !== undefined && pctStr !== null) {
          const pct = parseFloat(pctStr) || 0;
          const courseTitle = sub["Course Title"] || sub.courseTitle || sub.courseName || sub["Course Code"] || sub.courseCode;
          
          if (pct < 75) {
            riskyCount++;
            items.push({
              id: `attn-risk-${sub.courseCode || Math.random()}`,
              category: "lowAttendance",
              title: "Attendance needs care ⚠️",
              body: `${courseTitle} is at ${pct}%. Attend next class and keep the drama small.`,
              timestamp: "2 hours ago",
              read: false
            });
          }
        }
      });

      if (riskyCount === 0) {
        items.push({
          id: "attn-safe",
          category: "attendance",
          title: "Safe for now 😌",
          body: "Overall attendance is fine. Keep it steady, no unnecessary hero moves.",
          timestamp: "5 hours ago",
          read: false
        });
      }
    } else {
      items.push({
        id: "attn-pending",
        category: "attendance",
        title: "Awaiting attendance sync 📊",
        body: "Connect your portal to receive real-time attendance warnings and details.",
        timestamp: "1 day ago",
        read: true
      });
    }

    // 2. Check Marks Updates
    if (spMarks.length > 0) {
      items.push({
        id: "marks-live",
        category: "marks",
        title: "Marks are live 👀",
        body: "Assignment and cycle test marks are updated. Review them calmly and plan your comeback.",
        timestamp: "3 hours ago",
        read: false
      });
    }

    // 3. Timetable info
    items.push({
      id: "tt-ready",
      category: "timetable",
      title: "Timetable updated 📅",
      body: "Your schedule has been cached locally. Confirm classes before confidently walking wrong.",
      timestamp: "Today",
      read: true
    });

    // 4. Alerts State Notice / System alerts (appear only once per device)
    if (!academicAlertsEnabled) {
      items.push({
        id: "alerts-disabled-info",
        category: "system",
        title: "Enable push notifications 🔔",
        body: "Get automatic alerts for attendance drops and marks releases even when the app is closed.",
        timestamp: "Just now",
        read: false
      });
    } else if (mounted && typeof window !== "undefined" && localStorage.getItem("hasAddedAlertsEnabledNotification") === "true") {
      items.push({
        id: "alerts-enabled-system",
        category: "system",
        title: "Academic alerts enabled ✅",
        body: "Nexus will notify you about important attendance and marks updates.",
        timestamp: "Just now",
        read: false
      });
    }

    // 5. Time-of-day Friendly Motivation / Reminders
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      items.push({
        id: "friendly-morning-food",
        category: "system",
        title: "Food check first 🍛",
        body: "Eat something before overthinking attendance. Brain needs fuel.",
        timestamp: "Morning check-in",
        read: false
      });
      items.push({
        id: "friendly-morning-plan",
        category: "timetable",
        title: "Morning plan ready ☀️",
        body: "First class starts soon. Start slow, but start on time.",
        timestamp: "Morning check-in",
        read: false
      });
    } else if (hour >= 12 && hour < 17) {
      items.push({
        id: "friendly-afternoon-motivation",
        category: "system",
        title: "One step enough 🎯",
        body: "Fix one weak subject today. No need to fight everything.",
        timestamp: "Afternoon status",
        read: false
      });
      items.push({
        id: "friendly-afternoon-water",
        category: "system",
        title: "Water break now 💧",
        body: "Drink water once. Even good plans need hydration.",
        timestamp: "Afternoon status",
        read: false
      });
    } else {
      items.push({
        id: "friendly-night-sleep",
        category: "system",
        title: "Sleep matters too 🌙",
        body: "Rest properly tonight. Attendance stress feels worse when tired.",
        timestamp: "Night reminder",
        read: false
      });
      items.push({
        id: "friendly-evening-check",
        category: "timetable",
        title: "Evening check-in 🌆",
        body: "Today's attendance is saved. Review risky subjects before tomorrow.",
        timestamp: "Evening summary",
        read: false
      });
    }

    const filtered = items
      .filter(item => !clearedIds.includes(item.id))
      .map(item => ({
        ...item,
        read: readIds.includes(item.id) ? true : item.read
      }));

    setNotifications(filtered);
  }, [mounted, academicData, studentPortalData, academicAlertsEnabled, clearedIds, readIds]);

  useEffect(() => {
    if (mounted) {
      generateNotifications();
    }
  }, [mounted, generateNotifications]);


  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newRead = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newRead);
    try {
      localStorage.setItem("nexus_read_notifications", JSON.stringify(newRead));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    const newCleared = Array.from(new Set([...clearedIds, ...allIds]));
    setClearedIds(newCleared);
    try {
      localStorage.setItem("nexus_cleared_notifications", JSON.stringify(newCleared));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const newRead = [...readIds, id];
    setReadIds(newRead);
    try {
      localStorage.setItem("nexus_read_notifications", JSON.stringify(newRead));
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) return null;

  const isLight = theme === "light";
  const accentColor = isLight ? "#BF5AF2" : "#FF75C3";

  const getCategoryStyles = (cat: NotificationItem["category"]) => {
    switch (cat) {
      case "attendance":
        return {
          icon: CheckCircle2,
          color: "#34C759",
          bg: "rgba(52, 199, 89, 0.08)"
        };
      case "lowAttendance":
        return {
          icon: AlertTriangle,
          color: "#FF3B30",
          bg: "rgba(255, 59, 48, 0.08)"
        };
      case "marks":
        return {
          icon: Award,
          color: "#FF9500",
          bg: "rgba(255, 149, 0, 0.08)"
        };
      case "timetable":
        return {
          icon: Clock,
          color: "#00E5FF",
          bg: "rgba(0, 229, 255, 0.08)"
        };
      case "system":
        return {
          icon: Sparkles,
          color: accentColor,
          bg: isLight ? "rgba(191, 90, 242, 0.08)" : "rgba(255, 117, 195, 0.08)"
        };
      default:
        return {
          icon: Bell,
          color: "var(--text-secondary)",
          bg: "rgba(255, 255, 255, 0.05)"
        };
    }
  };

  return (
    <div className="page-root" style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="page-main" style={{ paddingBottom: "120px", display: "flex", flexDirection: "column", padding: "24px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button 
                onClick={() => router.back()} 
                style={{ 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid var(--border)", 
                  color: "var(--text-primary)", 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "12px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  cursor: "pointer" 
                }}
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
              style={{ 
                background: "rgba(255,255,255,0.03)", 
                border: "1px solid var(--border)", 
                color: "var(--text-secondary)", 
                width: "40px", 
                height: "40px", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                cursor: "pointer" 
              }}
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Action Sub-Bar */}
          {notifications.length > 0 && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", width: "100%" }}>
              <button 
                onClick={markAllAsRead}
                style={{ 
                  flex: 1, padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.02)", color: "var(--text-primary)", fontSize: "11px", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                Mark all read
              </button>
              <button 
                onClick={clearAll}
                style={{ 
                  padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(255, 59, 48, 0.15)",
                  background: "rgba(255, 59, 48, 0.05)", color: "#FF3B30", fontSize: "11px", fontWeight: 700,
                  display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <Trash2 size={12} /> Clear all
              </button>
            </div>
          )}

          {/* Main List */}
          <div style={{ flex: 1, width: "100%" }}>
            {notifications.length === 0 ? (
              <div style={{ 
                padding: "80px 24px", 
                textAlign: "center", 
                background: isLight ? "rgba(0,0,0,0.01)" : "rgba(255,255,255,0.01)", 
                border: "1px solid var(--border)", 
                borderRadius: "32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: isLight ? "rgba(143, 146, 255, 0.08)" : "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)"
                }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-primary)" }}>All clean!</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
                    No active notifications or alerts. You are fully up to date.
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
                        background: isLight ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.02)",
                        border: item.read ? "1px solid var(--border)" : `1px solid ${accentColor}25`,
                        borderRadius: "20px",
                        padding: "16px 20px",
                        display: "flex",
                        gap: "14px",
                        position: "relative",
                        transition: "all 0.3s",
                        cursor: !item.read ? "pointer" : "default"
                      }}
                    >
                      {/* Unread Pill Indicator */}
                      {!item.read && (
                        <div style={{
                          position: "absolute",
                          top: "20px",
                          right: "20px",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: accentColor,
                          boxShadow: `0 0 8px ${accentColor}`
                        }} />
                      )}

                      {/* Icon */}
                      <div style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        background: styles.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: styles.color,
                        flexShrink: 0
                      }}>
                        <CatIcon size={18} />
                      </div>

                      {/* Text Details */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {item.body}
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginTop: "4px" }}>
                          {item.timestamp}
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
    </div>
  );
}
