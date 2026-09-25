"use client";
import { useState, useEffect } from "react";
import { Share, PlusSquare, X, Info } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";

export default function InstallPWA() {
  const { theme } = useThemeStore();
  const { academicData, studentPortalData } = useAuthStore();
  const [deferredPrompt, setDeferredPrompt] = useState<AnyValue>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const isLight = theme === "light";

  function isIOS() {
    if (typeof window === "undefined") return false;
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  }

  useEffect(() => {
    // 1. If already standalone/installed, do not show banner
    if (typeof window !== "undefined") {
      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as AnyValue).standalone === true) {
        setTimeout(() => setIsStandalone(true), 0);
        return;
      }
    }

    // 2. Rules: Show only after user has used Nexus / seen useful data
    const hasUsefulData = !!academicData || !!studentPortalData;
    if (!hasUsefulData) return;

    // 3. For iPhone Safari
    if (isIOS()) {
      const dismissedIos = localStorage.getItem("iosInstallHelpDismissed") === "true";
      if (!dismissedIos) {
        // Show after 3 seconds of seeing useful data
        const timer = setTimeout(() => setShowIosHelp(true), 3000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // 4. For Android / Chrome (PWA prompt)
    const dismissedAndroid = localStorage.getItem("pwaInstallDismissed") === "true";
    if (dismissedAndroid) return;

    const handler = (e: AnyValue) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 3 seconds of seeing useful data
      setShowPopup(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
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

  const dismissAndroid = () => {
    localStorage.setItem("pwaInstallDismissed", "true");
    setShowPopup(false);
  };

  const dismissIos = () => {
    localStorage.setItem("iosInstallHelpDismissed", "true");
    setShowIosHelp(false);
  };

  if (isStandalone) return null;

  const bg = isLight ? "#ffffff" : "#12121A";
  const border = isLight ? "rgba(0, 0, 0, 0.08)" : "#292532";
  const color = isLight ? "#111827" : "#F7F5FA";
  const subColor = isLight ? "#6B7280" : "#9C96A7";
  const btnAccent = "#2563EB";
  const btnText = "#FFFFFF";

  return (
    <>
      {/* 1. Android/Chrome Default PWA Install Banner */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(82px + env(safe-area-inset-bottom))",
            left: "16px",
            right: "16px",
            zIndex: 100100,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none"
          }}
        >
          <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: "14px",
            padding: "16px 18px",
            maxWidth: "380px",
            width: "100%",
            boxShadow: isLight ? "0 10px 30px rgba(0,0,0,0.08)" : "0 16px 36px rgba(0,0,0,0.6)",
            position: "relative",
            pointerEvents: "auto"
          }}>
            <button 
              onClick={dismissAndroid}
              style={{ position: "absolute", top: "14px", right: "14px", background: "none", border: "none", color: subColor, cursor: "pointer", padding: "4px" }}
              aria-label="Dismiss installation prompt"
            >
              <X size={15} />
            </button>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "10px", 
                background: "#1A1724",
                border: "1px solid #292532",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <span style={{ color: "#93C5FD", fontWeight: 800, fontSize: "16px" }}>N</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, paddingRight: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: color }}>Install Nexus</div>
                <div style={{ fontSize: "11px", color: subColor, fontWeight: 500, lineHeight: 1.3 }}>Use Nexus like an app on your device.</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <button 
                onClick={dismissAndroid}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "transparent",
                  color: subColor,
                  borderRadius: "8px",
                  border: `1px solid ${border}`,
                  fontWeight: 600,
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
                  padding: "8px 12px",
                  background: btnAccent,
                  color: btnText,
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 650,
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. iPhone/Safari Specific Installation Help Drawer */}
      {showIosHelp && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(82px + env(safe-area-inset-bottom))",
            left: "16px",
            right: "16px",
            zIndex: 100100,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none"
          }}
        >
          <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: "14px",
            padding: "16px 18px",
            maxWidth: "380px",
            width: "100%",
            boxShadow: isLight ? "0 10px 30px rgba(0,0,0,0.08)" : "0 16px 36px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            pointerEvents: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#93C5FD", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>iOS Guide</div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: color, margin: "2px 0 0" }}>Add Nexus to Home Screen</h3>
              </div>
              <button 
                onClick={dismissIos}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                  border: "none",
                  color: subColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
                aria-label="Close iOS guide"
              >
                <X size={13} />
              </button>
            </div>

            <p style={{ fontSize: "11px", color: subColor, margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
              Add to Home Screen for fast, fullscreen access.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)", border: `1px solid ${border}`, borderRadius: "10px", padding: "10px 12px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "11px", color: color, fontWeight: 550 }}>
                <span style={{ color: "#93C5FD", fontWeight: 750 }}>1.</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Tap Share <Share size={13} style={{ display: "inline-block" }} /> in Safari.
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "11px", color: color, fontWeight: 550 }}>
                <span style={{ color: "#93C5FD", fontWeight: 750 }}>2.</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Tap Add to Home Screen <PlusSquare size={13} style={{ display: "inline-block" }} />
                </span>
              </div>
            </div>

            <button 
              onClick={dismissIos}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: btnAccent,
                color: btnText,
                borderRadius: "8px",
                border: "none",
                fontWeight: 650,
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
