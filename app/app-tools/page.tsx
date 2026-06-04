"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IdCard, Calendar, Wrench,
  Sparkles, Calculator, ShieldAlert, GraduationCap, 
  LayoutTemplate, LifeBuoy, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import LoadingSkeleton from "@/components/aura-theme/LoadingSkeleton";

const THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPurple: "#bf00ff",
  accentCyan: "#00d4ff",
};

const AURA_COLORS = {
  bg: "#050508",
  primary: "#FF75C3",
  secondary: "#8F92FF",
  accent: "#94FFD8",
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
};

const MenuIcon = ({ icon: Icon, label, color = THEME.accentCyan, onClick }: AnyValue) => (
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

const ActionCard = ({ icon: Icon, title, subtitle, color = THEME.accentPurple, onClick }: AnyValue) => (
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
  const { studentPortalData, email } = useAuthStore();
  const { theme } = useThemeStore();
  const isLumina = theme === "lumina";
  
  useEffect(() => { const id = setTimeout(() => setMounted(true), 0); return () => clearTimeout(id); }, []);

  if (!mounted) return <LoadingSkeleton />;

  const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];
  const isAdmin = email && ADMIN_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase());

  const profile = studentPortalData?.profile || {};
  const initials = profile.name ? profile.name.split(' ').filter(Boolean).map((n:AnyValue)=>n[0]).join('').slice(0,2).toUpperCase() : "NK";

  return (
    <div style={{ height: "100vh", width: "100vw", background: isLumina ? AURA_COLORS.bg : THEME.bg, color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        
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

      {isLumina && (
        <>
          <div className="aura-blob" style={{ background: AURA_COLORS.primary, top: '-200px', left: '-100px' }} />
          <div className="aura-blob" style={{ background: AURA_COLORS.secondary, bottom: '-200px', right: '-100px', animationDelay: '-5s' }} />
        </>
      )}


      <main style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {/* HEADER: USER CARD */}
        <header style={{ padding: "60px 24px 20px", position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
            background: isLumina ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,212,255,0.03)', 
            backdropFilter: isLumina ? 'blur(40px)' : 'none',
            border: isLumina ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0,212,255,0.1)', 
            borderRadius: "24px"
          }}>
            <div style={{ 
              width: "56px", height: "56px", borderRadius: "16px", 
              background: isLumina ? "linear-gradient(135deg, #FF75C3, #8F92FF)" : "linear-gradient(135deg, #00ff88, #00d4ff)", 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#fff', fontSize: '20px', fontWeight: 900,
              boxShadow: isLumina ? 'none' : '0 0 20px rgba(0,212,255,0.3)'
            }}>
              {initials}
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>{profile.name || "Academic User"}</h2>
              <p style={{ fontSize: "11px", color: 'rgba(255,255,255,0.4)', marginTop: "4px" }}>
                {profile.registerNo || "Nexus ID Locked"} • {profile.program?.split('-')[0] || "Architecture Core"}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isLumina ? 'rgba(255, 117, 195, 0.1)' : 'rgba(0,255,136,0.1)', padding: '4px 10px', borderRadius: '8px', marginTop: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLumina ? AURA_COLORS.primary : '#00ff88' }} />
                <span style={{ fontSize: '9px', fontWeight: 900, color: isLumina ? AURA_COLORS.primary : '#00ff88', textTransform: 'uppercase' }}>PORTAL LINKED</span>
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "0 24px 120px" }}>
          {/* NEXUS CORE */}
          <SectionHeader title="NEXUS CORE" />
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px 0' }}>
            <MenuIcon icon={Calendar} label="Calendar" color="#fff" onClick={() => router.push('/calendar')} />
            <MenuIcon icon={Wrench} label="Tools" color={isLumina ? AURA_COLORS.accent : "#00ff88"} onClick={() => router.push('/tools')} />
            <MenuIcon icon={Sparkles} label="AI Tutor" color="#fff" onClick={() => router.push('/ai')} />
            <MenuIcon icon={Calculator} label="GPA Calc" color="#fff" onClick={() => router.push('/gpa')} />
            {isAdmin && <MenuIcon icon={ShieldAlert} label="Admin" color="#fff" onClick={() => router.push('/admin')} />}
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
            color={isLumina ? AURA_COLORS.primary : "#bf00ff"}
            onClick={() => router.push('/settings/theme')} 
          />
          <ActionCard 
            icon={LifeBuoy} 
            title="Help & Support" 
            subtitle="Get assistance" 
            color="#3673ff"
            onClick={() => router.push('/support')} 
          />
        </div>
      </main>
    </div>
  );
}
