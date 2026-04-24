"use client";

import { useEffect, useState } from "react";

const SPLASH_TOTAL_MS = 1550;
const SPLASH_EXIT_MS = 420;

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"show" | "exit" | "done">("show");

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }

    const exitTimer = window.setTimeout(() => setPhase("exit"), SPLASH_TOTAL_MS - SPLASH_EXIT_MS);
    const doneTimer = window.setTimeout(() => setPhase("done"), SPLASH_TOTAL_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const isDone = phase === "done";

  return (
    <>
      <div className={`app-shell ${isDone ? "app-shell-ready" : "app-shell-loading"}`}>{children}</div>
      {!isDone && (
        <div
          className={`launch-splash ${phase === "exit" ? "launch-splash-exit" : ""}`}
          role="status"
          aria-label="Opening SRMX"
        >
          <div className="launch-splash-brand">
            <span className="launch-splash-mark" aria-hidden="true">
              <span className="launch-splash-mark-inner">S</span>
            </span>
            <span className="launch-splash-logo">SRMX</span>
            <span className="launch-splash-subtitle">student portal</span>
            <span className="launch-splash-glow" />
          </div>
        </div>
      )}
    </>
  );
}
