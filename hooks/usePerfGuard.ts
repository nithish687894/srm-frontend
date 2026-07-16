"use client";
import { useEffect } from "react";

export function usePerfGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyMode = (isLowPerf: boolean) => {
      document.documentElement.classList.toggle("theme-perf-low", isLowPerf);
      const nextMode = isLowPerf ? "low" : "high";
      if (localStorage.getItem("srmx_perf_mode_auto") !== nextMode) {
        localStorage.setItem("srmx_perf_mode_auto", nextMode);
      }
      window.dispatchEvent(new CustomEvent("srmx-perf-mode", { detail: nextMode }));
    };

    // 1. Check manual local storage override first (user preferred performance mode)
    const manualOverride = localStorage.getItem("srmx_perf_mode");
    if (manualOverride === "low") {
      applyMode(true);
      return;
    } else if (manualOverride === "high") {
      applyMode(false);
      return;
    }

    // 2. Automated Heuristics for Budget Hardware (Redmi, Realme, low-tier Androids)
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    
    // Low core count (budget phone CPU)
    const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    
    // Low device RAM (budget memory <= 4GB)
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowRAM = deviceMemory !== undefined && deviceMemory <= 4;
    
    // Budget Android signature check
    const isBudgetAndroid = ua.includes("android") && (lowCPU || lowRAM);

    if (isMobile && (isBudgetAndroid || lowCPU || lowRAM)) {
      applyMode(true);
    } else {
      applyMode(false);
    }
  }, []);
}
