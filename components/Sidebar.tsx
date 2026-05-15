"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { motion, AnimatePresence } from "framer-motion";
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();

  const { profile, email, studentPortalConnected, studentPortalData, academicData } = useAuthStore();
  const userEmail = (email || profile?.Email || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.some((e) => e.toLowerCase() === userEmail);

  const userName = academicData?.profile?.name || studentPortalData?.profile?.name || profile?.Name || "Student";
  const regNo = academicData?.profile?.registerNo || studentPortalData?.profile?.registerNo || "";
  const initials = userName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const moreItems = [
    ...NAV_MORE_ITEMS,
    ...(isAdmin ? [{ href: "/admin" as const, label: "Admin" as const, icon: Shield, color: "#fff" }] : []),
  ];

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMoreOpen(false); }, [path]);

  const handleLogout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* swallow */ }
    useAuthStore.getState().logout();
    router.push("/");
  }, [router]);

  const navContent = (
    <>
      <style>{`
        .srmx-mobile-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: calc(72px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: rgba(10,10,12,0.98); backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px); border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: space-around;
          z-index: 99999; box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; color: rgba(255,255,255,0.25); font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 8px; text-transform: uppercase; font-weight: 800; cursor: pointer;
          transition: all 0.2s ease; -webkit-tap-highlight-color: transparent;
          background: none; border: none; outline: none; text-decoration: none; width: 64px;
        }
        .nav-item.active { color: ${theme === 'matrix' ? '#facc15' : theme === 'aura' ? '#FF75C3' : THEME.accentCyan}; }
        .drawer-item-icon {
          width: 52px; height: 52px; border-radius: 18px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .drawer-item-icon.active {
          background: ${theme === 'matrix' ? 'rgba(250, 204, 21, 0.08)' : theme === 'aura' ? 'rgba(255, 117, 195, 0.08)' : 'rgba(0,212,255,0.08)'}; 
          border-color: ${theme === 'matrix' ? 'rgba(250, 204, 21, 0.25)' : theme === 'aura' ? 'rgba(255, 117, 195, 0.15)' : 'rgba(0,212,255,0.15)'}; 
          color: ${theme === 'matrix' ? '#facc15' : theme === 'aura' ? '#FF75C3' : THEME.accentCyan};
        }
        .matrix-font { font-family: 'JetBrains Mono', 'Courier New', monospace; }
      `}</style>

      {/* TOP STATUS BAR */}
      <div className="fixed top-12 left-6 right-6 z-[99999] flex items-center justify-between pointer-events-none">
        <div 
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border"
          style={{ 
            background: theme === 'matrix' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.05)',
            borderColor: theme === 'matrix' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)'
          }}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${studentPortalConnected ? (theme === 'matrix' ? "bg-[#facc15]" : "bg-[#94FFD8]") : "bg-red-500"}`} />
          <span className="text-[9px] font-black tracking-widest text-white/60 uppercase">{studentPortalConnected ? "SYNCED" : "OFFLINE"}</span>
        </div>
        <button 
          onClick={() => { setMenuOpen(true); setMoreOpen(false); }} 
          className="pointer-events-auto w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center text-white/60 transition-all active:scale-90"
          style={{ 
            background: theme === 'matrix' ? 'rgba(0,0,0,0.6)' : 'rgba(255, 117, 195, 0.1)',
            borderColor: theme === 'matrix' ? 'rgba(255,255,255,0.1)' : 'rgba(255, 117, 195, 0.2)',
            boxShadow: theme === 'aura' ? '0 0 15px rgba(255, 117, 195, 0.15)' : 'none'
          }}
        >
          <Settings size={18} color={theme === 'aura' ? '#FF75C3' : '#fff'} />
        </button>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f0f13] border border-white/10 p-6 rounded-[32px] w-full max-w-[360px] flex flex-col gap-6 shadow-2xl">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MORE DRAWER */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[850] bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[900] rounded-t-[40px] px-6 pt-3 pb-[100px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
              style={{ 
                maxHeight: "85vh", 
                overflowY: "auto",
                background: theme === 'matrix' ? '#050705' : 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                borderTop: theme === 'matrix' ? '1px solid rgba(0,255,65,0.1)' : '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

              {/* USER INFO */}
              <div className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.05] rounded-[28px] mb-8">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-black text-xl font-black"
                  style={{ 
                    background: theme === 'matrix' ? 'linear-gradient(135deg, #facc15, #ffffff)' : 'linear-gradient(135deg, #FF75C3, #8F92FF)',
                    boxShadow: `0 8px 20px ${theme === 'matrix' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255, 117, 195, 0.2)'}`
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className={`text-lg font-black text-white leading-tight truncate ${theme === 'matrix' ? 'matrix-font' : ''}`}>{userName}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{regNo}</p>
                    {academicData?.profile?.["Degree"] && (
                      <p className="text-[10px] text-white/20 font-bold uppercase">• {academicData.profile["Degree"]}</p>
                    )}
                  </div>
                  {studentPortalConnected && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-full bg-white/[0.05] border border-white/10">
                      <div className={`w-1 h-1 rounded-full ${theme === 'matrix' ? 'bg-[#facc15]' : 'bg-[#FF75C3]'}`} />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter">Portal Linked</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CORE GRID */}
              <div className="mb-10">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-5 pl-1">Nexus Core</p>
                <div className="grid grid-cols-4 gap-4">
                  {moreItems.map(({ href, label, icon: Icon, color }) => (
                    <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="flex flex-col items-center gap-3">
                      <div className={`drawer-item-icon ${isActive(href, path) ? "active" : ""}`} style={{ color: isActive(href, path) ? (theme === 'matrix' ? '#facc15' : theme === 'aura' ? '#FF75C3' : THEME.accentCyan) : (theme === 'matrix' ? '#facc15' : color) }}>
                        <Icon size={22} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider text-center ${theme === 'matrix' ? 'text-[#facc15]/40 matrix-font' : 'text-white/40'}`}>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* SERVICES GRID */}
              <div className="mb-10">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-5 pl-1">Portal Services</p>
                <div className="grid grid-cols-4 gap-4">
                  {PORTAL_SERVICES.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="flex flex-col items-center gap-3">
                      <div className={`drawer-item-icon ${isActive(href, path) ? "active" : ""}`} style={{ color: isActive(href, path) ? (theme === 'matrix' ? '#facc15' : theme === 'aura' ? '#FF75C3' : THEME.accentCyan) : (theme === 'matrix' ? '#facc15' : '#fff') }}>
                        <Icon size={22} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider text-center leading-tight ${theme === 'matrix' ? 'text-[#facc15]/40 matrix-font' : 'text-white/40'}`}>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="flex flex-col gap-3">
                <p className={`text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 pl-1 ${theme === 'matrix' ? 'matrix-font' : ''}`}>Quick Actions</p>
                <button onClick={() => { setMoreOpen(false); router.push("/settings/theme"); }} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-[24px] text-left transition-all active:scale-[0.98]">
                  <LayoutTemplate size={20} color={theme === 'matrix' ? '#facc15' : '#bf00ff'} />
                  <div className="flex-1">
                    <p className={`text-[15px] font-black text-white ${theme === 'matrix' ? 'matrix-font text-sm text-[#facc15]' : ''}`}>Themes & Layout</p>
                    <p className="text-[11px] text-white/20 font-bold">Customize your Nexus experience</p>
                  </div>
                  <ChevronRight size={18} className="text-white/10" />
                </button>
                <button onClick={() => { setMoreOpen(false); router.push("/support"); }} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-[24px] text-left transition-all active:scale-[0.98]">
                  <LifeBuoy size={20} color={theme === 'matrix' ? '#00d4ff' : '#3673ff'} />
                  <div className="flex-1">
                    <p className={`text-[15px] font-black text-white ${theme === 'matrix' ? 'matrix-font text-sm' : ''}`}>Help & Support</p>
                    <p className="text-[11px] text-white/20 font-bold">Get assistance with Academic OS</p>
                  </div>
                  <ChevronRight size={18} className="text-white/10" />
                </button>
              </div>


            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BOTTOM NAV BAR (FLAT STYLE) */}
      <div className="md:hidden">
        <nav className="srmx-mobile-nav" aria-label="Main navigation">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item ${isActive(href, path) ? "active" : ""}`} onClick={() => setMoreOpen(false)}>
              <Icon size={20} strokeWidth={isActive(href, path) ? 3 : 2} />
              <span>{label}</span>
            </Link>
          ))}
          <button className={`nav-item ${moreOpen ? "active" : ""}`} onClick={() => setMoreOpen(!moreOpen)}>
            <MoreHorizontal size={20} strokeWidth={moreOpen ? 3 : 2} />
            <span>More</span>
          </button>
        </nav>
      </div>
    </>
  );

  if (!mounted) return null;
  return createPortal(navContent, document.body);
}
