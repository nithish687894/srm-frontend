"use client";
import { useThemeStore } from "@/lib/themeStore";
import { useEffect, useState } from "react";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of unstyled content
  const currentTheme = mounted ? theme : "matrix";

  return (
    <div className={`theme-${currentTheme}`} style={{ minHeight: "100vh" }}>
      {children}
    </div>
  );
}
