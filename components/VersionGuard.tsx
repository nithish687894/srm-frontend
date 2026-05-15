"use client";
import { useEffect } from "react";
import axios from "axios";

/**
 * VersionGuard
 * 
 * Compares the local frontend version with the backend version.
 * If a mismatch is detected, it forces a page reload to bust the cache.
 */
const CURRENT_VERSION = "2.6.0"; 

export default function VersionGuard() {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // We use a raw axios call to avoid interceptors and long timeouts
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
        const latestVersion = res.data.version;

        if (latestVersion && latestVersion !== CURRENT_VERSION) {
          console.log(`[VersionGuard] New update available: ${latestVersion}. Force refreshing...`);
          
          // Small delay to let other processes finish if needed
          setTimeout(() => {
            if (typeof window !== "undefined") {
              // Standard reload usually works for Next.js hashed assets
              window.location.reload();
            }
          }, 1000);
        }
      } catch (err) {
        // Ignore health check failures to avoid infinite reload loops
      }
    };

    // Run on mount
    checkVersion();

    // Check periodically in the background (every 10 minutes)
    const interval = setInterval(checkVersion, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
