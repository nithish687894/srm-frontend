"use client";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import PremiumLock from "@/components/aura-theme/PremiumLock";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const isPremium = useAuthStore((state) => state.isPremium);


  if (!isPremium) {
    return (
      <PremiumLock
        title="Tools Hub Locked"
        description="Unlock advanced analytical tools including the Bunk Budget Attendance Planner, Regulation Grade Predictor, and Target CGPA Seekers."
        badge="Premium Hub"
      />
    );
  }

  return <>{children}</>;
}
