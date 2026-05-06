"use client";

import { PropsWithChildren, TouchEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { dataAPI } from "@/lib/api";
import { triggerHaptic } from "@/lib/haptics";

const PULL_THRESHOLD = 72;

export default function PullToRefresh({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [startY, setStartY] = useState<number | null>(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const active = distance > 0 || refreshing;
  const progress = useMemo(() => Math.min(distance / PULL_THRESHOLD, 1), [distance]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0 || refreshing) return;
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (startY === null || refreshing) return;
    const delta = e.touches[0].clientY - startY;
    if (delta <= 0) {
      setDistance(0);
      return;
    }
    setDistance(Math.min(delta * 0.5, 120));
  };

  const runRefresh = async () => {
    setRefreshing(true);
    try {
      await dataAPI.refresh();
    } catch {
      // fallback to client cache refresh even if API refresh fails
    } finally {
      await queryClient.invalidateQueries();
      router.refresh();
      setTimeout(() => {
        setRefreshing(false);
        setDistance(0);
      }, 300);
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    const shouldRefresh = distance >= PULL_THRESHOLD;
    setStartY(null);
    if (!shouldRefresh) {
      setDistance(0);
      return;
    }
    triggerHaptic(10);
    await runRefresh();
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div
        style={{
          height: active ? "48px" : "0px",
          transition: "height 180ms ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          overflow: "hidden",
        }}
      >
        {refreshing ? "Refreshing..." : progress >= 1 ? "Release to refresh" : "Pull to refresh"}
      </div>
      <div style={{ transform: `translateY(${distance}px)`, transition: startY !== null ? "none" : "transform 200ms ease-out" }}>
        {children}
      </div>
    </div>
  );
}
