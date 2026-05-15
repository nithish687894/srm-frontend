"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Settings, Copy, Check, Home, Award, 
  CheckCircle, Calendar, MoreHorizontal, Building, 
  GraduationCap, MapPin, IdCard, UserCheck, Fingerprint
} from 'lucide-react';
import { useAuthStore } from "@/lib/store";

const STYLES = `
  .loader {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top: 3px solid #00d4ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .custom-scroll::-webkit-scrollbar { display: none; }
  .custom-scroll { -ms-overflow-style: none; scrollbar-width: none; }
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
      borderLeft: '3px solid #00d4ff'
    }}>
      <div style={{ color: '#00d4ff' }}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>{value}</p>
      </div>
    </div>
  );
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const profile = studentPortalData?.profile;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <style>{STYLES}</style>
      
      {/* HEADER */}
      <header style={{ paddingTop: '55px', paddingBottom: '16px', paddingLeft: '24px', paddingRight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000000' }}>
        <button onClick={() => router.back()} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
          <ArrowLeft size={20} color="#ffffff" />
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.4em' }}>Nexus Portal</p>
          <h1 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Student Identity</h1>
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
            <div className="loader" style={{ marginBottom: '24px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Establishing Uplink</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '8px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Waiting for Student Portal Response...</p>
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: '100px' }}>
            
            {/* PROFILE HERO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', marginTop: '10px' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '30px', fontWeight: 900, color: '#00d4ff' }}>NS</span>
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 900, color: '#ffffff', textAlign: 'center', textTransform: 'uppercase' }}>{profile.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>{profile.registerNo}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Batch {profile.batch}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '9px', fontWeight: 900, borderRadius: '4px', textTransform: 'uppercase' }}>Dept: CS</span>
                <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '9px', fontWeight: 900, borderRadius: '4px', textTransform: 'uppercase' }}>Sec: {profile.section}</span>
              </div>
            </div>

            {/* DATA LIST */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
              <InfoRow index={0} icon={IdCard} label="System ID" value={profile.studentId} />
              <InfoRow index={1} icon={GraduationCap} label="Primary Program" value={profile.program} />
              <InfoRow index={2} icon={Building} label="Institution" value={profile.institution} />
              <InfoRow index={3} icon={MapPin} label="Assigned Section" value={profile.section} />
              <InfoRow index={4} icon={Fingerprint} label="ABC Identity" value={profile.abcNumber} />
            </div>

            <div style={{ marginTop: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
               <InfoRow index={0} icon={UserCheck} label="Faculty Advisor" value={profile.facultyAdvisor} />
               <InfoRow index={1} icon={UserCheck} label="Academic Advisor" value={profile.academicAdvisor} />
            </div>

          </div>
        )}
      </main>

      {/* NAVIGATION */}
      <nav style={{ height: '85px', backgroundColor: '#000000', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: '20px' }}>
        <button onClick={() => setActiveNav('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: activeNav === 'home' ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
          <Home size={20} strokeWidth={activeNav === 'home' ? 2.5 : 2} />
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
        <button onClick={() => setActiveNav('more')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: activeNav === 'more' ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
          <MoreHorizontal size={20} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>

    </div>
  );
}
