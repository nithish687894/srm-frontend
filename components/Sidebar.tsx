"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { authAPI, dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import Toast from "@/components/Toast";
import {
  Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield,
  X, ChevronRight, CreditCard, FileText, Bed, Bus, Bell, Award, MonitorPlay, Printer, Briefcase, UserSquare, User, GraduationCap, BookOpen, Settings, MoreHorizontal, Share2, LogOut, LayoutTemplate, LifeBuoy, StickyNote, MessageSquare,
  Fingerprint, RefreshCw, Cpu, Search, Library, Play, Pause, Headphones, Sun, UserRound, IdCard
} from "lucide-react";

const PortalSyncModal = dynamic(() => import("@/components/PortalSyncModal"), { ssr: false });
const FeedbackModal = dynamic(() => import("@/components/FeedbackModal"), { ssr: false });
const PremiumCheckout = dynamic(() => import("@/components/PremiumCheckout"), { ssr: false });

const NAV_MAIN = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/marks", label: "Marks", icon: Award },
  { href: "/attendance", label: "Attendance", icon: Library },
  { href: "/timetable", label: "Timetable", icon: Clock },
] as const;

const NAV_MORE_ITEMS = [
  { href: "/calendar", label: "Calendar", icon: Calendar, color: "#fff" },
  { href: "/exam-library", label: "Exam", icon: BookOpen, color: "#30D158" },
  { href: "/exam-hub", label: "Exam Hub", icon: BookOpen, color: "#BF5AF2" },
  { href: "/tools", label: "Academic Tools", icon: Wrench, color: "#00ff88" },
  { href: "/ai", label: "AI Tutor", icon: Sparkles, color: "#fff" },
  { href: "/gpa", label: "GPA Calc", icon: GraduationCap, color: "#fff" },
] as const;

const PORTAL_SERVICES = [
  { href: "/portal/student-dashboard", label: "Student Dashboard", icon: UserSquare },
  { href: "/portal/grade-mark-credit", label: "Grades & Credits", icon: GraduationCap },
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"lumina" | "light">("lumina");

  useEffect(() => {
    if (!mounted) return;
    const resolve = () => {
      if (theme === "system") {
        setResolvedTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "lumina");
      } else {
        setResolvedTheme(theme === "light" ? "light" : "lumina");
      }
    };
    resolve();
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      media.addEventListener("change", resolve);
      return () => media.removeEventListener("change", resolve);
    }
  }, [theme, mounted]);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (title: string, body: string, type: "success" | "error" | "info" = "success") => {
    setToast({ title, body, type });
  };

  const profile = useAuthStore((state) => state.profile);
  const email = useAuthStore((state) => state.email);
  const academiaConnected = useAuthStore((state) => state.academiaConnected);
  const studentPortalConnected = useAuthStore((state) => state.studentPortalConnected);
  const studentPortalData = useAuthStore((state) => state.studentPortalData);
  const academicData = useAuthStore((state) => state.academicData);
  const isPremium = useAuthStore((state) => state.isPremium);
  const [showCheckout, setShowCheckout] = useState(false);
  const userEmail = (email || profile?.Email || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.some((e) => e.toLowerCase() === userEmail) || profile?.role === "admin" || profile?.Role === "admin";

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    const media = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktop(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => {
      clearTimeout(id);
      media.removeEventListener("change", updateViewport);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setMenuOpen(false);
    setMoreOpen(false);
    try { await authAPI.logout(); } catch { /* swallow */ }
    useAuthStore.getState().logout();
    router.replace("/");
  }, [isLoggingOut, router]);

  // Close the drawer if the route changes
  useEffect(() => {
    const id = setTimeout(() => setMoreOpen(false), 0);
    return () => clearTimeout(id);
  }, [path]);

  // User profile details for the More drawer
  const profileName = profile?.["Name"] || profile?.Name;
  const profileRegNo = profile?.["Registration Number"] || profile?.RegNo;
  const userName = typeof profileName === "string" && profileName.trim() ? profileName.trim() : "Student";
  const regNo = typeof profileRegNo === "string" ? profileRegNo.trim() : "";
  const loginUserId = (email || profile?.Email || profile?.email || "").split("@")[0].trim();
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const profileImage =
    profile?.photoUrl ||
    profile?.photoURL ||
    profile?.picture ||
    profile?.avatar ||
    profile?.ProfileImage ||
    profile?.["Profile Image"] ||
    profile?.["Photo URL"];

  // Dynamic calculated stats for AURA Active Hero Section
  const att = useMemo(() => academicData?.attendance || [], [academicData?.attendance]);

  const avgAtt = useMemo(() => {
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
  }, [att]);

  const riskCount = useMemo(() => {
    if (!att.length) return 0;
    return att.filter((c: AnyValue) => {
      const pStr = c["Attn %"] || c.pct;
      if (pStr === undefined || pStr === null || pStr === "null") return false;
      const pct = parseFloat(pStr) || 0;
      return pct < 75;
    }).length;
  }, [att]);

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
    { href: "/notes", label: "Notes", icon: StickyNote, color: "#FF9500" },
    { href: "/calendar", label: "University Calendar", icon: Calendar, color: "#00E5FF" },
    { href: "/exam-library", label: "Exam", icon: BookOpen, color: "#30D158" },
    { href: "/exam-hub", label: "Exam Hub", icon: BookOpen, color: "#BF5AF2" },
    { href: "/tools", label: "Academic Tools", icon: Wrench, color: "#00ff88" },
    { href: "/premium", label: "Nexus Premium", icon: Sparkles, color: "#FFD700" },
    { href: "/ai", label: "AI Tutor", icon: Sparkles, color: "#BF5AF2" },
    { href: "/gpa", label: "GPA / CGPA Planner", icon: GraduationCap, color: "#FF2D55" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Control", icon: Shield, color: "#FF9500" }] : []),
  ];

  const portalServices = [
    { href: "/portal/grade-mark-credit", label: "Grades & Credits", icon: GraduationCap, color: "#FF2D55" },
  ];

  const isMoreActive = moreItems.some((item) => isActive(item.href, path)) || portalServices.some((item) => isActive(item.href, path));

  const navContent = (
    <>
      {/* Sidebar navigation styles are now in globals.css for performance.
          Only component-specific grid layout overrides remain here. */}
      <style>{`
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

        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
      `}</style>

      {/* TOP STATUS BAR */}
      {!(path === "/notes" || path.startsWith("/notes/")) && (
        <div className="srmx-top-status-bar fixed top-8 sm:top-12 left-4 right-4 sm:left-6 sm:right-6 z-[99999] flex items-center justify-end pointer-events-none">
          <div className="flex gap-2.5 pointer-events-auto">
            {path === "/dashboard" && (
              <>
                <button
                  onClick={() => { router.push("/exam-library"); }}
                  className="srmx-header-pill srmx-header-pill-exam h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 shrink-0"
                  style={{
                    background: resolvedTheme === "light"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.90), rgba(248,238,255,0.78))"
                      : "linear-gradient(135deg, rgba(191,90,242,0.26), rgba(255,117,195,0.10))",
                    borderColor: resolvedTheme === "light" ? "rgba(191,90,242,0.18)" : "rgba(255,117,195,0.20)",
                    boxShadow: resolvedTheme === "light" ? "0 10px 24px rgba(191,90,242,0.13)" : "0 10px 26px rgba(191,90,242,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
                    color: resolvedTheme === "light" ? "#7B2CBF" : "#FFEAF7",
                  }}
                  aria-label="Open Exam Library"
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: resolvedTheme === "light" ? "rgba(191,90,242,0.10)" : "rgba(255,255,255,0.075)",
                      color: "inherit"
                    }}
                  >
                    <BookOpen size={15} strokeWidth={2.5} className="shrink-0" />
                  </span>
                  <span className="hidden sm:inline text-[10.5px] font-black uppercase tracking-[0.11em] whitespace-nowrap leading-none">Exam</span>
                </button>
                <button
                  onClick={() => { router.push("/student-portal"); }}
                  className="srmx-header-pill srmx-header-pill-portal h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 shrink-0"
                  style={{
                    background: resolvedTheme === "light"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(232,243,255,0.74))"
                      : "linear-gradient(135deg, rgba(51,127,186,0.28), rgba(191,90,242,0.10))",
                    borderColor: resolvedTheme === "light" ? "rgba(51,127,186,0.18)" : "rgba(147,197,253,0.20)",
                    boxShadow: resolvedTheme === "light" ? "0 10px 24px rgba(51,127,186,0.14)" : "0 10px 26px rgba(51,127,186,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
                    color: resolvedTheme === "light" ? "#1F5F99" : "#EAF4FF",
                  }}
                  aria-label="Open Student Portal"
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: resolvedTheme === "light" ? "rgba(51,127,186,0.10)" : "rgba(255,255,255,0.075)",
                      color: "inherit"
                    }}
                  >
                    <IdCard size={15} strokeWidth={2.5} className="shrink-0" />
                  </span>
                  <span className="hidden sm:inline text-[10.5px] font-black uppercase tracking-[0.11em] whitespace-nowrap leading-none">Student Portal</span>
                </button>
              </>
            )}
            <button 
              onClick={() => { router.push("/notifications"); }} 
              className="w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center text-white/60 transition-all active:scale-90 shrink-0"
              style={{ 
                background: "rgba(143, 146, 255, 0.1)",
                borderColor: "rgba(143, 146, 255, 0.2)",
                boxShadow: "0 0 15px rgba(143, 146, 255, 0.15)"
              }}
            >
              <Bell size={18} color="#8F92FF" />
            </button>
            <button 
              onClick={() => { setMoreOpen(!moreOpen); }} 
              className="w-11 h-11 rounded-full border flex items-center justify-center text-white transition-all active:scale-90 relative overflow-hidden shrink-0"
              style={{ 
                background: profileImage
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, rgba(191,90,242,0.34) 0%, rgba(143,146,255,0.22) 100%)",
                borderColor: "rgba(255, 255, 255, 0.14)",
                boxShadow: `0 0 18px rgba(191,90,242,0.20), inset 0 1px 0 rgba(255,255,255,0.12)` 
              }}
              aria-label="Open profile menu"
            >
              {profileImage ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${String(profileImage)})` }}
                />
              ) : (
                <UserRound size={18} strokeWidth={2.4} className="text-purple-100" />
              )}
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
                <button onClick={() => { setMenuOpen(false); router.push("/support"); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-left">
                  <LifeBuoy size={20} color="#3673ff" /> Help & Support
                </button>
                <button onClick={() => { setMenuOpen(false); setFeedbackOpen(true); }} className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-4 p-4 rounded-2xl font-bold text-sm text-left">
                  <MessageSquare size={20} color="#34C759" /> Report Bug / Feedback
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
      {isDesktop && <div className="desktop-sidebar">
         {/* Top Profile Area */}
         <div>
            <div className="flex items-center gap-3 pb-6 desktop-sidebar-separator-b mb-6">
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
                <h3 className="text-sm font-black desktop-profile-name leading-tight truncate">{userName}</h3>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-1 tabular-nums desktop-profile-reg">
                  {regNo ? `${regNo.substring(0, 10)}...` : "Profile loading"}
                </p>
              </div>
            </div>

           {/* Main Links */}
           <div className="flex flex-col gap-2">
             <p className="text-[8px] font-black desktop-sidebar-section-title uppercase tracking-[0.25em] mb-2 pl-1">Nexus Core</p>
             {NAV_MAIN.map(({ href, label, icon: Icon }) => (
               <Link 
                 key={href} 
                 href={href} 
                 prefetch={true}
                 className={`desktop-nav-link ${isActive(href, path) ? "active" : ""}`}
               >
                 <Icon size={18} color={isActive(href, path) ? hubAccent : (resolvedTheme === "light" ? "rgba(27,20,40,0.5)" : "currentColor")} />
                 <span className="text-xs font-black tracking-wide">{label}</span>
               </Link>
             ))}

             <p className="text-[8px] font-black desktop-sidebar-section-title uppercase tracking-[0.25em] mt-4 mb-2 pl-1">Extended Tools</p>
             {moreItems.map(({ href, label, icon: Icon, color }) => (
               <Link 
                 key={href} 
                 href={href} 
                 prefetch={true}
                 className={`desktop-nav-link ${isActive(href, path) ? "active" : ""}`}
               >
                 <Icon size={18} color={isActive(href, path) ? hubAccent : color} />
                 <span className="text-xs font-black tracking-wide">{label}</span>
               </Link>
             ))}
           </div>
         </div>

         {/* Bottom Actions */}
         <div className="mt-auto pt-6 desktop-sidebar-separator flex flex-col gap-2">
            <button 
              onClick={() => router.push("/settings/theme")}
              className="desktop-nav-link w-full"
            >
              <Settings size={18} color={resolvedTheme === "light" ? "rgba(27,20,40,0.5)" : "currentColor"} />
              <span className="text-xs font-black tracking-wide">Settings</span>
            </button>
            <button 
              onClick={handleLogout}
              className="desktop-nav-link w-full text-red-500/80 hover:text-red-500"
              style={{ color: "rgba(239, 68, 68, 0.85)" }}
            >
              <LogOut size={18} color="rgba(239, 68, 68, 0.85)" />
              <span className="text-xs font-black tracking-wide uppercase font-sans">Sign Out</span>
            </button>
         </div>
      </div>}

      {/* BOTTOM NAV BAR (FLAT STYLE) */}
      {!isDesktop && <nav className="srmx-mobile-nav" aria-label="Main navigation">
        {NAV_MAIN.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} prefetch={true} className={`nav-item ${isActive(href, path) ? "active" : ""}`}>
            <Icon size={20} strokeWidth={isActive(href, path) ? 3 : 2} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>}

      {/* INLINE MORE DRAWER (CENTRAL HUB) */}
      {moreOpen && (
        <>
          {/* Backdrop to close settings dropdown on tap outside */}
          <div 
            onClick={() => setMoreOpen(false)} 
            className="profile-menu-backdrop fixed inset-0 z-[99998] transition-opacity duration-200"
          />

          {/* Floating Settings Dropdown */}
          <div 
            className="settings-dropdown fixed flex flex-col border backdrop-blur-2xl overflow-hidden"
            style={{ 
              zIndex: 100005,
              background: resolvedTheme === "light" 
                ? "linear-gradient(145deg, rgba(246, 241, 255, 0.88) 0%, rgba(232, 239, 255, 0.86) 100%)"
                : "linear-gradient(145deg, rgba(16, 12, 28, 0.92) 0%, rgba(10, 7, 18, 0.96) 100%)",
              borderColor: resolvedTheme === "light" ? "rgba(96, 68, 145, 0.14)" : "rgba(255, 255, 255, 0.08)",
              boxShadow: resolvedTheme === "light"
                ? `0 26px 60px rgba(46, 32, 74, 0.18), 0 0 36px rgba(191, 90, 242, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.72)`
                : `0 25px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(191, 90, 242, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
            }}
          >
            {/* Popover Arrow */}
            <div 
              className="settings-dropdown-arrow absolute right-5 -top-2 w-3 h-3 rotate-45 border-t border-l backdrop-blur-2xl"
              style={{
                background: resolvedTheme === "light" ? "rgba(246, 241, 255, 0.92)" : "rgba(16, 12, 28, 0.96)",
                borderColor: resolvedTheme === "light" ? "rgba(96, 68, 145, 0.14)" : "rgba(255, 255, 255, 0.08)",
              }}
            />

              {/* RowItem helper component inside Sidebar */}
              {(() => {
                const GroupContainer = ({ title, children }: AnyValue) => (
                  <div className="profile-menu-group flex flex-col">
                    <div className="profile-menu-group-label flex items-center">
                      <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${resolvedTheme === "light" ? "text-purple-900/60" : "text-white/40"}`}>{title}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {children}
                    </div>
                  </div>
                );

                const RowItem = ({ href, label, subtitle, icon: Icon, color, onClick, rightElement }: AnyValue) => {
                  const content = (
                    <div className="profile-menu-surface profile-menu-option profile-menu-option-row flex items-center justify-between w-full group text-left">
                      <div className="profile-menu-option-copy flex items-center min-w-0 flex-1">
                        <div 
                          className="profile-menu-icon-tile flex items-center justify-center shrink-0"
                          style={{ 
                            background: `${color}15`, 
                            color: color, 
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-[14px] font-black tracking-wide uppercase leading-tight ${resolvedTheme === "light" ? "text-black/90" : "text-white/90"}`}>{label}</span>
                          <span className={`text-[11.5px] mt-1 leading-snug tracking-normal ${resolvedTheme === "light" ? "text-black/60" : "text-white/50"}`}>{subtitle}</span>
                        </div>
                      </div>
                      
                      {rightElement ? (
                        <div className="shrink-0 relative z-20 ml-3" onClick={e => e.stopPropagation()}>
                          {rightElement}
                        </div>
                      ) : (
                        <ChevronRight size={15} className={`profile-menu-chevron group-hover:translate-x-0.5 transition-all duration-300 shrink-0 ${resolvedTheme === "light" ? "text-black/40 group-hover:text-black/70" : "text-white/30 group-hover:text-white/60"}`} />
                      )}
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
                    {/* Compact Profile Header */}
                    <div className="profile-menu-surface profile-menu-header flex items-center shrink-0">
                      <div 
                        className="profile-menu-avatar flex items-center justify-center relative overflow-hidden z-10 shrink-0"
                        style={{ 
                          background: "linear-gradient(135deg, rgba(191,90,242,0.5) 0%, rgba(143,146,255,0.3) 100%)", 
                          boxShadow: `0 8px 24px rgba(191,90,242,0.25)` 
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-60"
                          style={{ 
                            background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 48%)" 
                          }}
                        />
                        <IdCard size={21} strokeWidth={2.1} className="relative z-10 text-white" />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h2 className={`text-[15px] font-black leading-tight truncate tracking-wide uppercase ${resolvedTheme === "light" ? "text-black" : "text-white"}`}>{userName}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`w-2 h-2 rounded-full ${academiaConnected || studentPortalConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${resolvedTheme === "light" ? "text-emerald-700/80" : "text-emerald-300"}`}>
                            {academiaConnected || studentPortalConnected ? "Synced" : "Local Mode"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMoreOpen(false)}
                        aria-label="Close profile menu"
                        className={`profile-menu-close w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-colors ${resolvedTheme === "light" ? "border-purple-900/10 bg-white/60 text-purple-950/55 hover:text-purple-950" : "border-white/10 bg-white/[0.04] text-white/45 hover:text-white"}`}
                      >
                        <X size={16} strokeWidth={2.4} />
                      </button>
                    </div>

                    {/* Scrollable List Items */}
                    <div 
                      ref={scrollRef}
                      className="flex-1 overflow-y-auto flex flex-col w-full relative z-0"
                      style={{ 
                        scrollbarWidth: "none",
                        paddingBottom: "calc(18px + env(safe-area-inset-bottom))"
                      }}
                    >
                      {/* Group 1: Preferences */}
                      <GroupContainer title="Preferences">
                        <div className="profile-menu-surface profile-menu-option profile-menu-appearance flex flex-col w-full text-left">
                          <div className="profile-menu-option-copy flex items-center min-w-0">
                            <div 
                              className="profile-menu-icon-tile flex items-center justify-center shrink-0"
                              style={{ 
                                background: "#A78BFA15", 
                                color: "#A78BFA", 
                              }}
                            >
                              <LayoutTemplate size={18} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`text-[14px] font-black tracking-wide uppercase leading-tight ${resolvedTheme === "light" ? "text-black/90" : "text-white/90"}`}>Appearance</span>
                              <span className={`text-[11.5px] mt-1 leading-snug tracking-normal ${resolvedTheme === "light" ? "text-black/60" : "text-white/50"}`}>Switch visual themes</span>
                            </div>
                          </div>
                          
                          <div className={`profile-theme-toggle grid grid-cols-2 gap-2 p-1.5 rounded-[16px] transition-all duration-300 ${resolvedTheme === "light" ? "bg-black/[0.03]" : "bg-black/40"}`}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTheme("lumina"); }}
                                className={`h-10 flex items-center justify-center gap-2 px-3.5 rounded-[14px] text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  resolvedTheme === "lumina" 
                                    ? "text-purple-50 shadow-lg" 
                                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                                }`}
                                style={{
                                  background: resolvedTheme === "lumina" ? "linear-gradient(135deg, rgba(168,85,247,0.40) 0%, rgba(139,92,246,0.30) 100%)" : "transparent"
                                }}
                              >
                                <Sparkles size={13} className="shrink-0" />
                                Lumina
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTheme("light"); }}
                                className={`h-10 flex items-center justify-center gap-2 px-3.5 rounded-[14px] text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  resolvedTheme === "light" 
                                    ? "text-purple-900 shadow-sm bg-white" 
                                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                                }`}
                              >
                                <Sun size={13} className="shrink-0" />
                                Light
                              </button>
                          </div>
                        </div>
                      </GroupContainer>

                       {/* Group 2: System */}
                      <GroupContainer title="System">
                        <RowItem 
                          href="/tools" 
                          label="Academic Tools" 
                          subtitle="Calculators & utilities" 
                          icon={Wrench} 
                          color="#00ff88" 
                        />
                      </GroupContainer>

                      {/* Group 3: Support */}
                      <GroupContainer title="Support">
                        <RowItem 
                          href="/support" 
                          label="Help & Support" 
                          subtitle="Assistance & detailed feedback"
                          icon={LifeBuoy} 
                          color="#00aaff" 
                        />
                      </GroupContainer>

                      <div className="profile-menu-logout-wrap">
                        <button 
                          onClick={() => { setMoreOpen(false); handleLogout(); }}
                          className="profile-menu-surface profile-menu-option profile-menu-option-row profile-menu-logout w-full flex items-center text-left active:scale-[0.98]"
                        >
                          <div className={`profile-menu-icon-tile flex items-center justify-center shrink-0 ${resolvedTheme === "light" ? "bg-red-500/10 text-red-600" : "bg-red-500/10 text-red-400"}`}>
                            <LogOut size={18} />
                          </div>
                          <div className="min-w-0">
                            <span className={`block text-[14px] font-black uppercase tracking-wide leading-tight ${resolvedTheme === "light" ? "text-red-700" : "text-red-400"}`}>Logout</span>
                            <span className={`block text-[11.5px] mt-1 leading-snug ${resolvedTheme === "light" ? "text-red-600/70" : "text-red-400/60"}`}>Safely terminate session</span>
                          </div>
                        </button>
                      </div>

                      {/* Group 4: Admin (Only if admin role) */}
                      {isAdmin && (
                        <GroupContainer title="System Admin">
                          <RowItem 
                            href="/admin" 
                            label="Admin Control" 
                            subtitle="Manage telemetry & banner" 
                            icon={Shield} 
                            color="#ef4444" 
                          />
                        </GroupContainer>
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
      {isSyncOpen && (
        <PortalSyncModal
          isOpen
          onClose={() => setIsSyncOpen(false)}
          onSuccess={() => {
            handleRefreshSync();
          }}
          netId={loginUserId}
        />
      )}

      {feedbackOpen && (
        <FeedbackModal
          onClose={() => setFeedbackOpen(false)}
          showToast={showToast}
        />
      )}

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
    </>
  );

  if (!mounted) return null;
  if (isLoggingOut) {
    return createPortal(
      <div className="logout-transition" role="status" aria-live="polite" aria-label="Signing out">
        <div className="logout-transition-mark">
          <LogOut size={20} strokeWidth={2.2} />
        </div>
        <span>Signing out</span>
      </div>,
      document.body
    );
  }
  return createPortal(navContent, document.body);
}
