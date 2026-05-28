"use client";
import { useEffect, useState } from "react";
import { dataAPI } from "@/lib/api";
import { Megaphone, X } from "lucide-react";

export default function BroadcastBanner() {
  const [data, setData] = useState<AnyValue>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    dataAPI.getBroadcast().then(res => {
      if (res && res.active && res.message) {
        setData(res);
      }
    }).catch(() => {});
  }, []);

  if (!data || !visible) return null;

  const bg = data.type === "warning" ? "#ef4444" : data.type === "success" ? "#10b981" : "var(--accent)";

  return (
    <div 
      style={{
        background: bg,
        color: "#000",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        position: "relative",
        zIndex: 9999,
        fontWeight: 800,
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        textAlign: "center",
        animation: "bannerIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}
    >
      <Megaphone size={16} />
      <span>{data.message}</span>
      <button 
        onClick={() => setVisible(false)}
        style={{
          background: "rgba(0,0,0,0.1)",
          border: "none",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "absolute",
          right: "10px",
          color: "#000"
        }}
      >
        <X size={14} />
      </button>

      <style jsx>{`
        @keyframes bannerIn {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
