"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ArrowLeft, Sparkles, Shuffle, Headphones, Users, Tv } from "lucide-react";

interface PremiumLockProps {
  title: string;
  description: string;
  badge?: string;
  backPath?: string;
}

export default function PremiumLock({
  title,
  description,
  badge = "Premium Hub",
  backPath = "/dashboard"
}: PremiumLockProps) {
  const router = useRouter();

  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M11.66 6.1L8.3 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4.3l3.36 2.9a.5.5 0 0 0 .84-.37V6.47a.5.5 0 0 0-.84-.37z" />
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
      ),
      title: "Ad-free academic tracking",
    },
    {
      icon: <Shuffle size={15} style={{ flexShrink: 0 }} />,
      title: "Predictive Class Skipper",
    },
    {
      icon: <Headphones size={15} style={{ flexShrink: 0 }} />,
      title: "Priority Database Sync",
    },
    {
      icon: <Users size={15} style={{ flexShrink: 0 }} />,
      title: "Target GPA Estimator",
    },
    {
      icon: <Tv size={15} style={{ flexShrink: 0 }} />,
      title: "Real-time Push Alerts",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "#050508",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Dynamic ambient background glows */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #BF5AF2 0%, #FF2D55 100%)",
        filter: "blur(120px)",
        opacity: 0.12,
        pointerEvents: "none",
        zIndex: 0
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "400px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.01)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(192, 132, 252, 0.25)",
        borderRadius: "32px",
        padding: "40px 28px",
        boxShadow: "0 30px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
      }}>
        {/* Shimmering Premium Badge */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          background: 'rgba(192, 132, 252, 0.08)', 
          padding: '6px 14px', 
          borderRadius: '100px', 
          border: '1px solid rgba(192, 132, 252, 0.18)', 
          marginBottom: '24px', 
          boxShadow: '0 0 20px rgba(192, 132, 252, 0.06)' 
        }}>
          <Sparkles size={12} color="#BF5AF2" />
          <span style={{ fontSize: "9px", fontWeight: 900, color: "#BF5AF2", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {badge}
          </span>
        </div>

        {/* Locked Icon Container */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "20px",
          background: "rgba(191, 90, 242, 0.1)",
          border: "1px solid rgba(191, 90, 242, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#BF5AF2",
          marginBottom: "20px",
          boxShadow: "0 0 20px rgba(191, 90, 242, 0.15)"
        }}>
          <LockKeyhole size={28} />
        </div>

        <h1 style={{
          fontSize: "24px",
          fontWeight: 900,
          margin: "0 0 12px",
          letterSpacing: "-0.5px",
          color: "#fff"
        }}>
          {title}
        </h1>

        <p style={{
          fontSize: "13px",
          color: "rgba(255, 255, 255, 0.5)",
          lineHeight: 1.5,
          margin: "0 0 24px",
          fontWeight: 650
        }}>
          {description}
        </p>

        {/* Compact Benefits List */}
        <div style={{
          width: "100%",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(192, 132, 252, 0.12)",
          borderRadius: "20px",
          padding: "16px",
          marginBottom: "28px",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
        }}>
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#BF5AF2", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "2px" }}>
            Included with Premium:
          </span>
          {benefits.map((b, idx) => (
            <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ color: "#BF5AF2", display: "flex", alignItems: "center", flexShrink: 0 }}>
                {b.icon}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>
                {b.title}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          <button
            onClick={() => router.push("/premium")}
            style={{
              background: "linear-gradient(135deg, #BF5AF2, #FF2D55)",
              color: "#fff",
              border: "none",
              padding: "14px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(191, 90, 242, 0.35)",
              transition: "transform 0.2s",
              outline: "none"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Upgrade to Premium
          </button>

          <button
            onClick={() => router.push(backPath)}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              color: "rgba(255, 255, 255, 0.70)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "12px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: 900,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              outline: "none"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
