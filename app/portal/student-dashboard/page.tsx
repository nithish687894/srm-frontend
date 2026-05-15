"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Settings, Copy, Check, Home, Award, 
  CheckCircle, Calendar, MoreHorizontal, Building, 
  GraduationCap, MapPin, Hash, IdCard, Mail, 
  UserCheck, Fingerprint, ExternalLink
} from 'lucide-react';
import { useAuthStore } from "@/lib/store";

const STYLES = `
  .glass-panel { position: relative; backdrop-filter: blur(80px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); }
  .compact-card { background: rgba(255, 255, 255, 0.02); border-left: 3px solid #00d4ff; border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.2s ease; }
  .compact-card:hover { background: rgba(255, 255, 255, 0.04); }
  .section-divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0 0.5rem 0; }
  .section-divider::after { content: ""; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.05); }
  .scroll-hide::-webkit-scrollbar { display: none; }
  .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .animate-blink { animation: blink 1.5s infinite; }
`;

const DataRow = ({ icon: Icon, label, value, index }: any) => {
  if (!value || value === "Not Assigned") return null;
  return (
    <div className={`compact-card p-4 flex items-center gap-4 ${index % 2 !== 0 ? 'bg-white/[0.01]' : 'bg-transparent'}`}>
      <div className="text-[#00d4ff] flex-shrink-0 opacity-80">
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mb-0.5">{label}</p>
        <p className="text-[13px] font-bold text-white/90 break-words leading-tight uppercase">{value}</p>
      </div>
    </div>
  );
};

const AdvisorRow = ({ icon: Icon, label, advisorStr, handleCopy, copiedId, id }: any) => {
  if (!advisorStr || advisorStr === "Not Assigned") return null;
  const match = advisorStr.match(/(.*?)\[(.*?)\]/);
  const name = match ? match[1].trim() : advisorStr;
  const email = match ? match[2].trim() : "";

  return (
    <div className="compact-card p-4 flex items-center gap-4 text-left">
      <div className="text-[#00d4ff] flex-shrink-0 opacity-80">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mb-0.5">{label}</p>
        <p className="text-[14px] font-black text-white/90 uppercase leading-none mb-1">{name}</p>
        {email && (
          <p className="text-[11px] text-[#00d4ff]/60 font-mono tracking-tight break-words">{email}</p>
        )}
      </div>
      {email && (
        <button onClick={() => handleCopy(email, id)} className="p-2 rounded-lg bg-white/5 border border-white/10 active:scale-90 flex-shrink-0">
          {copiedId === id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/40" />}
        </button>
      )}
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-2 transition-all active:scale-95 ${active ? 'text-[#00d4ff]' : 'text-white/20'}`}>
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[8px] font-black tracking-widest uppercase">{label}</span>
  </button>
);

export default function StudentDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('home');
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const profile = studentPortalData?.profile;
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black text-white selection:bg-[#00d4ff]/30 font-sans flex flex-col overflow-hidden">
      <style>{STYLES}</style>
      
      {/* ── TOP HEADER (Fixed) ────────────────────────────────────────────────── */}
      <header className="pt-12 pb-4 px-6 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-xl z-30">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 active:scale-90 flex-shrink-0">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        
        <div className="flex-1 flex flex-col items-center px-2 text-center">
          <span className="text-[7px] font-black tracking-[0.6em] text-[#00d4ff] uppercase opacity-80 mb-0.5">Nexus Portal</span>
          <h1 className="text-[12px] font-black text-white uppercase tracking-widest whitespace-nowrap">Student Identity</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 min-w-[80px] justify-end">
          <div className="flex flex-col items-end mr-1">
            <div className="px-1.5 py-0.5 rounded-[2px] bg-emerald-500 text-[6px] font-black uppercase tracking-widest text-black mb-0.5">Active</div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-black uppercase tracking-widest text-[#00d4ff]">Synced</span>
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
            </div>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 active:scale-90">
            <Settings size={18} className="text-white/60" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT (Scrollable) ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scroll-hide px-6">
        {!studentPortalConnected || !profile ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 text-center">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} 
              className="w-10 h-10 rounded-full border-2 border-white/5 border-t-[#00d4ff] mb-6 shadow-[0_0_20px_rgba(0,212,255,0.2)]" 
            />
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Initializing Identity</span>
              <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/20">Securing encrypted uplink...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pt-8 pb-32">
            
            {/* Profile Section */}
            <div className="flex flex-col items-center space-y-6">
              <div className="w-24 h-24 rounded-full border border-white/10 bg-[#00d4ff]/5 flex items-center justify-center relative shadow-[0_0_50px_rgba(0,212,255,0.05)]">
                <span className="text-3xl font-black text-[#00d4ff] tracking-tighter">NS</span>
                <div className="absolute -bottom-1 right-1 w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center">
                  <CheckCircle size={12} className="text-emerald-400" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-white leading-none uppercase">{profile.name}</h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-[#00d4ff] font-mono text-[11px] font-bold tracking-widest">{profile.registerNo}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Batch {profile.batch}</span>
                </div>[#00d4ff]/10 border border-[#00d4ff]/20 text-[9px] font-black text-[#00d4ff] uppercase tracking-widest">Sec: {profile.section}</span>
                </div>
              </div>
            </div>

            {/* Core Identity Section */}
            <div className="space-y-1">
              <div className="section-divider">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Core Academic Identity</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/5">
                <DataRow index={0} icon={IdCard} label="System ID" value={profile.studentId} />
                <DataRow index={1} icon={GraduationCap} label="Primary Program" value={profile.program} />
                <DataRow index={2} icon={Building} label="Institution" value={profile.institution} />
                <DataRow index={3} icon={MapPin} label="Assigned Section" value={profile.section} />
                <DataRow index={4} icon={Fingerprint} label="ABC Identity" value={profile.abcNumber} />
              </div>
            </div>

            {/* Advisory Section */}
            <div className="space-y-1">
              <div className="section-divider">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Advisory & Facilities</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/5">
                <AdvisorRow id="fa" icon={UserCheck} label="Faculty Advisor" advisorStr={profile.facultyAdvisor} handleCopy={handleCopy} copiedId={copiedId} />
                <AdvisorRow id="aa" icon={GraduationCap} label="Academic Advisor" advisorStr={profile.academicAdvisor} handleCopy={handleCopy} copiedId={copiedId} />
              </div>
            </div>

            {/* Sync Indicator */}
            <div className="flex flex-col items-center pt-4 opacity-40">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-blink" />
                <span className="text-[8px] font-black tracking-[0.3em] uppercase">Real-time Data Sync</span>
              </div>
              <span className="text-[7px] font-mono tracking-tighter uppercase opacity-30 tracking-[0.5em]">Academic OS v2.5.Stable</span>
            </div>

          </div>
        )}
      </main>

      {/* ── BOTTOM NAV (Fixed) ────────────────────────────────────────────────── */}
      <nav className="h-20 bg-black border-t border-white/5 flex items-center justify-around px-2 z-40 pb-4">
        <NavItem icon={Home} label="Home" active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
        <NavItem icon={Award} label="Marks" active={activeNav === 'marks'} onClick={() => router.push('/portal/grade-mark-credit')} />
        <NavItem icon={CheckCircle} label="Attnd" active={activeNav === 'attnd'} onClick={() => router.push('/dashboard')} />
        <NavItem icon={Calendar} label="Time" active={activeNav === 'time'} onClick={() => router.push('/timetable')} />
        <NavItem icon={MoreHorizontal} label="More" active={activeNav === 'more'} onClick={() => setActiveNav('more')} />
      </nav>

    </div>
  );
}
