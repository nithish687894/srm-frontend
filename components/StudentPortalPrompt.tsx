"use client";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface StudentPortalPromptProps {
  onConnect: () => void;
  /** If true, render plain CTA content (no card wrapper). If false, render full section. */
  inline?: boolean;
}

/**
 * Shows a prompt to connect the Student Portal when not connected.
 * Two modes:
 *   - inline=true: renders just text + button (to be placed inside an existing card)
 *   - inline=false (default): renders as a centered full-section prompt
 */
export default function StudentPortalPrompt({
  onConnect,
  inline = false,
}: StudentPortalPromptProps) {
  if (inline) {
    // Simple text + button — NO card wrapper, NO header (parent provides those)
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <p
          style={{
            fontSize: "13px",
            color: "#666",
            marginBottom: "16px",
            lineHeight: 1.5,
          }}
        >
          Connect your official Student Portal to reveal complete academic
          history and performance insights.
        </p>
        <button
          onClick={onConnect}
          style={{
            background: "#00ff88",
            color: "#000",
            padding: "10px 20px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 900,
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
        >
          Unlock Performance Records
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        textAlign: "center",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "24px",
          background: "rgba(0, 255, 136, 0.1)",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShieldCheck size={36} color="#00ff88" />
      </div>
      <div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 900,
            color: "#fff",
            marginBottom: "8px",
          }}
        >
          Unlock Full Access
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#888",
            maxWidth: "320px",
            lineHeight: 1.5,
          }}
        >
          Connect your Student Portal to view deep analytics, absence tracking,
          and complete performance records.
        </p>
      </div>
      <button
        onClick={onConnect}
        style={{
          background: "#00ff88",
          color: "#000",
          padding: "14px 28px",
          borderRadius: "99px",
          fontSize: "13px",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(0, 255, 136, 0.3)",
        }}
      >
        Connect Student Portal
      </button>
    </motion.div>
  );
}
