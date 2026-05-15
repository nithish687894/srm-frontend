"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Home, Award, MoreHorizontal, IdCard, User, Mail, MapPin, 
  RefreshCcw, Shield, Phone, GraduationCap, Users, BookOpen, Briefcase, Hash
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { dataAPI } from "@/lib/api";

const THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPurple: "#bf00ff",
  accentCyan: "#00d4ff",
};

/* ── Smart Data Extractor ────────────────────────────────────────────────── */

const extract = (val: any) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.address || val.value || val.name || val.text || null;
  }
  return String(val);
};

const Parameter = ({ label, value, width = "50%" }: any) => (
  <div style={{ width, marginBottom: "20px" }}>
    <p style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</p>
    <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>{extract(value) || "—"}</p>
  </div>
);

const SectionHeader = ({ icon: Icon, title, color = THEME.accentPurple }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '32px 0 16px', paddingLeft: '4px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
      <Icon size={16} />
    </div>
    <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{title}</span>
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
    } catch (e) { console.error(e); } finally { setTimeout(() => setIsSyncing(false), 800); }
  };

  if (!mounted) return <div style={{ background: '#050505', height: '100vh' }} />;

  const profile = studentPortalData?.profile || {};
  const personal = profile.personalDetails || {};
  const address = profile.address || {};
  const parent = profile.parentDetails || {};
  const contact = profile.contact || {};

  const getV = (key: string, subObj?: any) => {
    return extract(subObj?.[key]) || extract(profile[key]);
  };

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: "#fff", display: "flex", flexDirection: "column", paddingBottom: "140px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${THEME.bg}; }
        .vault-card { background: ${THEME.surface}; border: 1px solid ${THEME.border}; border-radius: 16px; padding: 20px; }
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />

      {/* HEADER */}
      <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: 'sticky', top: 0, background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: THEME.accentPurple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: THEME.accentPurple }} />
            <span style={{ fontSize: "10px", fontWeight: 900, color: THEME.accentPurple, textTransform: "uppercase", letterSpacing: "0.4em" }}>ACADEMIC OS</span>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: THEME.accentPurple }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", display: 'block', marginTop: '2px' }}>IDENTITY VAULT</span>
        </div>
        <button onClick={handleSync} style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCcw size={18} className={isSyncing ? "animate-spin" : ""} />
        </button>
      </header>

      <main style={{ padding: "0 20px", flex: 1 }}>
        {/* PROFILE SUMMARY */}
        <div className="vault-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: 'rgba(191,0,255,0.03)', borderColor: 'rgba(191,0,255,0.1)' }}>
           <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(191,0,255,0.1)", border: "1px solid rgba(191,0,255,0.2)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.accentPurple }}>
              <User size={30} />
           </div>
           <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{getV('name')}</h2>
              <p style={{ fontSize: "11px", color: THEME.accentCyan, fontWeight: 700, marginTop: "4px" }}>{getV('registerNo')}</p>
           </div>
        </div>

        <SectionHeader icon={User} title="Primary Parameters" />
        <div className="vault-card">
           <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <Parameter label="Date of Birth" value={getV('dob', personal)} />
              <Parameter label="Gender" value={getV('gender', personal)} />
              <Parameter label="Nationality" value={getV('nationality', personal)} />
              <Parameter label="Blood Group" value={getV('bloodGroup', personal)} />
           </div>
        </div>

        <SectionHeader icon={Users} title="Lineage Node" color="#ff0080" />
        <div className="vault-card">
           <Parameter label="Father / Guardian" value={getV('fatherName', parent)} width="100%" />
           <Parameter label="Mother / Primary" value={getV('motherName', parent)} width="100%" />
           <Parameter label="Parent Contact" value={getV('contactNo', parent) || getV('emergencyContact')} />
           <Parameter label="Parent Email" value={getV('email', parent)} />
        </div>

        <SectionHeader icon={MapPin} title="Geographic Location" color="#ff3d00" />
        <div className="vault-card">
           <Parameter label="Residential Address" value={address.address} width="100%" />
           <div style={{ display: 'flex' }}>
              <Parameter label="District" value={address.district} />
              <Parameter label="State" value={address.state} />
           </div>
           <Parameter label="Pincode" value={address.pincode} />
        </div>

        <SectionHeader icon={Phone} title="Communication Channels" color="#00ff88" />
        <div className="vault-card">
           <Parameter label="Student Mobile" value={contact.mobile} width="100%" />
           <Parameter label="Official Email" value={profile.email} width="100%" />
        </div>

        <SectionHeader icon={GraduationCap} title="Academic Linkage" color={THEME.accentCyan} />
        <div className="vault-card">
           <Parameter label="Program" value={getV('program')} width="100%" />
           <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <Parameter label="Semester" value={getV('semester')} />
              <Parameter label="Section" value={getV('section')} />
              <Parameter label="Batch" value={getV('batch')} />
              <Parameter label="Room No" value={getV('roomNo')} />
           </div>
           <Parameter label="ABC ID / Number" value={getV('abcNumber')} width="100%" />
        </div>

        <SectionHeader icon={Briefcase} title="Advisor Infrastructure" color="#ffcc00" />
        <div className="vault-card">
           <Parameter label="Faculty Advisor" value={getV('facultyAdvisor')} width="100%" />
           <Parameter label="Academic Advisor" value={getV('academicAdvisor')} width="100%" />
        </div>
      </main>

      <nav style={{ position: "fixed", bottom: "24px", left: "20px", right: "20px", height: "72px", background: "rgba(10,12,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 1000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Nexus</span>
        </button>
        <button onClick={() => router.push('/portal/student-dashboard')} style={{ background: "none", border: "none", color: THEME.accentCyan, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <IdCard size={22} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Records</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>
    </div>
  );
}
