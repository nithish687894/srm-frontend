"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Settings, Copy, Check, Home, Award, 
  CheckCircle, Calendar, MoreHorizontal, Building, 
  GraduationCap, MapPin, IdCard, UserCheck, Fingerprint
} from 'lucide-react';
import { useAuthStore } from "@/lib/store";

const STYLES = `
  .custom-scroll::-webkit-scrollbar { display: none; }
  .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  .active-glow { box-shadow: 0 0 15px rgba(0, 212, 255, 0.3); }
  @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .animate-pulse-slow { animation: pulse-slow 2s infinite; }
`;

const InfoRow = ({ icon: Icon, label, value, index }: any) => {
  if (!value || value === "Not Assigned") return null;
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '16px', 
      backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      borderLeft: '2px solid #00d4ff'
    }}>
      <div style={{ color: '#00d4ff', opacity: 0.8 }}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>{value}</p>
      </div>
    </div>
  );
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const profile = studentPortalData?.profile;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <style>{STYLES}</style>
      
      {/* HEADER */}
      <header style={{ paddingTop: '50px', paddingBottom: '16px', paddingLeft: '24px', paddingRight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000000' }}>
        <button onClick={() => router.back()} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
          <ArrowLeft size={20} color="#ffffff" />
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.4em' }}>Nexus Portal</p>
          <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Student Identity</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
            <span style={{ padding: '2px 6px', background: '#10b981', color: '#000000', fontSize: '7px', fontWeight: 900, borderRadius: '2px', textTransform: 'uppercase' }}>Active</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ fontSize: '7px', fontWeight: 900, color: '#00d4ff', textTransform: 'uppercase' }}>Synced</span>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />
            </div>
          </div>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <Settings size={20} color="#ffffff" />
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {!profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#00d4ff', marginBottom: '16px' }} />
            <p style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Initializing...</p>
          </div>
        ) : (
          <div style={{ paddingBottom: '100px' }}>
            
            {/* PROFILE HERO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,212,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 40px rgba(0,212,255,0.1)' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#00d4ff' }}>NS</span>
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 900, color: '#ffffff', textAlign: 'center', textTransform: 'uppercase', lineHeight: 1 }}>{profile.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>{profile.registerNo}</span>
                <span>•</span>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Batch {profile.batch}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <span style={{ padding: '4px 10px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: '9px', fontWeight: 900, borderRadius: '4px', textTransform: 'uppercase' }}>Dept: CS</span>
                <span style={{ padding: '4px 10px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: '9px', fontWeight: 900, borderRadius: '4px', textTransform: 'uppercase' }}>Sec: {profile.section}</span>
              </div>
            </div>

            {/* DATA LIST */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              <InfoRow index={0} icon={IdCard} label="System ID" value={profile.studentId} />
              <InfoRow index={1} icon={GraduationCap} label="Primary Program" value={profile.program} />
              <InfoRow index={2} icon={Building} label="Institution" value={profile.institution} />
              <InfoRow index={3} icon={MapPin} label="Assigned Section" value={profile.section} />
              <InfoRow index={4} icon={Fingerprint} label="ABC Identity" value={profile.abcNumber} />
            </div>

            <div style={{ marginTop: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
               <InfoRow index={0} icon={UserCheck} label="Faculty Advisor" value={profile.facultyAdvisor} />
               <InfoRow index={1} icon={UserCheck} label="Academic Advisor" value={profile.academicAdvisor} />
            </div>

          </div>
        )}
      </main>

      {/* NAVIGATION */}
      <nav style={{ height: '80px', backgroundColor: '#000000', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: '16px' }}>
        <button onClick={() => setActiveNav('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#00d4ff' }}>
          <Home size={20} strokeWidth={2.5} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Home</span>
        </button>
        <button onClick={() => router.push('/portal/grade-mark-credit')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)' }}>
          <Award size={20} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Marks</span>
        </button>
        <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)' }}>
          <CheckCircle size={20} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Attnd</span>
        </button>
        <button onClick={() => router.push('/timetable')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)' }}>
          <Calendar size={20} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Time</span>
        </button>
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)' }}>
          <MoreHorizontal size={20} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>

    </div>
  );
}
function setActiveNav(arg0: string): void {
  // Mock function to satisfy the button click
}
