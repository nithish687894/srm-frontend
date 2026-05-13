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

  const DetailCard = ({ title, icon: Icon, children, delay = 0 }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-4"
    >
      <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex items-center gap-3">
        <Icon size={18} className="text-purple-400" />
        <span className="text-xs font-bold text-white uppercase tracking-widest">{title}</span>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {children}
      </div>
    </motion.div>
  );

  const Row = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider shrink-0 w-[40%]">{label}</span>
      <span className="text-sm font-bold text-white/90 text-right">{value || "-"}</span>
    </div>
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
            <div style={{ fontSize: "10px", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>Portal Hub</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>Personal Details</div>
          </div>
        </div>

        {/* Content */}
        {!studentPortalConnected || !profile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4 border border-red-500/50">
              <UserCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Portal Not Connected</h2>
            <p className="text-white/60 text-sm">Please link your Student Portal from the home screen to view your details.</p>
          </div>
        ) : (
          <div className="px-5">
            <DetailCard title="Personal Details" icon={UserCircle} delay={0.1}>
              <Row label="Date of Birth" value={profile.personalDetails?.dob} />
              <Row label="Gender" value={profile.personalDetails?.gender} />
              <Row label="Nationality" value={profile.personalDetails?.nationality} />
              <Row label="Blood Group" value={profile.personalDetails?.bloodGroup} />
            </DetailCard>

            <DetailCard title="Parent Details" icon={Users} delay={0.2}>
              <Row label="Father Name" value={profile.parentDetails?.fatherName} />
              <Row label="Mother Name" value={profile.parentDetails?.motherName} />
              <Row label="Contact No." value={profile.parentDetails?.contactNo} />
              <Row label="Email ID" value={profile.parentDetails?.email} />
            </DetailCard>

            <DetailCard title="Address for Communication" icon={Map} delay={0.3}>
              <Row label="Address" value={profile.address?.address} />
              <Row label="District" value={profile.address?.district} />
              <Row label="State" value={profile.address?.state} />
              <Row label="Pincode" value={profile.address?.pincode} />
            </DetailCard>

            <DetailCard title="Contact Info" icon={Phone} delay={0.4}>
              <Row label="Mobile No." value={profile.contact?.mobile} />
              <Row label="Personal Email" value={profile.contact?.email} />
            </DetailCard>
          </div>
        )}
      </main>
    </div>
  );
}
