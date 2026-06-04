"use client";
import { useState, useEffect } from "react";
import { Share, PlusSquare, X } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";

export default function InstallPWA() {
  const { theme } = useThemeStore();
  const { academicData, studentPortalData } = useAuthStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  function checkIsIOS() {
    if (typeof window === "undefined" || !window.navigator) return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
        setIsStandalone(true);
        return;
      }
      setIsIosDevice(checkIsIOS());
    }

    const hasData = !!academicData || !!studentPortalData;
    if (!hasData) return;

    const isIos = checkIsIOS();
    if (isIos) {
      const iosDismissed = localStorage.getItem("iosInstallHelpDismissed") === "true";
      if (!iosDismissed) {
        const t = setTimeout(() => setShowPopup(true), 3000);
        return () => clearTimeout(t);
      }
    } else {
      const androidDismissed = localStorage.getItem("pwaInstallDismissed") === "true";
      
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!androidDismissed) {
          setTimeout(() => setShowPopup(true), 3000);
        }
      };

      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, [academicData, studentPortalData]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPopup(false);
    }
  };

  const handleDismiss = () => {
    if (isIosDevice) {
      localStorage.setItem("iosInstallHelpDismissed", "true");
    } else {
      localStorage.setItem("pwaInstallDismissed", "true");
    }
    setShowPopup(false);
  };

  if (isStandalone || !showPopup) return null;

  const isLight = theme === "light";
  const accentColor = isLight ? "#BF5AF2" : "#FF75C3";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(100px + env(safe-area-inset-bottom))",
        left: "20px",
        right: "20px",
        zIndex: 10000,
        display: "flex",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      <div style={{
        background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(18, 14, 28, 0.95)",
        border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255, 255, 255, 0.08)"}`,
        borderRadius: "24px",
        padding: "20px",
        maxWidth: "400px",
        width: "100%",
        boxShadow: isLight ? "0 10px 30px rgba(0,0,0,0.06)" : "0 20px 40px rgba(0,0,0,0.6)",
        position: "relative",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}>
        <button 
          onClick={handleDismiss}
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={18} />
        </button>

        {isIosDevice ? (
          <div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: `linear-gradient(135deg, ${accentColor} 0%, #ffffff 300%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <span style={{ color: isLight ? "#fff" : "#000", fontWeight: 900, fontSize: "20px" }}>N</span>
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-primary)" }}>Add Nexus to Home Screen</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Open Nexus faster from your iPhone like a real app.</div>
              </div>
            </div>

            <div style={{ 
              marginTop: "20px", 
              padding: "16px", 
              background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)", 
              borderRadius: "16px", 
              fontSize: "11.5px", 
              color: "var(--text-secondary)", 
              display: "flex", 
              flexDirection: "column", 
              gap: "10px",
              lineHeight: 1.4,
              border: `1px solid var(--border)`
            }}>
              <div>1. Tap the <strong>Share</strong> button <Share size={14} style={{ display: "inline", verticalAlign: "middle" }} /> in Safari.</div>
              <div>2. Scroll and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: "inline", verticalAlign: "middle" }} />.</div>
              <div>3. Open Nexus from your home screen.</div>
            </div>

            <button 
              onClick={handleDismiss}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "14px",
                background: accentColor,
                color: isLight ? "#fff" : "#000",
                borderRadius: "14px",
                border: "none",
                fontWeight: 900,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                boxShadow: `0 8px 24px rgba(${isLight ? "191,90,242" : "255,117,195"}, 0.2)`
              }}
            >
              Got it
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: `linear-gradient(135deg, ${accentColor} 0%, #ffffff 300%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <span style={{ color: isLight ? "#fff" : "#000", fontWeight: 900, fontSize: "20px" }}>N</span>
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "var(--text-primary)" }}>Install Nexus</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Use Nexus like an app on your phone.</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button 
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Not now
              </button>
              <button 
                onClick={handleInstall}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: accentColor,
                  color: isLight ? "#fff" : "#000",
                  borderRadius: "14px",
                  border: "none",
                  fontWeight: 900,
                  fontSize: "12px",
                  cursor: "pointer",
                  boxShadow: `0 8px 24px rgba(${isLight ? "191,90,242" : "255,117,195"}, 0.2)`
                }}
              >
                Install
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
