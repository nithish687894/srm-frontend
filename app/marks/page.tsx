"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Home, Award, MoreHorizontal, IdCard, User, 
  Settings, AlertCircle, CheckCircle2
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { dataAPI } from "@/lib/api";

const THEME = {
  bg: "#050505",
  surface: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  accentPurple: "#bf00ff",
  accentCyan: "#00d4ff",
  accentRed: "#ff3b3b",
};

const GradeBadge = ({ grade }: { grade: string }) => {
  const isFail = grade === "F";
  const color = isFail ? THEME.accentRed : (grade === "O" || grade.includes('A')) ? THEME.accentCyan : THEME.accentPurple;
  
  return (
    <div style={{ 
      width: '60px', height: '60px', borderRadius: '50%', 
      background: `rgba(${isFail ? '255,59,59' : '191,0,255'}, 0.05)`, 
      border: `1px solid ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 20px ${color}1A`,
      flexShrink: 0
    }}>
      <span style={{ fontSize: '24px', fontWeight: 900, color }}>{grade}</span>
    </div>
  );
};

const RecordCard = ({ m }: { m: any }) => {
  return (
    <div style={{ 
      background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '24px',
      padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px'
    }}>
      <GradeBadge grade={m.grade || "—"} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>{m.code || m.courseCode}</span>
          <span style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{m.monthYear}</span>
        </div>
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: '0 0 8px', textTransform: 'uppercase', lineHeight: 1.3 }}>{m.description || m.courseTitle || "Course Title"}</h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CREDITS </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{m.credit || "0"}</span>
          </div>
          <div>
            <span style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SEM </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{m.semester || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MarksPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"evaluated" | "arrears">("evaluated");
  const { academicData, setAcademicData } = useAuthStore();
  
  useEffect(() => {
    setMounted(true);
    if (!academicData?.marks) {
      dataAPI.getMarks().then(res => {
        if (res.data) setAcademicData({ ...academicData, marks: res.data });
      });
    }
  }, []);

  if (!mounted) return <div style={{ background: '#050505', height: '100vh' }} />;

  const allMarks = academicData?.marks || [];
  const arrears = allMarks.filter((m: any) => m.grade === "F");
  const evaluated = allMarks.filter((m: any) => m.grade !== "F");
  
  const displayMarks = activeTab === "evaluated" ? evaluated : arrears;

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: "#fff", display: "flex", flexDirection: "column", paddingBottom: "140px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${THEME.bg}; }
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
          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em", display: 'block', marginTop: '2px' }}>GRADES & RECORDS</span>
        </div>
        <button style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={18} />
        </button>
      </header>

      <main style={{ padding: "0 20px", flex: 1 }}>
        
        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '4px', marginBottom: '24px' }}>
           <button 
             onClick={() => setActiveTab('evaluated')}
             style={{ 
               flex: 1, padding: '10px', borderRadius: '10px', border: 'none', 
               background: activeTab === 'evaluated' ? 'rgba(255,255,255,0.05)' : 'transparent',
               color: activeTab === 'evaluated' ? '#fff' : 'rgba(255,255,255,0.2)',
               fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
             }}
           >
             <CheckCircle2 size={14} color={activeTab === 'evaluated' ? THEME.accentCyan : 'currentColor'} />
             EVALUATED
           </button>
           <button 
             onClick={() => setActiveTab('arrears')}
             style={{ 
               flex: 1, padding: '10px', borderRadius: '10px', border: 'none', 
               background: activeTab === 'arrears' ? 'rgba(255,59,59,0.05)' : 'transparent',
               color: activeTab === 'arrears' ? THEME.accentRed : 'rgba(255,255,255,0.2)',
               fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
             }}
           >
             <AlertCircle size={14} color={activeTab === 'arrears' ? THEME.accentRed : 'currentColor'} />
             ARREARS
             {arrears.length > 0 && <span style={{ background: THEME.accentRed, color: '#000', fontSize: '10px', padding: '0 6px', borderRadius: '4px', marginLeft: '4px' }}>{arrears.length}</span>}
           </button>
        </div>

        {/* RECORDS LIST */}
        {displayMarks.length > 0 ? (
          displayMarks.map((m: any, i: number) => <RecordCard key={i} m={m} />)
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.2)' }}>
            <Award size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '13px', fontWeight: 800 }}>No {activeTab} records found.</p>
          </div>
        )}

      </main>

      {/* NAV DOCK */}
      <nav style={{ position: "fixed", bottom: "24px", left: "20px", right: "20px", height: "72px", background: "rgba(10,12,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 1000 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Home size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Nexus</span>
        </button>
        <button onClick={() => router.push('/marks')} style={{ background: "none", border: "none", color: THEME.accentCyan, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Award size={22} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}>Marks</span>
        </button>
        <button onClick={() => router.push('/portal/student-dashboard')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <User size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Records</span>
        </button>
        <button onClick={() => router.push('/app-tools')} style={{ background: "none", border: "none", color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>
    </div>
  );
}
