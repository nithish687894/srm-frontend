"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, User, Map, Users, Mail, Phone, Home, FileText, Droplet, Flag, Award, Layers, AlertCircle, RefreshCcw } from "lucide-react";
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

export default function PersonalDetailsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeNav, setActiveNav] = useState('records');
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const profile = studentPortalData?.profile;

  const DetailCard = ({ title, icon, children, delay = 0, variant = "blue" }: any) => {
    const accents = variant === "purple" ? "from-purple-500/10" : "from-blue-500/10";
    const borderColor = variant === "purple" ? "group-hover:border-purple-500/30" : "group-hover:border-blue-500/30";

    return (
      <div 
        className={`glow-card p-0 ${borderColor} transition-all duration-500 group`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${accents} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
        
        <div className="px-8 py-5 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500">
            <span className="text-xl">{icon}</span>
          </div>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{title}</span>
        </div>
        
        <div className="p-8 space-y-6">
          {children}
        </div>
      </div>
    );
  };

  const Row = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{label}</span>
      <span className="text-[15px] font-black text-white/90 leading-tight tracking-tight break-words">
        {value || <span className="text-white/5 font-medium italic text-xs tracking-normal uppercase font-black">Not Assigned</span>}
      </span>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
        
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          
          {/* Header */}
          <div className="pt-8 px-6 flex items-center justify-between max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 shadow-2xl">
              <ArrowLeft size={18} className="text-purple-400" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-[0.5em] text-purple-400 uppercase">● Academic OS</span>
              <span className="text-[8px] text-white/30 font-black tracking-[0.25em] uppercase">Identity Vault</span>
            </div>
            <button className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 group active:scale-90 shadow-2xl">
              <Settings size={18} className="text-white/30 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>

          <div className="pt-8 px-4 sm:px-6 pb-40">
            <div className="max-w-3xl mx-auto space-y-6">
              
              {!profile ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 rounded-[32px] bg-red-500/5 text-red-500/30 flex items-center justify-center mb-8 border border-red-500/10 mx-auto shadow-2xl">
                    <User size={40} />
                  </div>
                  <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Vault Empty</h2>
                  <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">Please connect your student portal to fetch details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {!studentPortalConnected && (
                    <div 
                      className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200"
                      style={{ backdropFilter: "blur(20px)" }}
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-amber-500">Offline Cache</div>
                          <div className="text-[11px] text-white/50 font-semibold mt-0.5">Viewing cached profile. Reconnect to sync updates.</div>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/dashboard?sync=1')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl active:scale-95 transition-all shadow-lg shadow-amber-500/10"
                      >
                        <RefreshCcw size={10} className="stroke-[3]" />
                         <span>Sync</span>
                      </button>
                    </div>
                  )}
                  <DetailCard title="Primary Parameters" icon="👤" delay={0.1}>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                      <Row label="Date of Birth" value={profile.personalDetails?.dob} />
                      <Row label="Gender" value={profile.personalDetails?.gender} />
                      <Row label="Nationality" value={profile.personalDetails?.nationality} />
                      <Row label="Blood Group" value={profile.personalDetails?.bloodGroup} />
                    </div>
                  </DetailCard>

                  <DetailCard title="Lineage Node" icon="👨‍👩‍👧‍👦" delay={0.2} variant="purple">
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <Row label="Father / Guardian" value={profile.parentDetails?.fatherName} />
                        <Row label="Mother / Primary" value={profile.parentDetails?.motherName} />
                      </div>
                      <div className="h-[1px] bg-white/5" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <Row label="Emergency Contact" value={profile.parentDetails?.contactNo} />
                        <Row label="Parental Email" value={profile.parentDetails?.email} />
                      </div>
                    </div>
                  </DetailCard>

                  <DetailCard title="Geographic Location" icon="📍" delay={0.3}>
                    <div className="space-y-8">
                      <Row label="Current Residential Address" value={profile.address?.address} />
                      <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                        <Row label="District" value={profile.address?.district} />
                        <Row label="State" value={profile.address?.state} />
                        <Row label="Pincode" value={profile.address?.pincode} />
                      </div>
                    </div>
                  </DetailCard>

                  <DetailCard title="Communication Channels" icon="📱" delay={0.4} variant="purple">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <Row label="Student Mobile" value={profile.contact?.mobile} />
                      <Row label="Official Email" value={profile.contact?.email} />
                    </div>
                  </DetailCard>

                  <div className="flex justify-center pt-6">
                    <div className="px-6 py-2.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2.5 shadow-2xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Data Integrity Verified</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Dock Navigation */}
          <div className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto">
            <div className="glass-panel px-3 py-3 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <NavItem icon={User} label="Home" active={activeNav === 'home'} onClick={() => router.push('/portal/student-dashboard')} />
              <NavItem icon={Award} label="Marks" active={activeNav === 'marks'} onClick={() => router.push('/portal/grade-mark-credit')} />
              <NavItem icon={Layers} label="Records" active={activeNav === 'records'} onClick={() => setActiveNav('records')} />
              <NavItem icon={Settings} label="More" active={activeNav === 'more'} onClick={() => setActiveNav('more')} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
