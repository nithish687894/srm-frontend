"use client";
import { useState, useEffect } from "react";
import { dataAPI } from "@/lib/api";
import { Send, MessageSquare, Clock, CheckCircle, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/lib/themeStore";

type SupportCategory = "bug" | "feature" | "feedback";

export default function SupportPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportCategory>("feedback");
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
    
    // Prefix categorization to fit backend model seamlessly
    const prefixMap = {
      bug: "🐞 [BUG REPORT] ",
      feature: "🚀 [FEATURE REQUEST] ",
      feedback: "💬 [GENERAL FEEDBACK] "
    };
    const prefix = prefixMap[category];
    
    try {
      const res = await dataAPI.submitFeedback(prefix + message);
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

  const isLight = theme === "light";
  const activeAccent = isLight ? "#BF5AF2" : "var(--accent)";

  const categoriesList: { id: SupportCategory; label: string; icon: AnyValue; color: string; bg: string }[] = [
    { id: "feedback", label: "Feedback", icon: MessageSquare, color: "#34C759", bg: "rgba(52, 199, 89, 0.08)" },
    { id: "bug", label: "Report Bug", icon: AlertTriangle, color: "#FF3B30", bg: "rgba(255, 59, 48, 0.08)" },
    { id: "feature", label: "Request Feature", icon: Sparkles, color: "#00E5FF", bg: "rgba(0, 229, 255, 0.08)" }
  ];

  return (
    <div className="page-root" style={{ background: "var(--bg)" }}>
      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom))", maxWidth: "700px", margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
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
              <div style={{ fontSize: "10px", color: activeAccent, letterSpacing: "0.2em", fontWeight: 800, textTransform: "uppercase" }}>Direct Line</div>
              <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px", color: "var(--text-primary)" }}>Help & Support</h1>
            </div>
          </div>

          {/* Selector Tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {categoriesList.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    background: isSelected ? cat.bg : "rgba(255,255,255,0.01)",
                    border: isSelected ? `1.5px solid ${cat.color}` : "1.5px solid var(--border)",
                    borderRadius: "16px",
                    padding: "12px 8px",
                    color: isSelected ? cat.color : "var(--text-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <IconComp size={16} />
                  <span style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em" }}>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="premium-card" style={{ 
            background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255, 255, 255, 0.02)", 
            padding: "24px", 
            marginBottom: "32px", 
            border: "1px solid var(--border)",
            borderRadius: "24px",
            position: "relative"
          }}>
            <h2 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
              {category === "bug" ? "Report a Bug to Admin" : category === "feature" ? "Request a Feature" : "Send Feedback"}
            </h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                category === "bug" 
                  ? "What went wrong? Describe the steps to reproduce..." 
                  : category === "feature" 
                    ? "What should we add first? Let us know..." 
                    : "Tell us what you think of SRM Nexus..."
              }
              style={{
                width: "100%", height: "120px", 
                background: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.2)", 
                border: "1px solid var(--border)",
                borderRadius: "16px", padding: "16px", color: "var(--text-primary)", outline: "none", fontSize: "14px", resize: "none",
                fontFamily: "inherit", marginBottom: "16px"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
                style={{
                  background: activeAccent, color: isLight ? "#fff" : "#000", border: "none", borderRadius: "12px",
                  padding: "12px 24px", fontWeight: 900, cursor: loading || !message.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "8px", opacity: loading || !message.trim() ? 0.5 : 1,
                  boxShadow: `0 4px 15px rgba(${isLight ? "191,90,242" : "168,194,0"}, 0.2)`
                }}
              >
                {loading ? "SENDING..." : <>SEND MESSAGE <Send size={16} /></>}
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "11px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>Your Conversations</h3>
            
            {fetching ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Loading...</div>
            ) : feedbackList.length === 0 ? (
              <div className="premium-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", borderStyle: "dashed", border: "1px dashed var(--border)", borderRadius: "20px" }}>
                No messages sent yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {feedbackList.map((item, i) => (
                  <div key={i} className="premium-card" style={{ 
                    padding: "20px", position: "relative", overflow: "hidden", 
                    borderRadius: "20px", border: "1px solid var(--border)",
                    background: isLight ? "rgba(0,0,0,0.01)" : "rgba(255,255,255,0.01)" 
                  }}>
                    {item.status === "resolved" && (
                      <div style={{ position: "absolute", top: 0, left: 0, width: "4px", bottom: 0, background: "#34C759" }} />
                    )}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                        <Clock size={12} /> {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: "9px", fontWeight: 900, textTransform: "uppercase", padding: "4px 8px", borderRadius: "8px",
                        background: item.status === "resolved" ? "rgba(52, 199, 89, 0.1)" : "rgba(255, 255, 255, 0.05)",
                        color: item.status === "resolved" ? "#34C759" : "var(--text-secondary)"
                      }}>
                        {item.status}
                      </div>
                    </div>

                    <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500, marginBottom: item.adminReply ? "20px" : 0 }}>
                      {item.message}
                    </div>

                    {item.adminReply && (
                      <div style={{ 
                        background: isLight ? "rgba(191,90,242,0.04)" : "rgba(168, 194, 0, 0.03)", 
                        border: `1px solid ${isLight ? "rgba(191,90,242,0.15)" : "rgba(168, 194, 0, 0.15)"}`, 
                        borderRadius: "12px", padding: "16px", marginTop: "16px" 
                      }}>
                        <div style={{ fontSize: "10px", color: activeAccent, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle size={12} /> Admin Reply
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
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
            <a href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ff75c3'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Privacy Policy</a>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <a href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#00ff88'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Terms of Service</a>
          </div>

        </div>
      </main>
    </div>
  );
}
