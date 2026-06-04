"use client";
import { useState } from "react";
import { X, Send, AlertTriangle, Sparkles, MessageSquare } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { dataAPI } from "@/lib/api";

interface FeedbackModalProps {
  onClose: () => void;
  showToast: (title: string, body: string, type?: "success" | "error" | "info") => void;
}

export default function FeedbackModal({ onClose, showToast }: FeedbackModalProps) {
  const { theme } = useThemeStore();
  const [category, setCategory] = useState<"bug" | "feature" | "feedback">("feedback");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isLight = theme === "light";

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const prefixMap = {
      bug: "🐞 [BUG REPORT] ",
      feature: "🚀 [FEATURE REQUEST] ",
      feedback: "💬 [GENERAL FEEDBACK] "
    };
    const payload = prefixMap[category] + message;

    try {
      // Direct API Submission
      const res = await dataAPI.submitFeedback(payload);
      if (res.success) {
        showToast("Thanks, feedback received. ✅", "Our developers have been alerted and will look into it shortly.", "success");
        setMessage("");
        onClose();
      } else {
        throw new Error();
      }
    } catch {
      // Local Fallback Storage & Logging as specified
      console.log("Feedback captured locally:", { category, message, timestamp: Date.now() });
      try {
        const localItems = JSON.parse(localStorage.getItem("srmx_local_feedback") || "[]");
        localItems.push({ category, message, timestamp: Date.now() });
        localStorage.setItem("srmx_local_feedback", JSON.stringify(localItems));
      } catch (err) {
        console.error(err);
      }
      showToast("Thanks, feedback received. ✅", "Captured locally. We will sync this when you are back online.", "success");
      setMessage("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const activeAccent = isLight ? "#BF5AF2" : "#FF75C3";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 420px)",
          background: isLight ? "#fff" : "#0f0f13",
          border: `1.5px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "28px",
          padding: "24px",
          boxShadow: isLight ? "0 20px 40px rgba(0,0,0,0.08)" : "0 25px 50px rgba(0,0,0,0.65)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          margin: "auto"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "9px", color: activeAccent, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>Improve Nexus</div>
            <h3 style={{ fontSize: "16px", fontWeight: 900, color: isLight ? "#111" : "#fff", margin: "4px 0 0" }}>Submit Feedback</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)",
              border: "none",
              color: isLight ? "#666" : "#aaa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Dropdown Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "10.5px", color: isLight ? "#666" : "rgba(255,255,255,0.45)", fontWeight: 800, textTransform: "uppercase" }}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "feedback" | "bug" | "feature")}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              background: isLight ? "#f4f4f6" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`,
              color: isLight ? "#111" : "#fff",
              fontSize: "13px",
              fontWeight: 650,
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="feedback" style={{ background: isLight ? "#fff" : "#111" }}>💬 General Feedback</option>
            <option value="bug" style={{ background: isLight ? "#fff" : "#111" }}>🐞 Report a Bug</option>
            <option value="feature" style={{ background: isLight ? "#fff" : "#111" }}>🚀 Request a Feature</option>
          </select>
        </div>

        {/* Textbox */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "10.5px", color: isLight ? "#666" : "rgba(255,255,255,0.45)", fontWeight: 800, textTransform: "uppercase" }}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              category === "bug" 
                ? "Describe the issue clearly..." 
                : category === "feature"
                  ? "Describe the feature you'd like to see..."
                  : "Share your experience or suggestions..."
            }
            rows={4}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              background: isLight ? "#f4f4f6" : "rgba(255,255,255,0.02)",
              border: `1.5px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}`,
              color: isLight ? "#111" : "#fff",
              fontSize: "13px",
              fontWeight: 600,
              outline: "none",
              resize: "none",
              lineHeight: 1.5
            }}
          />
        </div>

        {/* Actions */}
        <button
          onClick={handleSubmit}
          disabled={loading || !message.trim()}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "16px",
            background: activeAccent,
            color: isLight ? "#fff" : "#000",
            border: "none",
            fontSize: "12.5px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: message.trim() ? "pointer" : "default",
            opacity: message.trim() ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <Send size={14} />
          <span>{loading ? "Submitting..." : "Submit ticket"}</span>
        </button>
      </div>
    </div>
  );
}
