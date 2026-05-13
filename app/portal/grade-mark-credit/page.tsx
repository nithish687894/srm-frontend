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

  const MarkRow = ({ item, index }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-3 flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Grade Badge */}
      <div className={`absolute top-0 right-0 bottom-0 w-16 flex items-center justify-center font-black text-2xl ${
        ["O", "A+", "A"].includes(item.grade) ? "bg-green-500/10 text-green-400 border-l border-green-500/20" :
        ["B+", "B", "C"].includes(item.grade) ? "bg-blue-500/10 text-blue-400 border-l border-blue-500/20" :
        "bg-red-500/10 text-red-400 border-l border-red-500/20"
      }`}>
        {item.grade}
      </div>

      <div className="pr-16">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/70 uppercase tracking-wider border border-white/10">
            {item.code}
          </span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">{item.monthYear}</span>
        </div>
        <div className="text-sm font-bold text-white leading-snug mb-2">{item.description}</div>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Credits</span>
            <span className="text-xs text-white/90 font-bold">{item.credit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Semester</span>
            <span className="text-xs text-white/90 font-bold">{item.semester}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="page-root">
      <CyberBackground variant="lime" />
      <main className="page-main pb-32" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => router.back()}
            style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: "10px", color: "#a3e635", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>Portal Hub</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>Grade & Credit</div>
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/50">
              <BookOpen size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Portal Not Connected</h2>
            <p className="text-white/60 text-sm">Please link your Student Portal from the home screen to view your grades.</p>
          </div>
        ) : (
          <div className="px-5">
            
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl mb-6">
              <TabButton id="marks" label="Grades & Marks" icon={CheckCircle} />
              <TabButton id="failed" label="Failed Courses" icon={AlertTriangle} count={failedData.length} />
            </div>

            {/* List */}
            <AnimatePresence mode="wait">
              {activeTab === "marks" && (
                <motion.div key="marks" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  {marksData.length === 0 ? (
                    <div className="text-center p-8 border border-white/10 rounded-3xl bg-white/5">
                      <p className="text-white/50 text-sm font-bold">No marks records found.</p>
                    </div>
                  ) : (
                    marksData.map((m: any, i: number) => <MarkRow key={i} item={m} index={i} />)
                  )}
                </motion.div>
              )}
              {activeTab === "failed" && (
                <motion.div key="failed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {failedData.length === 0 ? (
                    <div className="text-center p-8 border border-green-500/20 rounded-3xl bg-green-500/5 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-3">
                        <CheckCircle size={24} />
                      </div>
                      <p className="text-green-400 text-sm font-bold uppercase tracking-wider">No Failed Courses!</p>
                      <p className="text-white/40 text-xs mt-2">You have cleared all subjects.</p>
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
