"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Settings, Copy, Check, User, Building, 
  GraduationCap, MapPin, Hash, IdCard, Award, Mail, 
  Layers, UserCheck, DoorOpen, Fingerprint, Search
} from 'lucide-react';
import { useAuthStore } from "@/lib/store";

// ============================================================================
// STYLES & ANIMATIONS
// ============================================================================
const STYLES = `
  @keyframes aurora { 0% { transform: translateX(-100%) rotate(0deg); } 100% { transform: translateX(100%) rotate(360deg); } }
  @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(34, 211, 238, 0); } }
  .glass-panel { position: relative; backdrop-filter: blur(80px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; }
  .glow-card { position: relative; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 1.5rem; backdrop-filter: blur(80px); overflow: hidden; }
  .sync-badge { animation: glow-pulse 2s infinite; }
  .avatar-circle { border-radius: 50%; background: #000; position: relative; border: 1px solid rgba(255,255,255,0.1); }
  .text-gradient { background: linear-gradient(135deg, #fff 0%, #aaa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
`;

// ============================================================================
// UTILS
// ============================================================================
const parseAdvisor = (advisorStr: string) => {
  if (!advisorStr) return { name: "", email: "" };
  const match = advisorStr.match(/(.*?)\[(.*?)\]/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: advisorStr.trim(), email: "" };
};

const isInvalid = (val: any) => !val || val === "Not Assigned" || val === "Not Provided" || val === "null" || val === "undefined";

// ============================================================================
// COMPONENTS
// ============================================================================

const PremiumCard = ({ icon: Icon, label, value, delay = 0 }: any) => {
  if (isInvalid(value)) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      className="group glow-card p-4 sm:p-5 hover:border-cyan-500/30 transition-all duration-500 cursor-pointer active:scale-[0.98] mb-3"
    >
      <div className="relative flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-cyan-500/5 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-cyan-500/20 transition-all">
          <Icon size={20} className="text-cyan-400/80" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black mb-0.5">{label}</p>
          <p className="text-[15px] font-black leading-tight text-white/90 break-words">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

const AdvisorCard = ({ icon: Icon, label, advisorStr, defaultEmail, colorClass, delay = 0, handleCopy, copiedId, id }: any) => {
  const { name, email } = parseAdvisor(advisorStr);
  const finalEmail = email || defaultEmail;

  if (isInvalid(name)) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.7 }}
      className={`group glow-card p-5 sm:p-6 hover:border-${colorClass === 'blue' ? 'blue' : 'amber'}-500/20 transition-all duration-500 mb-4`}
    >
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl bg-${colorClass === 'blue' ? 'blue' : 'amber'}-500/5 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:scale-105 transition-transform`}>
          <Icon size={28} className={colorClass === 'blue' ? 'text-blue-400' : 'text-amber-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black mb-1">{label}</p>
          <p className="text-[16px] font-black text-white/90 uppercase tracking-tight break-words leading-tight mb-1">{name}</p>
          {finalEmail && (
            <p className={`text-[11px] ${colorClass === 'blue' ? 'text-blue-400/60' : 'text-amber-400/60'} font-mono tracking-widest break-words`}>{finalEmail}</p>
          )}
        </div>
        {finalEmail && (
          <button onClick={() => handleCopy(finalEmail, id)} className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all border border-white/5">
            {copiedId === id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-white/20" />}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-95 ${
      active ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/20' : 'text-white/20 hover:text-white/60'
    }`}
  >
    <Icon size={18} className={active ? 'text-cyan-400' : ''} />
    <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${active ? 'text-cyan-300' : ''}`}>{label}</span>
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
      <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans pb-40">
        
        {/* Background Atmosphere */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-cyan-950/20 to-transparent blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          
          {/* Header */}
          <div className="pt-8 px-6 flex items-center justify-between max-w-2xl mx-auto mb-10">
            <button onClick={() => router.back()} className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all border border-white/5">
              <ArrowLeft size={18} className="text-white/60" />
            </button>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] font-black tracking-[0.5em] text-cyan-500 uppercase mb-1">Nexus Portal</span>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Student Identity</h1>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 sync-badge" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Synced</span>
                </div>
              </div>
            </div>
            <button className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all border border-white/5">
              <Settings size={18} className="text-white/60" />
            </button>
          </div>

          <div className="px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-12">
              
              {!studentPortalConnected || !profile ? (
                <div className="py-24 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-12 h-12 rounded-full border-2 border-cyan-500/10 border-t-cyan-500/50 mx-auto mb-6" />
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Accessing Encrypted Profile...</p>
                </div>
              ) : (
                <>
                  {/* Hero Identity Center */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center space-y-8"
                  >
                    <div className="relative group">
                      <div className="w-40 h-40 avatar-circle flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 relative z-10">
                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">NS</span>
                        <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-emerald-500 text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 z-20">
                          Active
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-cyan-500/20 blur-[50px] rounded-full -z-10 group-hover:scale-110 transition-transform duration-700 opacity-50" />
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white uppercase leading-[0.9]">{profile.name}</h2>
                      <div className="flex items-center justify-center gap-4 text-white/40 font-black uppercase text-[12px] tracking-widest">
                        <span className="text-cyan-400/60 font-mono tracking-[0.2em]">{profile.registerNo}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span>Batch {profile.batch}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                      <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-blue-400 tracking-wider">Dept: CS</span>
                      <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-cyan-400 tracking-wider">Section: {profile.section}</span>
                      <span className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-indigo-400 tracking-wider">Academic</span>
                    </div>
                  </motion.div>

                  {/* Core Identity Section */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-4 px-4">
                      <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] whitespace-nowrap">Core Academic Identity</span>
                      <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    
                    <div className="space-y-1">
                      <PremiumCard icon={IdCard} label="System ID" value={profile.studentId} delay={0.1} />
                      <PremiumCard icon={Hash} label="Semester" value={profile.semester} delay={0.2} />
                      <PremiumCard icon={GraduationCap} label="Primary Program" value={profile.program} delay={0.3} />
                      <PremiumCard icon={Building} label="Institution" value={profile.institution} delay={0.4} />
                      <PremiumCard icon={MapPin} label="Assigned Section" value={profile.section} delay={0.5} />
                      <PremiumCard icon={Fingerprint} label="ABC Identity" value={profile.abcNumber} delay={0.6} />
                    </div>
                  </div>

                  {/* Advisory Section */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-4 px-4">
                      <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] whitespace-nowrap">Advisory & Facilities</span>
                      <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                    </div>

                    <div className="space-y-4">
                      {/* Faculty Advisor */}
                      <AdvisorCard 
                        icon={UserCheck} 
                        label="Faculty Advisor" 
                        advisorStr={profile.facultyAdvisor} 
                        colorClass="blue" 
                        delay={0.7} 
                        handleCopy={handleCopy} 
                        copiedId={copiedId} 
                        id="fa" 
                      />

                      {/* Academic Advisor */}
                      <AdvisorCard 
                        icon={GraduationCap} 
                        label="Academic Advisor" 
                        advisorStr={profile.academicAdvisor} 
                        colorClass="amber" 
                        delay={0.8} 
                        handleCopy={handleCopy} 
                        copiedId={copiedId} 
                        id="aa" 
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Dock Navigation */}
          <div className="fixed bottom-8 left-6 right-6 z-40 max-w-2xl mx-auto">
            <div className="glass-panel px-4 py-3 flex items-center justify-around shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10">
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
