"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield, MoreHorizontal, Settings, Share2, LogOut, Wifi, WifiOff } from "lucide-react";

export default function BottomNavigation() {
  const path = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { profile, email, studentPortalConnected } = useAuthStore();
  const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];
  const userEmail = (email || profile?.Email || profile?.["Email"] || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

  // Main navigation items (always visible)
  const NAV_MAIN = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/marks", label: "Marks", icon: BarChart2 },
    { href: "/attendance", label: "Attnd", icon: CheckCircle },
    { href: "/timetable", label: "Time", icon: Clock },
  ];

  // More navigation items (in bottom sheet)
  const NAV_MORE = [
    { href: "/calendar", label: "Cal", icon: Calendar },
    { href: "/app-tools", label: "Tools", icon: Wrench },
    { href: "/ai", label: "AI", icon: Sparkles },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { }
    useAuthStore.getState().logout();
    router.push("/");
  };

  // Portal connection indicator
  const ConnectionIndicator = () => (
    <div className="connection-indicator">
      {studentPortalConnected ? (
        <Wifi size={12} color="#10b981" />
      ) : (
        <WifiOff size={12} color="#ef4444" />
      )}
    </div>
  );

  // Bottom sheet component
  const MoreSheet = () => {
    if (!mounted) return null;

    return createPortal(
      <>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setMoreOpen(false)}
            />

            {/* Sheet */}
            <div
              className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-50 rounded-t-3xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="p-6">
                {/* Handle */}
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

                {/* Title */}
                <h3 className="text-white text-lg font-bold text-center mb-6 uppercase tracking-wider">
                  More Options
                </h3>

                {/* Navigation Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {NAV_MORE.map((item) => {
                    const isActive = path === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? "bg-green-500/20 border border-green-500/30"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <item.icon
                          size={24}
                          className={isActive ? "text-green-400" : "text-white/70"}
                        />
                        <span className={`text-xs font-medium uppercase tracking-wide ${
                          isActive ? "text-green-400" : "text-white/70"
                        }`}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl hover:bg-red-500/30 transition-colors"
                >
                  <LogOut size={20} className="text-red-400" />
                  <span className="text-red-400 font-medium uppercase tracking-wide text-sm">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </>,
      document.body
    );
  };

  // Desktop navigation (keep existing for larger screens)
  const DesktopNav = () => (
    <div className="srmx-desktop-nav">
      <ConnectionIndicator />
      {NAV_MAIN.concat(NAV_MORE).map((item) => {
        const isActive = path === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  // Mobile bottom navigation
  const MobileNav = () => (
    <div className="srmx-mobile-nav">
      {NAV_MAIN.map((item) => {
        const isActive = path === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* More Button */}
      <button
        onClick={() => setMoreOpen(true)}
        className={`nav-item ${moreOpen ? "active" : ""}`}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
    </div>
  );

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <DesktopNav />
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNav />
        <MoreSheet />
      </div>

      <style jsx>{`
        .connection-indicator {
          position: absolute;
          top: 50%;
          right: 40px;
          transform: translateY(-50%);
          opacity: 0.7;
        }

        .srmx-desktop-nav {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          height: 64px;
          border-radius: 99px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(10, 15, 30, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 0 40px;
          z-index: 100;
        }

        .theme-matrix .srmx-desktop-nav {
          border: 1px solid var(--accent);
          box-shadow: 0 0 20px rgba(168, 194, 0, 0.2);
          background: rgba(10, 10, 10, 0.95);
        }

        .srmx-mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(72px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: rgba(10, 10, 12, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 100;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
        }

        .theme-matrix .srmx-mobile-nav {
          border-top: 1px solid var(--accent);
          box-shadow: 0 -4px 20px rgba(168, 194, 0, 0.15);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #666;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          position: relative;
          cursor: pointer;
          transition: color 0.2s ease, text-shadow 0.2s ease;
          width: 60px;
          height: 100%;
          -webkit-tap-highlight-color: transparent;
        }

        .nav-item:hover {
          color: #fff;
        }

        .nav-item.active {
          color: #a8c200;
          text-shadow: 0 0 10px rgba(168, 194, 0, 0.8);
        }

        .theme-matrix .nav-item.active {
          color: var(--accent);
          text-shadow: 0 0 10px rgba(168, 194, 0, 0.8);
        }

        .theme-cosmos .nav-item.active {
          color: #a78bfa;
          text-shadow: 0 0 10px rgba(167, 139, 250, 0.8);
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0px;
          left: 50%;
          transform: translateX(-50%);
          width: 0px;
          height: 2px;
          border-radius: 4px;
          background: transparent;
          transition: all 0.2s ease;
        }

        .nav-item.active::before {
          width: 30px;
          background: currentColor;
          box-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </>
  );
}