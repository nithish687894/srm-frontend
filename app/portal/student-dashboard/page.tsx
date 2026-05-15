"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Settings, Home, Award, CheckCircle,
  Calendar, MoreHorizontal, Building, GraduationCap,
  MapPin, IdCard, UserCheck, Fingerprint,
  Copy, Check, User, Globe, Hash
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { dataAPI } from "@/lib/api";

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const STYLES = `
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
  }
  .nexus-glow { box-shadow: 0 0 30px rgba(0, 212, 255, 0.15); }
  .nav-active { color: #00d4ff !important; text-shadow: 0 0 12px rgba(0, 212, 255, 0.5); }
  .custom-scroll::-webkit-scrollbar { display: none; }
  .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ── Identity Tile ──────────────────────────────────────────────────────────── */
const IdentityTile = ({ icon: Icon, label, value, delay }: { icon: any; label: string; value: string | undefined; delay: number }) => {
  if (!value || value === "Not Assigned") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card"
      style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}
    >
      <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4ff" }}>
        <Icon size={18} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>{value}</p>
      </div>
    </motion.div>
  );
};

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function StudentDashboardPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const { studentPortalData, setStudentPortalData, setAcademicData } = useAuthStore();

  useEffect(() => {
    if (!studentPortalData?.profile) {
      dataAPI.getUnified()
        .then((d) => {
          if (d?.success && d.studentPortal) {
            setStudentPortalData(d.studentPortal);
            setAcademicData({ ...d.academia, studentPortal: d.studentPortal });
          } else {
            setFetchError(true);
          }
        })
        .catch(() => setFetchError(true));
    }
  }, []);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const profile = studentPortalData?.profile;
  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#050505", color: "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{STYLES}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{ paddingTop: "60px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50 }}>
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{ width: "44px", height: "44px", borderRadius: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}
        >
          <ArrowLeft size={22} />
        </button>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.4em", display: "block", marginBottom: "2px" }}>NEXUS PORTAL</span>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Identity Card</span>
        </div>

        <button
          onClick={() => router.push("/settings/theme")}
          aria-label="Settings"
          style={{ width: "44px", height: "44px", borderRadius: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}
        >
          <Settings size={22} />
        </button>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <main className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 24px 120px" }}>
        <AnimatePresence mode="wait">
          {!profile ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}
            >
              {fetchError ? (
                <>
                  <p style={{ fontSize: "14px", fontWeight: 800, color: "#ef4444", marginBottom: "8px" }}>Connection Failed</p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>Session may have expired</p>
                  <button
                    onClick={() => { setFetchError(false); window.location.reload(); }}
                    style={{ padding: "12px 24px", background: "#00d4ff", color: "#000", border: "none", borderRadius: "12px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", border: "3px solid rgba(0,212,255,0.1)", borderTopColor: "#00d4ff", animation: "spin 1s linear infinite" }} />
                  <p style={{ marginTop: "20px", fontSize: "10px", fontWeight: 800, color: "#00d4ff", letterSpacing: "0.3em", textTransform: "uppercase" }}>Establishing Link</p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Status Pill */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
                <div className="glass-card" style={{ padding: "6px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em" }}>System Active • Fully Synced</span>
                </div>
              </div>

              {/* Profile Hero */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
                <div style={{ position: "relative", marginBottom: "24px" }}>
                  <div className="nexus-glow" style={{ width: "110px", height: "110px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(59,130,246,0.1) 100%)", border: "2px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "38px", fontWeight: 800, color: "#fff", letterSpacing: "-2px" }}>{initials}</span>
                  </div>
                  <div style={{ position: "absolute", bottom: "4px", right: "4px", background: "#050505", padding: "4px", borderRadius: "50%" }}>
                    <div style={{ background: "#10b981", width: "12px", height: "12px", borderRadius: "50%", border: "2px solid #050505" }} />
                  </div>
                </div>

                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "0 0 8px 0", textAlign: "center", textTransform: "uppercase", lineHeight: 1.1 }}>{profile.name}</h2>

                <div
                  onClick={() => handleCopy(profile.registerNo)}
                  role="button"
                  tabIndex={0}
                  aria-label="Copy registration number"
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", background: "rgba(255,255,255,0.03)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <span style={{ color: "#00d4ff", fontWeight: 700, fontSize: "13px", fontFamily: "monospace" }}>{profile.registerNo}</span>
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="rgba(255,255,255,0.3)" />}
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <span style={{ padding: "6px 14px", borderRadius: "12px", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00d4ff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                    DEPT: {profile.department?.split(" ")[0] || "CS"}
                  </span>
                  <span style={{ padding: "6px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                    SEC: {profile.section}
                  </span>
                </div>
              </div>

              {/* Core Identity */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ paddingLeft: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "4px", height: "14px", background: "#00d4ff", borderRadius: "2px" }} />
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Core Identity</span>
                </div>
                <IdentityTile delay={0.1} icon={IdCard} label="Internal System ID" value={profile.studentId} />
                <IdentityTile delay={0.2} icon={GraduationCap} label="Primary Program" value={profile.program} />
                <IdentityTile delay={0.3} icon={Building} label="Institution" value={profile.institution} />
                <IdentityTile delay={0.4} icon={Globe} label="ABC Identity" value={profile.abcNumber} />
              </div>

              {/* Advisors */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ paddingLeft: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "4px", height: "14px", background: "#10b981", borderRadius: "2px" }} />
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Academic Support</span>
                </div>
                <IdentityTile delay={0.5} icon={UserCheck} label="Faculty Advisor" value={profile.facultyAdvisor} />
                <IdentityTile delay={0.6} icon={UserCheck} label="Academic Advisor" value={profile.academicAdvisor} />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── NAV DOCK ────────────────────────────────────────────────────────── */}
      <nav style={{ position: "absolute", bottom: "24px", left: "20px", right: "20px", height: "72px", background: "rgba(15,15,15,0.85)", backdropFilter: "blur(20px)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 10px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 100 }}>
        {[
          { icon: Home, label: "Home", href: "/portal/student-dashboard", active: true },
          { icon: Award, label: "Marks", href: "/portal/grade-mark-credit" },
          { icon: CheckCircle, label: "Attnd", href: "/dashboard" },
          { icon: Calendar, label: "Time", href: "/timetable" },
          { icon: MoreHorizontal, label: "More", href: "/app-tools" },
        ].map(({ icon: NavIcon, label, href, active }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={active ? "nav-active" : ""}
            aria-label={label}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", color: active ? "#00d4ff" : "rgba(255,255,255,0.3)", cursor: "pointer" }}
          >
            <NavIcon size={22} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase" }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
