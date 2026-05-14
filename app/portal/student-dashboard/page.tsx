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
  .glass-panel { position: relative; backdrop-filter: blur(80px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1.25rem; }
  .glow-card { position: relative; background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1.5rem; backdrop-filter: blur(80px); overflow: hidden; }
  .sync-badge { animation: glow-pulse 2s infinite; }
  .avatar-squircle { border-radius: 3rem; background: linear-gradient(135deg, #1e1e1e 0%, #000000 100%); position: relative; }
  .avatar-squircle::after { content: ''; position: absolute; inset: 0; border-radius: 3rem; padding: 2px; background: linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
`;

// ============================================================================
// COMPONENTS
// ============================================================================

const PremiumCard = ({ icon: Icon, label, value, muted = false, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
    className="group glow-card p-4 sm:p-5 hover:border-cyan-500/30 transition-all duration-500 cursor-pointer active:scale-[0.98]"
  >
    <div className="relative flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-cyan-500/5 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-cyan-500/20 transition-all">
        <Icon size={18} className="text-cyan-400/80" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black mb-0.5">{label}</p>
        <p className={`text-[14px] font-black line-clamp-1 ${muted ? 'text-white/10 italic' : 'text-white/90'}`}>{value}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowLeft size={14} className="text-white/10 rotate-180" />
      </div>
    </div>
  </motion.div>
);

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
      <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
        
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          
          {/* Header */}
          <div className="pt-6 px-6 flex items-center justify-between max-w-2xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
              <ArrowLeft size={18} className="text-white/60" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black tracking-[0.4em] text-cyan-500 uppercase mb-0.5">Nexus Portal</span>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white uppercase tracking-tight">Student Identity</h1>
                <div className="sync-badge px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Synced</span>
                </div>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all">
              <Settings size={18} className="text-white/60" />
            </button>
          </div>

          <div className="pt-10 px-4 sm:px-6 pb-40">
            <div className="max-w-2xl mx-auto space-y-8">
              
              {!studentPortalConnected || !profile ? (
                <div className="py-24 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-12 h-12 rounded-full border-2 border-cyan-500/10 border-t-cyan-500/50 mx-auto mb-6" />
                  <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em] animate-pulse">Initializing Identity Vault...</p>
                </div>
              ) : (
                <>
                  {/* Hero Identity Hub */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="relative">
                      <div className="w-32 h-32 avatar-squircle flex items-center justify-center shadow-2xl relative">
                        <span className="text-4xl font-black text-white/90 tracking-tighter">NS</span>
                        <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/20">
                          Active
                        </div>
                      </div>
                      <div className="absolute -inset-4 bg-cyan-500/10 blur-[40px] rounded-full -z-10 animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">{profile.name}</h2>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-cyan-400/60 font-mono text-[11px] font-bold tracking-widest">{profile.registerNo}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Batch {profile.batch}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase text-blue-400 tracking-wider">Dept: CS</span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase text-cyan-400 tracking-wider">Section: {profile.section}</span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase text-indigo-400 tracking-wider">Academic</span>
                    </div>
                  </motion.div>

                  {/* Core Identity Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Core Academic Identity</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <PremiumCard icon={IdCard} label="System ID" value={profile.studentId} delay={0.1} />
                      <PremiumCard icon={Hash} label="Semester" value={profile.semester || "Not Assigned"} muted={!profile.semester} delay={0.2} />
                      <PremiumCard icon={GraduationCap} label="Primary Program" value={profile.program} delay={0.3} />
                      <PremiumCard icon={Building} label="Institution" value={profile.institution} delay={0.4} />
                      <PremiumCard icon={MapPin} label="Assigned Section" value={profile.section} delay={0.5} />
                      <PremiumCard icon={Fingerprint} label="ABC Identity" value={profile.abcNumber || "Not Assigned"} muted={!profile.abcNumber} delay={0.6} />
                    </div>
                  </div>

                  {/* Advisory Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Advisory & Facilities</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>

                    <div className="space-y-3">
                      {/* Faculty Advisor */}
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                        className="group glow-card p-4 sm:p-5 hover:border-blue-500/20 transition-all duration-500"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/5 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                            <UserCheck size={22} className="text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black mb-0.5">Faculty Advisor</p>
                            <p className="text-[14px] font-black text-white/90 uppercase tracking-tight truncate">{profile.facultyAdvisor}</p>
                            <p className="text-[10px] text-blue-400/60 font-mono tracking-widest truncate">{profile.email}</p>
                          </div>
                          <button onClick={() => handleCopy(profile.email, 'fa')} className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all">
                            {copiedId === 'fa' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/20" />}
                          </button>
                        </div>
                      </motion.div>

                      {/* Academic Advisor */}
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                        className="group glow-card p-4 sm:p-5 hover:border-amber-500/20 transition-all duration-500"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/5 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                            <GraduationCap size={22} className="text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black mb-0.5">Academic Advisor</p>
                            <p className="text-[14px] font-black text-white/90 uppercase tracking-tight truncate">Dr. Nimala K</p>
                            <p className="text-[10px] text-amber-400/60 font-mono tracking-widest truncate">nimalak@srmist.edu.in</p>
                          </div>
                          <button onClick={() => handleCopy('nimalak@srmist.edu.in', 'aa')} className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all">
                            {copiedId === 'aa' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/20" />}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Dock Navigation */}
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto">
            <div className="glass-panel px-3 py-3 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
