"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import { Shield, Lock, Eye, ArrowLeft, RefreshCw, Terminal, CheckCircle2, HeartHandshake } from "lucide-react";

export default function TrustPage() {
  const router = useRouter();
  const authToken = useAuthStore((state) => state.authToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    if (authToken) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  if (!isClient) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifySelf: "center", color: "#888" }}>
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
            justifyContent: "center",
            color: "#000",
            boxShadow: "0 0 30px rgba(191, 90, 242, 0.25)",
          }}
        >
          <HeartHandshake size={28} color="#fff" />
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
            Our Commitment
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 950, margin: 0, letterSpacing: "-0.05em", lineHeight: 1.1 }}>
            Trust & Privacy
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
        <Terminal size={12} style={{ color: "#ff75c3" }} /> Verified Protocol: June 2026
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
          SRM Nexus is a student productivity platform.
        </h2>
        <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          Designed with a student-first philosophy, we prioritize transparency and control over your personal data. 
          Here are our core promises to you, backed by cryptographically secure design.
        </p>
      </div>

      {/* Core Promises */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* We do not sell student data */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CheckCircle2 size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>We do not sell student data</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Your information is processed to give you a smart dashboard, not to build advertising profiles. 
            We have no tracking networks and do not monetize student information.
          </p>
        </div>

        {/* We do not modify official portal data */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CheckCircle2 size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>We do not modify official portal data</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            SRM Nexus is completely read-only. We fetch information to display to you but we never write back to or change 
            grades, attendance records, or official registration states on upstream portal servers.
          </p>
        </div>

        {/* We use read-only academic sync */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CheckCircle2 size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>We use read-only academic sync</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Synchronizations fetch profile details, marks, timetables, and calendars securely. 
            All fetches use secure network calls, caching responses for 10 minutes to protect upstream servers from excessive requests.
          </p>
        </div>

        {/* Portal Disconnect & Data Deletion */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CheckCircle2 size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>Disconnect & Delete Anytime</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            You can disconnect connected portals or wipe your cache clean from the Settings hub at any time. 
            Once triggered, credentials and session records are immediately cleared from local client storage.
          </p>
        </div>

        {/* Demo Mode */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CheckCircle2 size={18} style={{ color: "#00ff88" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>Risk-free Demo Mode</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            You can test the entire platform without connecting a real account. Use our sandbox database to evaluate 
            Marks Calculators, Timetable builders, and CGPA planners using mock academic details.
          </p>
        </div>

        {/* Deep Security Architecture */}
        <div className="min-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Lock size={18} style={{ color: "#ff75c3" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#fff" }}>Under the Hood: Deep Security</h3>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginBottom: "16px" }}>
            SRM Nexus runs a highly secure dual-connector backend designed for privacy and resilience:
          </p>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px", margin: 0, listStyleType: "none" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", flexShrink: 0 }} />
              <span><strong>Encrypted Cookie Jars:</strong> Upstream session cookie details are stored using state-of-the-art 256-bit AES-GCM encryption key protection on our databases, never as plain text.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", flexShrink: 0 }} />
              <span><strong>Token Rotation:</strong> Employs atomic refresh-token rotation triggers on each sync to prevent replay hijack vulnerabilities.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)" }}>
              <CheckCircle2 size={14} style={{ color: "#00ff88", marginTop: "3px", flexShrink: 0 }} />
              <span><strong>Mongo/Redis Hot Recovery:</strong> Active logins and temp captchas reside in low-latency Redis stores with backup MongoDB document continuity, avoiding local process data leaks.</span>
            </li>
          </ul>
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
