"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { scheduleIdleTask } from "@/lib/scheduleIdle";

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
      {children}
    </QueryClientProvider>
  );
}

