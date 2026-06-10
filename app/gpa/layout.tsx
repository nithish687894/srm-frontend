"use client";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import PremiumLock from "@/components/aura-theme/PremiumLock";

export default function GPALayout({ children }: { children: React.ReactNode }) {
  const isPremium = useAuthStore((state) => state.isPremium);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isPremium) {
    return (
      <PremiumLock
        title="GPA Planner Locked"
        description="Unlock the GPA & CGPA planner to calculate target grades and forecast your academic performance across semesters."
        badge="Premium Tool"
      />
    );
  }

  return <>{children}</>;
}
