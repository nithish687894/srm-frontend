"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield, MoreHorizontal, Settings, LogOut, Wifi, WifiOff, StickyNote, Search, Library, BookOpen, Star } from "lucide-react";
import PremiumCheckout from "@/components/PremiumCheckout";
import Toast from "@/components/Toast";

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
  isPremium,
  onOpenPremium,
  isLight,
}: {
  mounted: boolean;
  moreOpen: boolean;
  theme: string;
  navMore: NavEntry[];
  path: string;
  onClose: () => void;
  onLogout: () => void;
  isPremium: boolean;
  onOpenPremium: () => void;
  isLight: boolean;
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

              {/* Premium Pass Status or Buy Button */}
              {isPremium ? (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "16px",
                    background: "rgba(191, 90, 242, 0.08)",
                    border: "1px solid rgba(191, 90, 242, 0.25)",
                    borderRadius: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <Shield size={16} color="#FF75C3" />
                  <span style={{ color: "#FF75C3", fontWeight: 700, fontSize: "13px", letterSpacing: "0.02em" }}>
                    Nexus Premium Active
                  </span>
                </div>
              ) : (
                <button
                  onClick={onOpenPremium}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "16px",
                    background: "linear-gradient(135deg, #7B2CBF 0%, #BF5AF2 100%)",
                    border: "none",
                    borderRadius: "16px",
                    cursor: "pointer",
                    marginBottom: "16px",
                    boxShadow: "0 8px 20px rgba(123, 44, 191, 0.25)",
                  }}
                >
                  <Sparkles size={16} color="#FFFFFF" style={{ animation: "pulse 2s infinite" }} />
                  <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Get Premium Pass
                  </span>
                </button>
              )}

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

function DesktopNav({ 
  navItems, 
  path, 
  connected,
  isPremium,
  onPremiumOpen
}: { 
  navItems: NavEntry[]; 
  path: string; 
  connected: boolean;
  isPremium: boolean;
  onPremiumOpen: () => void;
}) {
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
      
      {/* Premium Desktop Button */}
      <button
        onClick={onPremiumOpen}
        className="nav-item"
        style={{ 
          background: "none", 
          border: "none", 
          outline: "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "6px",
          width: "auto",
          height: "100%",
          padding: "0 10px",
          fontFamily: "inherit",
        }}
      >
        {isPremium ? (
          <Shield size={14} color="#FF75C3" />
        ) : (
          <Sparkles size={14} color="#BF5AF2" />
        )}
        <span style={{ color: isPremium ? "#FF75C3" : "#BF5AF2", fontWeight: 700 }}>Premium</span>
      </button>
    </div>
  );
}

function MobileNav({ 
  navMain, 
  path, 
  moreOpen, 
  isMoreActive, 
  onMoreOpen,
  onPremiumOpen,
  isPremium
}: { 
  navMain: NavEntry[]; 
  path: string; 
  moreOpen: boolean; 
  isMoreActive: boolean; 
  onMoreOpen: () => void;
  onPremiumOpen: () => void;
  isPremium: boolean;
}) {
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

  const { profile, email, studentPortalConnected, isPremium } = useAuthStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (title: string, body: string, type: "success" | "error" | "info" = "success") => {
    setToast({ title, body, type });
  };
  const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];
  const userEmail = (email || profile?.Email || profile?.["Email"] || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

  // Main navigation items (always visible)
  const NAV_MAIN = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/marks", label: "Search", icon: Search },
    { href: "/attendance", label: "Your Library", icon: Library },
  ];

  // More navigation items (in bottom sheet)
  const NAV_MORE = [
    { href: "/timetable", label: "Timetable", icon: Clock },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/premium", label: "Premium", icon: Sparkles },
    { href: "/exam-library", label: "Exam", icon: BookOpen },
    { href: "/exam-hub", label: "Exam Hub", icon: BookOpen },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/app-tools", label: "Tools", icon: Wrench },
    { href: "/ai", label: "AI", icon: Sparkles },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isMoreActive = NAV_MORE.some(item => path === item.href || path.startsWith(item.href + "/"));

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
        <DesktopNav 
          navItems={NAV_MAIN.concat(NAV_MORE)} 
          path={path} 
          connected={studentPortalConnected} 
          isPremium={isPremium}
          onPremiumOpen={() => setShowCheckout(true)}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNav 
          navMain={NAV_MAIN} 
          path={path} 
          moreOpen={moreOpen} 
          isMoreActive={isMoreActive} 
          onMoreOpen={() => setMoreOpen(true)} 
          onPremiumOpen={() => setShowCheckout(true)}
          isPremium={isPremium}
        />
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
          isPremium={isPremium}
          onOpenPremium={() => {
            setMoreOpen(false);
            setShowCheckout(true);
          }}
          isLight={theme === "light"}
        />
      </div>

      {toast && (
        <Toast
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showCheckout && (
        <PremiumCheckout
          onClose={() => setShowCheckout(false)}
          showToast={showToast}
        />
      )}

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
          height: calc(60px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: #000000;
          border-top: 1px solid #121212;
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 100;
          box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.6);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #d1d5db;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: -0.012em;
          position: relative;
          cursor: pointer;
          transition: color 0.15s ease;
          width: 20%;
          height: 100%;
          -webkit-tap-highlight-color: transparent;
        }

        .nav-item:hover, .nav-item:active {
          color: #ffffff;
        }

        .nav-item.active {
          color: #ffffff;
        }

        .nav-item::before {
          display: none;
        }

        .nav-item.active::before {
          display: none;
        }
      `}</style>
    </>
  );
}
