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
  }, [_hasHydrated]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const d = await dataAPI.getUnified();
      if (d?.success && d.studentPortal) {
        setStudentPortalData(d.studentPortal);
        setAcademicData({ ...d.academia, studentPortal: d.studentPortal });
      }
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  if (!mounted) return <div style={{ background: '#050505', height: '100vh' }} />;

  const profile = studentPortalData?.profile || {};
  const initials = profile.name ? profile.name.split(' ').filter(Boolean).map((n:any)=>n[0]).join('').slice(0,2).toUpperCase() : "NK";

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#02040a", color: "#fff", display: "flex", flexDirection: "column", paddingBottom: "100px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Space Grotesk', sans-serif; background: #02040a; }
        .nexus-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 20px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />

      {/* HEADER */}
      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#00d4ff", textTransform: "uppercase", letterSpacing: "0.4em", margin: "0 0 4px" }}>NEXUS CORE</p>
          <p style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>IDENTITY</p>
        </div>
        <button onClick={handleSync} style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
          <RefreshCcw size={22} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      {/* CONTENT */}
      <main style={{ padding: "0 24px", flex: 1 }}>
        {!profile.name ? (
          <div style={{ height: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", border: "2px solid rgba(0,212,255,0.1)", borderTopColor: "#00d4ff", animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: "20px", color: "#00d4ff", fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em" }}>SYNCING...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="nexus-card" style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "30px", background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,212,255,0.2)" }}>
                 <span style={{ fontSize: "36px", fontWeight: 700 }}>{initials}</span>
              </div>
              <h2 style={{ fontSize: "22px", margin: "0 0 4px" }}>{profile.name}</h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>{profile.program}</p>
              <div onClick={() => handleCopy(profile.registerNo)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "12px", cursor: "pointer" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#00d4ff", fontFamily: "monospace" }}>{profile.registerNo}</span>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="rgba(255,255,255,0.3)" />}
              </div>
            </div>

            <div className="nexus-card" style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
               <IdCard size={20} color="#00d4ff" />
               <div>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Student ID</p>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: 500 }}>{profile.studentId}</p>
               </div>
            </div>
            <div className="nexus-card" style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
               <MapPin size={20} color="#00d4ff" />
               <div>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Section</p>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: 500 }}>{profile.section}</p>
               </div>
            </div>
            <div className="nexus-card" style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
               <Mail size={20} color="#00d4ff" />
               <div>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Email</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>{profile.email}</p>
               </div>
            </div>

            <div style={{ margin: "24px 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
               <Shield size={14} color="#10b981" />
               <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Verification Core</span>
            </div>
            <div className="nexus-card" style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px", borderColor: "rgba(16,185,129,0.2)" }}>
               <Fingerprint size={20} color="#10b981" />
               <div>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Biometric Status</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>Identity Synced</p>
               </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* NAV DOCK */}
      <nav style={{ position: "fixed", bottom: "24px", left: "20px", right: "20px", height: "72px", background: "rgba(10,12,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 1000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: activeNav === 'home' ? '#00d4ff' : 'rgba(255,255,255,0.3)' }}>
          <Home size={24} />
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: activeNav === 'marks' ? '#00d4ff' : 'rgba(255,255,255,0.3)' }}>
          <Award size={24} />
        </button>
        <button onClick={() => router.push('/portal/student-dashboard')} style={{ background: "none", border: "none", color: activeNav === 'identity' ? '#00d4ff' : 'rgba(255,255,255,0.3)' }}>
          <User size={24} />
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: activeNav === 'more' ? '#00d4ff' : 'rgba(255,255,255,0.3)' }}>
          <MoreHorizontal size={24} />
        </button>
      </nav>

      {/* Preservation Hidden */}
      <div style={{ display: "none" }}>
        <Building /><GraduationCap /><Globe /><Info /><UserPlus /><Hash /><DoorOpen /><Layers /><UserCheck /><ShieldCheck />
      </div>
    </div>
  );
}
