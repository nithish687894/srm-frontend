"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Home, Award, MoreHorizontal, IdCard, User, 
  Settings, AlertCircle, CheckCircle2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
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

export default function GradeMarkCreditPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"evaluated" | "arrears">("evaluated");
  const { studentPortalData, setStudentPortalData } = useAuthStore();
  
  useEffect(() => {
    setMounted(true);
    if (!studentPortalData?.marks) {
      dataAPI.getUnified().then(res => {
        if (res.studentPortal) setStudentPortalData(res.studentPortal);
      });
    }
  }, []);

  if (!mounted) return <div style={{ background: '#050505', height: '100vh' }} />;

  const marksData = studentPortalData?.marks?.marks || [];
  const arrearsData = studentPortalData?.marks?.failed || [];
  
  const displayMarks = activeTab === "evaluated" ? marksData : arrearsData;

  return (
    <div style={{ height: "100vh", width: "100vw", background: THEME.bg, color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: ${THEME.bg}; }
      `}} />
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <header style={{ padding: "60px 24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
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

        <div style={{ padding: "0 20px", paddingBottom: "120px" }}>
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
               {arrearsData.length > 0 && <span style={{ background: THEME.accentRed, color: '#000', fontSize: '10px', padding: '0 6px', borderRadius: '4px', marginLeft: '4px' }}>{arrearsData.length}</span>}
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
        </div>
      </main>
    </div>
  );
}
