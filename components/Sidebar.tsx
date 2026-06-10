"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI, dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import PortalSyncModal from "@/components/PortalSyncModal";
import FeedbackModal from "@/components/FeedbackModal";
import Toast from "@/components/Toast";
import {
  Home, BarChart2, CheckCircle, Clock, Calendar, Wrench, Sparkles, Shield,
  X, ChevronRight, CreditCard, FileText, Bed, Bus, Bell, Award, MonitorPlay, Printer, Briefcase, UserSquare, User, GraduationCap, BookOpen, Settings, MoreHorizontal, Share2, LogOut, LayoutTemplate, LifeBuoy, MessageSquare,
  Fingerprint, RefreshCw, Cpu, Search, Library, Play, Pause, Headphones, Sun, UserRound, IdCard
} from "lucide-react";
import PremiumCheckout from "@/components/PremiumCheckout";

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
  { href: "/app-tools", label: "Database Sync", icon: RefreshCw, color: "#34C759" },
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useThemeStore();
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

  const { profile, email, academiaConnected, studentPortalConnected, studentPortalData, academicData, isPremium } = useAuthStore();
  const [showCheckout, setShowCheckout] = useState(false);
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
    router.prefetch("/exam-library");
    router.prefetch("/exam-hub");
    router.prefetch("/ai");
    router.prefetch("/gpa");
    router.prefetch("/settings/theme");
    router.prefetch("/tools");
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
    { href: "/timetable", label: "Class Timetable", icon: Clock, color: "#FFCC00" },
    { href: "/calendar", label: "University Calendar", icon: Calendar, color: "#00E5FF" },
    { href: "/exam-library", label: "Exam", icon: BookOpen, color: "#30D158" },
    { href: "/exam-hub", label: "Exam Hub", icon: BookOpen, color: "#BF5AF2" },
    { href: "/tools", label: "Academic Tools", icon: Wrench, color: "#00ff88" },
    { href: "/app-tools", label: "Database Sync", icon: RefreshCw, color: "#34C759" },
    { href: "/chat", label: "Doubt Forums", icon: MessageSquare, color: "#5AC8FA" },
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
      <style>{`
        .srmx-mobile-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: calc(64px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: rgba(5, 3, 10, 0.96); 
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex; align-items: center; justify-content: space-around;
          z-index: 99999; box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255,255,255,0.035);
          padding: 0 8px;
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; color: rgba(255,255,255,0.58); font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 9.5px; font-weight: 700; cursor: pointer;
          letter-spacing: 0;
          transition: color 0.18s ease, transform 0.18s ease; -webkit-tap-highlight-color: transparent;
          background: none; border: none; outline: none; text-decoration: none; flex: 1 1 0;
          min-width: 0;
          height: 100%; position: relative;
        }
        .nav-item:hover, .nav-item:active {
          color: #ffffff;
        }
        .nav-item.active {
          color: #FF75C3;
          transform: translateY(-1px);
        }
        .nav-item span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.1;
        }
        .nav-item svg {
          flex-shrink: 0;
          filter: drop-shadow(0 0 0 rgba(0,0,0,0));
        }
        .nav-item.active svg {
          filter: drop-shadow(0 0 8px rgba(255,117,195,0.34));
        }
        .nav-item::before {
          display: none;
        }
        .nav-item.active::before {
          display: none;
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
        .popover-enter {
          animation: popoverEnter 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
        }
        @keyframes popoverEnter {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .row-icon-glow {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .group:hover .row-icon-glow {
          box-shadow: 0 0 12px var(--icon-glow);
          border-color: var(--icon-border);
          transform: scale(1.05);
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

        @keyframes drawer-rise {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes soft-scan {
          from { transform: translateX(-130%); opacity: 0; }
          28% { opacity: 0.55; }
          to { transform: translateX(130%); opacity: 0; }
        }

        .settings-dropdown {
          animation: drawer-rise 220ms cubic-bezier(.2,.8,.2,1) both;
        }

        .settings-dropdown::before {
          content: "";
          position: absolute;
          left: 18px;
          right: 18px;
          top: -1px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.34), rgba(191,90,242,0.42), transparent);
          opacity: 0.75;
        }

        .settings-dropdown::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 12% 8%, rgba(191,90,242,0.14), transparent 28%),
            radial-gradient(circle at 92% 0%, rgba(143,146,255,0.10), transparent 30%);
          opacity: 0.85;
        }

        .drawer-profile-card {
          position: relative;
          overflow: hidden;
        }

        .drawer-profile-card::after {
          content: "";
          position: absolute;
          inset: -40% -70%;
          background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.11) 50%, transparent 65%);
          animation: soft-scan 5.4s ease-in-out infinite;
          pointer-events: none;
        }

        .drawer-row-surface {
          position: relative;
          overflow: hidden;
        }

        .drawer-row-surface::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.045), transparent);
          transform: translateX(-45%);
          transition: opacity 180ms ease, transform 260ms ease;
        }

        .drawer-row-surface:hover::after,
        .drawer-row-surface:active::after {
          opacity: 1;
          transform: translateX(45%);
        }
      `}</style>

      {/* TOP STATUS BAR */}
      {!(path === "/chat" || path.startsWith("/chat/")) && (
        <div className="srmx-top-status-bar fixed top-12 left-6 right-6 z-[99999] flex items-center justify-end pointer-events-none">
          <div className="flex gap-2.5 pointer-events-auto">
            {path === "/dashboard" && (
              <>
                <button
                  onClick={() => { router.push("/exam-library"); }}
                  className="h-11 rounded-full backdrop-blur-md border flex items-center justify-center gap-2 pl-2.5 pr-3.5 transition-all active:scale-95"
                  style={{
                    background: resolvedTheme === "light"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.90), rgba(248,238,255,0.78))"
                      : "linear-gradient(135deg, rgba(191,90,242,0.26), rgba(255,117,195,0.10))",
                    borderColor: resolvedTheme === "light" ? "rgba(191,90,242,0.18)" : "rgba(255,117,195,0.20)",
                    boxShadow: resolvedTheme === "light" ? "0 10px 24px rgba(191,90,242,0.13)" : "0 10px 26px rgba(191,90,242,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
                    color: resolvedTheme === "light" ? "#7B2CBF" : "#FFEAF7",
                    paddingLeft: "10px",
                    paddingRight: "14px"
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
                  className="h-11 rounded-full backdrop-blur-md border flex items-center justify-center gap-2.5 pl-2.5 pr-4 transition-all active:scale-95"
                  style={{
                    background: resolvedTheme === "light"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(232,243,255,0.74))"
                      : "linear-gradient(135deg, rgba(51,127,186,0.28), rgba(191,90,242,0.10))",
                    borderColor: resolvedTheme === "light" ? "rgba(51,127,186,0.18)" : "rgba(147,197,253,0.20)",
                    boxShadow: resolvedTheme === "light" ? "0 10px 24px rgba(51,127,186,0.14)" : "0 10px 26px rgba(51,127,186,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
                    color: resolvedTheme === "light" ? "#1F5F99" : "#EAF4FF",
                    paddingLeft: "10px",
                    paddingRight: "16px"
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
                  <span className="sm:hidden text-[9.5px] font-black uppercase tracking-[0.045em] whitespace-nowrap leading-none">Student Portal</span>
                  <span className="hidden sm:inline text-[10.5px] font-black uppercase tracking-[0.11em] whitespace-nowrap leading-none">Student Portal</span>
                </button>
              </>
            )}
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
              onClick={() => { setMoreOpen(!moreOpen); }} 
              className="w-10 h-10 rounded-full border flex items-center justify-center text-white transition-all active:scale-90 relative overflow-hidden shrink-0"
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

          {/* Premium Tab (Spotify Style) */}
          <Link
            href="/premium"
            className={`nav-item ${isActive("/premium", path) ? "active" : ""}`}
            style={{ textDecoration: "none" }}
          >
            <Sparkles size={20} strokeWidth={isActive("/premium", path) ? 3 : 2} />
            <span>Premium</span>
          </Link>
        </nav>
      </div>

      {/* INLINE MORE DRAWER (CENTRAL HUB) */}
      {moreOpen && (
        <>
          {/* Backdrop to close settings dropdown on tap outside */}
          <div 
            onClick={() => setMoreOpen(false)} 
            className="fixed inset-0 bg-black/68 backdrop-blur-lg z-[99998] transition-opacity duration-200"
          />

          {/* Floating Settings Dropdown */}
          <div 
            className="settings-dropdown popover-enter fixed left-4 right-4 rounded-[28px] flex flex-col p-3.5 border backdrop-blur-2xl overflow-hidden"
            style={{ 
              top: "6.15rem",
              zIndex: 100005,
              maxHeight: "calc(100dvh - 11.5rem - env(safe-area-inset-bottom))",
              background: resolvedTheme === "light" 
                ? "linear-gradient(135deg, rgba(246, 241, 255, 0.92) 0%, rgba(232, 239, 255, 0.90) 100%)" 
                : "linear-gradient(135deg, rgba(16, 12, 28, 0.96) 0%, rgba(10, 7, 18, 0.98) 100%)",
              borderColor: resolvedTheme === "light" ? "rgba(96, 68, 145, 0.14)" : "rgba(255, 255, 255, 0.08)",
              boxShadow: resolvedTheme === "light"
                ? `0 26px 60px rgba(46, 32, 74, 0.18), 0 0 36px rgba(191, 90, 242, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.72)`
                : `0 25px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(191, 90, 242, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
            }}
          >
            {/* Popover Arrow */}
            <div 
              className="absolute right-8 -top-2 w-3 h-3 rotate-45 border-t border-l backdrop-blur-2xl"
              style={{
                background: resolvedTheme === "light" ? "rgba(246, 241, 255, 0.92)" : "rgba(16, 12, 28, 0.96)",
                borderColor: resolvedTheme === "light" ? "rgba(96, 68, 145, 0.14)" : "rgba(255, 255, 255, 0.08)",
              }}
            />

              {/* RowItem helper component inside Sidebar */}
              {(() => {
                const GroupContainer = ({ title, children }: AnyValue) => (
                  <div className="flex flex-col gap-2 mt-4 first:mt-3">
                    <div className="flex items-center gap-2 pl-2 mb-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${resolvedTheme === "light" ? "bg-purple-600/40" : "bg-purple-300/48"}`} />
                      <p className={`text-[9.5px] leading-none font-black uppercase tracking-[0.2em] ${resolvedTheme === "light" ? "text-purple-950/52" : "text-white/46"}`}>{title}</p>
                    </div>
                    <div className={`flex flex-col gap-1.5 p-1.5 rounded-[23px] border backdrop-blur-md ${resolvedTheme === "light" ? "bg-purple-950/[0.03] border-purple-900/[0.075]" : "bg-white/[0.02] border-white/[0.055]"}`}>
                      {children}
                    </div>
                  </div>
                );

                const RowItem = ({ href, label, subtitle, icon: Icon, color, onClick, rightElement }: AnyValue) => {
                  const content = (
                    <div className={`drawer-row-surface flex items-center justify-between w-full min-h-[64px] py-3 pl-3 pr-3.5 rounded-[19px] active:scale-[0.99] transition-all duration-300 group text-left ${resolvedTheme === "light" ? "hover:bg-gradient-to-r hover:from-purple-500/[0.04] hover:to-transparent" : "hover:bg-gradient-to-r hover:from-purple-500/[0.06] hover:to-transparent"}`}>
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div 
                          className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 row-icon-glow" 
                          style={{ 
                            background: `${color}12`, 
                            color: color, 
                            borderColor: `${color}20`,
                            "--icon-glow": `${color}35`,
                            "--icon-border": `${color}45`
                          } as React.CSSProperties}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-[13.5px] font-black tracking-wide uppercase leading-tight ${resolvedTheme === "light" ? "text-black/88" : "text-white/92"}`}>{label}</span>
                          <span className={`text-[11px] mt-1.5 leading-snug tracking-normal ${resolvedTheme === "light" ? "text-black/62" : "text-white/58"}`}>{subtitle}</span>
                        </div>
                      </div>
                      
                      {rightElement ? (
                        <div className="shrink-0 relative z-20 ml-3" onClick={e => e.stopPropagation()}>
                          {rightElement}
                        </div>
                      ) : (
                        <ChevronRight size={15} className={`ml-3 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 ${resolvedTheme === "light" ? "text-black/46 group-hover:text-black/70" : "text-white/38 group-hover:text-white/70"}`} />
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
                    <div className={`drawer-profile-card min-h-[68px] flex items-center gap-3.5 px-3.5 py-3 rounded-[24px] border shrink-0 ${resolvedTheme === "light" ? "bg-purple-950/[0.04] border-purple-900/[0.10]" : "bg-white/[0.032] border-white/[0.07]"}`}>
                      <div 
                        className="w-12 h-12 rounded-[18px] flex items-center justify-center relative overflow-hidden border border-white/10 z-10 shrink-0"
                        style={{ 
                          background: "linear-gradient(135deg, rgba(191,90,242,0.32) 0%, rgba(143,146,255,0.20) 100%)", 
                          boxShadow: `0 8px 22px rgba(191,90,242,0.18), inset 0 1px 0 rgba(255,255,255,0.12)` 
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-60"
                          style={{ 
                            background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.20), transparent 48%)" 
                          }}
                        />
                        <IdCard size={22} strokeWidth={2.25} className="relative z-10 text-purple-100" />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h2 className={`text-[13px] font-black leading-tight truncate tracking-wide uppercase ${resolvedTheme === "light" ? "text-black" : "text-white"}`}>{userName}</h2>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${academiaConnected || studentPortalConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${resolvedTheme === "light" ? "text-emerald-700/80" : "text-emerald-200/80"}`}>
                            {academiaConnected || studentPortalConnected ? "Synced" : "Local Mode"}
                          </span>
                        </div>
                      </div>
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
                        <div className={`drawer-row-surface w-full min-h-[104px] px-3 py-3 rounded-[19px] transition-all duration-300 ${resolvedTheme === "light" ? "hover:bg-gradient-to-r hover:from-purple-500/[0.035] hover:to-transparent" : "hover:bg-gradient-to-r hover:from-purple-500/[0.055] hover:to-transparent"}`}>
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div 
                              className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 row-icon-glow" 
                              style={{ 
                                background: "#A78BFA12", 
                                color: "#A78BFA", 
                                borderColor: "#A78BFA20",
                                "--icon-glow": "#A78BFA35",
                                "--icon-border": "#A78BFA45"
                              } as React.CSSProperties}
                            >
                              <LayoutTemplate size={18} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`text-[13.5px] font-black tracking-wide uppercase leading-tight ${resolvedTheme === "light" ? "text-black/88" : "text-white/92"}`}>Appearance</span>
                              <span className={`text-[11px] mt-1.5 leading-snug tracking-normal ${resolvedTheme === "light" ? "text-black/62" : "text-white/58"}`}>Switch visual themes</span>
                            </div>
                          </div>
                          <div className={`mt-3 grid grid-cols-2 gap-1 p-1 rounded-2xl border relative z-30 transition-all duration-300 ${resolvedTheme === "light" ? "bg-purple-950/[0.045] border-purple-900/[0.07]" : "bg-white/[0.028] border-white/[0.05]"}`}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTheme("lumina"); }}
                                className={`h-9 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  resolvedTheme === "lumina" 
                                    ? "text-purple-50 font-black" 
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                                }`}
                                style={{
                                  background: resolvedTheme === "lumina" ? "linear-gradient(135deg, rgba(168,85,247,0.30) 0%, rgba(139,92,246,0.24) 100%)" : "transparent"
                                }}
                              >
                                <Sparkles size={11} className="shrink-0" />
                                Lumina
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setTheme("light"); }}
                                className={`h-9 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                                  resolvedTheme === "light" 
                                    ? "text-purple-800 shadow-sm font-black border border-purple-900/[0.08]" 
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                                }`}
                                style={{
                                  background: resolvedTheme === "light" ? "rgba(255,255,255,0.52)" : "transparent"
                                }}
                              >
                                <Sun size={11} className="shrink-0" />
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
                        <RowItem 
                          href="/app-tools" 
                          label="Database Sync" 
                          subtitle="Sync credentials & status" 
                          icon={RefreshCw} 
                          color="#34C759" 
                          rightElement={
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRefreshSync(); }}
                              disabled={isRefreshing}
                              className={`mr-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase border active:scale-95 transition-all disabled:opacity-50 ${
                                resolvedTheme === "light" 
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" 
                                  : "text-emerald-200 bg-emerald-400/10 hover:bg-emerald-400/15 border-emerald-300/20"
                              }`}
                            >
                              <RefreshCw size={10} className={`shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
                              {isRefreshing ? "Syncing" : (academiaConnected || studentPortalConnected ? "Synced" : "Local")}
                            </button>
                          }
                        />
                      </GroupContainer>

                      {/* Group 3: Support */}
                      <GroupContainer title="Support">
                        <RowItem 
                          href="/support" 
                          label="Help & Support" 
                          subtitle="Assistance & details feedback" 
                          icon={LifeBuoy} 
                          color="#00aaff" 
                        />
                      </GroupContainer>

                      <button 
                        onClick={() => { setMoreOpen(false); handleLogout(); }}
                        className={`mt-4 w-full min-h-[64px] px-3.5 py-3 rounded-[22px] border flex items-center gap-3.5 text-left active:scale-[0.99] transition-all ${resolvedTheme === "light" ? "bg-red-500/[0.03] border-red-300/30 hover:bg-red-50/30" : "bg-red-500/[0.035] border-red-400/[0.12] hover:bg-red-500/[0.065]"}`}
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${resolvedTheme === "light" ? "bg-red-500/10 text-red-600 border-red-300/45" : "bg-red-500/10 text-red-300 border-red-400/20"}`}>
                          <LogOut size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className={`block text-[13.5px] font-black uppercase tracking-wide leading-tight ${resolvedTheme === "light" ? "text-red-700" : "text-red-200"}`}>Logout</span>
                          <span className={`block text-[11px] mt-1 leading-snug ${resolvedTheme === "light" ? "text-red-600/70" : "text-red-200/55"}`}>Safely terminate session</span>
                        </div>
                      </button>

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
      <PortalSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onSuccess={() => {
          handleRefreshSync();
        }}
        netId={loginUserId}
      />

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
  return createPortal(navContent, document.body);
}
