"use client";
import { useState } from "react";
import { X, Send } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import Toast from "./Toast";

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { theme } = useThemeStore();
  const [type, setType] = useState<"bug" | "feature" | "feedback">("feedback");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);

    try {
      const payload = {
        type,
        message,
        timestamp: new Date().toISOString()
      };
      
      const list = JSON.parse(localStorage.getItem("srmx_feedback_submissions") || "[]");
      list.push(payload);
      localStorage.setItem("srmx_feedback_submissions", JSON.stringify(list));

      console.log("Feedback submitted successfully:", payload);

      setShowToast(true);
      setMessage("");
      
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isLight = theme === "light";
  const accentColor = isLight ? "#BF5AF2" : "#FF75C3";

  return (
    <>
      <div 
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}
        onClick={onClose}
      >
        <div 
          style={{
            background: isLight ? "rgba(255,255,255,0.96)" : "rgba(16, 12, 26, 0.96)",
            border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: "28px",
            padding: "28px",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            position: "relative",
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>

          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>Send Feedback</h2>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "0 0 24px" }}>Help improve SRM Nexus by reporting bugs or features.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "10.5px", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                style={{
                  background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  outline: "none",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                <option value="feedback" style={{ background: "var(--bg)" }}>Send Feedback</option>
                <option value="bug" style={{ background: "var(--bg)" }}>Report a Bug</option>
                <option value="feature" style={{ background: "var(--bg)" }}>Request a Feature</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "10.5px", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Message</label>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  type === "bug" 
                    ? "What went wrong? Describe how to reproduce the bug..." 
                    : type === "feature"
                      ? "Describe the feature you'd like to see in Nexus..."
                      : "Share your thoughts, suggestions, or launch feedback..."
                }
                style={{
                  background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "16px",
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  outline: "none",
                  minHeight: "120px",
                  resize: "none",
                  lineHeight: 1.5,
                  width: "100%"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                background: accentColor,
                color: isLight ? "#fff" : "#000",
                fontSize: "12px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                border: "none",
                cursor: message.trim() ? "pointer" : "default",
                opacity: message.trim() ? 1 : 0.6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
                boxShadow: `0 8px 24px rgba(${isLight ? "191,90,242" : "255,117,195"}, 0.25)`,
                transition: "all 0.2s"
              }}
            >
              <Send size={14} />
              <span>{loading ? "Sending..." : "Submit"}</span>
            </button>
          </form>
        </div>
      </div>

      {showToast && (
        <Toast 
          title="Thanks, feedback received." 
          body="Students like you help improve SRM Nexus!" 
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
