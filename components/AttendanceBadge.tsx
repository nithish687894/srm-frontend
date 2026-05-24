"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export default function AttendanceBadge() {
  const { academicData } = useAuthStore();

  useEffect(() => {
    if (!academicData || !("setAppBadge" in navigator)) return;

    const att = academicData.attendance || [];
    const riskCount = att.filter((c: AnyValue) => parseFloat(c["Attn %"]) < 75).length;

    if (riskCount > 0) {
      (navigator as AnyValue).setAppBadge(riskCount).catch((e: AnyValue) => console.error("Badge error", e));
    } else {
      (navigator as AnyValue).clearAppBadge().catch((e: AnyValue) => console.error("Badge clear error", e));
    }
  }, [academicData]);

  return null;
}
