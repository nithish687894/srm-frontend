"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import {
  Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield,
  X, ChevronRight, CreditCard, FileText, Bed, Bus, Bell, Award, MonitorPlay, Printer, Briefcase, UserSquare, User, GraduationCap, BookOpen, Settings, MoreHorizontal, Share2, LogOut, LayoutTemplate, LifeBuoy
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Nexus", icon: Home },
  { href: "/marks", label: "Marks", icon: BarChart2 },
  { href: "/attendance", label: "Attnd", icon: CheckCircle },
  { href: "/timetable", label: "Time", icon: Clock },
] as const;

const NAV_MORE_ITEMS = [
  { href: "/calendar", label: "Calendar", icon: Calendar, color: "#fff" },
  { href: "/app-tools", label: "Tools", icon: Wrench, color: "#00ff88" },
  { href: "/ai", label: "AI Tutor", icon: Sparkles, color: "#fff" },
  { href: "/gpa", label: "GPA Calc", icon: GraduationCap, color: "#fff" },
] as const;

const PORTAL_SERVICES = [
  { href: "/portal/student-dashboard", label: "Student Dashboard", icon: UserSquare },
  { href: "/portal/grade-mark-credit", label: "Grade & Credit", icon: GraduationCap },
] as const;

const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];

const THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPurple: "#bf00ff",
  accentCyan: "#00d4ff",
};

function isActive(href: string, path: string) {
  if (href === "/dashboard") return path === href;
  return path === href || path.startsWith(href + "/");
}

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();

  const { profile, email, studentPortalConnected, studentPortalData, academicData } = useAuthStore();
  const userEmail = (email || profile?.Email || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.some((e) => e.toLowerCase() === userEmail);

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* swallow */ }
    useAuthStore.getState().logout();
    router.push("/");
  }, [router]);

  // Close the drawer if the route changes
  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  // User profile details for the More drawer
  const userName = profile?.["Name"] || profile?.Name || "NITHISHKUMAR S";
  const regNo = profile?.["Registration Number"] || profile?.RegNo || "RA2311026010156";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Theme configuration for drawer styling
  const hubAccent = theme === "matrix" ? "#a8c200" : theme === "aura" ? "#BF5AF2" : THEME.accentCyan;
  const hubAccentGlow = theme === "matrix" ? "rgba(168, 194, 0, 0.15)" : theme === "aura" ? "rgba(191,90,242,0.15)" : "rgba(0, 212, 255, 0.15)";
  const hubBg = theme === "matrix" ? "#050705" : theme === "aura" ? "#0f0a15" : "#0a0a0c";
  const hubCardBg = theme === "matrix" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)";
  const hubCardBorder = theme === "matrix" ? "rgba(168,194,0,0.15)" : "rgba(255,255,255,0.06)";

  const moreItems = [
    { href: "/calendar", label: "Calendar", icon: Calendar, color: theme === "aura" ? "#00E5FF" : theme === "matrix" ? "#a8c200" : THEME.accentCyan },
    { href: "/app-tools", label: "Tools", icon: Wrench, color: theme === "aura" ? "#34C759" : theme === "matrix" ? "#a8c200" : "#00ff88" },
    { href: "/ai", label: "AI Tutor", icon: Sparkles, color: theme === "aura" ? "#BF5AF2" : theme === "matrix" ? "#a8c200" : "#bf00ff" },
    { href: "/gpa", label: "GPA Calc", icon: GraduationCap, color: theme === "aura" ? "#FF2D55" : theme === "matrix" ? "#a8c200" : "#ffffff" },
    { href: "/admin", label: "Admin", icon: Shield, color: theme === "aura" ? "#FF9500" : theme === "matrix" ? "#a8c200" : "#ff3b30" },
  ];

  const portalServices = [
    { href: "/portal/student-dashboard", label: "Student Dashboard", icon: UserSquare, color: theme === "aura" ? "#00E5FF" : theme === "matrix" ? "#a8c200" : THEME.accentCyan },
    { href: "/portal/grade-mark-credit", label: "Grade & Credit", icon: GraduationCap, color: theme === "aura" ? "#FF2D55" : theme === "matrix" ? "#a8c200" : "#ffffff" },
  ];

  const navContent = (
    <>
      <style>{`
        .srmx-mobile-nav {
          position: fixed; bottom: 24px; left: 24px; right: 24px;
          height: 72px; border-radius: 36px;
          background: ${theme === "matrix" ? "rgba(5,7,5,0.8)" : theme === "aura" ? "rgba(20,15,35,0.8)" : "rgba(10,10,12,0.6)"}; 
          backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); 
          border: 1px solid ${theme === "matrix" ? "rgba(0,255,65,0.1)" : theme === "aura" ? "rgba(191,90,242,0.2)" : "rgba(255,255,255,0.08)"};
          display: flex; align-items: center; justify-content: space-around;
          z-index: 99999; box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02);
          padding: 0 12px;
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; color: rgba(255,255,255,0.3); font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 9px; text-transform: uppercase; font-weight: 800; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); -webkit-tap-highlight-color: transparent;
          background: none; border: none; outline: none; text-decoration: none; width: 64px;
          position: relative;
        }
        .nav-item:hover { color: rgba(255,255,255,0.7); }
        .nav-item.active { 
          color: ${theme === "matrix" ? "#a8c200" : theme === "aura" ? "#BF5AF2" : THEME.accentCyan}; 
        }
        .nav-item.active::after {
          content: ""; position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
          width: 32px; height: 4px; border-radius: 4px;
          background: ${theme === "matrix" ? "#a8c200" : theme === "aura" ? "#BF5AF2" : THEME.accentCyan}; 
          box-shadow: 0 0 15px ${theme === "matrix" ? "#a8c200" : theme === "aura" ? "#BF5AF2" : THEME.accentCyan};
        }
        .drawer-item-icon {
          width: 52px; height: 52px; border-radius: 18px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .drawer-item-icon.active {
          background: ${theme === "matrix" ? "rgba(168, 194, 0, 0.08)" : theme === "aura" ? "rgba(191, 90, 242, 0.08)" : "rgba(0,212,255,0.08)"}; 
          border-color: ${theme === "matrix" ? "rgba(168, 194, 0, 0.25)" : theme === "aura" ? "rgba(191, 90, 242, 0.15)" : "rgba(0,212,255,0.15)"}; 
          color: ${theme === "matrix" ? "#a8c200" : theme === "aura" ? "#BF5AF2" : THEME.accentCyan};
        }
        .matrix-font { font-family: "JetBrains Mono", "Courier New", monospace; }
        .nav-indicator {
           content: ""; position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
           width: 32px; height: 4px; border-radius: 4px;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* TOP STATUS BAR */}
      <div className="fixed top-12 left-6 right-6 z-[99999] flex items-center justify-between pointer-events-none">
        <div 
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border"
          style={{ 
            background: theme === "matrix" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.05)",
            borderColor: theme === "matrix" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"
          }}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${studentPortalConnected ? (theme === "matrix" ? "bg-[#a8c200]" : "bg-[#94FFD8]") : "bg-red-500"}`} />
          <span className="text-[9px] font-black tracking-widest text-white/60 uppercase">{studentPortalConnected ? "SYNCED" : "OFFLINE"}</span>
        </div>
        <button 
          onClick={() => { setMenuOpen(true); }} 
          className="pointer-events-auto w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center text-white/60 transition-all active:scale-90"
          style={{ 
            background: theme === "matrix" ? "rgba(0,0,0,0.6)" : "rgba(255, 117, 195, 0.1)",
            borderColor: theme === "matrix" ? "rgba(255,255,255,0.1)" : "rgba(255, 117, 195, 0.2)",
            boxShadow: theme === "aura" ? "0 0 15px rgba(255, 117, 195, 0.15)" : "none"
          }}
        >
          <Settings size={18} color={theme === "aura" ? "#FF75C3" : "#fff"} />
        </button>
      </div>

      {/* SETTINGS MODAL */}
        {menuOpen && (
          <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-6">
            <div onClick={(e) => e.stopPropagation()} className="bg-[#0f0f13] border border-white/10 p-6 rounded-[32px] w-full max-w-[360px] flex flex-col gap-6 shadow-2xl">
              <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black">Control Center</div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setMenuOpen(false); router.push("/settings/theme"); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-left">
                  <LayoutTemplate size={20} color={THEME.accentPurple} /> Themes & UI
                </button>
                <button onClick={() => { setMenuOpen(false); router.push("/support"); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-left">
                  <LifeBuoy size={20} color="#3673ff" /> Help & Support
                </button>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <button onClick={handleLogout} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2">
                <LogOut size={16} /> Terminate Session
              </button>
            </div>
          </div>
        )}

      {/* BOTTOM NAV BAR (FLAT STYLE) */}
      <div className="md:hidden">
        <nav className="srmx-mobile-nav" aria-label="Main navigation">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item ${isActive(href, path) ? "active" : ""}`}>
              <Icon size={20} strokeWidth={isActive(href, path) ? 3 : 2} />
              <span>{label}</span>
            </Link>
          ))}
          <button 
            onClick={() => setMoreOpen(true)} 
            className={`nav-item ${moreOpen ? "active" : ""}`}
            style={{ background: "none", border: "none", outline: "none" }}
          >
            <MoreHorizontal size={20} strokeWidth={moreOpen ? 3 : 2} />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* INLINE MORE DRAWER (CENTRAL HUB) */}
      {moreOpen && (
        <>
          {/* Backdrop with elegant fade-in and high blur */}
          <div 
            onClick={() => setMoreOpen(false)} 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99998] transition-opacity duration-300"
            style={{ animation: "fadeIn 0.25s ease-out" }}
          />

          {/* Sliding Bottom Drawer with Top Glowing Accent */}
          <div 
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] max-h-[85vh] overflow-y-auto z-[99999] rounded-t-[36px] flex flex-col transition-transform duration-300"
            style={{ 
              background: theme === "matrix" ? "rgba(4, 7, 4, 0.92)" : theme === "aura" ? "rgba(12, 8, 22, 0.92)" : "rgba(8, 10, 15, 0.92)",
              backdropFilter: "blur(50px) saturate(220%)",
              WebkitBackdropFilter: "blur(50px) saturate(220%)",
              borderTop: `1.5px solid ${hubCardBorder}`,
              boxShadow: `0 -25px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06), 0 -2px 20px ${hubAccentGlow}`,
              animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))"
            }}
          >
            {/* Drag Bar Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-4 shrink-0 cursor-pointer hover:bg-white/30 active:scale-95 transition-all" onClick={() => setMoreOpen(false)} />

            {/* Header section inside the drawer */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5 shrink-0">
              <span className="text-[10px] text-white/30 uppercase tracking-[0.35em] font-black font-sans">
                Central Hub
              </span>
              <button 
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 active:scale-90 hover:bg-white/10 transition-all"
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>

            <div 
              className="px-6 py-6 flex-1 flex flex-col gap-7 w-full"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              
              {/* STUDENT PROFILE CARD */}
              <div 
                className="flex items-center gap-5 p-5 rounded-[28px] w-full relative overflow-hidden"
                style={{ 
                  background: hubCardBg, 
                  border: `1px solid ${hubCardBorder}`, 
                  boxShadow: `inset 0 0 25px ${hubAccentGlow}, 0 10px 30px rgba(0,0,0,0.3)` 
                }}
              >
                {/* Subtle passport-style glare effect */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)"
                  }}
                />

                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-black text-xl font-black shrink-0 relative overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${hubAccent} 0%, #ffffff 200%)`, 
                    boxShadow: `0 8px 24px ${hubAccentGlow}` 
                  }}
                >
                  {initials}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-white leading-tight truncate tracking-wide">{userName}</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1.5 tabular-nums">{regNo}</p>
                  
                  {studentPortalConnected && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2.5 rounded-full bg-white/[0.04] border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: hubAccent, boxShadow: `0 0 8px ${hubAccent}` }} />
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Portal Linked</span>
                    </div>
                  )}
                </div>
              </div>

              {/* NEXUS CORE */}
              <div>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3.5 pl-1">Nexus Core</p>
                <div className="grid grid-cols-5 gap-2.5">
                  {moreItems.map(({ href, label, icon: Icon, color }) => (
                    <div key={href} className="flex flex-col items-center">
                      <button 
                        onClick={() => { setMoreOpen(false); router.push(href); }}
                        className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-white/[0.04]"
                        style={{ 
                          background: hubCardBg, 
                          border: `1px solid ${hubCardBorder}`,
                          boxShadow: "inset 0 0 15px rgba(255,255,255,0.01)" 
                        }}
                      >
                        <Icon size={20} color={color || hubAccent} />
                      </button>
                      <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-center mt-2.5 text-white/45 leading-tight min-h-[16px] font-sans">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PORTAL SERVICES */}
              <div>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3.5 pl-1">Portal Services</p>
                <div className="grid grid-cols-5 gap-2.5">
                  {portalServices.map(({ href, label, icon: Icon, color }) => (
                    <div key={href} className="flex flex-col items-center">
                      <button 
                        onClick={() => { setMoreOpen(false); router.push(href); }}
                        className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all hover:bg-white/[0.04]"
                        style={{ 
                          background: hubCardBg, 
                          border: `1px solid ${hubCardBorder}`,
                          boxShadow: "inset 0 0 15px rgba(255,255,255,0.01)" 
                        }}
                      >
                        <Icon size={20} color={color || hubAccent} />
                      </button>
                      <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-center mt-2.5 text-white/45 leading-tight min-h-[16px] max-w-[64px] font-sans">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="flex flex-col gap-3">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 pl-1">Quick Actions</p>
                
                <button 
                  onClick={() => { setMoreOpen(false); router.push("/settings/theme"); }} 
                  className="flex items-center gap-4.5 p-4 rounded-[24px] text-left transition-all active:scale-[0.98] w-full text-white/70 hover:text-white group"
                  style={{ background: hubCardBg, border: `1px solid ${hubCardBorder}` }}
                >
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.06] shrink-0 group-hover:scale-105 transition-transform" 
                    style={{ boxShadow: `inset 0 0 12px ${hubAccentGlow}` }}
                  >
                    <LayoutTemplate size={20} color={hubAccent} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white leading-none font-sans">
                      Themes
                    </p>
                    <p className="text-[10.5px] text-white/35 font-bold mt-1 leading-none truncate">
                      Customize your look
                    </p>
                  </div>
                  <ChevronRight size={17} className="text-white/20 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
                
                <button 
                  onClick={() => { setMoreOpen(false); router.push("/support"); }} 
                  className="flex items-center gap-4.5 p-4 rounded-[24px] text-left transition-all active:scale-[0.98] w-full text-white/70 hover:text-white group"
                  style={{ background: hubCardBg, border: `1px solid ${hubCardBorder}` }}
                >
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.06] shrink-0 group-hover:scale-105 transition-transform" 
                    style={{ boxShadow: `inset 0 0 12px ${hubAccentGlow}` }}
                  >
                    <LifeBuoy size={20} color={hubAccent} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white leading-none font-sans">
                      Help & Support
                    </p>
                    <p className="text-[10.5px] text-white/35 font-bold mt-1 leading-none truncate">
                      Get assistance with Academic OS
                    </p>
                  </div>
                  <ChevronRight size={17} className="text-white/20 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* LOGOUT */}
              <button 
                onClick={() => { setMoreOpen(false); handleLogout(); }}
                className="flex items-center justify-center gap-2.5 p-4.5 rounded-[24px] w-full mt-2 active:scale-[0.98] transition-all hover:bg-red-500/20"
                style={{ 
                  background: "rgba(255, 59, 48, 0.06)", 
                  border: "1px solid rgba(255, 59, 48, 0.15)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
                }}
              >
                <LogOut size={18} color="#ff3b30" />
                <span className="text-xs font-black tracking-widest text-[#ff3b30] uppercase">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );

  if (!mounted) return null;
  return createPortal(navContent, document.body);
}
