"use client";
import { useEffect } from "react";
export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(r => console.log("[SRMX] SW registered", r.scope))
        .catch(e => console.log("[SRMX] SW failed", e));
    }
  }, []);
  return null;
}
