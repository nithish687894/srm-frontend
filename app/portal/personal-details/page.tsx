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
    const accents = variant === "purple" ? "from-purple-500/10" : "from-blue-500/10";
    const iconColor = variant === "purple" ? "text-purple-400" : "text-blue-400";
    const borderColor = variant === "purple" ? "border-purple-500/10" : "border-blue-500/10";

    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`relative group bg-white/[0.015] border ${borderColor} rounded-[2.5rem] overflow-hidden backdrop-blur-3xl hover:bg-white/[0.04] transition-all duration-500`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${accents} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
        
        <div className="px-8 py-6 border-b border-white/5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500">
            <Icon size={22} className={iconColor} />
          </div>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{title}</span>
        </div>
        
        <div className="p-8 space-y-6">
          {children}
        </div>
      </motion.div>
    );
  };

  const Row = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{label}</span>
      <span className="text-[15px] font-black text-white/90 leading-tight tracking-tight break-words">
        {value || <span className="text-white/5 font-medium italic text-xs tracking-normal">Not Provided</span>}
      </span>
    </div>
  );

  return (
    <div className="page-root min-h-screen bg-[#050505]">
      <CyberBackground variant="purple" />
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
                <div className="w-1 h-1 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Identity Vault</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-widest uppercase">Personal Data</h1>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20">
            <UserCircle size={22} />
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected || !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-[32px] bg-red-500/5 text-red-500/50 flex items-center justify-center mb-8 border border-red-500/10">
              <UserCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Gateway Locked</h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest leading-relaxed">Identity synchronization required to access vault parameters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <DetailCard title="Primary Parameters" icon={UserCircle} delay={0.1}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                <Row label="Date of Birth" value={profile.personalDetails?.dob} />
                <Row label="Gender" value={profile.personalDetails?.gender} />
                <Row label="Nationality" value={profile.personalDetails?.nationality} />
                <Row label="Blood Group" value={profile.personalDetails?.bloodGroup} />
              </div>
            </DetailCard>

            <DetailCard title="Lineage Node" icon={Users} delay={0.2} variant="purple">
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

            <DetailCard title="Geographic Location" icon={Map} delay={0.3}>
              <div className="space-y-8">
                <Row label="Current Residential Address" value={profile.address?.address} />
                <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                  <Row label="District" value={profile.address?.district} />
                  <Row label="State" value={profile.address?.state} />
                  <Row label="Pincode" value={profile.address?.pincode} />
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Communication Channels" icon={Phone} delay={0.4} variant="purple">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Row label="Student Mobile" value={profile.contact?.mobile} />
                <Row label="Official Email" value={profile.contact?.email} />
              </div>
            </DetailCard>

            <div className="flex justify-center pt-6 pb-20">
              <div className="px-6 py-2.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Data Integrity Verified</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
