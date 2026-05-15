"use client";
import { useState, TouchEvent, ReactNode, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const TAB_ORDER = [
  "/dashboard",
  "/marks",
  "/attendance",
  "/timetable",
  "/calendar",
  "/ai"
];

export default function SwipeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [pullDist, setPullDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOffset(0);
    setPullDist(0);
    setTouchStart(null);
  }, [pathname]);

  const minSwipeDistance = 60;
  const currentIndex = TAB_ORDER.findIndex(p => pathname.startsWith(p));
  const isTabPage = currentIndex !== -1;
  const winWidth = typeof window !== "undefined" ? window.innerWidth : 375;

  const onTouchStart = (e: TouchEvent) => {
    if (!isTabPage) return;
    setTouchStart({ 
      x: e.targetTouches[0].clientX, 
      y: e.targetTouches[0].clientY 
    });
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isTabPage || !touchStart) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;

    // Detect if user is pulling down at the top of the page
    if (window.scrollY === 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setPullDist(Math.min(deltaY * 0.4, 100)); // resistance
      return;
    }

    if (pullDist > 0) return; // Ignore horizontal swipe if pulling down

    // add minor resistance if trying to swipe out of bounds
    if ((currentIndex === 0 && deltaX > 0) || (currentIndex === TAB_ORDER.length - 1 && deltaX < 0)) {
      setOffset(deltaX * 0.2);
    } else {
      setOffset(deltaX);
    }
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !isTabPage) {
      setOffset(0);
      setPullDist(0);
      return;
    }

    // Handle Pull to Refresh
    if (pullDist > 70) {
      setIsRefreshing(true);
      window.location.reload(); // Simple refresh for now
    }

    setPullDist(0);
    
    // Handle Horizontal Swipe
    if (Math.abs(offset) > minSwipeDistance) {
      if (offset < 0 && currentIndex < TAB_ORDER.length - 1) {
        router.push(TAB_ORDER[currentIndex + 1]);
        setOffset(-window.innerWidth);
      } else if (offset > 0 && currentIndex > 0) {
        router.push(TAB_ORDER[currentIndex - 1]);
        setOffset(window.innerWidth);
      } else {
        setOffset(0);
      }
    } else {
      setOffset(0);
    }
    
    setTouchStart(null);
  };

  const style = {
    transform: `translate3d(${offset}px, ${pullDist}px, 0)`,
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
      style={{ overflowX: "hidden", position: "relative", minHeight: "100vh" }}
    >
      {/* Pull to Refresh Indicator */}
      <div style={{
        position: 'absolute',
        top: pullDist > 0 ? pullDist - 40 : -40,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: pullDist / 70,
        transition: 'opacity 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="srmx-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#000' }}></div>
        </div>
      </div>

      <div ref={wrapperRef} style={style}>
        {children}
      </div>
    </div>
  );
}
