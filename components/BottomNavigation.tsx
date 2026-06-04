"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield, MoreHorizontal, Settings, LogOut, Wifi, WifiOff, MessageSquare } from "lucide-react";

type NavEntry = {
  href: string;
  label: string;
  icon: typeof Home;
};

function ConnectionIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="connection-indicator">
      {connected ? (
        <Wifi size={12} color="#10b981" />
      ) : (
        <WifiOff size={12} color="#ef4444" />
      )}
    </div>
  );
}

function MoreSheet({
  mounted,
  moreOpen,
  theme,
  navMore,
  path,
  onClose,
  onLogout,
}: {
  mounted: boolean;
  moreOpen: boolean;
  theme: string;
  navMore: NavEntry[];
  path: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  if (!mounted) return null;

  return createPortal(
    <>
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div
            className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-50 rounded-t-3xl bg-[#110c1e]/95 border-[rgba(255,117,195,0.1)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="p-6">
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              <h3 className="text-white text-lg font-bold text-center mb-6 uppercase tracking-wider">
                More Options
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {navMore.map((item) => {
                  const isActive = path === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-pink-500/20 border border-pink-500/30"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <item.icon
                        size={24}
                        className={isActive ? "text-pink-400" : "text-white/70"}
                      />
                      <span className={`text-xs font-medium tracking-wide ${
                        isActive ? "text-pink-400" : "text-white/70"
                      }`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl hover:bg-red-500/30 transition-colors"
              >
                <LogOut size={20} className="text-red-400" />
                <span className="text-red-400 font-medium tracking-wide text-sm">
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
}

function DesktopNav({ navItems, path, connected }: { navItems: NavEntry[]; path: string; connected: boolean }) {
  return (
    <div className="srmx-desktop-nav">
      <ConnectionIndicator connected={connected} />
      {navItems.map((item) => {
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
}

function MobileNav({ navMain, path, moreOpen, isMoreActive, onMoreOpen }: { navMain: NavEntry[]; path: string; moreOpen: boolean; isMoreActive: boolean; onMoreOpen: () => void }) {
  return (
    <div className="srmx-mobile-nav">
      {navMain.map((item) => {
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

      <button
        onClick={onMoreOpen}
        className={`nav-item ${moreOpen || isMoreActive ? "active" : ""}`}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
    </div>
  );
}

export default function BottomNavigation() {
  const path = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();

  const { profile, email, studentPortalConnected } = useAuthStore();
  const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];
  const userEmail = (email || profile?.Email || profile?.["Email"] || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

  // Main navigation items (always visible)
  const NAV_MAIN = [
    { href: "/dashboard", label: "Nexus", icon: Home },
    { href: "/marks", label: "Marks", icon: BarChart2 },
    { href: "/attendance", label: "Attendance", icon: CheckCircle },
    { href: "/timetable", label: "Timetable", icon: Clock },
  ];

  // More navigation items (in bottom sheet)
  const NAV_MORE = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/app-tools", label: "Tools", icon: Wrench },
    { href: "/ai", label: "AI", icon: Sparkles },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isMoreActive = NAV_MORE.some(item => path === item.href);

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { }
    useAuthStore.getState().logout();
    router.push("/");
  };

  // Portal connection indicator
  if (!mounted) return null;

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <DesktopNav navItems={NAV_MAIN.concat(NAV_MORE)} path={path} connected={studentPortalConnected} />
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNav navMain={NAV_MAIN} path={path} moreOpen={moreOpen} isMoreActive={isMoreActive} onMoreOpen={() => setMoreOpen(true)} />
        <MoreSheet
          mounted={mounted}
          moreOpen={moreOpen}
          theme={theme}
          navMore={NAV_MORE}
          path={path}
          onClose={() => setMoreOpen(false)}
          onLogout={() => {
            setMoreOpen(false);
            handleLogout();
          }}
        />
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


        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #666;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
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
          color: #FF75C3;
          text-shadow: 0 0 12px rgba(255, 117, 195, 0.7);
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
