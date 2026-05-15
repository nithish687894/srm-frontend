"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield,
  X, ChevronRight, CreditCard, FileText, Bed, Bus, Bell, Award, MonitorPlay, Printer, Briefcase, UserSquare, User, GraduationCap, BookOpen, Settings, MoreHorizontal, Share2, LogOut, LayoutTemplate, LifeBuoy
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Nexus", icon: Home },
  { href: "/marks", label: "Marks", icon: Award },
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
  { href: "/marks", label: "Grade & Credit", icon: GraduationCap },
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

  const allNav = [...NAV_MAIN, ...moreItems];

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
        .srmx-desktop-nav {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
          height: 64px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.05);
          background: rgba(10,15,30,0.6); backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px); display: flex; align-items: center;
          gap: 32px; padding: 0 40px; z-index: 100;
        }
        .srmx-mobile-nav {
          position: fixed; bottom: 24px; left: 20px; right: 20px;
          height: 72px; background: rgba(10,12,18,0.95);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
          display: flex; align-items: center; justify-content: space-around;
          z-index: 1000;
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; color: rgba(255,255,255,0.3); font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 8px; text-transform: uppercase; font-weight: 800; cursor: pointer;
          transition: all 0.2s ease; -webkit-tap-highlight-color: transparent;
          background: none; border: none; outline: none; text-decoration: none;
        }
        .nav-item.active { color: ${THEME.accentCyan}; font-weight: 900; }
        .drawer-item-icon {
          width: 48px; height: 48px; border-radius: 16px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
          display: flex; alignItems: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .drawer-item-icon.active {
          background: rgba(0,212,255,0.1); border-color: rgba(0,212,255,0.2); color: ${THEME.accentCyan};
          box-shadow: 0 0 15px rgba(0,212,255,0.15);
        }
      `}</style>

      {/* STATUS + SETTINGS BAR (TOP) */}
      <div className="fixed top-12 left-6 right-6 z-[100] flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10" style={{ boxShadow: studentPortalConnected ? "0 0 10px rgba(0,255,136,0.1)" : "none" }}>
          <div className={`w-2 h-2 rounded-full ${studentPortalConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-[9px] font-black tracking-widest text-white/80 uppercase">{studentPortalConnected ? "SYNCED" : "OFFLINE"}</span>
        </div>
        <button onClick={() => { setMenuOpen(true); setMoreOpen(false); }} className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80">
          <Settings size={18} />
        </button>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f0f13] border border-white/10 p-6 rounded-[32px] w-full max-w-[360px] flex flex-col gap-6">
              <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black font-mono">Control Center</div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setMenuOpen(false); router.push("/settings/theme"); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-left">
                  <LayoutTemplate size={18} color={THEME.accentPurple} /> Personalize Interface
                </button>
                <button onClick={() => { setMenuOpen(false); router.push("/support"); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-left">
                  <LifeBuoy size={18} color="#3673ff" /> Help & Support
                </button>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <button onClick={handleLogout} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2">
                <LogOut size={16} /> Terminate Session
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[850] bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[900] bg-[#0a0a0c] border-t border-white/10 rounded-t-[40px] px-6 pt-3 pb-[120px]"
              style={{ maxHeight: "85vh", overflowY: "auto" }}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />

              {/* PROFILE CARD */}
              <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-3xl mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00ff88] to-[#00d4ff] flex items-center justify-center text-black text-xl font-black shadow-lg shadow-cyan-500/20">
                  {initials}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">{userName}</h2>
                  <p className="text-xs text-white/40 font-bold mt-1">{regNo || "Student ID Locked"}</p>
                  <div className="inline-flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded-lg mt-2 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">PORTAL LINKED</span>
                  </div>
                </div>
              </div>

              {/* NEXUS CORE */}
              <div className="mb-8">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 pl-1">Nexus Core</p>
                <div className="grid grid-cols-4 gap-4">
                  {moreItems.map(({ href, label, icon: Icon, color }) => (
                    <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="flex flex-col items-center gap-3">
                      <div className={`drawer-item-icon ${isActive(href, path) ? "active" : ""}`} style={{ color: isActive(href, path) ? THEME.accentCyan : color }}>
                        <Icon size={22} />
                      </div>
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-wider text-center">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* PORTAL SERVICES */}
              <div className="mb-8">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 pl-1">Portal Services</p>
                <div className="grid grid-cols-4 gap-4">
                  {PORTAL_SERVICES.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="flex flex-col items-center gap-3">
                      <div className={`drawer-item-icon ${isActive(href, path) ? "active" : ""}`}>
                        <Icon size={22} />
                      </div>
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-wider text-center leading-tight">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 pl-1">Quick Actions</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setMoreOpen(false); router.push("/settings/theme"); }} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-3xl text-left">
                    <LayoutTemplate size={20} color={THEME.accentPurple} />
                    <div className="flex-1">
                      <p className="text-[15px] font-black text-white">Themes</p>
                      <p className="text-[11px] text-white/30 font-bold">Customize your look</p>
                    </div>
                    <ChevronRight size={18} className="text-white/20" />
                  </button>
                  <button onClick={() => { setMoreOpen(false); router.push("/support"); }} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-3xl text-left">
                    <LifeBuoy size={20} color="#3673ff" />
                    <div className="flex-1">
                      <p className="text-[15px] font-black text-white">Help & Support</p>
                      <p className="text-[11px] text-white/30 font-bold">Get assistance</p>
                    </div>
                    <ChevronRight size={18} className="text-white/20" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden">
        <nav className="srmx-mobile-nav" aria-label="Main navigation">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item ${isActive(href, path) ? "active" : ""}`} onClick={() => setMoreOpen(false)}>
              <Icon size={22} strokeWidth={isActive(href, path) ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          ))}
          <button className={`nav-item ${moreOpen ? "active" : ""}`} onClick={() => setMoreOpen(!moreOpen)}>
            <MoreHorizontal size={22} strokeWidth={moreOpen ? 2.5 : 2} />
            <span>More</span>
          </button>
        </nav>
      </div>
    </>
  );

  if (!mounted) return null;
  return createPortal(navContent, document.body);
}
