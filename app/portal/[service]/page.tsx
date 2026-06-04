"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Cpu } from "lucide-react";
import CyberBackground from "@/components/UnsplashBackground";

export default function PortalServicePage({ params }: { params: { service: string } }) {
  const router = useRouter();

  const formatServiceName = (str: string) => {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const serviceName = formatServiceName(params.service || "");

  return (
    <div style={{ height: "100dvh", width: "100vw", background: "#000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <CyberBackground variant="purple" />
      <main style={{ flex: 1, overflowY: "auto", position: 'relative', zIndex: 1, WebkitOverflowScrolling: "touch" }}>
        
        {/* Header */}
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => router.back()}
            style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: "10px", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>Nexus Bridge</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>{serviceName}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", paddingBottom: "100px" }}>
          <div
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(24px)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "32px", padding: "40px", maxWidth: "400px", width: "100%", position: "relative", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
          >
            {/* Grid overlay */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.5, pointerEvents: "none" }} />
            
            <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", position: "relative" }}>
              <Cpu size={36} color="#3b82f6" />
              <div
                style={{ position: "absolute", inset: "-4px", borderRadius: "inherit", border: "1px dashed rgba(59, 130, 246, 0.4)" }}
              />
            </div>
            
            <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#fff", marginBottom: "12px", letterSpacing: "-0.02em" }}>{serviceName}</h1>
            <p style={{ fontSize: "14px", color: "#aaa", lineHeight: 1.6, marginBottom: "32px" }}>
              This portal module is currently being integrated into the Nexus Core. We are building a secure bridge to fetch your {serviceName.toLowerCase()} data seamlessly.
            </p>

            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", textAlign: "left" }}>
              <ShieldCheck size={28} color="#10b981" />
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Secure Bridge Active</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>End-to-end encryption established</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
