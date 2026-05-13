"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, UserCircle, Map, Users, Mail, Phone, Home, FileText, Droplet, Flag } from "lucide-react";
import CyberBackground from "@/components/UnsplashBackground";
import { useAuthStore } from "@/lib/store";

export default function PersonalDetailsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { studentPortalData, studentPortalConnected } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const profile = studentPortalData?.profile;

  const DetailCard = ({ title, icon: Icon, children, delay = 0, variant = "blue" }: any) => {
    const accents = variant === "purple" ? "from-purple-500/20 to-transparent" : "from-blue-500/20 to-transparent";
    const iconColor = variant === "purple" ? "text-purple-400" : "text-blue-400";

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
        className="relative group bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden mb-6 hover:bg-white/[0.06] transition-all duration-300"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${accents} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
        
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
            <Icon size={20} className={iconColor} />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{title}</span>
        </div>
        
        <div className="p-6 space-y-5">
          {children}
        </div>
      </motion.div>
    );
  };

  const Row = ({ label, value, fullWidth = false }: { label: string, value: string, fullWidth?: boolean }) => (
    <div className={`flex ${fullWidth ? 'flex-col' : 'justify-between'} items-start gap-2`}>
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest shrink-0">{label}</span>
      <span className={`text-sm font-bold text-white/90 ${fullWidth ? '' : 'text-right'} break-words w-full`}>
        {value || <span className="text-white/20 italic font-medium">Not Provided</span>}
      </span>
    </div>
  );

  return (
    <div className="page-root min-h-screen bg-black">
      <CyberBackground variant="purple" />
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
              <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-0.5">Nexus Portal</div>
              <h1 className="text-2xl font-black text-white tracking-tight">Identity Vault</h1>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <UserCircle size={22} />
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected || !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center mt-20">
            <div className="w-24 h-24 rounded-[32px] bg-red-500/10 text-red-500 flex items-center justify-center mb-6 border border-red-500/20">
              <UserCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Gateway Locked</h2>
            <p className="text-white/40 text-sm max-w-[280px] leading-relaxed">Personal data extraction is unauthorized. Please verify your Student Portal connection.</p>
          </div>
        ) : (
          <div className="px-6">
            <div className="grid grid-cols-1 gap-1">
              <DetailCard title="Personal Parameters" icon={UserCircle} delay={0.1}>
                <div className="grid grid-cols-2 gap-6">
                  <Row label="Date of Birth" value={profile.personalDetails?.dob} />
                  <Row label="Gender" value={profile.personalDetails?.gender} />
                  <Row label="Nationality" value={profile.personalDetails?.nationality} />
                  <Row label="Blood Group" value={profile.personalDetails?.bloodGroup} />
                </div>
              </DetailCard>

              <DetailCard title="Lineage Details" icon={Users} delay={0.2} variant="purple">
                <div className="space-y-5">
                  <Row label="Father Name" value={profile.parentDetails?.fatherName} />
                  <Row label="Mother Name" value={profile.parentDetails?.motherName} />
                  <div className="h-px bg-white/5" />
                  <div className="grid grid-cols-1 gap-5">
                    <Row label="Emergency Contact" value={profile.parentDetails?.contactNo} />
                    <Row label="Parent Email" value={profile.parentDetails?.email} />
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Communication Node" icon={Map} delay={0.3}>
                <div className="space-y-5">
                  <Row label="Current Address" value={profile.address?.address} fullWidth />
                  <div className="grid grid-cols-2 gap-6">
                    <Row label="District" value={profile.address?.district} />
                    <Row label="State" value={profile.address?.state} />
                    <Row label="Pincode" value={profile.address?.pincode} />
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Direct Contact" icon={Phone} delay={0.4} variant="purple">
                <div className="space-y-5">
                  <Row label="Student Mobile" value={profile.contact?.mobile} />
                  <Row label="Official Email" value={profile.contact?.email} />
                </div>
              </DetailCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
