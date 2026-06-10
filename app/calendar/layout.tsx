"use client";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import PremiumLock from "@/components/aura-theme/PremiumLock";

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
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
        title="Calendar Locked"
        description="Unlock the interactive university calendar to track exams, holidays, university events, and day orders."
        badge="Premium Calendar"
      />
    );
  }

  return <>{children}</>;
}
