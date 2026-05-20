"use client";
import { useEffect, useState } from "react";

export function usePerfGuard() {
  const [isLowPerf, setIsLowPerf] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check manual local storage override first (user preferred performance mode)
    const manualOverride = localStorage.getItem("srmx_perf_mode");
    if (manualOverride === "low") {
      setIsLowPerf(true);
      document.documentElement.classList.add("theme-perf-low");
      return;
    } else if (manualOverride === "high") {
      setIsLowPerf(false);
      document.documentElement.classList.remove("theme-perf-low");
      return;
    }

    // 2. Automated Heuristics for Budget Hardware (Redmi, Realme, low-tier Androids)
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    
    // Low core count (budget phone CPU)
    const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    
    // Low device RAM (budget memory <= 4GB)
    // @ts-ignore
    const lowRAM = navigator.deviceMemory && navigator.deviceMemory <= 4;
    
    // Budget Android signature check
    const isBudgetAndroid = ua.includes("android") && (lowCPU || lowRAM);

    if (isMobile && (isBudgetAndroid || lowCPU || lowRAM)) {
      setIsLowPerf(true);
      document.documentElement.classList.add("theme-perf-low");
      // Persist the auto-detected state for consistent loading fallback
      localStorage.setItem("srmx_perf_mode_auto", "low");
    } else {
      setIsLowPerf(false);
      document.documentElement.classList.remove("theme-perf-low");
      localStorage.setItem("srmx_perf_mode_auto", "high");
    }
  }, []);

  return isLowPerf;
}
