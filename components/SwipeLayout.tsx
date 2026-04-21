"use client";
import { useState, TouchEvent, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const TAB_ORDER = ["/marks", "/attendance", "/dashboard", "/timetable", "/calendar"];

export default function SwipeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentIndex = TAB_ORDER.findIndex(p => pathname.startsWith(p));
    if (currentIndex === -1) return; // not a tab page

    if (isLeftSwipe && currentIndex < TAB_ORDER.length - 1) {
      router.push(TAB_ORDER[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      router.push(TAB_ORDER[currentIndex - 1]);
    }
  };

  return (
    <div 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEndHandler}
      className="swipe-wrapper"
      style={{ overflowX: "hidden" }}
    >
      {children}
    </div>
  );
}
