"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import { Shield, Lock, Eye, ArrowLeft, RefreshCw, Terminal, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();
  const authToken = useAuthStore((state) => state.authToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBack = () => {
    if (authToken) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  if (!isClient || !_hasHydrated) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
        <RefreshCw className="animate-spin" size={24} />
      </div>
    );
  }

  const content = (
    <div style={{ paddingBottom: "120px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Top Navigation / Back Button */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "32px" }}>
        <button
          onClick={handleBack}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "rgba(255, 255, 255, 0.6)",
            padding: "10px 18px",
            borderRadius: "14px",
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #ff75c3, #bf5af2)",
            display: "flex",
            alignItems: "center",
            justify-content: "center",
            color: "#000",
            boxShadow: "0 0 30px rgba(191, 90, 242, 0.25)",
          }}
        >
          <Shield size={28} color="#fff" />
        </div>
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "#ff75c3",
              letterSpacing: "0.25em",
              fontWeight: 900,
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Security Assurance
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 950, margin: 0, letterSpacing: "-0.05em", lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Last Updated */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "rgba(255, 255, 255, 0.35)",
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "monospace",
          letterSpacing: "0.08em",
          marginBottom: "36px",
          textTransform: "uppercase",
        }}
      >
        <Terminal size={12} style={{ color: "#ff75c3" }} /> Last Updated: May 2026
      </div>

      {/* Intro Card */}
      <div
        className="min-card"
        style={{
          padding: "28px",
          marginBottom: "32px",
          background: "linear-gradient(135deg, rgba(191,90,242,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(191, 90, 242, 0.15)",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "12px", color: "#fff" }}>
          Our Privacy Philosophy
        </h2>
        <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          SRM Nexus is engineered to act as a secure client-side middleware portal for SRM University students. 
          We believe that your academic information belongs solely to you. We maintain absolute transparency about how data is processed, 
          adhering to a zero-storage policy for your credentials.
        </p>
      </div>

      {/* Policy Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Section 1 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Lock size={18} style={{ color: "#ff75c3" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>1. Zero Credential Logging</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Your SRM NetID and academic portal password are never stored, logged, or recorded on our servers. 
            When you enter your credentials on the login screen, they are securely forwarded in-memory through the 
            SRM-Nexus dual-connector middleware strictly to fetch your session. 
            Once authenticated, your active session token is held locally in your browser, completely bypassed from permanent remote storage.
          </p>
        </div>

        {/* Section 2 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Eye size={18} style={{ color: "#ff75c3" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>2. Local Data Processing</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Academic metrics (such as your grades, attendance logs, timetables, and profile details) are cached 
            directly in your browser&apos;s encrypted LocalStorage or secure SessionStorage. This lets you access 
            your academic OS instantly without reload lag, keeping all sensitive information on your personal device.
          </p>
        </div>

        {/* Section 3 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Shield size={18} style={{ color: "#ff75c3" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>3. Encryption Protocols</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginBottom: "16px" }}>
            We implement state-of-the-art security mechanisms to keep your data safe:
          </p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", margin: 0, listStyleType: "none" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", shrink: 0 }} />
              <span><strong>TLS 1.3 Transmission:</strong> All data in transit is encrypted using advanced Transport Layer Security.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", shrink: 0 }} />
              <span><strong>AES-256-GCM Session Encryption:</strong> Your sessions are protected with industry-standard symmetric key encryption.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", shrink: 0 }} />
              <span><strong>Sandboxed Execution:</strong> Next.js client-side execution boundaries prevent cross-site scripting vulnerabilities.</span>
            </li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Terminal size={18} style={{ color: "#ff75c3" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>4. Telemetry and Analytics</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            To deliver unmatched performance and error mitigation, we monitor network latency and error rates. 
            All telemetry datasets are strictly anonymized, stripped of identifiers (NetIDs, registration numbers, names), 
            and processed solely to optimize synchronization logic.
          </p>
        </div>

        {/* Section 5 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Lock size={18} style={{ color: "#ff75c3" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>5. Contact and Governance</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            This system is maintained by the SRM Nexus Developer community. If you have any inquiries regarding data architecture, 
            session encryption practices, or governance protocols, you may establish contact directly via our 
            Support Module within the Control Center.
          </p>
        </div>

      </div>
    </div>
  );

  return (
    <div className="page-root">
      {authToken ? (
        <>
          <Sidebar />
          <main className="page-main">
            <div className="page-content">{content}</div>
          </main>
        </>
      ) : (
        <main
          style={{
            minHeight: "100vh",
            background: "#050508 radial-gradient(circle at 50% -20%, #150a25 0%, #050508 70%)",
            padding: "80px 24px",
            color: "#fff",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {content}
        </main>
      )}
    </div>
  );
}
