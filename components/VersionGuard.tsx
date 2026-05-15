"use client";
import { useEffect } from "react";
import axios from "axios";

/**
 * VersionGuard
 * 
 * Compares the local frontend version with the backend version.
 * If a mismatch is detected, it forces a ONE-TIME page reload.
 * Uses sessionStorage to prevent infinite reload loops.
 */
const CURRENT_VERSION = "2.6.0";

export default function VersionGuard() {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
        const latestVersion = res.data?.version;

        if (!latestVersion || latestVersion === CURRENT_VERSION) return;

        // Check if we already tried reloading for this version
        const reloadKey = `vg_reloaded_${latestVersion}`;
        if (typeof window !== "undefined" && !sessionStorage.getItem(reloadKey)) {
          console.log(`[VersionGuard] Update detected: ${CURRENT_VERSION} → ${latestVersion}. Reloading once.`);
          sessionStorage.setItem(reloadKey, "1");
          window.location.reload();
        }
      } catch {
        // Silently ignore — backend may be down or CORS blocked
      }
    };

    // Delay initial check to avoid blocking first paint
    const timer = setTimeout(checkVersion, 5000);

    // Re-check every 15 minutes in background
    const interval = setInterval(checkVersion, 15 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return null;
}
