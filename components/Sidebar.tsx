"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI, dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import PortalSyncModal from "@/components/PortalSyncModal";
import {
  Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield,
  X, ChevronRight, CreditCard, FileText, Bed, Bus, Bell, Award, MonitorPlay, Printer, Briefcase, UserSquare, User, GraduationCap, BookOpen, Settings, MoreHorizontal, Share2, LogOut, LayoutTemplate, LifeBuoy, MessageSquare,
  Fingerprint, RefreshCw, Cpu
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Nexus", icon: Home },
  { href: "/marks", label: "Marks", icon: BarChart2 },
  { href: "/attendance", label: "Attendance", icon: CheckCircle },
  { href: "/timetable", label: "Timetable", icon: Clock },
] as const;

const NAV_MORE_ITEMS = [
  { href: "/calendar", label: "Calendar", icon: Calendar, color: "#fff" },
  { href: "/app-tools", label: "Tools", icon: Wrench, color: "#00ff88" },
  { href: "/ai", label: "AI Tutor", icon: Sparkles, color: "#fff" },
  { href: "/gpa", label: "GPA Calc", icon: GraduationCap, color: "#fff" },
] as const;

const PORTAL_SERVICES = [
  { href: "/portal/student-dashboard", label: "Student Dashboard", icon: UserSquare },
  { href: "/portal/grade-mark-credit", label: "Grades & Credits", icon: GraduationCap },
] as const;

const ADMIN_EMAILS = ["ts0014@srmist.edu.in"];

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

  const { profile, email, academiaConnected, studentPortalConnected, studentPortalData, academicData } = useAuthStore();
  const userEmail = (email || profile?.Email || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.some((e) => e.toLowerCase() === userEmail) || profile?.role === "admin" || profile?.Role === "admin";

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    // Prefetch key routes to enable instant, mobile-native transitions
    router.prefetch("/dashboard");
    router.prefetch("/marks");
    router.prefetch("/attendance");
    router.prefetch("/timetable");
    router.prefetch("/calendar");
    router.prefetch("/ai");
    router.prefetch("/gpa");
    router.prefetch("/settings/theme");
    router.prefetch("/app-tools");
    router.prefetch("/trust");
    return () => clearTimeout(id);
  }, [router]);

  const handleLogout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* swallow */ }
    useAuthStore.getState().logout();
    router.push("/");
  }, [router]);

  // Close the drawer if the route changes
  useEffect(() => {
    const id = setTimeout(() => setMoreOpen(false), 0);
    return () => clearTimeout(id);
  }, [path]);

  // User profile details for the More drawer
  const userName = profile?.["Name"] || profile?.Name || "NITHISHKUMAR S";
  const regNo = profile?.["Registration Number"] || profile?.RegNo || "RA2511030010190";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Dynamic calculated stats for AURA Active Hero Section
  const att = academicData?.attendance || [];
  const avgAtt = (() => {
    if (!att.length) return "89.3";
    const totalH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Conducted"] || c.conducted) || 0), 0);
    if (totalH > 0) {
      const presentH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Attended"] || c.attended) || Math.max(0, (parseInt(c["Hours Conducted"] || c.conducted) || 0) - (parseInt(c["Hours Absent"] || c.absent) || 0))), 0);
      return ((presentH / totalH) * 100).toFixed(1);
    }
    const validPctCourses = att.filter((c: AnyValue) => {
      const p = c["Attn %"] || c.pct;
      return p !== undefined && p !== null && p !== "null";
    });
    if (validPctCourses.length > 0) {
      const sumPct = validPctCourses.reduce((s: number, c: AnyValue) => s + (parseFloat(c["Attn %"] || c.pct) || 0), 0);
      return (sumPct / validPctCourses.length).toFixed(1);
    }
    return "89.3";
  })();
  const riskCount = att.length
    ? att.filter((c: AnyValue) => {
        const pStr = c["Attn %"] || c.pct;
        if (pStr === undefined || pStr === null || pStr === "null") return false;
        const pct = parseFloat(pStr) || 0;
        return pct < 75;
      }).length
    : 0;

  // ── Contextual Intelligence Engine ──
  // Generates real interpretive insights from academic data — not fake AI,
  // just smart interpretation layers from what the store already knows.
  const contextualInsight = useMemo(() => {
    const insights: string[] = [];
    const attNum = parseFloat(String(avgAtt));
    
    if (att.length > 0) {
      if (attNum >= 90) insights.push("Attendance trajectory is excellent — top quartile performance");
      else if (attNum >= 80) insights.push("Attendance stability is within safe operating range");
      else if (attNum >= 75) insights.push("Attendance approaching risk threshold — monitor closely");
      else insights.push("Attendance below safe limits — immediate recovery recommended");

      if (riskCount === 0) insights.push("No academic anomalies detected");
      else if (riskCount === 1) insights.push(`1 subject flagged below 75% threshold`);
      else insights.push(`${riskCount} subjects require attendance intervention`);

      const lowSubs = att.filter((c: AnyValue) => {
        const pct = parseFloat(c["Attn %"] || 0);
        return pct >= 75 && pct < 80;
      });
      if (lowSubs.length > 0) insights.push(`${lowSubs.length} subject${lowSubs.length > 1 ? 's' : ''} within 5% of risk zone`);
    } else {
      insights.push("Awaiting academic data sync");
    }

    if (studentPortalConnected) insights.push("All data streams operational");
    else insights.push("Portal sync pending — displaying cached state");

    return insights[0] || "System nominal";
  }, [att, avgAtt, riskCount, studentPortalConnected]);

  // ── Dynamic Light Response (scroll-reactive) ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollGlow, setScrollGlow] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
      setScrollGlow(Math.min(pct, 1));
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const id = requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [moreOpen]);

  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshSync = async () => {
    setIsRefreshing(true);
    try {
      await dataAPI.forceRefresh();
      const unified = await dataAPI.getUnified();
      if (unified && unified.success) {
        const mergedData = {
          ...unified.academia,
          studentPortal: unified.studentPortal
        };
        useAuthStore.getState().setAcademicData(mergedData);
        if (unified.studentPortal) {
          useAuthStore.getState().setStudentPortalData(unified.studentPortal);
        }
        if (unified.academia?.profile) {
          useAuthStore.getState().setProfile(unified.academia.profile);
        }
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const hubAccent = "#BF5AF2";
  const hubAccentGlow = "rgba(191,90,242,0.15)";
  const hubBg = "#0f0a15";
  const hubCardBg = "rgba(255,255,255,0.03)";
  const hubCardBorder = "rgba(255,255,255,0.06)";

  const moreItems = [
    { href: "/calendar", label: "University Calendar", icon: Calendar, color: "#00E5FF" },
    { href: "/app-tools", label: "Sync & Connectors", icon: Wrench, color: "#34C759" },
    { href: "/ai", label: "AI Tutor", icon: Sparkles, color: "#BF5AF2" },
    { href: "/gpa", label: "GPA / CGPA Planner", icon: GraduationCap, color: "#FF2D55" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Control", icon: Shield, color: "#FF9500" }] : []),
  ];

  const portalServices = [
    { href: "/portal/student-dashboard", label: "Student Portal", icon: UserSquare, color: "#00E5FF" },
    { href: "/portal/grade-mark-credit", label: "Grades & Credits", icon: GraduationCap, color: "#FF2D55" },
  ];

  const isMoreActive = moreItems.some((item) => isActive(item.href, path)) || portalServices.some((item) => isActive(item.href, path));

  const navContent = (
    <>
      <style>{`
        .srmx-mobile-nav {
          position: fixed; bottom: 24px; left: 24px; right: 24px;
          height: 72px; border-radius: 36px;
          background: rgba(20,15,35,0.8); 
          backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); 
          border: none;
          display: flex; align-items: center; justify-content: space-around;
          z-index: 99999; box-shadow: 0 30px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06);
          padding: 0 12px;
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; color: rgba(255,255,255,0.55); font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 9px; font-weight: 800; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); -webkit-tap-highlight-color: transparent;
          background: none; border: none; outline: none; text-decoration: none; width: 64px;
          position: relative;
        }
        .nav-item:hover { color: rgba(255,255,255,0.7); }
        .nav-item.active { 
          color: #BF5AF2; 
        }
        .nav-item.active::after {
          content: ""; position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
          width: 32px; height: 4px; border-radius: 4px;
          background: #BF5AF2; 
          box-shadow: 0 0 15px #BF5AF2;
        }
        .drawer-item-icon {
          width: 52px; height: 52px; border-radius: 18px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .drawer-item-icon.active {
          background: rgba(191, 90, 242, 0.08); 
          border-color: rgba(191, 90, 242, 0.15); 
          color: #BF5AF2;
        }
        .matrix-font { font-family: "JetBrains Mono", "Courier New", monospace; }
        .nav-indicator {
           content: ""; position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
           width: 32px; height: 4px; border-radius: 4px;
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes heroGlow {
          0%, 100% {
            box-shadow: 0 0 35px rgba(168, 85, 247, 0.07);
          }
          50% {
            box-shadow: 0 0 55px rgba(168, 85, 247, 0.16);
          }
        }
        @keyframes heroBreathe {
          0%, 100% {
            opacity: 0.8;
            transform: scale(0.97);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }

        @media (min-width: 768px) {
          main, .page-main, .swipe-wrapper > div:last-child {
            padding-left: 288px !important;
            padding-right: 32px !important;
          }
          .fixed.top-12 {
            left: 288px !important;
          }
          .fixed.top-12 button {
            display: none !important;
          }
        }

        @media (min-width: 1180px) {
          main, .page-main, .swipe-wrapper > div:last-child {
            padding-left: 320px !important;
            padding-right: 48px !important;
          }
          .fixed.top-12 {
            left: 320px !important;
            right: 48px !important;
          }
        }

        .desktop-sidebar {
          display: none !important;
        }
        @media (min-width: 768px) {
          .desktop-sidebar {
            display: flex !important;
          }
        }

        .more-drawer {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 0;
          width: min(calc(100vw - 16px), 640px);
          left: 50% !important;
          right: auto !important;
          transform: translateX(-50%);
        }

        .more-drawer-body {
          overscroll-behavior: contain;
        }

        .more-drawer-body::-webkit-scrollbar {
          display: none;
        }

        .more-drawer-body .grid.grid-cols-6 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .more-drawer-body .grid.grid-cols-6 > button {
          grid-column: span 1 / span 1 !important;
          min-height: 94px !important;
          border-radius: 20px !important;
          padding: 12px !important;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18) !important;
        }

        .more-drawer-body .grid.grid-cols-6 > button:first-child,
        .more-drawer-body .grid.grid-cols-6 > button:nth-child(4),
        .more-drawer-body .grid.grid-cols-6 > button:nth-child(7) {
          grid-column: 1 / -1 !important;
          min-height: auto !important;
        }

        .more-drawer-body .grid.grid-cols-6 > button span {
          overflow-wrap: anywhere;
        }

        .more-drawer-body .grid.grid-cols-6 > button [class*="text-[7px]"],
        .more-drawer-body .grid.grid-cols-6 > button [class*="text-[8px]"] {
          letter-spacing: 0.04em !important;
        }

        .more-drawer-body .grid.grid-cols-6 > button .w-12,
        .more-drawer-body .grid.grid-cols-6 > button .h-12 {
          width: 42px !important;
          height: 42px !important;
        }

        .more-drawer-body .grid.grid-cols-6 > button .w-10,
        .more-drawer-body .grid.grid-cols-6 > button .h-10,
        .more-drawer-body .grid.grid-cols-6 > button .w-11,
        .more-drawer-body .grid.grid-cols-6 > button .h-11 {
          width: 38px !important;
          height: 38px !important;
          border-radius: 14px !important;
        }

        @media (max-width: 380px) {
          .more-drawer-body {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }

          .more-drawer-body .grid.grid-cols-6 {
            grid-template-columns: 1fr;
          }

          .more-drawer-body .grid.grid-cols-6 > button {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>

      {/* TOP STATUS BAR */}
      {!(path === "/chat" || path.startsWith("/chat/")) && (
        <div className="fixed top-12 left-6 right-6 z-[99999] flex items-center justify-between pointer-events-none">
          <div 
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border"
            style={{ 
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.08)"
            }}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${(academiaConnected || studentPortalConnected) ? "bg-[#94FFD8]" : "bg-amber-500"}`} />
            <span className="text-[9px] font-black tracking-widest text-white/60 uppercase">{(academiaConnected || studentPortalConnected) ? "SYNCED" : "LOCAL MODE"}</span>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => { router.push("/notifications"); }} 
              className="w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center text-white/60 transition-all active:scale-90"
              style={{ 
                background: "rgba(143, 146, 255, 0.1)",
                borderColor: "rgba(143, 146, 255, 0.2)",
                boxShadow: "0 0 15px rgba(143, 146, 255, 0.15)"
              }}
            >
              <Bell size={18} color="#8F92FF" />
            </button>
            <button 
              onClick={() => { setMenuOpen(true); }} 
              className="w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center text-white/60 transition-all active:scale-90"
              style={{ 
                background: "rgba(255, 117, 195, 0.1)",
                borderColor: "rgba(255, 117, 195, 0.2)",
                boxShadow: "0 0 15px rgba(255, 117, 195, 0.15)"
              }}
            >
              <Settings size={18} color="#FF75C3" />
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
        {menuOpen && (
          <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-6">
            <div onClick={(e) => e.stopPropagation()} className="bg-[#0f0f13] border border-white/10 p-6 rounded-[32px] w-full max-w-[360px] flex flex-col gap-6 shadow-2xl">
              <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black">Control Center</div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setMenuOpen(false); router.push("/settings/theme"); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-left">
                  <LayoutTemplate size={20} color={THEME.accentPurple} /> Themes & UI
                </button>
                <button onClick={() => { setMenuOpen(false); router.push("/settings/notifications"); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-left">
                  <Bell size={20} color="#8F92FF" /> Notifications
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

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <div className="desktop-sidebar" style={{
        position: "fixed", left: "24px", top: "24px", bottom: "24px", width: "248px",
        background: "rgba(20,15,35,0.85)",
        backdropFilter: "blur(40px)",
        borderRadius: "32px", border: `1.5px solid ${hubCardBorder}`,
        boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${hubAccentGlow}`,
        padding: "22px", flexDirection: "column",
        zIndex: 99999, overflowY: "auto"
      }}>
         {/* Top Profile Area */}
         <div>
           <div className="flex items-center gap-3 pb-6 border-b border-white/5 mb-6">
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center text-black text-sm font-black shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, ${hubAccent} 0%, #ffffff 200%)`, 
                  boxShadow: `0 4px 12px ${hubAccentGlow}` 
                }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white leading-tight truncate">{userName}</h3>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1 tabular-nums">{regNo.substring(0, 10)}...</p>
              </div>
           </div>

           {/* Main Links */}
           <div className="flex flex-col gap-2">
             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.25em] mb-2 pl-1">Nexus Core</p>
             {NAV_MAIN.map(({ href, label, icon: Icon }) => (
               <Link 
                 key={href} 
                 href={href} 
                 prefetch={true}
                 className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all ${isActive(href, path) ? "text-white" : "text-white/40 hover:text-white/70"}`}
                 style={{ 
                   background: isActive(href, path) ? hubAccentGlow : "transparent",
                   border: isActive(href, path) ? `1px solid ${hubCardBorder}` : "1px solid transparent"
                 }}
               >
                 <Icon size={18} color={isActive(href, path) ? hubAccent : "currentColor"} />
                 <span className="text-xs font-black tracking-wide">{label}</span>
               </Link>
             ))}

             <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.25em] mt-4 mb-2 pl-1">Extended Tools</p>
             {moreItems.map(({ href, label, icon: Icon, color }) => (
               <Link 
                 key={href} 
                 href={href} 
                 prefetch={true}
                 className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all ${isActive(href, path) ? "text-white" : "text-white/40 hover:text-white/70"}`}
                 style={{ 
                   background: isActive(href, path) ? hubAccentGlow : "transparent",
                   border: isActive(href, path) ? `1px solid ${hubCardBorder}` : "1px solid transparent"
                 }}
               >
                 <Icon size={18} color={isActive(href, path) ? hubAccent : color} />
                 <span className="text-xs font-black tracking-wide">{label}</span>
               </Link>
             ))}
           </div>
         </div>

         {/* Bottom Actions */}
         <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
           <button 
             onClick={() => router.push("/settings/theme")}
             className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all text-white/40 hover:text-white/70 w-full"
           >
             <Settings size={18} />
             <span className="text-xs font-black tracking-wide">Settings</span>
           </button>
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all text-red-500/80 hover:text-red-500 w-full"
           >
             <LogOut size={18} />
             <span className="text-xs font-black tracking-wide uppercase font-sans">Sign Out</span>
           </button>
         </div>
      </div>

      {/* BOTTOM NAV BAR (FLAT STYLE) */}
      <div className="md:hidden">
        <nav className="srmx-mobile-nav" aria-label="Main navigation">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} prefetch={true} className={`nav-item ${isActive(href, path) ? "active" : ""}`}>
              <Icon size={20} strokeWidth={isActive(href, path) ? 3 : 2} />
              <span>{label}</span>
            </Link>
          ))}
          <button 
            onClick={() => setMoreOpen(true)} 
            className={`nav-item ${moreOpen || isMoreActive ? "active" : ""}`}
            style={{ background: "none", border: "none", outline: "none" }}
          >
            <MoreHorizontal size={20} strokeWidth={moreOpen || isMoreActive ? 3 : 2} />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* INLINE MORE DRAWER (CENTRAL HUB) */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setMoreOpen(false)} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99998]"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          />

          {/* Bottom Drawer */}
          <div 
            className="more-drawer fixed bottom-0 left-0 right-0 max-h-[88vh] z-[99999] rounded-t-[28px] flex flex-col overflow-hidden"
            style={{ 
              background: "#110c1e",
              boxShadow: `0 -20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)`,
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))'
            }}
          >
              {/* RowItem helper component inside Sidebar */}
              {(() => {
                const RowItem = ({ href, label, subtitle, icon: Icon, color, onClick }: AnyValue) => {
                  const content = (
                    <div className="flex items-center justify-between w-full py-3.5 px-4 rounded-[20px] bg-white/[0.01] hover:bg-white/[0.04] transition-all active:scale-[0.99] group border border-white/[0.02] hover:border-white/[0.04] text-left">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shrink-0" style={{ background: `${color}12`, color: color }}>
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-white/90 tracking-wide truncate">{label}</span>
                          <span className="text-[9.5px] text-white/45 font-bold mt-1 leading-normal tracking-wide">{subtitle}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                    </div>
                  );

                  if (onClick) {
                    return (
                      <button onClick={onClick} className="w-full text-left p-0 bg-transparent border-none outline-none block">
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link href={href} prefetch={true} onClick={() => setMoreOpen(false)} className="w-full block">
                      {content}
                    </Link>
                  );
                };

                return (
                  <>
                    <div 
                      className="shrink-0 flex flex-col w-full relative z-10"
                      style={{ background: "#110c1e" }}
                    >
                      {/* Drag Bar Handle */}
                      <div 
                        className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-3 shrink-0 cursor-pointer hover:bg-white/30 active:scale-95 transition-all" 
                        onClick={() => setMoreOpen(false)} 
                      />

                      {/* Profile Header Section */}
                      <div className="flex items-center justify-between px-6 pb-3 pt-1 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-black text-xs font-black shrink-0 relative overflow-hidden border border-white/5"
                            style={{ 
                              background: `linear-gradient(135deg, ${hubAccent} 0%, #ffffff 200%)`, 
                              boxShadow: `0 4px 10px ${hubAccentGlow}` 
                            }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-[11.5px] font-black text-white leading-tight truncate tracking-wide uppercase">{userName}</h2>
                            <p className="text-[7.5px] text-white/40 font-bold uppercase tracking-widest mt-0.5 tabular-nums">{regNo}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`w-1 h-1 rounded-full ${academiaConnected || studentPortalConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                              <span className="text-[7.5px] font-black text-white/30 uppercase tracking-widest">
                                {academiaConnected || studentPortalConnected ? "Synced" : "Local Mode"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setMoreOpen(false)}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/5 active:scale-90 hover:bg-white/10 transition-all shrink-0"
                        >
                          <X size={12} className="text-white/60" />
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 px-6 py-3 bg-white/[0.01] border-b border-white/5">
                        <button
                          onClick={handleRefreshSync}
                          disabled={isRefreshing}
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 px-3 text-[9px] font-black tracking-wider text-white uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
                          <span>{isRefreshing ? "Syncing..." : "Refresh Data"}</span>
                        </button>
                        {!studentPortalConnected ? (
                          <button
                            onClick={() => { setMoreOpen(false); setIsSyncOpen(true); }}
                            className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl py-2 px-3 text-[9px] font-black tracking-wider text-purple-300 uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <Cpu size={11} />
                            <span>Connect Student Portal</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => { setMoreOpen(false); setShowStudentInfo(true); }}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 px-3 text-[9px] font-black tracking-wider text-white uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <Fingerprint size={11} />
                            <span>Student ID</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SCROLLABLE BODY */}
                    <div 
                      ref={scrollRef}
                      className="more-drawer-body px-5 py-4 flex-1 overflow-y-auto flex flex-col gap-5 w-full relative z-0"
                      style={{ 
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        scrollbarWidth: "none"
                      }}
                    >
                      {/* 1. ACADEMIC TOOLS */}
                      <div className="flex flex-col gap-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 pl-1">Academic Tools</p>
                        <RowItem 
                          href="/ai" 
                          label="AI Tutor" 
                          subtitle="Academic help, insights & instant analysis" 
                          icon={Sparkles} 
                          color="#BF5AF2" 
                        />
                        <RowItem 
                          href="/gpa" 
                          label="GPA / CGPA Planner" 
                          subtitle="Target forecast and GPA calculator" 
                          icon={GraduationCap} 
                          color="#FF2D55" 
                        />
                        <RowItem 
                          href="/calendar" 
                          label="University Calendar" 
                          subtitle="Holidays, exams, and key academic events" 
                          icon={Calendar} 
                          color="#00E5FF" 
                        />
                        <RowItem 
                          href="/portal/student-dashboard" 
                          label="Student Portal" 
                          subtitle="Official personal details & student summary" 
                          icon={UserSquare} 
                          color="#FF75C3" 
                        />
                        <RowItem 
                          href="/portal/grade-mark-credit" 
                          label="Grades & Credits" 
                          subtitle="Semester grade ledger & credits tracker" 
                          icon={Award} 
                          color="#FF9500" 
                        />
                      </div>

                      {/* 2. SETTINGS */}
                      <div className="flex flex-col gap-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 pl-1">Settings</p>
                        <RowItem 
                          href="/settings/theme" 
                          label="Appearance" 
                          subtitle="Personalize workspace visual styles & themes" 
                          icon={LayoutTemplate} 
                          color="#A78BFA" 
                        />
                        <RowItem 
                          href="/settings/notifications" 
                          label="Notifications" 
                          subtitle="Manage academic alerts and system updates" 
                          icon={Bell} 
                          color="#8F92FF" 
                        />
                        <RowItem 
                          href="/app-tools" 
                          label="Sync & Connectors" 
                          subtitle="System diagnostics, sync options & overrides" 
                          icon={Wrench} 
                          color="#34C759" 
                        />
                        <RowItem 
                          href="/trust" 
                          label="Privacy & Trust" 
                          subtitle="Encrypted sessions & secure data practices" 
                          icon={Shield} 
                          color="#38BDF8" 
                        />
                      </div>

                      {/* 3. SUPPORT */}
                      <div className="flex flex-col gap-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1 pl-1">Support</p>
                        <RowItem 
                          href="/support" 
                          label="Help & Support" 
                          subtitle="Get immediate assistance with Academic OS" 
                          icon={LifeBuoy} 
                          color="#00aaff" 
                        />
                        <RowItem 
                          href="#" 
                          label="Logout" 
                          subtitle="Safely terminate your local active session" 
                          icon={LogOut} 
                          color="#ff5555" 
                          onClick={() => { setMoreOpen(false); handleLogout(); }}
                        />
                      </div>

                      {/* 4. ADMIN CONTROL (Only if admin role) */}
                      {isAdmin && (
                        <div className="flex flex-col gap-2">
                          <p className="text-[9px] font-black text-red-500/40 uppercase tracking-[0.3em] mb-1 pl-1">System Administration</p>
                          <RowItem 
                            href="/admin" 
                            label="Admin Control" 
                            subtitle="Manage broadcast banner & system telemetry" 
                            icon={Shield} 
                            color="#ef4444" 
                          />
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
          </div>
        </>
      )}

      {/* Student info details modal */}
      {showStudentInfo && profile && (
        <div 
          onClick={() => setShowStudentInfo(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100000] flex items-center justify-center p-6"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div onClick={e => e.stopPropagation()} className="bg-[#0f0f13] border border-white/10 p-6 rounded-[28px] w-full max-w-[380px] flex flex-col gap-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black">Student Details</div>
              <button onClick={() => setShowStudentInfo(false)} className="text-white/40 text-xl font-bold hover:text-white/70">×</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {["Registration Number", "Name", "Combo / Batch", "Program", "Department", "Semester", "Class Room"].map(key => {
                const value = profile[key] || 
                              profile[key.toLowerCase()] || 
                              profile[key.replace(/\s+/g, '')] ||
                              profile[key.replace(/\s+/g, '').toLowerCase()];
                if (!value) return null;
                return (
                  <div key={key} className="bg-white/5 border border-white/[0.05] p-3 rounded-2xl flex flex-col gap-1">
                    <span className="text-[8px] text-white/40 font-black uppercase tracking-wider">{key}</span>
                    <span className="text-xs font-bold text-white truncate">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Portal Sync Modal integration in Sidebar */}
      <PortalSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onSuccess={() => {
          handleRefreshSync();
        }}
        netId={profile?.["Registration Number"] || profile?.RegNo || ""}
      />
    </>
  );

  if (!mounted) return null;
  return createPortal(navContent, document.body);
}
