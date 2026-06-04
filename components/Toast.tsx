"use client";
import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";

export interface ToastProps {
  title: string;
  body: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export default function Toast({ title, body, type = "success", duration = 4000, onClose }: ToastProps) {
  const { theme } = useThemeStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showId = setTimeout(() => setVisible(true), 50);
    const hideId = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(showId);
      clearTimeout(hideId);
    };
  }, [duration, onClose]);

  const isLight = theme === "light";
  
  const getColors = () => {
    if (type === "success") return { color: "#34C759", bg: "rgba(52, 199, 89, 0.08)", icon: CheckCircle2 };
    if (type === "error") return { color: "#FF3B30", bg: "rgba(255, 59, 48, 0.08)", icon: AlertTriangle };
    return { color: isLight ? "#6366f1" : "#8F92FF", bg: isLight ? "rgba(99, 102, 241, 0.08)" : "rgba(143, 146, 255, 0.08)", icon: Info };
  };

  const { color, bg, icon: Icon } = getColors();

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: visible ? "translate(-50%, 0)" : "translate(-50%, -120px)",
        opacity: visible ? 1 : 0,
        zIndex: 999999,
        width: "min(calc(100% - 32px), 420px)",
        background: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(15, 10, 25, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: "20px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        boxShadow: isLight ? "0 10px 30px rgba(0,0,0,0.08)" : "0 20px 50px rgba(0,0,0,0.55)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: bg,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <Icon size={18} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>{title}</span>
          <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.35 }}>{body}</span>
        </div>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
