"use client";
import { useState, TouchEvent, ReactNode, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const TAB_ORDER = [
  "/dashboard",
  "/marks",
  "/attendance",
  "/premium"
];

export default function SwipeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pullDist, setPullDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Gesture tracking refs (non-reactive for perf)
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const gestureRef = useRef<"none" | "horizontal" | "vertical" | "pull">("none");
  const lastNavTime = useRef(0);

  // Navigation Progress Bar States
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgressTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      setProgress(10);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 90;
          }
          return prev + (90 - prev) * 0.15;
        });
      }, 150);
    }, 300);
  };

  const stopProgress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      setOffset(0);
      setPullDist(0);
      setIsGestureActive(false);
      // Complete navigation progress on path change
      stopProgress();
    }, 0);
    touchRef.current = null;
    gestureRef.current = "none";
    
    return () => clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      startProgressTimer();
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");
      
      if (
        href && 
        href.startsWith("/") && 
        !href.startsWith("//") &&
        targetAttr !== "_blank" &&
        !e.defaultPrevented &&
        e.button === 0 &&
        !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      ) {
        try {
          const url = new URL(anchor.href, window.location.href);
          if (url.pathname !== window.location.pathname) {
            startProgressTimer();
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick);
      window.removeEventListener("popstate", handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Thresholds — much higher to prevent accidental triggers
  const SWIPE_THRESHOLD = 100;      // px needed for horizontal page nav
  const PULL_REFRESH_THRESHOLD = 130; // px needed for pull-to-refresh
  const GESTURE_LOCK_THRESHOLD = 12;  // px to decide gesture direction
  const NAV_COOLDOWN = 800;           // ms cooldown between page navigations

  const currentIndex = TAB_ORDER.findIndex(p => pathname.startsWith(p));
  const isTabPage = currentIndex !== -1;
  const winWidth = typeof window !== "undefined" ? window.innerWidth : 375;

  const onTouchStart = (e: TouchEvent) => {
    if (!isTabPage) return;
    touchRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    gestureRef.current = "none";
    setIsGestureActive(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!isTabPage || !touchRef.current) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;

    const deltaX = currentX - touchRef.current.x;
    const deltaY = currentY - touchRef.current.y;
    const absDX = Math.abs(deltaX);
    const absDY = Math.abs(deltaY);

    // Lock gesture direction once user moves past threshold
    if (gestureRef.current === "none") {
      if (absDX < GESTURE_LOCK_THRESHOLD && absDY < GESTURE_LOCK_THRESHOLD) {
        return; // Not enough movement to decide yet
      }
      if (absDY > absDX * 1.5) {
        // Clearly vertical — check if pull-to-refresh or normal scroll
        if (window.scrollY <= 0 && deltaY > 0) {
          gestureRef.current = "pull";
        } else {
          gestureRef.current = "vertical";
        }
      } else if (absDX > absDY * 1.5) {
        gestureRef.current = "horizontal";
      } else {
        // Diagonal — treat as vertical scroll (don't hijack)
        gestureRef.current = "vertical";
      }
    }

    // Once locked to vertical scroll, do nothing — let browser handle it
    if (gestureRef.current === "vertical") {
      return;
    }

    // Pull-to-refresh: only when at very top of page and pulling down
    if (gestureRef.current === "pull") {
      if (window.scrollY > 0) {
        // User scrolled down mid-gesture, cancel pull
        gestureRef.current = "vertical";
        setPullDist(0);
        return;
      }
      // Heavy resistance (0.3x) so it feels intentional
      setPullDist(Math.min(deltaY * 0.3, 150));
      return;
    }

    // Horizontal swipe for page navigation
    if (gestureRef.current === "horizontal") {
      // Resistance at edges (can't swipe past first/last tab)
      if ((currentIndex === 0 && deltaX > 0) || (currentIndex === TAB_ORDER.length - 1 && deltaX < 0)) {
        setOffset(deltaX * 0.15);
      } else {
        setOffset(deltaX * 0.8);
      }
    }
  };

  const onTouchEndHandler = () => {
    if (!touchRef.current || !isTabPage) {
      setOffset(0);
      setPullDist(0);
      setIsGestureActive(false);
      gestureRef.current = "none";
      return;
    }

    const now = Date.now();

    // Handle Pull to Refresh — only if pulled far enough AND intentional
    if (gestureRef.current === "pull" && pullDist > PULL_REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      setPullDist(PULL_REFRESH_THRESHOLD); // Hold at threshold during reload
      // Small delay so user sees the spinner
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else {
      setPullDist(0);
    }

    // Handle Horizontal Swipe — with cooldown to prevent double-nav
    if (gestureRef.current === "horizontal" && Math.abs(offset) > SWIPE_THRESHOLD) {
      if (now - lastNavTime.current > NAV_COOLDOWN) {
        lastNavTime.current = now;
        if (offset < 0 && currentIndex < TAB_ORDER.length - 1) {
          startProgressTimer();
          router.push(TAB_ORDER[currentIndex + 1]);
          setOffset(-winWidth);
        } else if (offset > 0 && currentIndex > 0) {
          startProgressTimer();
          router.push(TAB_ORDER[currentIndex - 1]);
          setOffset(winWidth);
        } else {
          setOffset(0);
        }
      } else {
        setOffset(0);
      }
    } else {
      setOffset(0);
    }

    touchRef.current = null;
    gestureRef.current = "none";
    setIsGestureActive(false);
  };

  const style = {
    transform: `translate3d(${offset}px, ${pullDist}px, 0)`,
    transition: isGestureActive ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    opacity: 1 - Math.min(Math.abs(offset) / winWidth, 0.4),
    width: "100%",
    willChange: isGestureActive ? "transform, opacity" : "auto",
    overflowX: "hidden" as const
  };

  const hideSidebar = ["/", "/setup", "/terms", "/privacy", "/trust"].includes(pathname);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      className={`swipe-wrapper ${!hideSidebar ? 'layout-with-sidebar' : ''}`}
      style={{ overflowX: "hidden", position: "relative", minHeight: "100dvh" }}
    >
      {/* Pull to Refresh Indicator */}
      {pullDist > 10 && (
        <div style={{
          position: 'fixed',
          top: Math.min(pullDist - 30, 60),
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: Math.min(pullDist / PULL_REFRESH_THRESHOLD, 1),
          transition: isGestureActive ? 'none' : 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(20,20,25,0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${pullDist * 3}deg)`,
            transition: isGestureActive ? 'none' : 'transform 0.3s ease'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pullDist > PULL_REFRESH_THRESHOLD ? "#4ade80" : "rgba(255,255,255,0.6)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </div>
          {pullDist > PULL_REFRESH_THRESHOLD && (
            <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Release
            </div>
          )}
        </div>
      )}

      {/* Top Progress Bar */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${progress}%`,
          height: '2.5px',
          backgroundColor: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent)',
          zIndex: 999999,
          transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.2s ease-out' : 'width 0.4s cubic-bezier(0.1, 0.8, 0.1, 1)',
          opacity: progress === 100 ? 0 : 1,
          willChange: 'width, opacity'
        }} />
      )}

      <div ref={wrapperRef} style={style}>
        {children}
      </div>

      {!hideSidebar && <Sidebar />}
    </div>
  );
}

