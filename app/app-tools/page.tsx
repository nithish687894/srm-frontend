"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, Award, MoreHorizontal, IdCard, Calendar, Wrench, 
  Sparkles, Calculator, ShieldAlert, GraduationCap, 
  LayoutTemplate, LifeBuoy, ChevronRight, User
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { motion } from "framer-motion";

const THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPurple: "#bf00ff",
  accentCyan: "#00d4ff",
};

const MenuIcon = ({ icon: Icon, label, color = THEME.accentCyan, onClick }: any) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', 
      background: 'none', border: 'none', cursor: 'pointer', width: '80px' 
    }}
  >
    <div style={{ 
      width: '64px', height: '64px', borderRadius: '20px', 
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      transition: 'all 0.2s ease',
      boxShadow: `0 8px 24px rgba(0,0,0,0.2)`
    }}>
      <Icon size={24} />
    </div>
    <span style={{ 
      fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', 
      textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' 
    }}>{label}</span>
  </button>
);

const ActionCard = ({ icon: Icon, title, subtitle, color = THEME.accentPurple, onClick }: any) => (
  <button 
    onClick={onClick}
    style={{ 
      width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
      background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '20px',
      marginBottom: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
    }}
  >
    <div style={{ color }}>
      <Icon size={22} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>{title}</p>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>{subtitle}</p>
    </div>
    <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
  </button>
);

const SectionHeader = ({ title }: { title: string }) => (
  <p style={{ 
    fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', 
    textTransform: 'uppercase', letterSpacing: '0.3em', margin: '32px 0 16px', paddingLeft: '4px' 
  }}>{title}</p>
);

export default function AppToolsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { studentPortalData } = useAuthStore();
  const { theme } = useThemeStore();
  const isAura = theme === "aura";
  
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div style={{ background: '#050505', height: '100vh' }} />;

  const profile = studentPortalData?.profile || {};
  const initials = profile.name ? profile.name.split(' ').filter(Boolean).map((n:any)=>n[0]).join('').slice(0,2).toUpperCase() : "NK";

  return (
    <div style={{ minHeight: "100vh", background: isAura ? "#050508" : THEME.bg, color: "#fff", display: "flex", flexDirection: "column", paddingBottom: "140px", overflow: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${isAura ? "#050508" : THEME.bg}; }
        
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(140px);
          opacity: 0.15; z-index: 0; pointer-events: none;
          animation: orbit 20s infinite linear;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translate(100px) rotate(0deg); }
          to { transform: rotate(360deg) translate(100px) rotate(-360deg); }
        }
      `}} />

      {isAura && (
        <>
          <div className="aura-blob" style={{ background: "#FF75C3", top: '-200px', left: '-100px' }} />
          <div className="aura-blob" style={{ background: "#8F92FF", bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />
        </>
      )}

      {/* HEADER: USER CARD */}
      <div style={{ padding: "60px 24px 20px", position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
          background: isAura ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,212,255,0.03)', 
          backdropFilter: isAura ? 'blur(40px)' : 'none',
          border: isAura ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,212,255,0.1)', 
          borderRadius: "24px"
        }}>
          <div style={{ 
            width: "56px", height: "56px", borderRadius: "16px", 
            background: isAura ? "linear-gradient(135deg, #FF75C3, #8F92FF)" : "linear-gradient(135deg, #00ff88, #00d4ff)", 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: '#fff', fontSize: '20px', fontWeight: 900,
            boxShadow: isAura ? 'none' : '0 0 20px rgba(0,212,255,0.3)'
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>{profile.name || "Academic User"}</h2>
            <p style={{ fontSize: "11px", color: 'rgba(255,255,255,0.4)', marginTop: "4px" }}>
              {profile.registerNo || "Nexus ID Locked"} • {profile.program?.split('-')[0] || "Architecture Core"}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isAura ? 'rgba(255, 117, 195, 0.1)' : 'rgba(0,255,136,0.1)', padding: '4px 10px', borderRadius: '8px', marginTop: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAura ? '#FF75C3' : '#00ff88' }} />
              <span style={{ fontSize: '9px', fontWeight: 900, color: isAura ? '#FF75C3' : '#00ff88', textTransform: 'uppercase' }}>PORTAL LINKED</span>
            </div>
          </div>
        </div>
      </div>

      <main style={{ padding: "0 24px", flex: 1 }}>
        
        {/* NEXUS CORE */}
        <SectionHeader title="NEXUS CORE" />
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px 0' }}>
          <MenuIcon icon={Calendar} label="Calendar" color="#fff" onClick={() => router.push('/calendar')} />
          <MenuIcon icon={Wrench} label="Tools" color="#00ff88" onClick={() => {}} />
          <MenuIcon icon={Sparkles} label="AI Tutor" color="#fff" onClick={() => router.push('/ai')} />
          <MenuIcon icon={Calculator} label="GPA Calc" color="#fff" onClick={() => router.push('/gpa')} />
          <MenuIcon icon={ShieldAlert} label="Admin" color="#fff" onClick={() => router.push('/admin')} />
        </div>

        {/* PORTAL SERVICES */}
        <SectionHeader title="PORTAL SERVICES" />
        <div style={{ display: 'flex', gap: '24px' }}>
          <MenuIcon icon={IdCard} label="Student Dashboard" color="#fff" onClick={() => router.push('/portal/student-dashboard')} />
          <MenuIcon icon={GraduationCap} label="Grade & Credit" color="#fff" onClick={() => router.push('/portal/grade-mark-credit')} />
        </div>

        {/* QUICK ACTIONS */}
        <SectionHeader title="QUICK ACTIONS" />
        <ActionCard 
          icon={LayoutTemplate} 
          title="Themes" 
          subtitle="Customize your look" 
          color="#bf00ff"
          onClick={() => router.push('/settings/theme')} 
        />
        <ActionCard 
          icon={LifeBuoy} 
          title="Help & Support" 
          subtitle="Get assistance" 
          color="#3673ff"
          onClick={() => router.push('/support')} 
        />

      </main>

      {/* NAV DOCK */}
      <nav style={{ 
        position: "fixed", 
        bottom: "0", 
        left: "0", 
        right: "0", 
        height: isAura ? "calc(80px + env(safe-area-inset-bottom))" : "72px", 
        paddingBottom: isAura ? "env(safe-area-inset-bottom)" : "0",
        background: isAura ? "rgba(5,5,8,0.7)" : "rgba(10,12,18,0.95)", 
        backdropFilter: "blur(30px)",
        borderTop: isAura ? "1px solid rgba(255,255,255,0.05)" : "none",
        border: !isAura ? "1px solid rgba(255,255,255,0.1)" : "none",
        borderRadius: isAura ? "0" : "24px",
        margin: isAura ? "0" : "0 20px 24px",
        display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 1000 
      }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>{isAura ? "SPACE" : "Nexus"}</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Award size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>{isAura ? "LOGS" : "Marks"}</span>
        </button>
        <button onClick={() => router.push('/attendance')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Activity size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>{isAura ? "SYNC" : "Sync"}</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: isAura ? "#FF75C3" : THEME.accentCyan, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>MORE</span>
        </button>
      </nav>
    </div>
  );
}
