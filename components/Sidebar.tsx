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
  MoreHorizontal, Settings, Share2, LogOut, User, BookOpen, GraduationCap,
  X, ChevronRight, CreditCard, FileText, Bed, Bus, Bell, Award, MonitorPlay, Printer,
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/marks", label: "Marks", icon: BarChart2 },
  { href: "/attendance", label: "Attnd", icon: CheckCircle },
  { href: "/timetable", label: "Time", icon: Clock },
] as const;

const NAV_MORE_ITEMS = [
  { href: "/calendar", label: "Calendar", icon: Calendar, desc: "Academic calendar & events" },
  { href: "/app-tools", label: "Tools", icon: Wrench, desc: "GPA calculator & utilities" },
  { href: "/ai", label: "AI Tutor", icon: Sparkles, desc: "AI-powered study assistant" },
  { href: "/gpa", label: "GPA Calc", icon: GraduationCap, desc: "CGPA & SGPA calculator" },
] as const;

const PORTAL_SERVICES = [
  { href: "/portal/fee-payment", label: "Fee Payment", icon: CreditCard },
  { href: "/portal/course-status", label: "Course Status", icon: BookOpen },
  { href: "/portal/provisional-results", label: "Prov Results", icon: FileText },
  { href: "/portal/revaluation", label: "Revaluation", icon: FileText },
  { href: "/portal/hostel", label: "Hostel Details", icon: Bed },
  { href: "/portal/transport", label: "Transport", icon: Bus },
  { href: "/portal/finance", label: "Finance", icon: CreditCard },
  { href: "/portal/notice-board", label: "Notices", icon: Bell },
  { href: "/portal/abc-id", label: "ABC ID", icon: Award },
  { href: "/portal/lms", label: "LMS", icon: MonitorPlay },
  { href: "/portal/codetantra", label: "CodeTantra", icon: MonitorPlay },
  { href: "/portal/id-card", label: "ID Card", icon: Printer },
] as const;

const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];

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

  const userName = profile?.Name || academicData?.profile?.Name || "Student";
  const regNo = profile?.["Registration Number"] || academicData?.profile?.["Registration Number"] || "";
  const dept = profile?.Department || academicData?.profile?.Department || "";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const moreItems = [
    ...NAV_MORE_ITEMS,
    ...(isAdmin ? [{ href: "/admin" as const, label: "Admin" as const, icon: Shield, desc: "Admin panel" as const }] : []),
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
        .theme-matrix .srmx-desktop-nav {
          border: 1px solid var(--accent); box-shadow: 0 0 20px rgba(168,194,0,0.2);
          background: rgba(10,10,10,0.95);
        }
        .srmx-mobile-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: calc(72px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: rgba(10,10,12,0.95); backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px); border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: space-around;
          z-index: 100; box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
        }
        .theme-matrix .srmx-mobile-nav {
          border-top: 1px solid var(--accent); box-shadow: 0 -4px 20px rgba(168,194,0,0.15);
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; color: #666; font-family: "Space Mono", monospace; font-size: 10px;
          text-transform: uppercase; position: relative; cursor: pointer;
          transition: color 0.2s ease, text-shadow 0.2s ease; width: 60px; height: 100%;
          -webkit-tap-highlight-color: transparent; text-decoration: none;
          background: none; border: none; outline: none;
        }
        .nav-item:hover { color: #fff; }
        .nav-item.active { color: #00ff88; text-shadow: 0 0 10px rgba(0,255,136,0.8); }
        .theme-matrix .nav-item.active { color: var(--accent); text-shadow: 0 0 10px rgba(168,194,0,0.8); }
        .theme-cosmos .nav-item.active { color: #a78bfa; text-shadow: 0 0 10px rgba(167,139,250,0.8); }
        .nav-item::before {
          content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 0; height: 2px; border-radius: 4px; background: transparent;
          transition: all 0.3s cubic-bezier(0.2,0.9,0.2,1);
        }
        .nav-item.active::before {
          width: 30px; background: #00ff88;
          box-shadow: 0 0 10px rgba(0,255,136,0.8), 0 0 20px rgba(0,255,136,0.4);
        }
        .theme-matrix .nav-item.active::before { background: var(--accent); box-shadow: 0 0 10px rgba(168,194,0,0.8); }
        .theme-cosmos .nav-item.active::before { background: #a78bfa; box-shadow: 0 0 10px rgba(167,139,250,0.8); }
        .srmx-desktop-nav .nav-item {
          flex-direction: row; gap: 8px; font-size: 12px; width: auto; height: auto;
          padding: 8px 16px; border-radius: 99px;
        }
        .srmx-desktop-nav .nav-item::before { display: none; }
        .srmx-desktop-nav .nav-item.active { background: rgba(0,255,136,0.08); }
        .theme-matrix .srmx-desktop-nav .nav-item.active { background: rgba(168,194,0,0.15); }
        .theme-cosmos .srmx-desktop-nav .nav-item.active { background: rgba(167,139,250,0.12); }
      `}</style>

      {/* TOP RIGHT: STATUS + SETTINGS */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-3" role="status">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10"
          style={{ boxShadow: studentPortalConnected ? "0 0 10px rgba(0,255,136,0.2)" : "0 0 10px rgba(239,68,68,0.2)" }}
          aria-label={studentPortalConnected ? "Student Portal connected" : "Student Portal disconnected"}
        >
          <div className="relative flex h-2.5 w-2.5">
            {studentPortalConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${studentPortalConnected ? "bg-green-500" : "bg-red-500"}`} />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-white/80" style={{ marginTop: "1px" }}>
            {studentPortalConnected ? "SYNCED" : "DISC."}
          </span>
        </div>
        <button
          onClick={() => { setMenuOpen(true); setMoreOpen(false); }}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-105 active:scale-95"
          aria-label="Open settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* SETTINGS OVERLAY */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex flex-col justify-end items-center pb-[100px] md:justify-center md:pb-0"
            role="dialog" aria-label="Control center"
          >
            <motion.div
              initial={{ y: 50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f13] border border-white/10 p-6 rounded-[28px] w-[90%] max-w-[400px] flex flex-col gap-6 shadow-2xl"
            >
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mb-4 font-mono">Control Center</div>
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => { setMenuOpen(false); router.push("/settings/theme"); }}
                    className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition-colors font-bold text-sm text-left">
                    <Sparkles size={18} /> Personalize Interface
                  </button>
                  <button onClick={() => { setMenuOpen(false); router.push("/support"); }}
                    className="w-full bg-white/5 border border-white/10 text-white flex items-center gap-3 p-4 rounded-2xl hover:bg-white/10 transition-colors font-bold text-sm text-left">
                    <Wrench size={18} /> Help & Support
                  </button>
                  <button
                    onClick={async () => {
                      if (navigator.share) {
                        try { await navigator.share({ title: "SRM Nexus", text: "Check out SRM Nexus!", url: "https://srmnexus.app" }); } catch { /* cancelled */ }
                      } else { window.open("https://wa.me/?text=https://srmnexus.app", "_blank"); }
                    }}
                    className="w-full bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] flex items-center gap-3 p-4 rounded-2xl hover:bg-[#00ff88]/20 transition-colors font-bold text-sm text-left">
                    <Share2 size={18} /> Share Nexus Portal
                  </button>
                </div>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <button onClick={handleLogout}
                className="w-full bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                <LogOut size={16} /> Terminate Session
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP NAV */}
      <div className="hidden md:flex">
        <nav className="srmx-desktop-nav" aria-label="Main navigation">
          {allNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item ${isActive(href, path) ? "active" : ""}`} aria-current={isActive(href, path) ? "page" : undefined}>
              <Icon size={16} className="mb-0.5" /><span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden">
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
              <motion.div
                initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-0 right-0 z-[90] bg-[#0a0a0c]/98 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.8)]"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
                role="dialog" aria-label="More navigation options"
              >
                {/* Drag handle */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-2" />

                {/* Profile Card */}
                <div style={{ padding: "12px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "16px",
                      background: "linear-gradient(135deg, #00ff88, #3b82f6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px", fontWeight: 900, color: "#000",
                      boxShadow: "0 4px 15px rgba(0,255,136,0.25)",
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                        {userName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#666", fontWeight: 700, marginTop: "2px" }}>
                        {regNo}{dept ? ` • ${dept}` : ""}
                      </div>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px",
                        padding: "3px 8px", borderRadius: "6px", fontSize: "9px", fontWeight: 900,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        background: studentPortalConnected ? "rgba(0,255,136,0.1)" : "rgba(239,68,68,0.1)",
                        color: studentPortalConnected ? "#00ff88" : "#ef4444",
                        border: `1px solid ${studentPortalConnected ? "rgba(0,255,136,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}>
                        <div style={{
                          width: "5px", height: "5px", borderRadius: "50%",
                          background: studentPortalConnected ? "#00ff88" : "#ef4444",
                        }} />
                        {studentPortalConnected ? "Portal Linked" : "Portal Unlinked"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Grid */}
                <div style={{ padding: "16px 20px 8px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 900, color: "#444", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "12px" }}>
                    Nexus Core
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {moreItems.map(({ href, label, icon: Icon }) => {
                      const active = isActive(href, path);
                      return (
                        <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                          className="flex flex-col items-center justify-center gap-2"
                          aria-current={active ? "page" : undefined}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            active ? "bg-[#00ff88]/20 text-[#00ff88] shadow-[inset_0_0_12px_rgba(0,255,136,0.3)]" : "bg-white/5 text-white/60"
                          }`}>
                            <Icon size={20} />
                          </div>
                          <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${active ? "text-[#00ff88]" : "text-white/60"}`}>
                            {label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Portal Services Grid */}
                <div style={{ padding: "16px 20px 8px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 900, color: "#444", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Portal Services</span>
                    {!studentPortalConnected && <span style={{ color: "#ef4444" }}>Requires Link</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-y-5 gap-x-3">
                    {PORTAL_SERVICES.map(({ href, label, icon: Icon }) => {
                      const active = isActive(href, path);
                      return (
                        <Link key={href} href={studentPortalConnected ? href : "#"} onClick={(e) => {
                          if (!studentPortalConnected) {
                            e.preventDefault();
                            // Optional: could open sync modal here if we wanted
                          } else {
                            setMoreOpen(false);
                          }
                        }}
                          className="flex flex-col items-center justify-start gap-2"
                          style={{ opacity: studentPortalConnected ? 1 : 0.4, cursor: studentPortalConnected ? "pointer" : "not-allowed" }}
                          aria-current={active ? "page" : undefined}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            active ? "bg-[#3b82f6]/20 text-[#3b82f6] shadow-[inset_0_0_12px_rgba(59,130,246,0.3)]" : "bg-white/5 text-white/60"
                          }`}>
                            <Icon size={20} />
                          </div>
                          <span className={`text-[9px] font-mono uppercase font-bold tracking-wider text-center ${active ? "text-[#3b82f6]" : "text-white/60"}`} style={{ lineHeight: 1.1 }}>
                            {label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ padding: "12px 20px 20px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 900, color: "#444", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "12px" }}>
                    Quick Actions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button onClick={() => { setMoreOpen(false); router.push("/settings/theme"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", textAlign: "left" }}>
                      <Sparkles size={16} style={{ color: "#a78bfa", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>Themes</div>
                        <div style={{ fontSize: "10px", color: "#555" }}>Customize your look</div>
                      </div>
                      <ChevronRight size={14} style={{ color: "#333" }} />
                    </button>
                    <button onClick={() => { setMoreOpen(false); router.push("/support"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", textAlign: "left" }}>
                      <BookOpen size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>Help & Support</div>
                        <div style={{ fontSize: "10px", color: "#555" }}>Get assistance</div>
                      </div>
                      <ChevronRight size={14} style={{ color: "#333" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* The Tab Bar */}
        <nav className="srmx-mobile-nav" aria-label="Main navigation">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, path);
            return (
              <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}
                onClick={() => setMoreOpen(false)} aria-current={active ? "page" : undefined} aria-label={label}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button className={`nav-item ${moreOpen ? "active" : ""}`}
            onClick={() => setMoreOpen(!moreOpen)} aria-label="More navigation options" aria-expanded={moreOpen}>
            <MoreHorizontal size={20} strokeWidth={moreOpen ? 2.5 : 2} />
            <span>More</span>
          </button>
        </nav>
      </div>
    </>
  );

  if (!mounted) return null;
  return createPortal(navContent, document.body);
}
