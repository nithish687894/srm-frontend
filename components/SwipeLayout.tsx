"use client";
import { useState, TouchEvent, ReactNode, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const TAB_ORDER = ["/marks", "/attendance", "/dashboard", "/timetable", "/calendar"];

export default function SwipeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Stop swipe animation tracking across routes naturally
  useEffect(() => {
    setOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  }, [pathname]);

  const minSwipeDistance = 60;
  
  const currentIndex = TAB_ORDER.findIndex(p => pathname.startsWith(p));
  const isTabPage = currentIndex !== -1;

  const onTouchStart = (e: TouchEvent) => {
    if (!isTabPage) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isTabPage || touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    const dist = currentX - touchStart;
    
    // add minor resistance if trying to swipe out of bounds
    if ((currentIndex === 0 && dist > 0) || (currentIndex === TAB_ORDER.length - 1 && dist < 0)) {
      setOffset(dist * 0.2);
    } else {
      setOffset(dist);
    }
    setTouchEnd(currentX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd || !isTabPage) {
      setOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < TAB_ORDER.length - 1) {
      router.push(TAB_ORDER[currentIndex + 1]);
      setOffset(typeof window !== "undefined" ? -window.innerWidth : -375);
    } else if (isRightSwipe && currentIndex > 0) {
      router.push(TAB_ORDER[currentIndex - 1]);
      setOffset(typeof window !== "undefined" ? window.innerWidth : 375);
    } else {
      setOffset(0);
    }
    
    setTimeout(() => {
      setTouchStart(null);
      setTouchEnd(null);
    }, 50);
  };

  // The visual transition
  const winWidth = typeof window !== "undefined" ? window.innerWidth : 375;
  const style = {
    transform: `translate3d(${offset}px, 0, 0)`,
    transition: touchStart ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    opacity: 1 - Math.min(Math.abs(offset) / winWidth, 0.5),
    width: "100%",
    willChange: "transform, opacity"
  };

  return (
    <div 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEndHandler}
      className="swipe-wrapper"
      style={{ overflowX: "hidden", position: "relative" }}
    >
      <div ref={wrapperRef} style={style}>
        {children}
      </div>
    </div>
  );
}
