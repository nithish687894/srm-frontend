"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import { 
  Bell, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, 
  Award, Settings, Trash2, Clock, Pencil, X, Save, Phone, Search
} from "lucide-react";
import { getCachedTemplates, renderTemplate as renderPulseTemplate, type NotificationTemplate } from "@/lib/pulseEngine";

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

interface MessageTemplate {
  id: string;
  category: "attendance" | "marks" | "timetable" | "system";
  label: string;
  title: string;
  body: string;
  isPhoneAlert: boolean; // true = also sent as phone push
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  // ── Attendance ───────────────────────────────────────────────────────────
  {
    id: "msg-attn-low",
    category: "attendance",
    label: "Low attendance warning",
    title: "⚠️ Low attendance: {subject}",
    body: "{subject} is at {pct}%. Attend next class to avoid getting detained.",
    isPhoneAlert: true,
  },
  {
    id: "msg-attn-multi-risk",
    category: "attendance",
    label: "Multiple subjects at risk",
    title: "⚠️ {count} subjects need attention",
    body: "You have low attendance in: {subjects}.",
    isPhoneAlert: true,
  },
  {
    id: "msg-attn-safe",
    category: "attendance",
    label: "Attendance safe",
    title: "Safe for now 😌",
    body: "Overall attendance is fine. Keep it steady, no unnecessary hero moves.",
    isPhoneAlert: false,
  },
  {
    id: "msg-attn-pending",
    category: "attendance",
    label: "Attendance not synced",
    title: "Awaiting attendance sync 📊",
    body: "Connect your portal to receive real-time attendance warnings and details.",
    isPhoneAlert: false,
  },
  // ── Marks ────────────────────────────────────────────────────────────────
  {
    id: "msg-marks-updated",
    category: "marks",
    label: "Marks updated (phone alert)",
    title: "📊 Marks updated",
    body: "New marks have been posted. Check your scores in the Marks section.",
    isPhoneAlert: true,
  },
  {
    id: "msg-marks-live",
    category: "marks",
    label: "Marks live (in-app)",
    title: "Marks are live 👀",
    body: "Assignment and cycle test marks are updated. Review them calmly and plan your comeback.",
    isPhoneAlert: false,
  },
  // ── Timetable ────────────────────────────────────────────────────────────
  {
    id: "msg-tt-ready",
    category: "timetable",
    label: "Timetable cached",
    title: "Timetable updated 📅",
    body: "Your schedule has been cached locally. Confirm classes before confidently walking wrong.",
    isPhoneAlert: false,
  },
  // ── System / Time-of-day ─────────────────────────────────────────────────
  {
    id: "msg-welcome",
    category: "system",
    label: "Welcome push (phone)",
    title: "Nexus has your back 😌",
    body: "Don't worry. We'll remind you when something important changes.",
    isPhoneAlert: true,
  },
  {
    id: "msg-alerts-enabled",
    category: "system",
    label: "Alerts enabled confirmation",
    title: "Academic alerts enabled ✅",
    body: "Nexus will notify you about important attendance and marks updates.",
    isPhoneAlert: false,
  },
  {
    id: "msg-alerts-disabled",
    category: "system",
    label: "Enable push reminder",
    title: "Enable push notifications 🔔",
    body: "Get automatic alerts for attendance drops and marks releases even when the app is closed.",
    isPhoneAlert: false,
  },
  {
    id: "msg-morning-food",
    category: "system",
    label: "Morning — Food check",
    title: "Food check first 🍛",
    body: "Eat something before overthinking attendance. Brain needs fuel.",
    isPhoneAlert: false,
  },
  {
    id: "msg-morning-plan",
    category: "timetable",
    label: "Morning — Day plan",
    title: "Morning plan ready ☀️",
    body: "First class starts soon. Start slow, but start on time.",
    isPhoneAlert: false,
  },
  {
    id: "msg-afternoon-focus",
    category: "system",
    label: "Afternoon — Focus tip",
    title: "One step enough 🎯",
    body: "Fix one weak subject today. No need to fight everything.",
    isPhoneAlert: false,
  },
  {
    id: "msg-afternoon-water",
    category: "system",
    label: "Afternoon — Water break",
    title: "Water break now 💧",
    body: "Drink water once. Even good plans need hydration.",
    isPhoneAlert: false,
  },
  {
    id: "msg-night-sleep",
    category: "system",
    label: "Night — Sleep reminder",
    title: "Sleep matters too 🌙",
    body: "Rest properly tonight. Attendance stress feels worse when tired.",
    isPhoneAlert: false,
  },
  {
    id: "msg-evening-check",
    category: "timetable",
    label: "Evening — Review check",
    title: "Evening check-in 🌆",
    body: "Today's attendance is saved. Review risky subjects before tomorrow.",
    isPhoneAlert: false,
  },
];

const STORAGE_KEY = "nexus_custom_notif_messages";

function loadTemplates(): MessageTemplate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(saved) as Partial<MessageTemplate>[];
    // Merge with defaults (add new defaults, keep user edits)
    return DEFAULT_TEMPLATES.map((def) => {
      const custom = parsed.find((p) => p.id === def.id);
      return custom ? { ...def, ...custom } : def;
    });
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

function saveTemplates(templates: MessageTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {}
}

export default function NotificationCenterPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { academicData, studentPortalData, academicAlertsEnabled } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  // Message editor state
  const [activeTab, setActiveTab] = useState<"inbox" | "messages">("inbox");
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // Pulse Explorer state
  const [messagesSubTab, setMessagesSubTab] = useState<"defaults" | "pulse">("defaults");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTone, setSelectedTone] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pulseTemplates, setPulseTemplates] = useState<NotificationTemplate[]>([]);

  const previewVars = {
    subject: "Cyber Security",
    attendance: 71,
    attendanceChange: -2,
    classTime: "10:30 AM",
    classesToday: 4,
    deadline: "Tonight at 11:59 PM",
    duration: "45 mins",
    examDate: "June 15",
    examName: "End Semester Exam",
    firstClassTime: "8:00 AM",
    location: "Tech Park 603",
    marks: 12,
    maxMarks: 15,
    newClass: "TP 603",
    oldClass: "TP 502",
    overallAttendance: 74,
    requiredAttendance: 75,
    riskySubject: "Cyber Security",
    safeSkips: 0,
    studentName: "Nithish",
    topic: "Buffer Overflow"
  };

  useEffect(() => {
    try {
      const cleared = localStorage.getItem("nexus_cleared_notifications");
      if (cleared) setClearedIds(JSON.parse(cleared));
      setTemplates(loadTemplates());
      setPulseTemplates(getCachedTemplates());
      
      const cached = localStorage.getItem("nexus_cached_notifications_list");
      if (cached) setNotifications(JSON.parse(cached));
    } catch {}
    setMounted(true);
  }, []);

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
          const formatted = data.notifications.map((n: any) => ({
            id: n._id || n.id,
            category: n.category,
            title: n.title,
            body: n.body,
            timestamp: new Date(n.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: n.read,
            severity: n.severity,
            tone: n.tone,
          }));

          const filtered = formatted.filter((n: any) => !clearedIds.includes(n.id));
          setNotifications(filtered);
          localStorage.setItem("nexus_cached_notifications_list", JSON.stringify(filtered));
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [clearedIds]);

  useEffect(() => {
    if (mounted) {
      fetchNotifications();
    }
  }, [mounted, fetchNotifications]);

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
        const list = JSON.parse(cached) as any[];
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
        const list = JSON.parse(cached) as any[];
        const updated = list.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        localStorage.setItem("nexus_cached_notifications_list", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const startEdit = (tmpl: MessageTemplate) => {
    setEditingId(tmpl.id);
    setEditTitle(tmpl.title);
    setEditBody(tmpl.body);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = templates.map(t =>
      t.id === editingId ? { ...t, title: editTitle, body: editBody } : t
    );
    setTemplates(updated);
    saveTemplates(updated);
    setEditingId(null);
  };

  const resetTemplate = (id: string) => {
    const def = DEFAULT_TEMPLATES.find(t => t.id === id);
    if (!def) return;
    const updated = templates.map(t => t.id === id ? { ...t, title: def.title, body: def.body } : t);
    setTemplates(updated);
    saveTemplates(updated);
    if (editingId === id) setEditingId(null);
  };

  if (!mounted) return null;

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

  const catColor = (cat: MessageTemplate["category"]) => ({
    attendance: "#34C759", marks: "#FF9500", timetable: "#00E5FF", system: accentColor
  }[cat] || accentColor);

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

          {/* Tab Bar */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", borderRadius: "14px", padding: "4px" }}>
            {(["inbox", "messages"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                  background: activeTab === tab ? (isLight ? "#fff" : "rgba(255,255,255,0.08)") : "transparent",
                  color: activeTab === tab ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "12px", fontWeight: 800, cursor: "pointer",
                  boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.2s",
                  textTransform: "uppercase", letterSpacing: "0.08em"
                }}
              >
                {tab === "inbox" ? `📥 Inbox (${notifications.length})` : `✏️ Messages (${templates.length})`}
              </button>
            ))}
          </div>

          {/* ── INBOX TAB ─────────────────────────────────────────── */}
          {activeTab === "inbox" && (
            <>
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
            </>
          )}

          {/* ── MESSAGES TAB ──────────────────────────────────────── */}
          {activeTab === "messages" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Messages Sub-tabs */}
              <div style={{ display: "flex", gap: "8px", background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "3px" }}>
                {(["defaults", "pulse"] as const).map(subTab => (
                  <button
                    key={subTab}
                    onClick={() => setMessagesSubTab(subTab)}
                    style={{
                      flex: 1, padding: "8px", borderRadius: "10px", border: "none",
                      background: messagesSubTab === subTab ? (isLight ? "#fff" : "rgba(255,255,255,0.08)") : "transparent",
                      color: messagesSubTab === subTab ? "var(--text-primary)" : "var(--text-secondary)",
                      fontSize: "11px", fontWeight: 700, cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {subTab === "defaults" ? "📋 App Defaults" : "⚡ Pulse Explorer (700)"}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: App Defaults */}
              {messagesSubTab === "defaults" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", background: isLight ? "rgba(191,90,242,0.06)" : "rgba(255,117,195,0.06)", border: `1px solid ${isLight ? "rgba(191,90,242,0.15)" : "rgba(255,117,195,0.15)"}`, borderRadius: "14px", padding: "12px 16px" }}>
                    <Phone size={15} color={accentColor} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", fontWeight: 600, lineHeight: 1.5 }}>
                      Messages marked with 📱 are sent as <strong>real phone notifications</strong> when triggered. You can edit any message title or body. Use <code>{"{subject}"}</code>, <code>{"{pct}"}</code>, <code>{"{count}"}</code> as placeholders.
                    </span>
                  </div>

                  {templates.map((tmpl) => {
                    const isEditing = editingId === tmpl.id;
                    const color = catColor(tmpl.category);
                    return (
                      <div
                        key={tmpl.id}
                        style={{ background: isLight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.025)", border: isEditing ? `1px solid ${accentColor}60` : "1px solid var(--border)", borderRadius: "18px", padding: "16px 18px", transition: "all 0.2s" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isEditing ? "12px" : "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                            <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
                              {tmpl.category} {tmpl.isPhoneAlert ? "· 📱 Phone" : "· In-app"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {isEditing ? (
                              <>
                                <button onClick={saveEdit} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", border: `1px solid ${accentColor}40`, background: `${accentColor}15`, color: accentColor, fontSize: "10px", fontWeight: 800, cursor: "pointer" }}>
                                  <Save size={10} /> Save
                                </button>
                                <button onClick={() => setEditingId(null)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}>
                                  <X size={10} /> Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(tmpl)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                                  <Pencil size={10} /> Edit
                                </button>
                                <button onClick={() => resetTemplate(tmpl.id)} style={{ padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                                  Reset
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "6px" }}>{tmpl.label}</div>

                        {isEditing ? (
                          <>
                            <div style={{ marginBottom: "8px" }}>
                              <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Title</div>
                              <input
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                style={{ width: "100%", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Body</div>
                              <textarea
                                value={editBody}
                                onChange={e => setEditBody(e.target.value)}
                                rows={3}
                                style={{ width: "100%", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px", color: "var(--text-primary)", fontSize: "12px", lineHeight: 1.5, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>{tmpl.title}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{tmpl.body}</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-tab 2: Pulse Explorer */}
              {messagesSubTab === "pulse" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Info */}
                  <div style={{ background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "4px" }}>⚡ Nexus Pulse Explorer</div>
                    <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      Seeded from MongoDB database. Nexus randomly chooses one matching template to provide humorous variety and soft roasts!
                    </div>
                  </div>

                  {/* Filters */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        style={{ flex: 1, background: isLight ? "#fff" : "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "10px", padding: "10px", fontSize: "11px", fontWeight: 700, outline: "none" }}
                      >
                        <option value="all">All Categories</option>
                        <option value="attendance_low">Low Attendance</option>
                        <option value="attendance_danger">Attendance Danger</option>
                        <option value="attendance_safe">Attendance Safe</option>
                        <option value="safe_to_skip">Safe to Skip</option>
                        <option value="not_safe_to_skip">Not Safe to Skip</option>
                        <option value="marks_update">Marks Update</option>
                        <option value="class_reminder">Class Reminder</option>
                        <option value="timetable_change">Timetable Change</option>
                        <option value="exam_reminder">Exam Reminder</option>
                        <option value="assignment_deadline">Assignment Deadline</option>
                        <option value="study_plan">Study Plan</option>
                        <option value="life_reminder">Life Reminder</option>
                        <option value="morning_summary">Morning Summary</option>
                        <option value="evening_summary">Evening Summary</option>
                      </select>

                      <select
                        value={selectedTone}
                        onChange={e => setSelectedTone(e.target.value)}
                        style={{ flex: 1, background: isLight ? "#fff" : "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "10px", padding: "10px", fontSize: "11px", fontWeight: 700, outline: "none" }}
                      >
                        <option value="all">All Tones</option>
                        <option value="funny_friend">Funny Friend</option>
                        <option value="helpful_friendly">Helpful Friendly</option>
                        <option value="strict_caring">Strict Caring</option>
                      </select>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: "relative" }}>
                      <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                      <input
                        type="text"
                        placeholder="Search template content..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: "100%", background: isLight ? "#fff" : "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 10px 10px 34px", color: "var(--text-primary)", fontSize: "11.5px", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* List of Templates */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
                    {pulseTemplates
                      .filter(t => {
                        const matchesCat = selectedCategory === "all" || t.category === selectedCategory;
                        const matchesTone = selectedTone === "all" || t.tone === selectedTone;
                        const matchesSearch = searchQuery === "" || 
                          t.titleTemplate.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.bodyTemplate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchesCat && matchesTone && matchesSearch;
                      })
                      .slice(0, 30) // Show first 30 to keep UI snappy
                      .map(tmpl => {
                        const preview = renderPulseTemplate(tmpl.titleTemplate, tmpl.bodyTemplate, previewVars);
                        const toneColors: Record<string, string> = {
                          funny_friend: "#FF75C3",
                          helpful_friendly: "#00E5FF",
                          strict_caring: "#FF3B30"
                        };
                        return (
                          <div
                            key={tmpl.id}
                            style={{ background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.015)", border: "1px solid var(--border)", borderRadius: "16px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "9px", fontWeight: 800, color: accentColor, letterSpacing: "0.05em" }}>{tmpl.id}</span>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <span style={{ fontSize: "8px", fontWeight: 900, background: `${toneColors[tmpl.tone] || accentColor}15`, color: toneColors[tmpl.tone] || accentColor, padding: "2px 6px", borderRadius: "6px", textTransform: "uppercase" }}>{tmpl.tone}</span>
                                <span style={{ fontSize: "8px", fontWeight: 900, background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", padding: "2px 6px", borderRadius: "6px", textTransform: "uppercase" }}>{tmpl.category}</span>
                              </div>
                            </div>

                            <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", flexDirection: "column" }}>
                              <span><strong>Title:</strong> {tmpl.titleTemplate}</span>
                              <span><strong>Body:</strong> {tmpl.bodyTemplate}</span>
                            </div>

                            {/* Rendered Live Preview bubble */}
                            <div style={{ background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)", borderLeft: `2px solid ${accentColor}`, borderRadius: "8px", padding: "8px 10px", marginTop: "4px" }}>
                              <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 800, marginBottom: "2px" }}>Rendered Preview</div>
                              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-primary)" }}>{preview.title}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>{preview.body}</div>
                            </div>
                          </div>
                        );
                      })}
                    {pulseTemplates.filter(t => {
                      const matchesCat = selectedCategory === "all" || t.category === selectedCategory;
                      const matchesTone = selectedTone === "all" || t.tone === selectedTone;
                      const matchesSearch = searchQuery === "" || 
                        t.titleTemplate.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.bodyTemplate.toLowerCase().includes(searchQuery.toLowerCase());
                      return matchesCat && matchesTone && matchesSearch;
                    }).length === 0 && (
                      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>No matching templates found in local cache.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
