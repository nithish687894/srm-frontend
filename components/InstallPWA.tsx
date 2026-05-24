"use client";
import { useState, useEffect } from "react";
import { Share, PlusSquare, X } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<AnyValue>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  function isIOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as AnyValue).standalone === true) {
      setTimeout(() => setIsStandalone(true), 0);
      return;
    }

    if (localStorage.getItem("srmx_pwa_dismissed") === "true") {
      return;
    }

    // For Android/Chrome
    const handler = (e: AnyValue) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPopup(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // For iOS where beforeinstallprompt doesn't fire
    if (isIOS()) {
      setTimeout(() => setShowPopup(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPopup(false);
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {showPopup && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            left: "20px",
            right: "20px",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div style={{
            background: "#1c1c1c",
            border: "1px solid #333",
            borderRadius: "24px",
            padding: "20px",
            maxWidth: "400px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            position: "relative"
          }}>
            <button 
              onClick={() => {
                localStorage.setItem("srmx_pwa_dismissed", "true");
                setShowPopup(false);
              }}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "#666", cursor: "pointer" }}
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: "linear-gradient(135deg, #a8c200, #00ff00)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <span style={{ color: "#000", fontWeight: 900, fontSize: "20px" }}>N</span>
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>Install SRM NEXUS</div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Access your attendance instantly from your home screen.</div>
              </div>
            </div>

            {isIOS() ? (
              <div style={{ marginTop: "20px", padding: "12px", background: "#000", borderRadius: "14px", fontSize: "12px", color: "#ccc", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Tap <Share size={16} style={{ display: "inline", verticalAlign: "middle" }} /> then <b>Add to Home Screen</b> <PlusSquare size={16} style={{ display: "inline", verticalAlign: "middle" }} /></span>
              </div>
            ) : (
              <button 
                onClick={handleInstall}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "14px",
                  background: "#fff",
                  color: "#000",
                  borderRadius: "14px",
                  border: "none",
                  fontWeight: 900,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer"
                }}
              >
                Add to Home Screen
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
