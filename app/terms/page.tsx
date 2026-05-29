"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import { FileText, Scale, ShieldAlert, ArrowLeft, RefreshCw, Terminal, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
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
            background: "linear-gradient(135deg, #00ff88, #00e5ff)",
            display: "flex",
            alignItems: "center",
            justifycontent: "center",
            color: "#000",
            boxShadow: "0 0 30px rgba(0, 229, 255, 0.25)",
          }}
        >
          <Scale size={28} color="#fff" />
        </div>
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "#00ff88",
              letterSpacing: "0.25em",
              fontWeight: 900,
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Legal Framework
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 950, margin: 0, letterSpacing: "-0.05em", lineHeight: 1.1 }}>
            Terms of Service
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
        <Terminal size={12} style={{ color: "#00ff88" }} /> Last Updated: May 2026
      </div>

      {/* Intro Disclaimer Card */}
      <div
        className="min-card"
        style={{
          padding: "28px",
          marginBottom: "32px",
          background: "linear-gradient(135deg, rgba(0,255,136,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(0, 255, 136, 0.15)",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "12px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={18} style={{ color: "#00ff88" }} /> Important Disclaimer
        </h2>
        <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          SRM Nexus is an <strong>independent, unofficial middleware portal client</strong> designed to help students access their official SRM University academic accounts with an optimized UI. 
          We have **no affiliation, connection, or official authorization** from SRM Institute of Science and Technology (SRM IST).
        </p>
      </div>

      {/* Terms Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Section 1 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <FileText size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>1. Acceptance of Conditions</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            By registering, logging in, or accessing SRM Nexus, you agree to comply with and be bound by these Terms of Service. 
            If you do not accept these policies, you must immediately terminate your session and refrain from utilizing this platform.
          </p>
        </div>

        {/* Section 2 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Scale size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>2. Nature of the Middleware</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            SRM Nexus retrieves academic records directly from the official SRM Student Portal and Academia portals 
            by using dynamic, in-memory connectors. 
            Any modifications, inaccuracies, downtimes, or lags in academic data (attendance percentages, internal marks, profile details) 
            are subject to the official university systems and are outside the control of SRM Nexus.
          </p>
        </div>

        {/* Section 3 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Scale size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>3. Academic Integrity & Usage</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginBottom: "16px" }}>
            As a user of SRM Nexus, you agree to:
          </p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", margin: 0, listStyleType: "none" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", shrink: 0 }} />
              <span>Use this tool purely for academic self-tracking and diagnostic support.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", shrink: 0 }} />
              <span>Ensure your login credentials (NetID and password) are kept safe on your own personal device.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", shrink: 0 }} />
              <span>Refrain from launching malicious automation, scraping loops, or denial-of-service attempts against the portal connectors.</span>
            </li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Scale size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>4. Service Limitations & Liability</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            The application and its underlying connectors are provided &quot;as is&quot; without any warranty of any kind, 
            either express or implied. SRM Nexus is not responsible for any session blockages, portal rate limits, 
            or temporary academic access locks that may arise from using third-party clients.
          </p>
        </div>

        {/* Section 5 */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Scale size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>5. Governance & Updates</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            We reserve the right to refine or alter these Terms of Service at any time. Your continued utilization of the 
            client dashboard following updates constitutes absolute acceptance of all active guidelines.
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
            background: "#050508 radial-gradient(circle at 50% -20%, #0a1f18 0%, #050508 70%)",
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
