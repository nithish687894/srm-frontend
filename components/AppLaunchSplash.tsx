"use client";

/**
 * The application shell must never be held behind a simulated launch screen.
 * Each route renders immediately from available state and refreshes in place.
 */
export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
