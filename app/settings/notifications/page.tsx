"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import Toast from "@/components/Toast";
import { enableAcademicAlerts } from "@/lib/notificationHelper";

export default function NotificationsSettingsPage() {
  const { theme } = useThemeStore();
  const { academicAlertsEnabled, setAcademicAlertsEnabled } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (title: string, body: string, type: "success" | "error" | "info" = "success") => {
    setToast({ title, body, type });
  };

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;

  const isLight = theme === "light";
  const accentColor = isLight ? "#BF5AF2" : "#FF75C3";

  return (
    <div className="settings-page-container" style={{ 
      background: "var(--bg)", 
      width: "100%", 
      padding: "24px", 
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px", flexShrink: 0 }}>
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
        <h1 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>Notifications</h1>
      </div>

      {/* Main Form */}
      <main style={{ flex: 1, overflowY: "auto", marginBottom: "40px", WebkitOverflowScrolling: "touch" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ 
            background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255, 255, 255, 0.02)", 
            border: "1px solid var(--border)", 
            borderRadius: "24px", 
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>Academic alerts</span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                Get important updates for attendance, marks, and timetable changes.
              </span>
            </div>
            
            {/* Custom Toggle Switch */}
            <button 
              onClick={() => {
                if (academicAlertsEnabled) {
                  setAcademicAlertsEnabled(false);
                  localStorage.setItem("academicAlertsEnabled", "false");
                } else {
                  enableAcademicAlerts(showToast);
                }
              }}
              style={{
                width: "52px",
                height: "30px",
                borderRadius: "15px",
                background: academicAlertsEnabled ? accentColor : (isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"),
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                padding: 0,
                outline: "none"
              }}
            >
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                position: "absolute",
                top: "3px",
                left: academicAlertsEnabled ? "25px" : "3px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }} />
            </button>
          </div>

          {/* Value Suggestion Message */}
          {academicAlertsEnabled && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: isLight ? "rgba(191,90,242,0.06)" : "rgba(255,117,195,0.06)",
              border: `1px solid ${isLight ? "rgba(191,90,242,0.15)" : "rgba(255,117,195,0.15)"}`,
              borderRadius: "16px",
              padding: "12px 16px"
            }}>
              <CheckCircle2 size={16} color={accentColor} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", fontWeight: 600 }}>
                Alerts are active. You will be notified of anomalies automatically.
              </span>
            </div>
          )}

        </div>
      </main>

      {/* Done Button */}
      <div className="sticky-mobile-action" style={{ flexShrink: 0 }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            width: "100%", padding: "18px", borderRadius: "16px", border: "none",
            background: accentColor,
            color: isLight ? "#fff" : "#000",
            fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
            cursor: "pointer", transition: "all 0.3s",
            boxShadow: `0 10px 30px rgba(${isLight ? "191,90,242" : "255,117,195"}, 0.25)`
          }}
        >
          Done
        </button>
      </div>
      {toast && (
        <Toast
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
