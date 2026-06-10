"use client";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import PremiumLock from "@/components/aura-theme/PremiumLock";

export default function AILayout({ children }: { children: React.ReactNode }) {
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
        title="AI Tutor Locked"
        description="Unlock instant academic help, research insights, and interactive course analysis with the AI Tutor."
        badge="Premium Assistant"
      />
    );
  }

  return <>{children}</>;
}
