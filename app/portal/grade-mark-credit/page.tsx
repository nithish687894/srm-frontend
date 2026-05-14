"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Settings, BookOpen, AlertTriangle, CheckCircle, Award, User, Layers } from "lucide-react";
import { useAuthStore } from "@/lib/store";

const STYLES = `
  .glass-panel { position: relative; backdrop-filter: blur(80px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; }
  .glow-card { position: relative; background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1.875rem; backdrop-filter: blur(80px); overflow: hidden; }
`;

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

export default function GradeMarkCreditPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('marks');
  const [activeTab, setActiveTab] = useState<"marks" | "failed">("marks");
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const marksData = studentPortalData?.marks?.marks || [];
  const failedData = studentPortalData?.marks?.failed || [];

  const TabButton = ({ id, label, icon: Icon, count }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
        activeTab === id 
          ? "bg-white/10 text-white shadow-2xl border border-white/10" 
          : "text-white/40 hover:text-white/40 border border-transparent"
      }`}
    >
      <Icon size={16} className={activeTab === id ? (id === "failed" ? "text-red-400" : "text-emerald-400") : ""} />
      {label}
      {count > 0 && id === "failed" && (
        <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-lg font-black">{count}</span>
      )}
    </button>
  );

  const MarkRow = ({ item, index }: any) => {
    const gradeColor = ["O", "A+", "A"].includes(item.grade) ? "emerald" : 
                       ["B+", "B", "C"].includes(item.grade) ? "blue" : "red";

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.5 }}
        className="group relative glow-card p-6 mb-4 flex items-center gap-6 hover:border-white/20 transition-all duration-500"
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 ${
          gradeColor === "emerald" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
          gradeColor === "blue" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
          "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {item.grade}
        </div>
  
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-white/5 text-white/40 uppercase tracking-[0.2em] border border-white/5">
              {item.code}
            </span>
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">{item.monthYear}</span>
          </div>
          <div className="text-base font-black text-white leading-tight mb-3 uppercase tracking-tight line-clamp-1">{item.description}</div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-black">Credits</span>
              <span className="text-xs text-white/70 font-black">{item.credit}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-black">Sem</span>
              <span className="text-xs text-white/70 font-black">{item.semester}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
        
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          
          {/* Header */}
          <div className="pt-8 px-6 flex items-center justify-between max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 shadow-2xl">
              <ArrowLeft size={18} className="text-emerald-400" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-[0.5em] text-emerald-400 uppercase">● Academic OS</span>
              <span className="text-[8px] text-white/30 font-black tracking-[0.25em] uppercase">Grades & Records</span>
            </div>
            <button className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 group active:scale-90 shadow-2xl">
              <Settings size={18} className="text-white/30 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>

          <div className="pt-8 px-4 sm:px-6 pb-40">
            <div className="max-w-3xl mx-auto space-y-8">
              
              {!studentPortalConnected ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 rounded-[32px] bg-red-500/5 text-red-500/30 flex items-center justify-center mb-8 border border-red-500/10 mx-auto shadow-2xl">
                    <BookOpen size={40} />
                  </div>
                  <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Records Locked</h2>
                  <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Authentication Required</p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex gap-3 p-2 glass-panel border border-white/5 rounded-[2.5rem]">
                    <TabButton id="marks" label="Evaluated" icon={CheckCircle} />
                    <TabButton id="failed" label="Arrears" icon={AlertTriangle} count={failedData.length} />
                  </div>

                  {/* List */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activeTab === "marks" ? (
                        marksData.length === 0 ? (
                          <div className="text-center py-20 glow-card border-white/5">
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">Zero Records Detected</p>
                          </div>
                        ) : (
                          marksData.map((m: any, i: number) => <MarkRow key={i} item={m} index={i} />)
                        )
                      ) : (
                        failedData.length === 0 ? (
                          <div className="text-center py-24 glow-card border-emerald-500/10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-2xl">
                              <CheckCircle size={36} />
                            </div>
                            <p className="text-white text-lg font-black uppercase tracking-widest">Clear Standing</p>
                            <p className="text-white/20 text-[9px] mt-2 font-black uppercase tracking-[0.2em]">All subjects successfully cleared</p>
                          </div>
                        ) : (
                          failedData.map((m: any, i: number) => <MarkRow key={i} item={m} index={i} />)
                        )
                      )}
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          {/* Bottom Dock Navigation */}
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto">
            <div className="glass-panel px-3 py-3 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <NavItem icon={User} label="Home" active={activeNav === 'home'} onClick={() => router.push('/portal/student-dashboard')} />
              <NavItem icon={Award} label="Marks" active={activeNav === 'marks'} onClick={() => setActiveNav('marks')} />
              <NavItem icon={Layers} label="Records" active={activeNav === 'records'} onClick={() => router.push('/portal/personal-details')} />
              <NavItem icon={Settings} label="More" active={activeNav === 'more'} onClick={() => setActiveNav('more')} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
