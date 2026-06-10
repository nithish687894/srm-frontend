"use client";

import { useEffect } from "react";

const CACHE_VERSION = "srm-nexus-cache-v5";

export default function CacheUpgrade() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = window.localStorage.getItem("srmx_cache_version");
    if (current === CACHE_VERSION) return;

    window.sessionStorage.removeItem("srmx_splashed");

    if ("caches" in window) {
      caches.keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("srm-nexus-") && key !== "srm-nexus-v5")
              .map((key) => caches.delete(key))
          )
        )
        .catch(() => undefined);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration()
        .then((registration) => registration?.update())
        .catch(() => undefined);
    }

    window.localStorage.setItem("srmx_cache_version", CACHE_VERSION);
  }, []);

  return null;
}
