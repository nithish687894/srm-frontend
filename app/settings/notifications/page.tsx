"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import Toast from "@/components/Toast";
import { enableAcademicAlerts } from "@/lib/notificationHelper";
import PremiumCheckout from "@/components/PremiumCheckout";

export default function NotificationsSettingsPage() {
  const { theme } = useThemeStore();
  const { academicAlertsEnabled, setAcademicAlertsEnabled, isPremium, premiumExpiresAt } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
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
          
          {/* Premium Membership Banner */}
          {isPremium ? (
            <div style={{
              background: "linear-gradient(135deg, rgba(123, 44, 191, 0.15) 0%, rgba(191, 90, 242, 0.1) 100%)",
              border: `1.5px solid ${isLight ? "rgba(123, 44, 191, 0.25)" : "rgba(191, 90, 242, 0.3)"}`,
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  fontSize: "9px",
                  fontWeight: 900,
                  color: isLight ? "#7B2CBF" : "#BF5AF2",
                  background: isLight ? "rgba(123,44,191,0.08)" : "rgba(191,90,242,0.15)",
                  padding: "4px 8px",
                  borderRadius: "99px",
                  textTransform: "uppercase"
                }}>
                  Active Pass
                </span>
                <span style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-primary)" }}>Nexus Premium Active</span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Thanks for supporting SRM Nexus! You have unlocked GPA target tools, Predictive Class Skipper, and custom push alerts.
              </p>
              {premiumExpiresAt && (
                <span style={{ fontSize: "10px", color: isLight ? "#7B2CBF" : "#BF5AF2", fontWeight: 700 }}>
                  Expires on: {new Date(premiumExpiresAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </span>
              )}
            </div>
          ) : (
            <div style={{
              background: "linear-gradient(135deg, rgba(123, 44, 191, 0.06) 0%, rgba(191, 90, 242, 0.03) 100%)",
              border: `1.5px dashed ${isLight ? "rgba(123, 44, 191, 0.3)" : "rgba(191, 90, 242, 0.4)"}`,
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>Unlock Nexus Premium</span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Get predictive skipping, target GPA estimation, and fast push notifications starting at only ₹10.
                </span>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                style={{
                  background: isLight ? "#7B2CBF" : "#BF5AF2",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 18px",
                  fontSize: "12.5px",
                  fontWeight: 750,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  transition: "all 0.2s ease",
                  boxShadow: `0 4px 12px ${isLight ? "rgba(123, 44, 191, 0.15)" : "rgba(191, 90, 242, 0.15)"}`
                }}
              >
                Get Premium Pass
              </button>
            </div>
          )}

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
      {showCheckout && (
        <PremiumCheckout
          onClose={() => setShowCheckout(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
