"use client";
import { useEffect, useState } from "react";
import { dataAPI } from "@/lib/api";
import { Megaphone, X, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BroadcastBanner() {
  const [data, setData] = useState<{ active?: boolean; message?: string; type?: string; timestamp?: number } | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    dataAPI.getBroadcast().then(res => {
      if (res && res.active && res.message) {
        const dismissKey = `dismissed_broadcast_${res.message}_${res.timestamp || ""}`;
        if (typeof window !== "undefined" && sessionStorage.getItem(dismissKey) === "true") {
          return;
        }
        setData(res);
      }
    }).catch(() => {});
  }, []);

  if (!data || !visible || !data.message) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined" && data?.message) {
      sessionStorage.setItem(`dismissed_broadcast_${data.message}_${data.timestamp || ""}`, "true");
    }
  };

  const isWarning = data.type === "warning" || data.type === "error";
  const isSuccess = data.type === "success";

  const themeConfig = isWarning
    ? {
        bg: "linear-gradient(135deg, rgba(30, 10, 14, 0.94) 0%, rgba(20, 6, 9, 0.97) 100%)",
        border: "rgba(255, 69, 58, 0.35)",
        glow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 69, 58, 0.2)",
        badgeBg: "rgba(255, 69, 58, 0.16)",
        badgeColor: "#FF453A",
        icon: AlertTriangle,
        tag: "Important Notice",
      }
    : isSuccess
    ? {
        bg: "linear-gradient(135deg, rgba(8, 26, 16, 0.94) 0%, rgba(5, 18, 11, 0.97) 100%)",
        border: "rgba(48, 209, 88, 0.35)",
        glow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(48, 209, 88, 0.2)",
        badgeBg: "rgba(48, 209, 88, 0.16)",
        badgeColor: "#30D158",
        icon: CheckCircle2,
        tag: "System Update",
      }
    : {
        bg: "linear-gradient(135deg, rgba(26, 12, 32, 0.94) 0%, rgba(16, 8, 22, 0.97) 100%)",
        border: "rgba(255, 117, 195, 0.35)",
        glow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 117, 195, 0.2)",
        badgeBg: "rgba(255, 117, 195, 0.16)",
        badgeColor: "#FF75C3",
        icon: Megaphone,
        tag: "Announcement",
      };

  const IconComponent = themeConfig.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 60px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: "580px",
        zIndex: 9998,
        background: themeConfig.bg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1.5px solid ${themeConfig.border}`,
        boxShadow: themeConfig.glow,
        borderRadius: "18px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        animation: "broadcastSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: themeConfig.badgeBg,
            color: themeConfig.badgeColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconComponent size={16} strokeWidth={2.2} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: themeConfig.badgeColor,
              lineHeight: 1.1,
            }}
          >
            {themeConfig.tag}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.01em",
              lineHeight: 1.35,
              marginTop: "2px",
              overflowWrap: "anywhere",
            }}
          >
            {data.message}
          </span>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "rgba(255, 255, 255, 0.7)",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
        }}
      >
        <X size={14} strokeWidth={2.4} />
      </button>

      <style jsx>{`
        @keyframes broadcastSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
