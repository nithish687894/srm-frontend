"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import {
  Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield,
  X, ChevronRight, CreditCard, FileText, Bed, Bus, Bell, Award, MonitorPlay, Printer, Briefcase, UserSquare, User, GraduationCap, BookOpen, Settings, MoreHorizontal, Share2, LogOut, LayoutTemplate, LifeBuoy, MessageSquare
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

  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

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
  const regNo = profile?.["Registration Number"] || profile?.RegNo || "RA2311026010156";
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
    const totalH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Conducted"]) || 0), 0);
    const presentH = att.reduce((s: number, c: AnyValue) => s + (parseInt(c["Hours Attended"]) || Math.max(0, (parseInt(c["Hours Conducted"]) || 0) - (parseInt(c["Hours Absent"]) || 0))), 0);
    return totalH > 0 ? ((presentH / totalH) * 100).toFixed(1) : "89.3";
  })();
  const riskCount = att.length
    ? att.filter((c: AnyValue) => parseFloat(c["Attn %"] || 0) < 75).length
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

  // Theme configuration for drawer styling
  const hubAccent = theme === "aura" ? "#BF5AF2" : THEME.accentCyan;
  const hubAccentGlow = theme === "aura" ? "rgba(191,90,242,0.15)" : "rgba(0, 212, 255, 0.15)";
  const hubBg = theme === "aura" ? "#0f0a15" : "#0a0a0c";
  const hubCardBg = "rgba(255,255,255,0.03)";
  const hubCardBorder = "rgba(255,255,255,0.06)";

  const moreItems = [
    { href: "/calendar", label: "Calendar", icon: Calendar, color: theme === "aura" ? "#00E5FF" : THEME.accentCyan },
    { href: "/app-tools", label: "Tools", icon: Wrench, color: theme === "aura" ? "#34C759" : "#00ff88" },
    { href: "/ai", label: "AI Tutor", icon: Sparkles, color: theme === "aura" ? "#BF5AF2" : "#bf00ff" },
    { href: "/gpa", label: "GPA Calc", icon: GraduationCap, color: theme === "aura" ? "#FF2D55" : "#ffffff" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield, color: theme === "aura" ? "#FF9500" : "#ff3b30" }] : []),
  ];

  const portalServices = [
    { href: "/portal/student-dashboard", label: "Student Dashboard", icon: UserSquare, color: theme === "aura" ? "#00E5FF" : THEME.accentCyan },
    { href: "/portal/grade-mark-credit", label: "Grade & Credit", icon: GraduationCap, color: theme === "aura" ? "#FF2D55" : "#ffffff" },
  ];

  const isMoreActive = moreItems.some((item) => isActive(item.href, path)) || portalServices.some((item) => isActive(item.href, path));

  const navContent = (
    <>
      <style>{`
        .srmx-mobile-nav {
          position: fixed; bottom: 24px; left: 24px; right: 24px;
          height: 72px; border-radius: 36px;
          background: ${theme === "aura" ? "rgba(20,15,35,0.8)" : "rgba(10,10,12,0.6)"}; 
          backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); 
          border: none;
          display: flex; align-items: center; justify-content: space-around;
          z-index: 99999; box-shadow: 0 30px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06);
          padding: 0 12px;
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; color: rgba(255,255,255,0.3); font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 9px; font-weight: 800; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); -webkit-tap-highlight-color: transparent;
          background: none; border: none; outline: none; text-decoration: none; width: 64px;
          position: relative;
        }
        .nav-item:hover { color: rgba(255,255,255,0.7); }
        .nav-item.active { 
          color: ${theme === "aura" ? "#BF5AF2" : THEME.accentCyan}; 
        }
        .nav-item.active::after {
          content: ""; position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
          width: 32px; height: 4px; border-radius: 4px;
          background: ${theme === "aura" ? "#BF5AF2" : THEME.accentCyan}; 
          box-shadow: 0 0 15px ${theme === "aura" ? "#BF5AF2" : THEME.accentCyan};
        }
        .nav-item.active { color: ${'#FF75C3'}; }
        .drawer-item-icon {
          width: 52px; height: 52px; border-radius: 18px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .drawer-item-icon.active {
          background: rgba(255, 117, 195, 0.08); 
          border-color: rgba(255, 117, 195, 0.15); 
          color: #FF75C3;
        }
      `}</style>

      {/* TOP STATUS BAR */}
      <div className="fixed top-12 left-6 right-6 z-[99999] flex items-center justify-between pointer-events-none">
        <div 
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border"
          style={{ 
            background: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.08)'
          }}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${studentPortalConnected ? ("bg-[#94FFD8]") : "bg-red-500"}`} />
          <span className="text-[9px] font-black tracking-widest text-white/60 uppercase">{studentPortalConnected ? "SYNCED" : "OFFLINE"}</span>
        </div>
        <button 
          onClick={() => { setMenuOpen(true); setMoreOpen(false); }} 
          className="pointer-events-auto w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center text-white/60 transition-all active:scale-90"
          style={{ 
            background: 'rgba(255, 117, 195, 0.1)',
            borderColor: 'rgba(255, 117, 195, 0.2)',
            boxShadow: '0 0 15px rgba(255, 117, 195, 0.15)'
          }}
        >
          <Settings size={18} color={'#FF75C3'} />
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
                background: 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                borderTop: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

              {/* USER INFO */}
              <div className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.05] rounded-[28px] mb-8">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-black text-xl font-black"
                  style={{ 
                    background: 'linear-gradient(135deg, #FF75C3, #8F92FF)',
                    boxShadow: `0 8px 20px ${'rgba(255, 117, 195, 0.2)'}`
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className={`text-lg font-black text-white leading-tight truncate ${''}`}>{userName}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{regNo}</p>
                    {academicData?.profile?.["Degree"] && (
                      <p className="text-[10px] text-white/20 font-bold uppercase">• {academicData.profile["Degree"]}</p>
                    )}
                  </div>
                  {studentPortalConnected && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-full bg-white/[0.05] border border-white/10">
                      <div className={`w-1 h-1 rounded-full ${'bg-[#FF75C3]'}`} />
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
                      <div className={`drawer-item-icon ${isActive(href, path) ? "active" : ""}`} style={{ color: isActive(href, path) ? ('#FF75C3') : (color) }}>
                        <Icon size={22} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider text-center ${'text-white/40'}`}>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
           </div>

              {/* SERVICES GRID */}
              <div className="mb-10">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-5 pl-1">Portal Services</p>
                <div className="grid grid-cols-4 gap-4">
                  {PORTAL_SERVICES.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="flex flex-col items-center gap-3">
                      <div className={`drawer-item-icon ${isActive(href, path) ? "active" : ""}`} style={{ color: isActive(href, path) ? ('#FF75C3') : ('#fff') }}>
                        <Icon size={22} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider text-center leading-tight ${'text-white/40'}`}>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="flex flex-col gap-3">
                <p className={`text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 pl-1 ${''}`}>Quick Actions</p>
                <button onClick={() => { setMoreOpen(false); router.push("/settings/theme"); }} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-[24px] text-left transition-all active:scale-[0.98]">
                  <LayoutTemplate size={20} color={'#bf00ff'} />
                  <div className="flex-1">
                    <p className={`text-[15px] font-black text-white ${''}`}>Themes & Layout</p>
                    <p className="text-[11px] text-white/20 font-bold">Customize your Nexus experience</p>
                  </div>
                  <ChevronRight size={18} className="text-white/10" />
                </button>
                <button onClick={() => { setMoreOpen(false); router.push("/support"); }} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-[24px] text-left transition-all active:scale-[0.98]">
                  <LifeBuoy size={20} color={'#3673ff'} />
                  <div className="flex-1">
                    <p className={`text-[15px] font-black text-white ${''}`}>Help & Support</p>
                    <p className="text-[11px] text-white/20 font-bold">Get assistance with Academic OS</p>
                  </div>
                  <ChevronRight size={18} className="text-white/10" />
                </button>
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
            <Link key={href} href={href} className={`nav-item ${isActive(href, path) ? "active" : ""}`}>
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
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-[99999] rounded-t-[32px] flex flex-col overflow-hidden"
            style={{ 
              background: theme === "aura" ? "#110c1e" : "#0c0c10",
              boxShadow: `0 -20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)`,
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))'
            }}
          >
              <div 
                className="shrink-0 flex flex-col w-full relative z-10"
                style={{ background: theme === "aura" ? "#110c1e" : "#0c0c10" }}
              >
                {/* Drag Bar Handle */}
                <div 
                  className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-3 shrink-0 cursor-pointer hover:bg-white/30 active:scale-95 transition-all" 
                  onClick={() => setMoreOpen(false)} 
                />

                {/* Profile Header Section */}
                <div className="flex items-center gap-4 px-6 pb-4">
                  {/* Initials Avatar */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-black text-base font-black shrink-0 relative overflow-hidden border border-white/5"
                    style={{ 
                      background: `linear-gradient(135deg, ${hubAccent} 0%, #ffffff 200%)`, 
                      boxShadow: `0 4px 12px ${hubAccentGlow}` 
                    }}
                  >
                    {initials}
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-black text-white leading-tight truncate tracking-wide">{userName}</h2>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1 tabular-nums">{regNo}</p>
                    
                    {studentPortalConnected && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1.5 rounded-full bg-white/[0.04] border border-white/5">
                        <div 
                          className="w-1 h-1 rounded-full animate-pulse" 
                          style={{ 
                            background: hubAccent, 
                            boxShadow: `0 0 6px ${hubAccent}` 
                          }} 
                        />
                        <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Portal Linked</span>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button 
                    onClick={() => setMoreOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/5 active:scale-90 hover:bg-white/10 transition-all shrink-0 self-start"
                  >
                    <X size={14} className="text-white/60" />
                  </button>
                </div>
              </div>

              {/* SCROLLABLE BODY */}
              <div 
                ref={scrollRef}
                className="px-6 py-5 flex-1 overflow-y-auto flex flex-col gap-6 w-full relative z-0"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  scrollbarWidth: "none"
                }}
              >
                {/* 1. AURA ACTIVE HERO */}
                <div 
                  className="w-full rounded-[24px] bg-white/[0.02] backdrop-blur-xl p-5 flex flex-col gap-4 relative overflow-hidden border border-white/[0.04]"
                  style={{
                    animation: 'heroGlow 6s cubic-bezier(0.37, 0, 0.63, 1) infinite'
                  }}
                >
                  {/* Ambient gradient — dynamic light response: shifts with scroll */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(circle at ${30 + scrollGlow * 40}% ${20 + scrollGlow * 30}%, rgba(168, 85, 247, ${0.08 + scrollGlow * 0.05}), transparent 55%),
                        radial-gradient(circle at ${70 - scrollGlow * 20}% ${80 - scrollGlow * 20}%, rgba(0, 229, 255, ${0.04 + scrollGlow * 0.03}), transparent 50%)
                      `,
                      transition: 'background 0.8s ease'
                    }}
                  />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black tracking-[0.2em] text-white/50 uppercase">
                        AURA ACTIVE
                      </span>
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">
                        Academic Intelligence Engine
                      </span>
                    </div>
                    {/* Live Status indicator */}
                    <div 
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ animation: 'heroBreathe 2s ease-in-out infinite' }} />
                      <span className="text-[8px] font-black tracking-widest text-purple-300 uppercase">ONLINE</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 relative z-10 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">Attendance</span>
                      <span className="text-lg font-black text-white tracking-tight mt-0.5">{avgAtt}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">Status</span>
                      <span className={`text-lg font-black tracking-tight mt-0.5 ${riskCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {riskCount > 0 ? `${riskCount} Risks` : "Optimal"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">Core Sync</span>
                      <span className="text-lg font-black text-white/80 tracking-tight mt-0.5">
                        {studentPortalConnected ? "100%" : "Cached"}
                      </span>
                    </div>
                  </div>

                  {/* Contextual Intelligence — real interpretive insight */}
                  <div className="relative z-10 pt-2 border-t border-white/5">
                    <p className="text-[9px] text-white/45 font-semibold leading-relaxed tracking-wide flex items-center gap-2">
                      <span className="text-purple-400 shrink-0">⦿</span>
                      <span>{contextualInsight}</span>
                    </p>
                  </div>
                </div>

                {/* 2. SYMMETRICAL BENTO GRID */}
                <div>
                  <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.3em] mb-3 pl-1">Nexus Intelligence</p>
                  <div className="grid grid-cols-6 gap-3">
                    
                    {/* AURA AI Tutor (6 cols) */}
                    <button
                      onClick={() => { setMoreOpen(false); router.push("/ai"); }}
                      className="group relative col-span-6 overflow-hidden rounded-[24px] border border-purple-500/10 bg-gradient-to-r from-purple-900/15 via-indigo-950/10 to-transparent p-5 text-left backdrop-blur-xl shadow-xl transition-all duration-300 hover:scale-[1.01] hover:border-purple-500/25 hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]"
                    >
                      <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                      <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-[inset_0_0_12px_rgba(168,85,247,0.2)] group-hover:scale-105 transition-transform duration-300">
                            <Sparkles size={22} className="animate-spin-slow" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white tracking-wide">AURA AI Tutor</span>
                              <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black tracking-widest text-purple-300 bg-purple-500/20 border border-purple-500/30 uppercase animate-pulse">AI ACTIVE</span>
                            </div>
                            <span className="text-[10px] text-white/45 font-semibold mt-1 leading-normal">Instant academic support, insights & analysis</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-purple-400 group-hover:border-purple-500/20 group-hover:bg-purple-500/10 transition-all duration-300 shrink-0">
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </button>

                    {/* Attendance (3 cols) */}
                    <button
                      onClick={() => { setMoreOpen(false); router.push("/attendance"); }}
                      className="group relative col-span-3 overflow-hidden rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between text-left backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/25 hover:bg-white/[0.03] hover:shadow-[0_0_25px_rgba(52,199,89,0.12)] min-h-[112px]"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                          <CheckCircle size={20} />
                        </div>
                        <div className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                          {avgAtt}%
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-[11px] font-black text-white/90 tracking-wide block">Attendance</span>
                        <span className="text-[9px] text-white/40 font-bold mt-1 block">Live track log</span>
                      </div>
                    </button>

                    {/* GPA Calculator (3 cols) */}
                    <button
                      onClick={() => { setMoreOpen(false); router.push("/gpa"); }}
                      className="group relative col-span-3 overflow-hidden rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between text-left backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-rose-500/25 hover:bg-white/[0.03] hover:shadow-[0_0_25px_rgba(255,45,85,0.12)] min-h-[112px]"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform duration-300">
                          <GraduationCap size={20} />
                        </div>
                        <div className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider text-rose-300 bg-rose-500/10 border border-rose-500/20 uppercase">
                          What-If
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-[11px] font-black text-white/90 tracking-wide block">GPA Calc</span>
                        <span className="text-[9px] text-white/40 font-bold mt-1 block">Target forecast</span>
                      </div>
                    </button>

                    {/* Calendar (6 cols) */}
                    <button
                      onClick={() => { setMoreOpen(false); router.push("/calendar"); }}
                      className="group relative col-span-6 overflow-hidden rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-4 text-left backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-[1.01] hover:border-cyan-500/25 hover:bg-white/[0.03] hover:shadow-[0_0_25px_rgba(0,229,255,0.12)]"
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Calendar size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white tracking-wide">University Calendar</span>
                            <span className="text-[10px] text-white/45 font-semibold mt-1 leading-normal">Holidays, exams, and key academic events</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-cyan-400 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/10 transition-all duration-300 shrink-0">
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </button>

                    {/* Student Dashboard (3 cols) */}
                    <button
                      onClick={() => { setMoreOpen(false); router.push("/portal/student-dashboard"); }}
                      className="group relative col-span-3 overflow-hidden rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between text-left backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/25 hover:bg-white/[0.03] hover:shadow-[0_0_25px_rgba(255,117,195,0.12)] min-h-[112px]"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20 group-hover:scale-105 transition-transform duration-300">
                          <UserSquare size={20} />
                        </div>
                        <div className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider text-pink-300 bg-pink-500/10 border border-pink-500/20 uppercase">
                          Profile
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-[11px] font-black text-white/90 tracking-wide block">Student Portal</span>
                        <span className="text-[9px] text-white/40 font-bold mt-1 block">Full profile view</span>
                      </div>
                    </button>

                    {/* Grades Log (3 cols) */}
                    <button
                      onClick={() => { setMoreOpen(false); router.push("/portal/grade-mark-credit"); }}
                      className="group relative col-span-3 overflow-hidden rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between text-left backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-amber-500/25 hover:bg-white/[0.03] hover:shadow-[0_0_25px_rgba(255,149,0,0.12)] min-h-[112px]"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                          <Award size={20} />
                        </div>
                        <div className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 uppercase">
                          Ledger
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-[11px] font-black text-white/90 tracking-wide block">Grades & Credit</span>
                        <span className="text-[9px] text-white/40 font-bold mt-1 block">GPA & credit tracker</span>
                      </div>
                    </button>

                    {/* System Tools (full width if not admin, half width if admin) */}
                    <button
                      onClick={() => { setMoreOpen(false); router.push("/app-tools"); }}
                      className={`group relative overflow-hidden rounded-[24px] border border-white/[0.04] bg-white/[0.01] p-4 text-left backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-[1.01] hover:border-yellow-500/25 hover:bg-white/[0.03] hover:shadow-[0_0_25px_rgba(255,204,0,0.12)] ${isAdmin ? 'col-span-3 min-h-[112px] flex flex-col justify-between' : 'col-span-6'}`}
                    >
                      {isAdmin ? (
                        <>
                          <div className="flex items-start justify-between w-full">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 group-hover:scale-105 transition-transform duration-300">
                              <Wrench size={20} />
                            </div>
                            <div className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 uppercase">
                              Tools
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-[11px] font-black text-white/90 tracking-wide block">System Tools</span>
                            <span className="text-[9px] text-white/40 font-bold mt-1 block">Nexus diagnostics</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 group-hover:scale-105 transition-transform duration-300">
                              <Wrench size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white tracking-wide">System Tools</span>
                              <span className="text-[10px] text-white/45 font-semibold mt-1 leading-normal">Nexus diagnostics & system utilities</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-yellow-400 group-hover:border-yellow-500/20 group-hover:bg-yellow-500/10 transition-all duration-300 shrink-0">
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Admin Panel (col-span-3, ONLY displayed if user is admin) */}
                    {isAdmin && (
                      <button
                        onClick={() => { setMoreOpen(false); router.push("/admin"); }}
                        className="group relative col-span-3 overflow-hidden rounded-[24px] border border-red-500/10 bg-red-500/[0.02] p-4 flex flex-col justify-between text-left backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-red-500/30 hover:bg-red-500/[0.05] hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] min-h-[112px]"
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Shield size={20} />
                          </div>
                          <div className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider text-red-300 bg-red-500/10 border border-red-500/20 uppercase">
                            Admin
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-[11px] font-black text-red-400 tracking-wide block">Admin Control</span>
                          <span className="text-[9px] text-white/40 font-bold mt-1 block">System configurations</span>
                        </div>
                      </button>
                    )}

                  </div>
                </div>

                {/* 3. QUICK ACTIONS & CUSTOMIZATION */}
                <div className="flex flex-col gap-2.5">
                  <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.3em] mb-1 pl-1">Configuration</p>
                  
                  {/* Theme Settings */}
                  <button 
                    onClick={() => { setMoreOpen(false); router.push("/settings/theme"); }} 
                    className="group relative overflow-hidden flex items-center justify-between p-3.5 rounded-[20px] text-left w-full border border-white/[0.04] bg-white/[0.01] backdrop-blur-xl shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-purple-500/20 hover:bg-white/[0.03] hover:shadow-[0_0_20px_rgba(168,85,247,0.08)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                        <LayoutTemplate size={18} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-black text-white leading-none">
                          Theme Settings
                        </p>
                        <p className="text-[9px] text-white/40 font-bold mt-1.5 leading-none">
                          Personalize workspace visual engines
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-white/20 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all duration-300" />
                  </button>
                  
                  {/* Help & Support */}
                  <button 
                    onClick={() => { setMoreOpen(false); router.push("/support"); }} 
                    className="group relative overflow-hidden flex items-center justify-between p-3.5 rounded-[20px] text-left w-full border border-white/[0.04] bg-white/[0.01] backdrop-blur-xl shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-blue-500/20 hover:bg-white/[0.03] hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                        <LifeBuoy size={18} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-black text-white leading-none">
                          Help & Support
                        </p>
                        <p className="text-[9px] text-white/40 font-bold mt-1.5 leading-none">
                          Get assistance with Academic OS
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-300" />
                  </button>
                </div>

                {/* 4. LOGOUT (Crimson Gradient) */}
                <button 
                  onClick={() => { setMoreOpen(false); handleLogout(); }}
                  className="group relative overflow-hidden flex items-center justify-center gap-2.5 p-4 rounded-[20px] w-full mt-2 active:scale-[0.98] transition-all duration-300"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.03) 100%)", 
                    border: "1px solid rgba(255, 59, 48, 0.12)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
                  }}
                >
                  <LogOut size={16} className="text-red-500 group-hover:-translate-x-0.5 group-hover:scale-110 transition-all duration-300" />
                  <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">Terminate Session</span>
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
