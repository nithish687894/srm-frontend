"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Settings, Home, Award, CheckCircle,
  Calendar, MoreHorizontal, Building, GraduationCap,
  MapPin, IdCard, UserCheck, Fingerprint,
  Copy, Check, User, Globe, Hash, Info, UserPlus, DoorOpen, Layers,
  RefreshCcw, ShieldCheck, Mail
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

  .nexus-card:active {
    transform: scale(0.98);
    border-color: rgba(0, 212, 255, 0.3);
  }

  .glow-text {
    text-shadow: 0 0 15px ${THEME.accentGlow};
  }

  .nav-item {
    color: ${THEME.textSecondary};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-active {
    color: ${THEME.accent};
    filter: drop-shadow(0 0 8px ${THEME.accentGlow});
  }

  .custom-scroll::-webkit-scrollbar { display: none; }
  .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
`;

/* ── Components ─────────────────────────────────────────────────────────────── */

const DataRow = ({ icon: Icon, label, value, delay = 0 }: any) => {
  if (!value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + delay }}
      className="nexus-card"
      style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "18px", marginBottom: "12px" }}
    >
      <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: "rgba(0,212,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: THEME.accent, border: "1px solid rgba(0,212,255,0.1)" }}>
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
  const [activeNav, setActiveNav] = useState('home');
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { studentPortalData, _hasHydrated, setStudentPortalData, setAcademicData } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
    if (_hasHydrated && !studentPortalData?.profile) {
      dataAPI.getUnified().then(d => {
        if (d?.success && d.studentPortal) {
          setStudentPortalData(d.studentPortal);
          setAcademicData({ ...d.academia, studentPortal: d.studentPortal });
        }
      });
    }
  }, [_hasHydrated, studentPortalData?.profile]);

  const profile = studentPortalData?.profile || {};
  const initials = profile.name ? profile.name.split(' ').map((n:any)=>n[0]).join('').slice(0,2).toUpperCase() : "NK";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isMounted || !_hasHydrated) return <div style={{ background: THEME.bg, height: '100vh' }} />;

  return (
    <div style={{ position: "fixed", inset: 0, background: THEME.bg, color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{STYLES}</style>

      {/* Decorative Glows */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '80%', height: '60%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '60%', height: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* HEADER */}
      <header style={{ paddingTop: "60px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ width: "48px", height: "48px", borderRadius: "18px", background: THEME.surface, border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "10px", fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.5em", margin: "0 0 4px 0" }}>NEXUS CORE</h1>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "0.05em" }}>STUDENT IDENTITY</p>
        </div>
        <button onClick={() => router.push('/settings')} style={{ width: "48px", height: "48px", borderRadius: "18px", background: THEME.surface, border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <Settings size={22} />
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 24px 140px", zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {!profile.name ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid rgba(0,212,255,0.1)", borderTopColor: THEME.accent, animation: "float 2s infinite ease-in-out" }} />
              <p style={{ marginTop: "24px", fontSize: "11px", fontWeight: 700, color: THEME.accent, letterSpacing: "0.3em", textTransform: "uppercase" }}>Syncing Identity...</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* PROFILE CARD */}
              <div className="nexus-card" style={{ padding: "32px 24px", textAlign: "center", marginBottom: "32px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, padding: "12px 20px", background: "rgba(16,185,129,0.1)", borderBottomLeftRadius: "20px", borderLeft: "1px solid rgba(16,185,129,0.2)", borderBottom: "1px solid rgba(16,185,129,0.2)" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: THEME.success }} />
                      <span style={{ fontSize: "10px", fontWeight: 700, color: THEME.success, textTransform: "uppercase" }}>Active</span>
                   </div>
                </div>

                <div style={{ width: "120px", height: "120px", borderRadius: "40px", background: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(59,130,246,0.1) 100%)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,212,255,0.2)", position: "relative" }}>
                   <span style={{ fontSize: "42px", fontWeight: 700, color: "#fff", letterSpacing: "-1px" }}>{initials}</span>
                </div>

                <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0", color: "#fff", lineHeight: 1.2 }}>{profile.name}</h2>
                <p style={{ fontSize: "13px", color: THEME.textSecondary, margin: "0 0 24px 0" }}>{profile.program}</p>

                <div onClick={() => handleCopy(profile.registerNo)} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 20px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: THEME.accent, fontFamily: "monospace" }}>{profile.registerNo}</span>
                  {copied ? <Check size={16} color={THEME.success} /> : <Copy size={16} color={THEME.textSecondary} />}
                </div>
              </div>

              {/* DETAILS GROUPS */}
              <section style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingLeft: "4px" }}>
                   <div style={{ width: "12px", height: "2px", background: THEME.accent, borderRadius: "2px" }} />
                   <span style={{ fontSize: "11px", fontWeight: 700, color: THEME.textSecondary, textTransform: "uppercase", letterSpacing: "0.2em" }}>Academic Data</span>
                </div>
                <DataRow icon={IdCard} label="Student ID" value={profile.studentId} delay={0.05} />
                <DataRow icon={Hash} label="Combo ID" value={profile.combo} delay={0.1} />
                <DataRow icon={Layers} label="Batch" value={profile.batch} delay={0.15} />
                <DataRow icon={DoorOpen} label="Room Number" value={profile.roomNo} delay={0.2} />
                <DataRow icon={MapPin} label="Section" value={profile.section} delay={0.25} />
                <DataRow icon={Mail} label="University Email" value={profile.email} delay={0.3} />
                <DataRow icon={Building} label="Institution" value={profile.institution} delay={0.35} />
              </section>

              <section style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingLeft: "4px" }}>
                   <div style={{ width: "12px", height: "2px", background: THEME.success, borderRadius: "2px" }} />
                   <span style={{ fontSize: "11px", fontWeight: 700, color: THEME.textSecondary, textTransform: "uppercase", letterSpacing: "0.2em" }}>Mentorship</span>
                </div>
                <DataRow icon={UserCheck} label="Faculty Advisor" value={profile.facultyAdvisor} delay={0.4} />
                <DataRow icon={ShieldCheck} label="Academic Advisor" value={profile.academicAdvisor} delay={0.45} />
              </section>

              {/* Original Code Preservation (Hidden) */}
              <div style={{ display: "none" }}>
                <MapPin /><Fingerprint /><User /><Hash /><Building /><GraduationCap /><Globe />
                <IdCard /><UserPlus /><Info /><RefreshCcw /><Globe />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* NAVIGATION DOCK */}
      <nav style={{ position: "fixed", bottom: "32px", left: "24px", right: "24px", height: "80px", background: "rgba(10,12,18,0.8)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 1000, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <button onClick={() => { setActiveNav('home'); router.push('/dashboard'); }} className={`nav-item ${activeNav === 'home' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <Home size={24} strokeWidth={activeNav === 'home' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>Nexus</span>
        </button>
        <button onClick={() => { setActiveNav('marks'); router.push('/marks'); }} className={`nav-item ${activeNav === 'marks' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <Award size={24} strokeWidth={activeNav === 'marks' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>Grades</span>
        </button>
        <button onClick={() => { setActiveNav('identity'); router.push('/portal/student-dashboard'); }} className={`nav-item ${activeNav === 'identity' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <User size={24} strokeWidth={activeNav === 'identity' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>Profile</span>
        </button>
        <button onClick={() => { setActiveNav('more'); router.push('/app-tools'); }} className={`nav-item ${activeNav === 'more' ? 'nav-active' : ''}`} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <MoreHorizontal size={24} strokeWidth={activeNav === 'more' ? 2.5 : 2} />
          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>Tools</span>
        </button>
      </nav>
    </div>
  );
}
