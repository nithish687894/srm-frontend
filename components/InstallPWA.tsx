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

  const bg = isLight ? "#ffffff" : "#0f0f13";
  const border = isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";
  const color = isLight ? "#111" : "#fff";
  const subColor = isLight ? "#666" : "rgba(255, 255, 255, 0.6)";
  const btnAccent = isLight ? "#BF5AF2" : "#FF75C3";
  const btnText = isLight ? "#fff" : "#000";

  return (
    <>
      {/* 1. Android/Chrome Default PWA Install Banner */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(96px + env(safe-area-inset-bottom))",
            left: "20px",
            right: "20px",
            zIndex: 99999,
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div style={{
            background: bg,
            border: `1.5px solid ${border}`,
            borderRadius: "24px",
            padding: "20px",
            maxWidth: "400px",
            width: "100%",
            boxShadow: isLight ? "0 10px 30px rgba(0,0,0,0.08)" : "0 20px 40px rgba(0,0,0,0.65)",
            position: "relative",
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            <button 
              onClick={dismissAndroid}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: subColor, cursor: "pointer" }}
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
              <div style={{ 
                width: "44px", 
                height: "44px", 
                borderRadius: "12px", 
                background: `linear-gradient(135deg, ${btnAccent} 0%, #ffffff 200%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <span style={{ color: isLight ? "#fff" : "#000", fontWeight: 900, fontSize: "18px" }}>N</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: color }}>Install Nexus</div>
                <div style={{ fontSize: "11px", color: subColor, fontWeight: 500, lineHeight: 1.4 }}>Use Nexus like an app on your phone.</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button 
                onClick={dismissAndroid}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  color: subColor,
                  borderRadius: "12px",
                  border: `1px solid ${border}`,
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                Not now
              </button>
              <button 
                onClick={handleInstall}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: btnAccent,
                  color: btnText,
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "11px",
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
            bottom: "0",
            left: "0",
            right: "0",
            zIndex: 99999,
            display: "flex",
            justifyContent: "center",
            padding: "20px 20px calc(24px + env(safe-area-inset-bottom))",
            background: bg,
            borderTop: `1.5px solid ${border}`,
            boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            animation: "slideUp 0.3s ease-out"
          }}
        >
          <div style={{ maxWidth: "420px", width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "9px", color: btnAccent, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>Apple iOS Guide</div>
                <h3 style={{ fontSize: "15px", fontWeight: 900, color: color, margin: "2px 0 0" }}>Add Nexus to Home Screen</h3>
              </div>
              <button 
                onClick={dismissIos}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)",
                  border: "none",
                  color: subColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <X size={12} />
              </button>
            </div>

            <p style={{ fontSize: "11.5px", color: subColor, margin: 0, lineHeight: 1.4, fontWeight: 550 }}>
              Open Nexus faster from your iPhone like a real app.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.01)", border: `1px solid ${border}`, borderRadius: "16px", padding: "14px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "11.5px", color: color, fontWeight: 600 }}>
                <span style={{ color: btnAccent, fontWeight: 900 }}>1.</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                  Tap the Share button <Share size={14} style={{ display: "inline-block", verticalAlign: "middle" }} /> in Safari.
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "11.5px", color: color, fontWeight: 600 }}>
                <span style={{ color: btnAccent, fontWeight: 900 }}>2.</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                  Tap Add to Home Screen <PlusSquare size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "11.5px", color: color, fontWeight: 600 }}>
                <span style={{ color: btnAccent, fontWeight: 900 }}>3.</span>
                <span>Open Nexus from your home screen.</span>
              </div>
            </div>

            <button 
              onClick={dismissIos}
              style={{
                width: "100%",
                padding: "12px",
                background: btnAccent,
                color: btnText,
                borderRadius: "14px",
                border: "none",
                fontWeight: 800,
                fontSize: "11.5px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
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
