"use client";
import { useEffect, useMemo, useState } from "react";
import { APP_VERSION } from "@/lib/version";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [step, setStep] = useState(0);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [minVersion, setMinVersion] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("srmx_splashed") === "true") {
      document.body.classList.remove("splash-active");
      const skipTimer = window.setTimeout(() => {
        setMounted(true);
        setIsExiting(true);
        setIsDestroyed(true);
      }, 0);
      return () => window.clearTimeout(skipTimer);
    }
    document.body.classList.add("splash-active");
    return () => {
      document.body.classList.remove("splash-active");
    };
  }, []);

  useEffect(() => {
    if (isExiting && typeof window !== "undefined") {
      document.body.classList.remove("splash-active");
    }
  }, [isExiting]);

  const steps = useMemo(
    () => [
      "Opening workspace",
      "Checking secure session",
      "Preparing academic data",
      "Syncing interface",
      "Ready",
    ],
    []
  );

  useEffect(() => {
    const mountedTimer = window.setTimeout(() => setMounted(true), 0);
    const recoveryTimer = window.setTimeout(() => {
      setIsExiting(true);
      window.setTimeout(() => setIsDestroyed(true), 520);
    }, 5000);

    const runSplash = async () => {
      let requiresUpdate = false;
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          setLatestVersion(data.version || "");
          setMinVersion(data.minVersion || "");
          if (data.minVersion && APP_VERSION < data.minVersion) {
            setNeedsUpdate(true);
            requiresUpdate = true;
          }
        }
      } catch {
        // Local development can run without the config endpoint.
      }

      if (requiresUpdate) {
        window.clearTimeout(recoveryTimer);
        return;
      }

      const duration = 1150;
      const interval = window.setInterval(() => {
        setStep((current) => Math.min(current + 1, steps.length - 1));
      }, duration / steps.length);

      const timer = window.setTimeout(() => {
        setIsExiting(true);
        sessionStorage.setItem("srmx_splashed", "true");
        window.setTimeout(() => setIsDestroyed(true), 520);
      }, duration + 160);

      return () => {
        window.clearInterval(interval);
        window.clearTimeout(timer);
      };
    };

    runSplash();

    return () => {
      window.clearTimeout(mountedTimer);
      window.clearTimeout(recoveryTimer);
    };
  }, [steps.length]);

  if (!mounted) return null;

  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <>
      <style>{`
        @keyframes nexusGlow {
          0%, 100% { opacity: 0.72; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes nexusSweep {
          0% { transform: translateX(-110%); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: translateX(260%); opacity: 0; }
        }
        @keyframes nexusFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .nexus-splash {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: grid;
          place-items: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 28%, rgba(255, 117, 195, 0.16), transparent 34%),
            radial-gradient(circle at 46% 62%, rgba(0, 229, 255, 0.1), transparent 36%),
            linear-gradient(180deg, #050509 0%, #000000 100%);
          transition: opacity 520ms cubic-bezier(0.16, 1, 0.3, 1), transform 520ms cubic-bezier(0.16, 1, 0.3, 1), filter 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nexus-splash::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black 0%, transparent 78%);
          -webkit-mask-image: radial-gradient(circle at center, black 0%, transparent 78%);
          opacity: 0.65;
        }
        .nexus-splash.exiting {
          opacity: 0;
          transform: scale(1.035);
          filter: blur(18px);
          pointer-events: none;
        }
        .nexus-loader-card {
          position: relative;
          z-index: 1;
          width: min(86vw, 360px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #fff;
        }
        .nexus-logo-shell {
          width: 96px;
          height: 96px;
          display: grid;
          place-items: center;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.6),
            0 0 44px rgba(191, 90, 242, 0.16),
            inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(26px);
          -webkit-backdrop-filter: blur(26px);
          animation: nexusFloat 4.5s ease-in-out infinite;
        }
        .nexus-logo-shell::before {
          content: "";
          position: absolute;
          width: 132px;
          height: 132px;
          border-radius: 999px;
          border: 1px solid rgba(0, 229, 255, 0.16);
          box-shadow: 0 0 50px rgba(0, 229, 255, 0.1);
          animation: nexusGlow 3.6s ease-in-out infinite;
        }
        .nexus-logo-shell img {
          width: 62px;
          height: 62px;
          border-radius: 18px;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 0 18px rgba(0, 229, 255, 0.28));
        }
        .nexus-title {
          margin-top: 34px;
          font-size: clamp(28px, 8vw, 42px);
          font-weight: 950;
          letter-spacing: 0;
          line-height: 0.95;
        }
        .nexus-subtitle {
          margin-top: 12px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
        }
        .nexus-progress {
          width: min(78vw, 300px);
          margin-top: 34px;
        }
        .nexus-progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 10px;
          font-weight: 850;
          color: rgba(255,255,255,0.5);
        }
        .nexus-progress-track {
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
        }
        .nexus-progress-fill {
          position: relative;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #ff75c3, #bf5af2, #00e5ff);
          box-shadow: 0 0 18px rgba(0,229,255,0.38);
          transition: width 360ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nexus-progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 42%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: nexusSweep 1.7s ease-in-out infinite;
        }
        .nexus-status {
          margin-top: 18px;
          min-height: 18px;
          font-size: 12px;
          font-weight: 750;
          color: rgba(255,255,255,0.68);
        }
        .nexus-version {
          position: absolute;
          bottom: max(22px, env(safe-area-inset-bottom));
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.24);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .nexus-app {
          width: 100%;
          min-height: 100vh;
          transition: opacity 520ms cubic-bezier(0.16, 1, 0.3, 1), transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nexus-app.loading {
          opacity: 0;
          transform: scale(0.985);
          pointer-events: none;
        }
        .nexus-app.ready {
          opacity: 1;
          transform: scale(1);
        }
        body.splash-active .srmx-top-status-bar,
        body.splash-active .srmx-mobile-nav,
        body.splash-active .desktop-sidebar {
          display: none !important;
        }
        .nexus-update-card {
          position: relative;
          z-index: 2;
          width: min(88vw, 380px);
          padding: 28px;
          border-radius: 24px;
          background: rgba(10, 10, 15, 0.88);
          border: 1px solid rgba(255, 45, 85, 0.3);
          box-shadow: 0 22px 70px rgba(255, 45, 85, 0.16);
          color: #fff;
          text-align: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .nexus-logo-shell,
          .nexus-logo-shell::before,
          .nexus-progress-fill::after {
            animation: none !important;
          }
        }
      `}</style>

      {!isDestroyed && (
        <div className={`nexus-splash ${isExiting ? "exiting" : ""}`}>
          {!needsUpdate ? (
            <div className="nexus-loader-card">
              <div className="nexus-logo-shell">
                <img src="/nexus-logo.png" alt="SRM Nexus" />
              </div>
              <div className="nexus-title">SRM Nexus</div>
              <div className="nexus-subtitle">Academic Intelligence</div>
              <div className="nexus-progress">
                <div className="nexus-progress-meta">
                  <span>{steps[step]}</span>
                  <span>{progress}%</span>
                </div>
                <div className="nexus-progress-track">
                  <div className="nexus-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="nexus-status">Preparing your academic workspace</div>
            </div>
          ) : (
            <div className="nexus-update-card">
              <h2 style={{ fontSize: "20px", fontWeight: 950, marginBottom: "12px" }}>Update Required</h2>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.66)", marginBottom: "22px" }}>
                Your client version v{APP_VERSION} must update to v{minVersion || latestVersion}.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: "100%",
                  border: 0,
                  borderRadius: "16px",
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, #ff75c3, #bf5af2)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Reload
              </button>
            </div>
          )}
          <div className="nexus-version">Version {APP_VERSION}</div>
        </div>
      )}

      <div className={`nexus-app ${!isExiting ? "loading" : "ready"}`}>{children}</div>
    </>
  );
}
