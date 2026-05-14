"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Settings, Copy, Check, User, Building, 
  GraduationCap, MapPin, Hash, IdCard, Award, Mail, 
  Layers, UserCheck, DoorOpen 
} from 'lucide-react';
import { useAuthStore } from "@/lib/store";

// ============================================================================
// STYLES & ANIMATIONS
// ============================================================================
const STYLES = `
  @keyframes aurora { 0% { transform: translateX(-100%) rotate(0deg); } 100% { transform: translateX(100%) rotate(360deg); } }
  @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(76, 175, 80, 0); } }
  @keyframes floating { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  .glass-panel { position: relative; backdrop-filter: blur(80px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; }
  .glow-card { position: relative; background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1.875rem; backdrop-filter: blur(80px); overflow: hidden; }
  .sync-badge { animation: glow-pulse 2s infinite; }
  .floating { animation: floating 3s ease-in-out infinite; }
`;

// ============================================================================
// COMPONENTS
// ============================================================================

const PremiumCard = ({ icon, iconGradient, label, value, muted = false, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6 }}
    className="group glow-card p-5 hover:border-cyan-500/30 transition-all duration-500 cursor-pointer active:scale-95"
  >
    <div className="relative flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconGradient} opacity-20 flex items-center justify-center flex-shrink-0 group-hover:opacity-30 transition-all`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-black mb-1">{label}</p>
        <p className={`text-[15px] font-black line-clamp-1 ${muted ? 'text-white/20 italic' : 'text-white'}`}>{value}</p>
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
  const [copied, setCopied] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const profile = studentPortalData?.profile;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
        
        {/* Aurora Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-600/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10">
          
          {/* Header */}
          <div className="pt-8 px-6 flex items-center justify-between max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 shadow-2xl">
              <ArrowLeft size={18} className="text-cyan-400" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase">● Academic OS</span>
              <span className="text-[8px] text-white/30 font-black tracking-[0.25em] uppercase">AI Powered</span>
            </div>
            <button className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 group active:scale-90 shadow-2xl">
              <Settings size={18} className="text-white/30 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>

          <div className="pt-8 px-4 sm:px-6 pb-40">
            <div className="max-w-3xl mx-auto space-y-6">
              
              {!studentPortalConnected ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 rounded-[32px] bg-red-500/5 text-red-500/30 flex items-center justify-center mb-8 border border-red-500/10 mx-auto">
                    <User size={40} />
                  </div>
                  <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Gateway Locked</h2>
                  <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Authentication Required</p>
                </div>
              ) : !profile ? (
                <div className="py-20 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 rounded-full border-2 border-cyan-500/10 border-t-cyan-500/50 mx-auto mb-8" />
                  <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em] animate-pulse">Decrypting Identity...</p>
                </div>
              ) : (
                <>
                  {/* Hero Profile Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="relative glow-card p-8 sm:p-10 hover:border-cyan-500/20 transition-all duration-500 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50" />
                    <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[2.5rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.15)] shrink-0">
                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">NS</span>
                      </div>
                      <div className="flex-1 text-center sm:text-left space-y-5">
                        <div className="space-y-1.5">
                          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none">{profile.name}</h1>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                            <span className="text-cyan-400/50 font-mono text-[13px] font-bold tracking-widest uppercase">{profile.registerNo}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <span className="text-white/30 text-[12px] font-black uppercase tracking-widest">Batch {profile.batch}</span>
                            <div className="sync-badge px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 ml-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[10px] font-black text-emerald-300 tracking-[0.1em]">SYNCED</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                          <span className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-blue-300 tracking-wider">Dept: CS</span>
                          <span className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-cyan-300 tracking-wider">Section: {profile.section}</span>
                          <span className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-indigo-300 tracking-wider">Active</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <PremiumCard icon="A3" iconGradient="from-blue-600 to-cyan-500" label="SYSTEM ID" value={profile.studentId} delay={0.1} />
                    <PremiumCard icon="📚" iconGradient="from-purple-600 to-pink-500" label="SEMESTER" value={profile.semester || "Not Assigned"} muted={!profile.semester} delay={0.2} />
                    <PremiumCard icon="🎓" iconGradient="from-cyan-600 to-blue-500" label="PRIMARY PROGRAM" value={profile.program} delay={0.3} />
                    <PremiumCard icon="🏢" iconGradient="from-indigo-600 to-blue-500" label="INSTITUTION" value={profile.institution} delay={0.4} />
                  </div>

                  {/* Wide Cards */}
                  <div className="space-y-4">
                    <PremiumCard icon="📍" iconGradient="from-emerald-600 to-green-500" label="ASSIGNED SECTION" value={profile.section} delay={0.5} />
                    <PremiumCard icon="🆔" iconGradient="from-purple-600 to-indigo-500" label="ABC IDENTITY" value={profile.abcNumber || "Not Assigned"} muted={!profile.abcNumber} delay={0.6} />
                  </div>

                  {/* Faculty Advisor Section */}
                  <div className="pt-4 space-y-4">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] px-2">Advisory & Facilities</span>
                    <div className="group glow-card p-6 hover:border-blue-500/30 transition-all duration-500">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="text-3xl">👨‍🏫</span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[10px] text-white/30 uppercase tracking-[0.25em] font-black mb-1">Faculty Advisor</p>
                          <p className="text-xl font-black text-white mb-0.5 tracking-tight uppercase truncate">{profile.facultyAdvisor}</p>
                          <p className="text-[11px] text-cyan-400 font-mono font-bold tracking-widest truncate">{profile.email}</p>
                        </div>
                        <button onClick={() => handleCopy(profile.email)} className="w-11 h-11 rounded-2xl glass-panel flex items-center justify-center hover:bg-cyan-500/10 active:scale-90 transition-all shadow-xl">
                          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} className="text-white/20 hover:text-white/40" />}
                        </button>
                      </div>
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
