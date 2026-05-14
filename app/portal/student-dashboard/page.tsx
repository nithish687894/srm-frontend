"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Building, BookOpen, GraduationCap, MapPin, Hash, IdCard, Award, Mail, Layers, UserCheck, DoorOpen } from "lucide-react";
import CyberBackground from "@/components/UnsplashBackground";
import { useAuthStore } from "@/lib/store";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const profile = studentPortalData?.profile;

  // Render a beautifully styled data card
  const DataCard = ({ label, value, icon: Icon, delay = 0, variant = "blue" }: { label: string, value: any, icon: any, delay?: number, variant?: "blue" | "purple" | "green" | "emerald" | "amber" }) => {
    const colorMap = {
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400", accent: "from-blue-500/20", shadow: "shadow-blue-500/5" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", accent: "from-purple-500/20", shadow: "shadow-purple-500/5" },
      green: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", accent: "from-emerald-500/20", shadow: "shadow-emerald-500/5" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", accent: "from-emerald-500/20", shadow: "shadow-emerald-500/5" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400", accent: "from-amber-500/20", shadow: "shadow-amber-500/5" }
    };
    const colors = colorMap[variant as keyof typeof colorMap] || colorMap.blue;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`group relative overflow-hidden p-6 rounded-[32px] bg-white/[0.02] border ${colors.border} backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 ${colors.shadow}`}
      >
        <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r ${colors.accent} to-transparent opacity-30 group-hover:opacity-100 transition-opacity`} />
        
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
            <Icon size={24} className={colors.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] mb-1.5">{label}</div>
            <div className="text-[17px] font-black text-white truncate tracking-tight group-hover:text-blue-400 transition-colors">
              {value && value !== "-" ? value : <span className="text-white/10 italic font-medium text-xs">Not Assigned</span>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 py-4">
      <div className="w-8 h-[2px] bg-gradient-to-r from-blue-500/40 to-transparent rounded-full" />
      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{title}</h3>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
    </div>
  );

  return (
    <div className="page-root min-h-screen bg-black selection:bg-blue-500/30">
      <CyberBackground variant="blue" />
      <main className="page-main pb-40 relative z-10">
        
        {/* Header */}
        <div className="px-6 py-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 hover:border-white/20 active:scale-90 transition-all shadow-2xl backdrop-blur-md"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <div className="text-[10px] font-black text-blue-500/80 uppercase tracking-[0.4em]">Academic OS</div>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter">Student Identity</h1>
            </div>
          </div>
          <div className="w-14 h-14 rounded-[22px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <User size={24} />
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center mt-20">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-28 h-28 rounded-[40px] bg-red-500/10 text-red-500 flex items-center justify-center mb-8 border border-red-500/20 shadow-2xl shadow-red-500/10 relative"
            >
              <div className="absolute inset-0 rounded-[40px] bg-red-500/5 animate-ping" />
              <User size={48} className="relative z-10" />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Gateway Locked</h2>
            <p className="text-white/40 text-sm max-w-[280px] leading-relaxed font-medium">Your Student Portal session is missing. Link your account to authorize biometric synchronization.</p>
          </div>
        ) : !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center mt-20">
            <div className="relative mb-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-24 h-24 rounded-full border-[3px] border-blue-500/10 border-t-blue-500 shadow-2xl shadow-blue-500/20"
              />
              <div className="absolute inset-0 flex items-center justify-center text-blue-500/40">
                <Hash size={32} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Syncing Intelligence</h2>
            <p className="text-white/40 text-sm max-w-[260px] leading-relaxed font-medium">Extracting encrypted academic parameters from the SRM gateway...</p>
          </div>
        ) : (
          <div className="px-6 space-y-10">
            {/* Ultra-Premium Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              className="relative group p-10 rounded-[48px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 shadow-3xl overflow-hidden backdrop-blur-2xl"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 blur-[120px] -mr-40 -mt-40 rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 blur-[120px] -ml-40 -mb-40 rounded-full pointer-events-none" />
              
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-8">
                  <div className="w-36 h-36 rounded-[48px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[3.5px] shadow-3xl shadow-blue-500/30">
                    <div className="w-full h-full rounded-[44.5px] bg-[#050505] flex items-center justify-center text-5xl font-black text-white tracking-tighter">
                      {profile.name?.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -bottom-3 -right-3 bg-emerald-500 text-black px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/40 border-[5px] border-[#050505]"
                  >
                    SYNCED
                  </motion.div>
                </div>
                
                <h2 className="text-4xl font-black text-white tracking-tighter mb-3 leading-none">{profile.name}</h2>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span className="px-4 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[13px] font-black tracking-[0.15em] shadow-lg">
                    {profile.registerNo}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="text-white/40 text-[12px] font-black uppercase tracking-[0.2em]">Batch {profile.batch || "-"}</span>
                </div>
              </div>
            </motion.div>

            {/* Core Academic Identity Section */}
            <div className="space-y-4">
              <SectionHeader title="Core Academic Identity" />
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DataCard label="System ID" value={profile.studentId} icon={IdCard} delay={0.1} />
                  <DataCard label="Semester" value={profile.semester} icon={Hash} delay={0.2} variant="purple" />
                </div>
                
                <DataCard label="Primary Program" value={profile.program} icon={GraduationCap} delay={0.3} />
                <DataCard label="Institution" value={profile.institution} icon={Building} delay={0.4} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DataCard label="Assigned Section" value={profile.section} icon={MapPin} delay={0.5} variant="green" />
                  <DataCard label="ABC Identity" value={profile.abcNumber} icon={Award} delay={0.6} variant="purple" />
                </div>
              </div>
            </div>

            {/* Advisory & Facilities Section */}
            <div className="space-y-4">
              <SectionHeader title="Advisory & Facilities" />
              <div className="grid grid-cols-1 gap-5">
                <DataCard label="Faculty Advisor" value={profile.facultyAdvisor} icon={UserCheck} delay={0.7} variant="amber" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DataCard label="Room Allocation" value={profile.roomNo} icon={DoorOpen} delay={0.8} variant="emerald" />
                  <DataCard label="Combo Reference" value={profile.combo} icon={Layers} delay={0.9} variant="purple" />
                </div>
              </div>
            </div>

            {/* Contact Parameters Section */}
            <div className="space-y-4">
              <SectionHeader title="Contact Parameters" />
              <DataCard label="Official Email Node" value={profile.email} icon={Mail} delay={1.0} variant="blue" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
