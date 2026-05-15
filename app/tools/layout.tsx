import React from "react";

export const metadata = {
  title: "SRM Nexus Tools — Attendance & CGPA Calculators for SRM Academia",
  description: "Calculate your attendance, CGPA, and internal marks with precision using SRM Nexus Tools. The ultimate Nexus Academia companion for SRM University students.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  // Render children directly without the public navbar or footer
  // This allows the inner tools to fully control their own authenticated, locked-viewport layouts.
  return <>{children}</>;
}
