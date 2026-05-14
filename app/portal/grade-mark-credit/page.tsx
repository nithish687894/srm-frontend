"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import CyberBackground from "@/components/UnsplashBackground";
import { useAuthStore } from "@/lib/store";

export default function GradeMarkCreditPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"marks" | "failed">("marks");
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const marksData = studentPortalData?.marks?.marks || [];
  const failedData = studentPortalData?.marks?.failed || [];

  const TabButton = ({ id, label, icon: Icon, count }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
        activeTab === id 
          ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20" 
          : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
      }`}
    >
      <Icon size={16} className={activeTab === id ? (id === "failed" ? "text-red-400" : "text-green-400") : ""} />
      {label}
      {count > 0 && id === "failed" && (
        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{count}</span>
      )}
    </button>
  );

  const MarkRow = ({ item, index }: any) => {
    const isPass = !["F", "W", "I", "Ab"].includes(item.grade);
    const gradeColor = ["O", "A+", "A"].includes(item.grade) ? "emerald" : 
                       ["B+", "B", "C"].includes(item.grade) ? "blue" : "red";

    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative bg-white/[0.015] border border-white/5 p-6 rounded-[2rem] mb-4 flex items-center gap-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 backdrop-blur-3xl overflow-hidden"
      >
        <div className={`absolute top-0 left-0 w-1.5 h-full bg-${gradeColor}-500/20`} />
        
        {/* Grade Indicator */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 transition-all duration-500 group-hover:scale-110 ${
          gradeColor === "emerald" ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]" :
          gradeColor === "blue" ? "bg-blue-500/5 text-blue-400 border border-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)]" :
          "bg-red-500/5 text-red-400 border border-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
        }`}>
          {item.grade}
        </div>
  
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-white/5 text-white/40 uppercase tracking-widest border border-white/5">
              {item.code}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">{item.monthYear}</span>
          </div>
          <div className="text-lg font-black text-white leading-tight mb-3 group-hover:text-blue-400 transition-colors truncate uppercase tracking-tight">{item.description}</div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">Credits</span>
              <span className="text-sm text-white/70 font-black">{item.credit}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">Semester</span>
              <span className="text-sm text-white/70 font-black">{item.semester}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="page-root min-h-screen bg-[#050505]">
      <CyberBackground variant="lime" />
      <main className="page-main pb-40 relative z-10 px-4 sm:px-6">
        
        {/* Header */}
        <div className="pt-10 pb-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 text-white/50 flex items-center justify-center hover:bg-white/10 hover:text-white active:scale-90 transition-all backdrop-blur-md"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Academic Records</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-widest uppercase">Grades & Marks</h1>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20">
            <BookOpen size={22} />
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-[32px] bg-red-500/5 text-red-500/50 flex items-center justify-center mb-8 border border-red-500/10">
              <BookOpen size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Sync Required</h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest leading-relaxed">Please link your portal to retrieve academic parameters.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Tabs */}
            <div className="flex gap-3 p-1.5 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2rem] mb-8">
              <TabButton id="marks" label="Evaluated" icon={CheckCircle} />
              <TabButton id="failed" label="Arrears" icon={AlertTriangle} count={failedData.length} />
            </div>

            {/* List */}
            <AnimatePresence mode="wait">
              {activeTab === "marks" && (
                <motion.div key="marks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {marksData.length === 0 ? (
                    <div className="text-center p-16 border border-white/5 rounded-[3rem] bg-white/[0.01]">
                      <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Zero Records Detected</p>
                    </div>
                  ) : (
                    marksData.map((m: any, i: number) => <MarkRow key={i} item={m} index={i} />)
                  )}
                </motion.div>
              )}
              {activeTab === "failed" && (
                <motion.div key="failed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  {failedData.length === 0 ? (
                    <div className="text-center p-20 border border-emerald-500/5 rounded-[3rem] bg-emerald-500/[0.01] flex flex-col items-center">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/5 text-emerald-500/30 flex items-center justify-center mb-6 border border-emerald-500/10">
                        <CheckCircle size={32} />
                      </div>
                      <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">Clear Standing</p>
                      <p className="text-white/10 text-[9px] mt-4 uppercase tracking-[0.2em]">All subjects successfully cleared.</p>
                    </div>
                  ) : (
                    failedData.map((m: any, i: number) => <MarkRow key={i} item={m} index={i} />)
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </main>
    </div>
  );
}
