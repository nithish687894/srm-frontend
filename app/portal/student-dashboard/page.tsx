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

  // Render a beautifully styled data row
  const DataRow = ({ label, value, icon: Icon, delay = 0 }: { label: string, value: string, icon: any, delay?: number }) => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-sm font-bold text-white/90 leading-snug">{value || "-"}</div>
      </div>
    </motion.div>
  );

  return (
    <div className="page-root">
      <CyberBackground variant="purple" />
      <main className="page-main pb-32" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => router.back()}
            style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: "10px", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>Portal Hub</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>Student Dashboard</div>
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/50">
              <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Portal Not Connected</h2>
            <p className="text-white/60 text-sm">Please link your Student Portal from the home screen to view your dashboard.</p>
          </div>
        ) : !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 mb-4"
            />
            <h2 className="text-xl font-bold text-white mb-2">Synchronizing Profile</h2>
            <p className="text-white/60 text-sm">We are pulling your official details from the SRM portal. This may take up to 60 seconds.</p>
          </div>
        ) : (
          <div className="px-5">
            {/* Top Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-xl border border-blue-500/30 p-6 rounded-[32px] mb-6 shadow-[0_10px_40px_rgba(59,130,246,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl font-black text-white">
                      {profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Active
                  </div>
                </div>
                
                <h1 className="text-2xl font-black text-white tracking-tight mb-1">{profile.name}</h1>
                <div className="text-blue-400 font-mono text-sm font-bold tracking-widest">{profile.registerNo}</div>
              </div>
            </motion.div>

            {/* General Details Grid */}
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 ml-2 mb-3">General Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DataRow label="Student ID" value={profile.studentId} icon={IdCard} delay={0.1} />
              <DataRow label="Program" value={profile.program} icon={GraduationCap} delay={0.2} />
              <DataRow label="Institution" value={profile.institution} icon={Building} delay={0.3} />
              <DataRow label="Batch" value={profile.batch} icon={BookOpen} delay={0.4} />
              <DataRow label="Semester" value={profile.semester} icon={Hash} delay={0.5} />
              <DataRow label="Section" value={profile.section} icon={MapPin} delay={0.6} />
              <DataRow label="ABC Number" value={profile.abcNumber} icon={Award} delay={0.7} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
