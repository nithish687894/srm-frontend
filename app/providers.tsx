"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { scheduleIdleTask } from "@/lib/scheduleIdle";

const BroadcastBanner = dynamic(() => import("@/components/BroadcastBanner"), { ssr: false });
const InstallPWA = dynamic(() => import("@/components/InstallPWA"), { ssr: false });
const AttendanceBadge = dynamic(() => import("@/components/AttendanceBadge"), { ssr: false });
const CacheUpgrade = dynamic(() => import("@/components/CacheUpgrade"), { ssr: false });

export function ClientOverlays() {
  return (
    <>
      <CacheUpgrade />
      <BroadcastBanner />
      <InstallPWA />
      <AttendanceBadge />
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 15 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error: AnyValue) => {
              const status = error?.response?.status;
              if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelIdle = () => {};
    const register = () => {
      cancelIdle = scheduleIdleTask(() => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }, 4000);
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
      cancelIdle();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ClientOverlays />
      {children}
    </QueryClientProvider>
  );
}

