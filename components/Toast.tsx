"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";

export interface ToastProps {
  title: string;
  body: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export default function Toast({ title, body, type = "success", duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getThemeStyles = () => {
    if (isLight) {
      return {
        bg: "rgba(255, 255, 255, 0.95)",
        border: "rgba(0, 0, 0, 0.08)",
        color: "#111",
        subColor: "#666",
        shadow: "0 10px 30px rgba(0, 0, 0, 0.08)"
      };
    }
    return {
      bg: "rgba(18, 15, 25, 0.9)",
      border: "rgba(255, 255, 255, 0.08)",
      color: "#fff",
      subColor: "rgba(255, 255, 255, 0.6)",
      shadow: "0 10px 40px rgba(0, 0, 0, 0.5)"
    };
  };

  const getIconStyles = () => {
    switch (type) {
      case "error":
        return { icon: AlertCircle, color: "#FF3B30", bg: "rgba(255, 59, 48, 0.1)" };
      case "info":
        return { icon: Info, color: "#00E5FF", bg: "rgba(0, 229, 255, 0.1)" };
      default: // success
        return { icon: CheckCircle2, color: isLight ? "#BF5AF2" : "#FF75C3", bg: isLight ? "rgba(191, 90, 242, 0.1)" : "rgba(255, 117, 195, 0.1)" };
    }
  };

  const ts = getThemeStyles();
  const ic = getIconStyles();
  const IconComponent = ic.icon;

  return (
    <div
      style={{
        position: "fixed",
        top: "32px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-40px"})`,
        opacity: visible ? 1 : 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        gap: "14px",
        background: ts.bg,
        border: `1.5px solid ${ts.border}`,
        borderRadius: "20px",
        padding: "16px 20px",
        width: "min(calc(100% - 32px), 400px)",
        boxShadow: ts.shadow,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: "auto"
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: ic.bg,
          color: ic.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <IconComponent size={18} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <span style={{ fontSize: "13px", fontWeight: 800, color: ts.color }}>{title}</span>
        <span style={{ fontSize: "11px", fontWeight: 500, color: ts.subColor, lineHeight: 1.4 }}>{body}</span>
      </div>

      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: "none",
          border: "none",
          color: ts.subColor,
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.7,
          transition: "opacity 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
      >
        <X size={14} />
      </button>
    </div>
  );
}
