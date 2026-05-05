"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Clipboard, Download, Trash2, RefreshCw, Search, Users, ShieldCheck, Activity, ChevronUp, ChevronDown, CheckCircle, Megaphone, Send, ToggleLeft, ToggleRight, MessageSquare, Reply } from "lucide-react";

const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];

export default function AdminPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const { profile, email: storeEmail } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"users" | "broadcast" | "feedback" | "logs">("users");

  // Data States
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  
  // Broadcast State
  const [bcMsg, setBcMsg] = useState("");
  const [bcType, setBcType] = useState<"info" | "success" | "warning">("info");
  const [bcActive, setBcActive] = useState(false);
  const [bcLoading, setBcLoading] = useState(false);

  // General State
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Feedback Reply State
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [logsRes, bcRes, usersRes, fbRes] = await Promise.all([
        dataAPI.getAdminLogs(),
        dataAPI.getBroadcast(),
        dataAPI.getUsers(),
        dataAPI.getAllFeedback()
      ]);
      if (logsRes.success) setLogs(logsRes.logs || []);
      if (usersRes.success) setUsers(usersRes.users || []);
      if (fbRes.success) setFeedback(fbRes.feedback || []);
      
      setBcMsg(bcRes.message || "");
      setBcType(bcRes.type || "info");
      setBcActive(bcRes.active || false);
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const userEmail = (storeEmail || profile?.Email || profile?.["Email"] || "").toLowerCase();
    if (!ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [ready, profile, storeEmail, router, fetchData]);

  const handleBroadcastUpdate = async () => {
    setBcLoading(true);
    try {
      await dataAPI.updateBroadcast({ message: bcMsg, type: bcType, active: bcActive });
      showToast("System broadcast updated!");
    } catch (e) {
      showToast("Update failed", "error");
    } finally {
      setBcLoading(false);
    }
  };

  const handleReplyFeedback = async (id: string) => {
    if (!replyText[id]) return;
    try {
      await dataAPI.replyToFeedback(id, replyText[id], "resolved");
      showToast("Reply sent successfully");
      fetchData(); // Refresh list
    } catch (e) {
      showToast("Failed to reply", "error");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
  };

  // Filtering
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(u => 
      (u.name || "").toLowerCase().includes(s) || 
      (u.email || "").toLowerCase().includes(s) ||
      (u.regNumber || "").toLowerCase().includes(s)
    );
  }, [users, search]);

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter(l => 
      (l.email || "").toLowerCase().includes(s) || 
      (l.ip || "").toLowerCase().includes(s)
    );
  }, [logs, search]);

  if (loading) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner"></div>
    </div>
  );

  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "120px" }}>
          
          {toast && (
            <div className={`srmx-toast ${toast.type}`}>
              <CheckCircle size={16} />
              <span>{toast.msg}</span>
            </div>
          )}

          {/* Header Section */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                System Core • Master Access
              </div>
              <h1 style={{ fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
                Command <span style={{ color: "var(--accent)" }}>Center</span>
              </h1>
            </div>
            <button 
              onClick={fetchData}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "12px", borderRadius: "14px", color: "var(--text-primary)", cursor: "pointer" }}
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Top Tabs */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
            {[
              { id: "users", icon: Users, label: "User Directory" },
              { id: "feedback", icon: MessageSquare, label: "Support Inbox", badge: feedback.filter(f => f.status === "open").length },
              { id: "broadcast", icon: Megaphone, label: "Announcements" },
              { id: "logs", icon: Activity, label: "Access Logs" },
            ].map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    background: active ? "var(--accent)" : "rgba(255,255,255,0.03)",
                    color: active ? "#000" : "var(--text-secondary)",
                    border: active ? "none" : "1px solid var(--border)",
                    padding: "12px 24px", borderRadius: "99px", display: "flex", alignItems: "center", gap: "8px",
                    fontWeight: 800, fontSize: "13px", letterSpacing: "0.05em", transition: "all 0.2s", cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Icon size={16} /> {tab.label}
                  {!!tab.badge && tab.badge > 0 && (
                    <span style={{ background: active ? "#000" : "var(--accent)", color: active ? "var(--accent)" : "#000", padding: "2px 8px", borderRadius: "99px", fontSize: "10px" }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* TABS CONTENT */}

          {activeTab === "users" && (
            <div className="animation-fade-in">
              <div style={{ position: "relative", marginBottom: "24px" }}>
                <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                <input 
                  type="text" 
                  placeholder="Search students by name, email, or reg no..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ 
                    width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", 
                    borderRadius: "16px", padding: "16px 16px 16px 48px", color: "#fff", outline: "none", fontSize: "15px"
                  }} 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {filteredUsers.map((u, i) => (
                  <div key={i} className="min-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "4px" }}>{u.name || "Unknown"}</div>
                      <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 800, letterSpacing: "0.1em" }}>{u.regNumber || "NO-REG"}</div>
                    </div>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{u.email}</div>
                      <button onClick={() => copyToClipboard(u.email, "Email")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                        <Clipboard size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", gridColumn: "1/-1" }}>No users found.</div>}
              </div>
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {feedback.map((f, i) => (
                <div key={i} className="min-card" style={{ padding: "24px", position: "relative", overflow: "hidden", border: f.status === "open" ? "1px solid rgba(168, 194, 0, 0.3)" : "1px solid var(--border)" }}>
                  {f.status === "open" && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "var(--accent)" }} />}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>{f.userEmail}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(f.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", padding: "4px 8px", borderRadius: "6px", background: f.status === "open" ? "rgba(168, 194, 0, 0.1)" : "rgba(255,255,255,0.05)", color: f.status === "open" ? "var(--accent)" : "var(--text-secondary)" }}>
                      {f.status}
                    </div>
                  </div>
                  <div style={{ fontSize: "15px", color: "#fff", lineHeight: 1.5, marginBottom: "20px" }}>{f.message}</div>
                  
                  {f.status === "open" ? (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <input 
                        type="text" 
                        placeholder="Write a reply..." 
                        value={replyText[f._id] || ""}
                        onChange={(e) => setReplyText({...replyText, [f._id]: e.target.value})}
                        style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 16px", color: "#fff", outline: "none" }}
                      />
                      <button 
                        onClick={() => handleReplyFeedback(f._id)}
                        disabled={!replyText[f._id]}
                        style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "12px", padding: "0 20px", fontWeight: 900, cursor: replyText[f._id] ? "pointer" : "not-allowed", opacity: replyText[f._id] ? 1 : 0.5 }}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Reply size={12} /> Admin Reply
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{f.adminReply}</div>
                    </div>
                  )}
                </div>
              ))}
              {feedback.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No feedback tickets found.</div>}
            </div>
          )}

          {activeTab === "broadcast" && (
            <div className="animation-fade-in min-card" style={{ padding: "32px", border: "1px solid var(--accent)", background: "rgba(168, 194, 0, 0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", background: "rgba(168, 194, 0, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Megaphone size={20} /></div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, margin: 0 }}>Global Announcement</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <textarea 
                  placeholder="Enter message to broadcast to all users..."
                  value={bcMsg}
                  onChange={e => setBcMsg(e.target.value)}
                  style={{ width: "100%", height: "100px", background: "var(--bg-root)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", color: "#fff", outline: "none", fontSize: "16px", resize: "none" }}
                />
                <div style={{ display: "flex", gap: "12px" }}>
                  {["info", "success", "warning"].map(type => (
                    <button key={type} onClick={() => setBcType(type as any)} style={{ flex: 1, padding: "16px", borderRadius: "12px", border: bcType === type ? `2px solid var(--accent)` : "1px solid var(--border)", background: bcType === type ? "rgba(168, 194, 0, 0.05)" : "rgba(255,255,255,0.02)", color: bcType === type ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: 800, textTransform: "capitalize", cursor: "pointer" }}>
                      {type} Theme
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <button 
                    onClick={() => setBcActive(!bcActive)}
                    style={{ background: "none", border: "none", color: bcActive ? "var(--accent)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 900, fontSize: "14px", textTransform: "uppercase" }}
                  >
                    {bcActive ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                    {bcActive ? "Broadcast Active" : "Broadcast Offline"}
                  </button>
                  <button 
                    onClick={handleBroadcastUpdate}
                    disabled={bcLoading}
                    style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "14px", padding: "16px 32px", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Send size={18} /> {bcLoading ? "TRANSMITTING..." : "TRANSMIT NOW"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="animation-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ position: "relative", width: "300px" }}>
                  <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                  <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 12px 12px 40px", color: "#fff", outline: "none", fontSize: "13px" }} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 800 }}>⚠️ Passwords are redacted for privacy</div>
              </div>

              <div className="min-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                        <th style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>User Identity</th>
                        <th style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Status</th>
                        <th style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Timestamp</th>
                        <th style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Origin IP</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "13px" }}>
                      {filteredLogs.map((log, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                          <td style={{ padding: "16px 20px", fontWeight: 800, color: "var(--text-primary)" }}>{log.email}</td>
                          <td style={{ padding: "16px 20px" }}>
                            <span style={{ fontSize: "9px", fontWeight: 900, padding: "4px 8px", borderRadius: "6px", background: log.status === "SUCCESS" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: log.status === "SUCCESS" ? "#10b981" : "#ef4444" }}>{log.status}</span>
                          </td>
                          <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ padding: "16px 20px", color: "var(--text-muted)" }}>{log.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="watermark">Command Center</div>
        </div>
      </main>

      <style jsx global>{`
        .animation-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .srmx-toast {
          position: fixed; top: 32px; right: 32px; padding: 12px 24px; border-radius: 12px;
          background: #1c1c1c; border: 1px solid var(--border); color: #fff;
          display: flex; align-items: center; gap: 12px; z-index: 1000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-weight: 700; font-size: 14px;
        }
        .srmx-toast.success { border-left: 4px solid var(--accent); }
        .srmx-toast.error { border-left: 4px solid #ef4444; }
      `}</style>
    </div>
  );
}
