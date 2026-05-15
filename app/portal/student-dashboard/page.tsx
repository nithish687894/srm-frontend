"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Settings, Home, Award, CheckCircle,
  Calendar, MoreHorizontal, Building, GraduationCap,
  MapPin, IdCard, UserCheck, Fingerprint,
  Copy, Check, User, Globe, Hash, Info, UserPlus, DoorOpen, Layers,
  RefreshCcw, ShieldCheck, Mail, Shield, Cpu
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { dataAPI } from "@/lib/api";

/* ── Design System ──────────────────────────────────────────────────────────── */
const THEME = {
  bg: "#02040a",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accent: "#00d4ff",
  accentGlow: "rgba(0, 212, 255, 0.15)",
  success: "#10b981",
  warning: "#f59e0b",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.4)",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap');
  
  body { 
    font-family: 'Space Grotesk', sans-serif;
    background: ${THEME.bg};
  }

  .nexus-card {
    background: ${THEME.surface};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid ${THEME.border};
    border-radius: 28px;
    transition: all 0.3s ease;
  }

  .nav-item {
    color: ${THEME.textSecondary};
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .nav-active {
    color: ${THEME.accent};
    filter: drop-shadow(0 0 8px ${THEME.accentGlow});
  }

  .custom-scroll::-webkit-scrollbar { display: none; }
  .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  
  @keyframes scan {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 0.5; }
    100% { transform: translateY(100%); opacity: 0; }
  }

  .scanning-line {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, ${THEME.accent}, transparent);
    animation: scan 3s infinite linear;
    z-index: 5;
  }
`;

/* ── Components ─────────────────────────────────────────────────────────────── */

const DataRow = ({ icon: Icon, label, value, delay = 0, accent = THEME.accent }: any) => {
  if (!value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + delay }}
      className="nexus-card"
      style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "18px", marginBottom: "12px" }}
    >
      <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: `rgba(${accent === THEME.accent ? '0,212,255' : '16,185,129'},0.08)`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, border: `1px solid rgba(${accent === THEME.accent ? '0,212,255' : '16,185,129'},0.1)` }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: "9px", fontWeight: 700, color: THEME.textSecondary, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "4px" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 500, color: "#fff", letterSpacing: "0.02em" }}>{value}</p>
      </div>
    </motion.div>
  );
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('identity');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { studentPortalData, _hasHydrated, setStudentPortalData, setAcademicData } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated && !studentPortalData?.profile) {
      handleSync();
    }
  }, [_hasHydrated, studentPortalData?.profile]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const d = await dataAPI.getUnified();
      if (d?.success && d.studentPortal) {
        setStudentPortalData(d.studentPortal);
        setAcademicData({ ...d.academia, studentPortal: d.studentPortal });
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  if (!mounted) return null;

  const profile = studentPortalData?.profile || {};
  const initials = profile.name ? profile.name.split(' ').filter(Boolean).map((n:any)=>n[0]).join('').slice(0,2).toUpperCase() : "SR";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: THEME.bg, color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 10 }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Decorative Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,212,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* HEADER */}
      <header style={{ paddingTop: "60px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ width: "48px", height: "48px", borderRadius: "18px", background: THEME.surface, border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "10px", fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.5em", margin: "0 0 4px 0" }}>NEXUS CORE</h1>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "0.05em" }}>IDENTITY SYSTEM</p>
        </div>
        <button onClick={handleSync} style={{ width: "48px", height: "48px", borderRadius: "18px", background: THEME.surface, border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <RefreshCcw size={22} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 24px 180px", zIndex: 20 }}>
        <AnimatePresence mode="wait">
          {!profile.name ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
               <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid rgba(0,212,255,0.1)", borderTopColor: THEME.accent, animation: "spin 2s infinite linear" }} />
               <p style={{ marginTop: "32px", fontSize: "11px", fontWeight: 700, color: THEME.accent, letterSpacing: "0.4em", textTransform: "uppercase" }}>Syncing Core Data</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* PREMIUM ID CARD */}
              <div className="nexus-card" style={{ padding: "32px 24px", textAlign: "center", marginBottom: "32px", position: "relative", overflow: "hidden", border: `1px solid rgba(0,212,255,0.2)`, boxShadow: `0 0 40px ${THEME.accentGlow}` }}>
                <div className="scanning-line" />
                
                <div style={{ position: "absolute", top: 0, right: 0, padding: "12px 20px", background: "rgba(16,185,129,0.1)", borderBottomLeftRadius: "24px", borderLeft: "1px solid rgba(16,185,129,0.2)", borderBottom: "1px solid rgba(16,185,129,0.2)" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Shield size={10} color={THEME.success} fill={THEME.success} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: "9px", fontWeight: 800, color: THEME.success, textTransform: "uppercase", letterSpacing: "0.1em" }}>Verified Access</span>
                   </div>
                </div>

                <div style={{ width: "120px", height: "120px", borderRadius: "40px", background: "linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(59,130,246,0.1) 100%)", margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,212,255,0.3)", position: "relative" }}>
                   <span style={{ fontSize: "48px", fontWeight: 700, color: "#fff", letterSpacing: "-2px" }}>{initials}</span>
                </div>

                <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 10px 0", color: "#fff", lineHeight: 1.2 }}>{profile.name}</h2>
                <p style={{ fontSize: "13px", color: THEME.textSecondary, marginBottom: "28px" }}>{profile.program}</p>

                <div onClick={() => handleCopy(profile.registerNo)} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 24px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: THEME.accent, fontFamily: "monospace" }}>{profile.registerNo}</span>
                  {copied ? <Check size={16} color={THEME.success} /> : <Copy size={16} color={THEME.textSecondary} />}
                </div>
              </div>

              {/* DATA ROWS */}
              <DataRow icon={IdCard} label="Student ID" value={profile.studentId} delay={0.05} />
              <DataRow icon={Layers} label="Batch" value={profile.batch} delay={0.1} />
              <DataRow icon={MapPin} label="Section" value={profile.section} delay={0.15} />
              <DataRow icon={DoorOpen} label="Room No" value={profile.roomNo} delay={0.2} />
              <DataRow icon={Mail} label="Email" value={profile.email} delay={0.25} />
              
              {/* SECURITY SECTION */}
              <div style={{ margin: "32px 0 20px", display: "flex", alignItems: "center", gap: "10px", paddingLeft: "8px" }}>
                 <div style={{ width: "4px", height: "14px", background: THEME.success, borderRadius: "2px" }} />
                 <span style={{ fontSize: "11px", fontWeight: 800, color: THEME.textSecondary, textTransform: "uppercase", letterSpacing: "0.25em" }}>Verification Core</span>
              </div>
              <DataRow icon={Fingerprint} label="Biometric" value="Identity Synced" delay={0.3} accent={THEME.success} />
              <DataRow icon={Globe} label="Registry" value={profile.abcNumber || "National Database Verified"} delay={0.35} accent={THEME.success} />
              <DataRow icon={Hash} label="Record Hash" value={`NX-${profile.studentId}-${profile.section}`} delay={0.4} />

              {/* ADVISORS */}
              <div style={{ margin: "32px 0 20px", display: "flex", alignItems: "center", gap: "10px", paddingLeft: "8px" }}>
                 <div style={{ width: "4px", height: "14px", background: THEME.warning, borderRadius: "2px" }} />
                 <span style={{ fontSize: "11px", fontWeight: 800, color: THEME.textSecondary, textTransform: "uppercase", letterSpacing: "0.25em" }}>Oversight</span>
              </div>
              <DataRow icon={UserCheck} label="Faculty Advisor" value={profile.facultyAdvisor} delay={0.45} />
              <DataRow icon={ShieldCheck} label="Academic Advisor" value={profile.academicAdvisor} delay={0.5} />

              <div style={{ display: "none" }}>
                 <Building /><GraduationCap /><Globe /><Info /><UserPlus /><User />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* NAVIGATION DOCK (Ultra high z-index and fixed positioning) */}
      <nav style={{ position: "fixed", bottom: "32px", left: "24px", right: "24px", height: "80px", background: "rgba(10,12,18,0.9)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 100000, boxShadow: "0 25px 60px rgba(0,0,0,0.8)" }}>
        <button onClick={() => { setActiveNav('home'); router.push('/dashboard'); }} className={`nav-item ${activeNav === 'home' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <Home size={24} strokeWidth={activeNav === 'home' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>Nexus</span>
        </button>
        <button onClick={() => { setActiveNav('marks'); router.push('/marks'); }} className={`nav-item ${activeNav === 'marks' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <Award size={24} strokeWidth={activeNav === 'marks' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>Grades</span>
        </button>
        <button onClick={() => { setActiveNav('identity'); router.push('/portal/student-dashboard'); }} className={`nav-item ${activeNav === 'identity' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <User size={24} strokeWidth={activeNav === 'identity' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>Profile</span>
        </button>
        <button onClick={() => { setActiveNav('more'); router.push('/app-tools'); }} className={`nav-item ${activeNav === 'more' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <MoreHorizontal size={24} strokeWidth={activeNav === 'more' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>Tools</span>
        </button>
      </nav>
    </div>
  );
}
