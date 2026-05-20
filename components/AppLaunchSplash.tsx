"use client";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/version";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [minVersion, setMinVersion] = useState("");

  const statusLogs = [
    "BOOTING_NEURAL_CORE",
    "ESTABLISHING_VPN_TUNNEL",
    "DECRYPTING_ACADEMIC_KEYS",
    "SYNCING_REGISTRY_V2",
    "OPTIMIZING_QUANTUM_UI",
    "READY_FOR_LAUNCH"
  ];

  useEffect(() => {
    setMounted(true);
    
    // Safety recovery timer: ensures splash screen disappears after 6 seconds even if something fails
    const recoveryTimer = setTimeout(() => {
      setIsExiting(true);
      const destroyTimer = setTimeout(() => {
        setIsDestroyed(true);
      }, 600);
      return () => clearTimeout(destroyTimer);
    }, 6000);

    const checkVersionAndRun = async () => {
      let requiresUpdate = false;
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          setLatestVersion(data.version || "");
          setMinVersion(data.minVersion || "");
          if (data.minVersion && APP_VERSION < data.minVersion) {
            setNeedsUpdate(true);
            requiresUpdate = true;
          }
        }
      } catch (e) {
        console.warn("Version check skipped:", e);
      }

      if (requiresUpdate) {
        // Do not auto-dismiss if version is too old
        clearTimeout(recoveryTimer);
        return;
      }

      const hasSplashed = typeof window !== 'undefined' ? sessionStorage.getItem("srmx_splashed") : null;
      const duration = hasSplashed ? 400 : 1600;

      // Smooth step logs interval
      const logInterval = setInterval(() => {
        setLogIndex(prev => (prev < statusLogs.length - 1 ? prev + 1 : prev));
      }, duration / statusLogs.length);

      // Dismiss splash
      const timer = setTimeout(() => {
        setIsExiting(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem("srmx_splashed", "true");
        }
        
        const destroyTimer = setTimeout(() => {
          setIsDestroyed(true);
        }, 600); // Matches CSS transition duration
      }, duration);

      return () => {
        clearInterval(logInterval);
        clearTimeout(timer);
      };
    };

    checkVersionAndRun();

    return () => {
      clearTimeout(recoveryTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Dynamic Keyframes injected into the page */}
      <style>{`
        @keyframes srmx-spin-glow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes srmx-breath-glow {
          0% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 0.65; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.9); }
        }
        @keyframes srmx-logo-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes srmx-rotate-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes srmx-rotate-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes srmx-terminal-pulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes srmx-shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes srmx-pulse-shadow {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(143, 146, 255, 0.3)); }
          50% { filter: drop-shadow(0 0 45px rgba(255, 117, 195, 0.5)); }
        }
        @keyframes srmx-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes srmx-fade-in {
          from { opacity: 0; transform: scale(0.95); filter: blur(5px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .srmx-splash-container {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #000000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity 600ms cubic-bezier(0.25, 1, 0.5, 1), transform 600ms cubic-bezier(0.25, 1, 0.5, 1), filter 600ms cubic-bezier(0.25, 1, 0.5, 1);
          will-change: opacity, transform, filter;
        }
        .srmx-splash-container.exiting {
          opacity: 0;
          transform: scale(1.08);
          filter: blur(16px);
          pointer-events: none;
        }
        .srmx-app-wrapper {
          transition: opacity 600ms cubic-bezier(0.25, 1, 0.5, 1), transform 600ms cubic-bezier(0.25, 1, 0.5, 1);
          will-change: opacity, transform;
          width: 100%;
          height: 100%;
        }
        .srmx-app-wrapper.loading {
          opacity: 0;
          transform: scale(0.97);
          pointer-events: none;
        }
        .srmx-app-wrapper.ready {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>

      {!isDestroyed && (
        <div className={`srmx-splash-container ${isExiting ? "exiting" : ""}`}>
          {/* Dynamic Neural Field Glow */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <div 
              style={{
                position: "absolute", top: "50%", left: "50%",
                width: "140vw", height: "140vw", borderRadius: "50%",
                background: "conic-gradient(from 0deg, #FF75C3, #8F92FF, #94FFD8, #FF75C3)",
                filter: "blur(140px)",
                animation: "srmx-spin-glow 20s linear infinite, srmx-breath-glow 10s ease-in-out infinite",
                willChange: "transform, opacity",
              }}
            />
            {/* Tech grid overlay */}
            <div 
              style={{
                position: "absolute", inset: 0,
                backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                backgroundPosition: "center",
                maskImage: "radial-gradient(circle at center, black 30%, transparent 85%)",
                WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 85%)",
                opacity: 0.6,
              }}
            />
            {/* Dark vignette */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 10%, #000000 85%)" }} />
          </div>

          {!needsUpdate ? (
            <div
              style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              {/* Logo Area with floating and rotating rings */}
              <div 
                className="srmx-logo-wrapper"
                style={{ 
                  position: 'relative', 
                  marginBottom: '40px',
                  animation: "srmx-logo-float 4s ease-in-out infinite",
                  willChange: "transform"
                }}
              >
                {/* Outer Dashed Tech Ring */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    inset: -16, 
                    borderRadius: '50%', 
                    border: '1px dashed rgba(143, 146, 255, 0.35)',
                    animation: "srmx-rotate-cw 16s linear infinite" 
                  }}
                />
                {/* Inner Glowing Gradient Ring */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    inset: -8, 
                    borderRadius: '50%', 
                    border: '1.5px solid rgba(255, 117, 195, 0.15)',
                    borderTopColor: 'rgba(255, 117, 195, 0.7)',
                    borderBottomColor: 'rgba(143, 146, 255, 0.7)',
                    animation: "srmx-rotate-ccw 8s linear infinite" 
                  }}
                />
                {/* Main Logo Image */}
                <img 
                  src="/nexus-logo.png" 
                  alt="SRM NEXUS" 
                  style={{ 
                    width: "96px", 
                    height: "96px", 
                    borderRadius: "50%",
                    display: "block",
                    animation: "srmx-pulse-shadow 4s ease-in-out infinite",
                  }} 
                />
              </div>

              {/* Branding and Loading Status */}
              <div style={{ textAlign: "center" }}>
                <div 
                  style={{ 
                    fontSize: "24px", 
                    fontWeight: 900, 
                    color: "#fff", 
                    marginBottom: "24px", 
                    textTransform: 'uppercase',
                    letterSpacing: "0.12em",
                    textShadow: "0 0 30px rgba(255, 255, 255, 0.25)"
                  }}
                >
                  SRM NEXUS
                </div>
                
                {/* Smooth Glowing Progress Bar */}
                <div 
                  style={{ 
                    width: '180px', 
                    height: '3px', 
                    background: 'rgba(255,255,255,0.06)', 
                    borderRadius: '10px', 
                    margin: '0 auto 16px', 
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                  }}
                >
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #FF75C3, #8F92FF, #94FFD8, #FF75C3)', 
                      backgroundSize: '300% 100%',
                      width: `${((logIndex + 1) / statusLogs.length) * 100}%`,
                      transition: "width 400ms cubic-bezier(0.25, 0.8, 0.25, 1)",
                      position: "relative",
                      borderRadius: '10px',
                      boxShadow: '0 0 8px rgba(143, 146, 255, 0.8)',
                      animation: "srmx-gradient-shift 4s ease infinite"
                    }}
                  >
                    {/* Shimmer light effect */}
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        animation: 'srmx-shimmer 2s infinite',
                        transform: 'translateX(-100%)'
                      }}
                    />
                  </div>
                </div>

                {/* Micro Sci-fi terminal logs */}
                <div style={{ height: "20px" }}>
                  <p 
                    key={logIndex}
                    style={{ 
                      fontSize: "9px", 
                      fontFamily: "monospace", 
                      color: "rgba(255,255,255,0.45)", 
                      textTransform: "uppercase", 
                      letterSpacing: "0.22em", 
                      fontWeight: 900,
                      animation: "srmx-terminal-pulse 1s infinite alternate"
                    }}
                  >
                    {statusLogs[logIndex]}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Premium, detailed Force Update Prompt if needsUpdate is true */
            <div style={{
              position: "relative",
              zIndex: 100,
              width: "90%",
              maxWidth: "400px",
              background: "rgba(12, 12, 12, 0.75)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 90, 95, 0.25)",
              borderRadius: "28px",
              padding: "36px 32px",
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(255, 60, 60, 0.12)",
              animation: "srmx-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(255, 90, 95, 0.08)",
                border: "1px solid rgba(255, 90, 95, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#fff", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Update Required
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: "1.6", marginBottom: "28px", fontFamily: "system-ui, sans-serif" }}>
                Your client version (<strong style={{ color: "#fff" }}>v{APP_VERSION}</strong>) is outdated. 
                Please update to at least <strong style={{ color: "#fff" }}>v{minVersion}</strong> (latest is <strong style={{ color: "#fff" }}>v{latestVersion}</strong>) to sync with the new SRM dual connectors.
              </p>
              <button 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.reload(); // Force bypass cache reload
                  }
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #FF5A5F, #FF75C3)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "800",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(255, 90, 95, 0.3)",
                  transition: "transform 200ms ease"
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Reload & Apply Update
              </button>
            </div>
          )}

          {/* Bottom Holographic Version Readout */}
          <div className="version-stamp">
            SYSTEM_VER_{APP_VERSION}_STABLE
          </div>
        </div>
      )}

      {/* Premium Content Reveal Transition Wrapper */}
      <div 
        className={`srmx-app-wrapper ${!isExiting ? "loading" : "ready"}`}
      >
        {children}
      </div>
    </>
  );
}

