"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { useRouter } from "next/navigation";
import { 
  Bell, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, 
  Award, Settings, Trash2, Clock, Pencil, X, Save, Phone
} from "lucide-react";

interface NotificationItem {
  id: string;
  category: "attendance" | "marks" | "timetable" | "lowAttendance" | "system";
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

  useEffect(() => {
    try {
      const cleared = localStorage.getItem("nexus_cleared_notifications");
      if (cleared) setClearedIds(JSON.parse(cleared));
      const read = localStorage.getItem("nexus_read_notifications");
      if (read) setReadIds(JSON.parse(read));
      setTemplates(loadTemplates());
    } catch {}
    setMounted(true);
  }, []);

  const generateNotifications = useCallback(() => {
    const items: NotificationItem[] = [];
    const att = academicData?.attendance || [];
    const spMarks = studentPortalData?.marks?.marks || [];
    
    if (att.length > 0) {
      let riskyCount = 0;
      att.forEach((sub: AnyValue) => {
        const pctStr = sub["Attn %"] ?? sub.pct;
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

    items.push({
      id: "tt-ready",
      category: "timetable",
      title: "Timetable updated 📅",
      body: "Your schedule has been cached locally. Confirm classes before confidently walking wrong.",
      timestamp: "Today",
      read: true
    });

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

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      items.push({ id: "friendly-morning-food", category: "system", title: "Food check first 🍛", body: "Eat something before overthinking attendance. Brain needs fuel.", timestamp: "Morning check-in", read: false });
      items.push({ id: "friendly-morning-plan", category: "timetable", title: "Morning plan ready ☀️", body: "First class starts soon. Start slow, but start on time.", timestamp: "Morning check-in", read: false });
    } else if (hour >= 12 && hour < 17) {
      items.push({ id: "friendly-afternoon-motivation", category: "system", title: "One step enough 🎯", body: "Fix one weak subject today. No need to fight everything.", timestamp: "Afternoon status", read: false });
      items.push({ id: "friendly-afternoon-water", category: "system", title: "Water break now 💧", body: "Drink water once. Even good plans need hydration.", timestamp: "Afternoon status", read: false });
    } else {
      items.push({ id: "friendly-night-sleep", category: "system", title: "Sleep matters too 🌙", body: "Rest properly tonight. Attendance stress feels worse when tired.", timestamp: "Night reminder", read: false });
      items.push({ id: "friendly-evening-check", category: "timetable", title: "Evening check-in 🌆", body: "Today's attendance is saved. Review risky subjects before tomorrow.", timestamp: "Evening summary", read: false });
    }

    const filtered = items
      .filter(item => !clearedIds.includes(item.id))
      .map(item => ({ ...item, read: readIds.includes(item.id) ? true : item.read }));

    setNotifications(filtered);
  }, [mounted, academicData, studentPortalData, academicAlertsEnabled, clearedIds, readIds]);

  useEffect(() => {
    if (mounted) generateNotifications();
  }, [mounted, generateNotifications]);

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newRead = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newRead);
    try { localStorage.setItem("nexus_read_notifications", JSON.stringify(newRead)); } catch {}
  };

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    const newCleared = Array.from(new Set([...clearedIds, ...allIds]));
    setClearedIds(newCleared);
    try { localStorage.setItem("nexus_cleared_notifications", JSON.stringify(newCleared)); } catch {}
  };

  const handleMarkAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const newRead = [...readIds, id];
    setReadIds(newRead);
    try { localStorage.setItem("nexus_read_notifications", JSON.stringify(newRead)); } catch {}
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

  const getCategoryStyles = (cat: NotificationItem["category"]) => {
    switch (cat) {
      case "attendance": return { icon: CheckCircle2, color: "#34C759", bg: "rgba(52, 199, 89, 0.08)" };
      case "lowAttendance": return { icon: AlertTriangle, color: "#FF3B30", bg: "rgba(255, 59, 48, 0.08)" };
      case "marks": return { icon: Award, color: "#FF9500", bg: "rgba(255, 149, 0, 0.08)" };
      case "timetable": return { icon: Clock, color: "#00E5FF", bg: "rgba(0, 229, 255, 0.08)" };
      case "system": return { icon: Sparkles, color: accentColor, bg: isLight ? "rgba(191, 90, 242, 0.08)" : "rgba(255, 117, 195, 0.08)" };
      default: return { icon: Bell, color: "var(--text-secondary)", bg: "rgba(255, 255, 255, 0.05)" };
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
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Info banner */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: isLight ? "rgba(191,90,242,0.06)" : "rgba(255,117,195,0.06)", border: `1px solid ${isLight ? "rgba(191,90,242,0.15)" : "rgba(255,117,195,0.15)"}`, borderRadius: "14px", padding: "12px 16px", marginBottom: "4px" }}>
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
                    {/* Row header */}
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

                    {/* Label */}
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

        </div>
      </main>
    </div>
  );
}
