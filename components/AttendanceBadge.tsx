"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export default function AttendanceBadge() {
  const { academicData } = useAuthStore();

  useEffect(() => {
    if (!academicData || !("setAppBadge" in navigator)) return;

    const att = academicData.attendance || [];
    const riskCount = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;

    if (riskCount > 0) {
      (navigator as any).setAppBadge(riskCount).catch((e: any) => console.error("Badge error", e));
    } else {
      (navigator as any).clearAppBadge().catch((e: any) => console.error("Badge clear error", e));
    }
  }, [academicData]);

  return null;
}
