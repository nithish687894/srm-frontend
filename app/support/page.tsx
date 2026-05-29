"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { Send, MessageSquare, Clock, CheckCircle } from "lucide-react";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [feedbackList, setFeedbackList] = useState<AnyValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await dataAPI.getFeedback();
      if (res.success) setFeedbackList(res.feedback || []);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await dataAPI.submitFeedback(message);
      if (res.success) {
        setMessage("");
        fetchFeedback();
      }
    } catch (e) {
      console.error("Failed to send feedback", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-root">
      <Sidebar />
      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "120px", maxWidth: "800px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "linear-gradient(135deg, #a8c200, #4ade80)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>
              <MessageSquare size={24} />
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: 800, textTransform: "uppercase" }}>Direct Line</div>
              <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, letterSpacing: "-0.04em" }}>Help & Support</h1>
            </div>
          </div>

          <div className="min-card" style={{ padding: "24px", marginBottom: "32px", border: "1px solid rgba(168, 194, 0, 0.2)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>Send a Message to Admin</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue, feature request, or feedback here..."
              style={{
                width: "100%", height: "120px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                borderRadius: "16px", padding: "16px", color: "#fff", outline: "none", fontSize: "14px", resize: "none",
                fontFamily: "inherit", marginBottom: "16px"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
                style={{
                  background: "var(--accent)", color: "#000", border: "none", borderRadius: "12px",
                  padding: "12px 24px", fontWeight: 900, cursor: loading || !message.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "8px", opacity: loading || !message.trim() ? 0.5 : 1
                }}
              >
                {loading ? "SENDING..." : <>SEND MESSAGE <Send size={16} /></>}
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Your Conversations</h3>
            
            {fetching ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : feedbackList.length === 0 ? (
              <div className="min-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", borderStyle: "dashed" }}>
                No messages sent yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {feedbackList.map((item, i) => (
                  <div key={i} className="min-card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
                    {item.status === "resolved" && (
                      <div style={{ position: "absolute", top: 0, left: 0, width: "4px", bottom: 0, background: "#10b981" }} />
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>
                        <Clock size={12} /> {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: "10px", fontWeight: 900, textTransform: "uppercase", padding: "4px 8px", borderRadius: "8px",
                        background: item.status === "resolved" ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)",
                        color: item.status === "resolved" ? "#10b981" : "var(--text-secondary)"
                      }}>
                        {item.status}
                      </div>
                    </div>

                    <div style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.5, marginBottom: item.adminReply ? "20px" : 0 }}>
                      {item.message}
                    </div>

                    {item.adminReply && (
                      <div style={{ background: "rgba(168, 194, 0, 0.05)", border: "1px solid rgba(168, 194, 0, 0.2)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
                        <div style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle size={12} /> Admin Reply
                        </div>
                        <div style={{ fontSize: "14px", color: "#fff", lineHeight: 1.5 }}>
                          {item.adminReply}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Symmetrical footer links */}
          <div style={{ marginTop: '80px', textAlign: 'center', opacity: 0.5, fontSize: '11px', display: 'flex', justifyContent: 'center', gap: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            <a href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ff75c3'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>Privacy Policy</a>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <a href="/terms" style={{ color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#00ff88'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>Terms of Service</a>
          </div>

        </div>
      </main>
    </div>
  );
}
