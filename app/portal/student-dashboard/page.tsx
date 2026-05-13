"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Building, BookOpen, GraduationCap, MapPin, Hash, IdCard, Award } from "lucide-react";
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
  const DataCard = ({ label, value, icon: Icon, delay = 0, variant = "blue" }: { label: string, value: string, icon: any, delay?: number, variant?: "blue" | "purple" | "green" }) => {
    const colorMap = {
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400", accent: "from-blue-500/20" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", accent: "from-purple-500/20" },
      green: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", accent: "from-emerald-500/20" }
    };
    const colors = colorMap[variant];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.4 }}
        className={`group relative overflow-hidden p-5 rounded-3xl bg-white/[0.03] border ${colors.border} hover:bg-white/[0.08] transition-all duration-300`}
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
            <Icon size={22} className={colors.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{label}</div>
            <div className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {value && value !== "-" ? value : <span className="text-white/20 italic font-medium">Not Assigned</span>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="page-root min-h-screen bg-black">
      <CyberBackground variant="blue" />
      <main className="page-main pb-32 relative z-10">
        
        {/* Header */}
        <div className="px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-xl"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-0.5">Nexus Portal</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Student ID</h1>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <User size={22} />
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center mt-20">
            <div className="w-24 h-24 rounded-[32px] bg-red-500/10 text-red-500 flex items-center justify-center mb-6 border border-red-500/20 shadow-2xl shadow-red-500/10">
              <User size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Gateway Locked</h2>
            <p className="text-white/40 text-sm max-w-[280px] leading-relaxed">Your Student Portal session is missing. Link your account to authorize data synchronization.</p>
          </div>
        ) : !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center mt-20">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-500 mb-8 shadow-2xl shadow-blue-500/20"
            />
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Syncing Intelligence</h2>
            <p className="text-white/40 text-sm max-w-[260px] leading-relaxed">Extracting academic parameters from the SRM gateway. Please wait...</p>
          </div>
        ) : (
          <div className="px-6 space-y-8">
            {/* Ultra-Premium Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="relative group p-8 rounded-[40px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] -ml-32 -mb-32 rounded-full pointer-events-none" />
              
              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[3px] shadow-2xl shadow-blue-500/20">
                    <div className="w-full h-full rounded-[37px] bg-[#050505] flex items-center justify-center text-4xl font-black text-white tracking-tighter">
                      {profile.name?.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
                    className="absolute -bottom-2 -right-2 bg-emerald-500 text-black px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/40 border-4 border-[#050505]"
                  >
                    Active
                  </motion.div>
                </div>
                
                <h2 className="text-3xl font-black text-white tracking-tight mb-2 leading-none">{profile.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-black tracking-widest">
                    {profile.registerNo}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Batch {profile.batch || "-"}</span>
                </div>
              </div>
            </motion.div>

            {/* Structured Grid */}
            <div className="space-y-6 pb-10">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 whitespace-nowrap">Core Academic Identity</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DataCard label="System ID" value={profile.studentId} icon={IdCard} delay={0.1} />
                  <DataCard label="Semester" value={profile.semester} icon={Hash} delay={0.2} variant="purple" />
                </div>
                
                <DataCard label="Primary Program" value={profile.program} icon={GraduationCap} delay={0.3} />
                <DataCard label="Institution" value={profile.institution} icon={Building} delay={0.4} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DataCard label="Assigned Section" value={profile.section} icon={MapPin} delay={0.5} variant="green" />
                  <DataCard label="ABC Identity" value={profile.abcNumber} icon={Award} delay={0.6} variant="purple" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
