"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Settings, Home, Award, CheckCircle,
  Calendar, MoreHorizontal, Building, GraduationCap,
  MapPin, IdCard, UserCheck, Fingerprint,
  Copy, Check, User, Globe, Hash, Info, UserPlus, DoorOpen, Layers,
  RefreshCcw, ShieldCheck, Mail, Shield, Cpu, Heart, Users, Phone, Map,
  UserCircle
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { dataAPI } from "@/lib/api";

/* ── Academic OS Design Tokens ────────────────────────────────────────────── */
const OS_THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.02)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPrimary: "#bf00ff", // Purple
  accentSecondary: "#00d4ff", // Cyan
  textHeader: "rgba(191, 0, 255, 0.6)",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
  
  body { 
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: ${OS_THEME.bg};
    color: #fff;
    margin: 0;
  }

  .vault-card {
    background: ${OS_THEME.surface};
    border: 1px solid ${OS_THEME.border};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 8px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 16px;
    padding-left: 4px;
  }

  .section-title {
    font-size: 10px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.3em;
  }

  .param-label {
    font-size: 9px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 6px;
  }

  .param-value {
    font-size: 16px;
    font-weight: 800;
    color: #fff;
    margin: 0;
  }

  .animate-spin { animation: spin 2s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ── Components ─────────────────────────────────────────────────────────────── */

const Parameter = ({ label, value, width = "50%" }: any) => (
  <div style={{ width, marginBottom: "20px" }}>
    <p className="param-label">{label}</p>
    <p className="param-value">{value || "N/A"}</p>
  </div>
);

const SectionIcon = ({ icon: Icon, color = OS_THEME.accentPrimary }: any) => (
  <div style={{ 
    width: "32px", height: "32px", borderRadius: "10px", 
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
    display: "flex", alignItems: "center", justifyContent: "center", color
  }}>
    <Icon size={16} />
  </div>
);

export default function StudentDashboardPage() {
  const router = useRouter();
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

  if (!mounted) return null;

  const profile = studentPortalData?.profile || {};
  
  return (
    <div style={{ minHeight: "100vh", background: OS_THEME.bg, display: "flex", flexDirection: "column", paddingBottom: "120px" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* HEADER: ACADEMIC OS • IDENTITY VAULT */}
      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: OS_THEME.accentPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: OS_THEME.accentPrimary }} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: OS_THEME.accentPrimary, textTransform: "uppercase", letterSpacing: "0.4em" }}>ACADEMIC OS</span>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: OS_THEME.accentPrimary }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", display: 'block', marginTop: '2px' }}>IDENTITY VAULT</span>
        </div>

        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "0 20px" }}>
        {/* PROFILE SUMMARY */}
        <div className="vault-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: 'rgba(191,0,255,0.03)', borderColor: 'rgba(191,0,255,0.1)' }}>
           <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(191,0,255,0.1)", border: "1px solid rgba(191,0,255,0.2)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: OS_THEME.accentPrimary }}>
              <User size={30} />
           </div>
           <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{profile.name || "UNSYNCED"}</h2>
              <p style={{ fontSize: "11px", color: OS_THEME.accentSecondary, fontWeight: 700, marginTop: "4px" }}>{profile.registerNo || "RA000000000000"}</p>
           </div>
        </div>

        {/* PRIMARY PARAMETERS */}
        <div className="section-header">
           <SectionIcon icon={UserCircle} />
           <span className="section-title">Primary Parameters</span>
        </div>
        <div className="vault-card">
           <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <Parameter label="Date of Birth" value={profile.dob} />
              <Parameter label="Gender" value={profile.gender} />
              <Parameter label="Nationality" value={profile.nationality} />
              <Parameter label="Blood Group" value={profile.bloodGroup} />
           </div>
        </div>

        {/* LINEAGE NODE */}
        <div className="section-header">
           <SectionIcon icon={Users} color="#ff0080" />
           <span className="section-title">Lineage Node</span>
        </div>
        <div className="vault-card">
           <Parameter label="Father / Guardian" value={profile.fatherName} width="100%" />
           <Parameter label="Mother / Primary" value={profile.motherName} width="100%" />
           <Parameter label="Emergency Contact" value={profile.emergencyContact} width="100%" />
           <Parameter label="Parental Email" value={profile.parentEmail} width="100%" />
        </div>

        {/* GEOGRAPHIC LOCATION */}
        <div className="section-header">
           <SectionIcon icon={MapPin} color="#ff3d00" />
           <span className="section-title">Geographic Location</span>
        </div>
        <div className="vault-card">
           <Parameter label="Current Residential Address" value={profile.address} width="100%" />
           <div style={{ display: 'flex' }}>
              <Parameter label="District" value={profile.district} />
              <Parameter label="State" value={profile.state} />
           </div>
           <Parameter label="Pincode" value={profile.pincode} />
        </div>

        {/* COMMUNICATION CHANNELS */}
        <div className="section-header">
           <SectionIcon icon={Phone} color="#00ff88" />
           <span className="section-title">Communication Channels</span>
        </div>
        <div className="vault-card">
           <Parameter label="Student Mobile" value={profile.mobile} width="100%" />
           <Parameter label="Official Email" value={profile.email} width="100%" />
        </div>

        {/* ACADEMIC LINKS */}
        <div className="section-header">
           <SectionIcon icon={GraduationCap} color={OS_THEME.accentSecondary} />
           <span className="section-title">Academic Linkage</span>
        </div>
        <div className="vault-card">
           <Parameter label="Program" value={profile.program} width="100%" />
           <Parameter label="Institution" value={profile.institution} width="100%" />
           <div style={{ display: 'flex' }}>
              <Parameter label="Section" value={profile.section} />
              <Parameter label="Batch" value={profile.batch} />
           </div>
        </div>
      </main>

      {/* NAVIGATION DOCK: ACADEMIC OS STYLE */}
      <nav style={{ position: "fixed", bottom: "24px", left: "20px", right: "20px", height: "72px", background: "rgba(10,12,18,0.9)", backdropFilter: "blur(40px)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 1000, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Home</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Award size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Marks</span>
        </button>
        <button onClick={() => router.push('/portal/student-dashboard')} style={{ background: "none", border: "none", color: OS_THEME.accentSecondary, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <IdCard size={22} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: OS_THEME.accentSecondary }}>Records</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Settings size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>

      {/* PLANNED CODE PRESERVATION */}
      <div style={{ display: "none" }}>
        <Building /><Globe /><Info /><UserPlus /><Hash /><DoorOpen /><Layers /><UserCheck /><ShieldCheck /><Fingerprint /><Heart /><Map />
      </div>
    </div>
  );
}
