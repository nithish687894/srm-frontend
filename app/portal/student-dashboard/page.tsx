"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Settings, Copy, Check, User, Building, 
  GraduationCap, MapPin, Hash, IdCard, Award, Mail, 
  Layers, UserCheck, DoorOpen, Fingerprint, Search,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from "@/lib/store";

// ============================================================================
// STYLES & ANIMATIONS
// ============================================================================
const STYLES = `
  .glass-panel { position: relative; backdrop-filter: blur(80px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; }
  .compact-card { position: relative; background: rgba(255, 255, 255, 0.02); border-left: 3px solid transparent; border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.3s ease; }
  .compact-card:hover { background: rgba(255, 255, 255, 0.04); }
  .avatar-circle-72 { width: 72px; height: 72px; border-radius: 50%; background: #000; border: 1px solid rgba(255,255,255,0.15); display: flex; items-center: center; justify-content: center; position: relative; }
  .section-divider { display: flex; items-center: center; text-align: center; gap: 1rem; margin: 1.5rem 0; }
  .section-divider::before, .section-divider::after { content: ""; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1); }
  .copy-btn { padding: 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.3); transition: all 0.2s; }
  .copy-btn:hover { background: rgba(255,255,255,0.08); color: white; border-color: rgba(255,255,255,0.2); }
  .scroll-hide::-webkit-scrollbar { display: none; }
  .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;

// ============================================================================
// UTILS
// ============================================================================
const parseAdvisor = (advisorStr: string) => {
  if (!advisorStr) return { name: "", email: "" };
  const match = advisorStr.match(/(.*?)\[(.*?)\]/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: advisorStr.trim(), email: "" };
};

const isInvalid = (val: any) => !val || val === "Not Assigned" || val === "Not Provided" || val === "null" || val === "undefined";

// ============================================================================
// COMPONENTS
// ============================================================================

const DataRow = ({ icon: Icon, label, value, color, index }: any) => {
  if (isInvalid(value)) return null;
  const isOdd = index % 2 !== 0;

  return (
    <div className={`compact-card p-4 flex items-center gap-4 ${isOdd ? 'bg-white/[0.01]' : 'bg-transparent'}`} style={{ borderLeftColor: color }}>
      <div className="text-white/20 flex-shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mb-0.5">{label}</p>
        <p className="text-[13px] font-bold text-white/90 break-words leading-tight">{value}</p>
      </div>
    </div>
  );
};

const AdvisorRow = ({ icon: Icon, label, advisorStr, defaultEmail, color, delay = 0, handleCopy, copiedId, id }: any) => {
  const { name, email } = parseAdvisor(advisorStr);
  const finalEmail = email || defaultEmail;
  if (isInvalid(name)) return null;

  return (
    <div className="compact-card p-4 flex items-center gap-4" style={{ borderLeftColor: color }}>
      <div className="text-white/20 flex-shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-white/20 uppercase tracking-widest font-black mb-0.5">{label}</p>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-black text-white/90 uppercase leading-none mb-1">{name}</p>
            {finalEmail && (
              <a href={`mailto:${finalEmail}`} className="text-[11px] text-blue-400 hover:text-blue-300 font-mono tracking-tight break-words flex items-center gap-1">
                {finalEmail} <ExternalLink size={8} />
              </a>
            )}
          </div>
          {finalEmail && (
            <button onClick={() => handleCopy(finalEmail, id)} className="copy-btn active:scale-90 flex-shrink-0">
              {copiedId === id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 active:scale-95 ${
      active ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/20 hover:text-white/60'
    }`}
  >
    <Icon size={16} />
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
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 font-sans scroll-hide">
        
        <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
          
          {/* Top Bar */}
          <div className="pt-6 px-4 flex items-center justify-between mb-6">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 border border-white/5">
              <ArrowLeft size={16} className="text-white/60" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black tracking-[0.4em] text-cyan-500 uppercase">Nexus Portal</span>
              <h1 className="text-lg font-black text-white uppercase tracking-tight">Identity Vault</h1>
            </div>
            <button className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 border border-white/5">
              <Settings size={16} className="text-white/60" />
            </button>
          </div>

          <div className="flex-1 px-4 overflow-y-auto scroll-hide pb-32">
            {!studentPortalConnected || !profile ? (
              <div className="py-24 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-10 h-10 rounded-full border-2 border-cyan-500/10 border-t-cyan-500/50 mx-auto mb-4" />
                <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Identity...</p>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                
                {/* Hero Header */}
                <div className="p-8 flex flex-col items-center text-center space-y-5 bg-gradient-to-b from-white/[0.02] to-transparent">
                  <div className="avatar-circle-72 shadow-2xl">
                    <span className="text-2xl font-black text-white/90">NS</span>
                    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-[7px] font-black uppercase tracking-widest shadow-lg border border-white/10">
                      Active
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-white uppercase leading-none">{profile.name}</h2>
                    <div className="flex items-center justify-center gap-2 text-white/30 font-black uppercase text-[10px] tracking-widest">
                      <span className="text-cyan-500/60 font-mono tracking-tighter">{profile.registerNo}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span>Batch {profile.batch}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[8px] font-black uppercase text-blue-400/80 tracking-widest">Dept: CS</span>
                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[8px] font-black uppercase text-cyan-400/80 tracking-widest">Sec: {profile.section}</span>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="px-1">
                  
                  <div className="section-divider">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Core Academic Identity</span>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-white/[0.03]">
                    <DataRow index={0} color="#3b82f6" icon={IdCard} label="System ID" value={profile.studentId} />
                    <DataRow index={1} color="#8b5cf6" icon={Hash} label="Semester" value={profile.semester} />
                    <DataRow index={2} color="#06b6d4" icon={GraduationCap} label="Primary Program" value={profile.program} />
                    <DataRow index={3} color="#6366f1" icon={Building} label="Institution" value={profile.institution} />
                    <DataRow index={4} color="#10b981" icon={MapPin} label="Assigned Section" value={profile.section} />
                    <DataRow index={5} color="#ec4899" icon={Fingerprint} label="ABC Identity" value={profile.abcNumber} />
                  </div>

                  <div className="section-divider">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Advisory & Facilities</span>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-white/[0.03] mb-4">
                    <AdvisorRow 
                      id="fa" color="#3b82f6" icon={UserCheck} label="Faculty Advisor" 
                      advisorStr={profile.facultyAdvisor} handleCopy={handleCopy} copiedId={copiedId} 
                    />
                    <AdvisorRow 
                      id="aa" color="#f59e0b" icon={GraduationCap} label="Academic Advisor" 
                      advisorStr={profile.academicAdvisor} handleCopy={handleCopy} copiedId={copiedId} 
                    />
                  </div>

                </div>

                {/* Status Footer */}
                <div className="p-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Real-time Data Sync</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 uppercase tracking-tighter">Academic OS v2.4</span>
                </div>

              </div>
            )}
          </div>

          {/* Bottom Dock Navigation */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-50">
            <div className="glass-panel px-3 py-2 flex items-center justify-around shadow-2xl border border-white/10">
              <NavItem icon={User} label="Home" active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
              <NavItem icon={Award} label="Marks" active={activeNav === 'marks'} onClick={() => router.push('/portal/grade-mark-credit')} />
              <NavItem icon={Layers} label="Records" active={activeNav === 'records'} onClick={() => router.push('/portal/personal-details')} />
              <NavItem icon={Settings} label="More" active={activeNav === 'more'} onClick={() => setActiveNav('more')} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
