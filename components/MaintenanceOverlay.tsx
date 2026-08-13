"use client";
import React, { useState } from "react";
import { Clock, ShieldAlert, Sparkles } from "lucide-react";

export default function MaintenanceOverlay() {
  const [enabled] = useState(true);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "#050508",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 117, 195, 0.15) 0%, transparent 70%)",
          filter: "blur(120px)",
          top: "-150px",
          right: "-100px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(54, 115, 255, 0.15) 0%, transparent 70%)",
          filter: "blur(120px)",
          bottom: "-150px",
          left: "-100px",
          pointerEvents: "none",
        }}
      />

      {/* Main Glass Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "520px",
          width: "100%",
          background: "rgba(18, 18, 26, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "28px",
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 117, 195, 0.1)",
        }}
      >
        {/* Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 117, 195, 0.1)",
            border: "1px solid rgba(255, 117, 195, 0.3)",
            borderRadius: "20px",
            padding: "6px 16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#FF75C3",
              boxShadow: "0 0 10px #FF75C3",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#FF75C3",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            UPDATE COOLDOWN ACTIVE
          </span>
        </div>

        {/* Clock Icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            }}
          >
            <Clock size={36} color="#00e5ff" style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.4))" }} />
          </div>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 900,
            color: "#ffffff",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          SRM NEXUS IS IN UPDATE COOLDOWN
        </h1>

        {/* Body Text */}
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: "28px",
            fontWeight: 500,
          }}
        >
          Sorry, SRM Nexus is currently under scheduled update cooldown while we sync with the updated SRM Academia system.
        </p>

        {/* Timer Box */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "18px",
            padding: "16px 20px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              PLEASE OPEN AFTER
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#00e5ff", marginTop: "2px" }}>
              24 — 48 Hours
            </div>
          </div>
          <div
            style={{
              padding: "10px",
              borderRadius: "12px",
              background: "rgba(0, 229, 255, 0.1)",
              border: "1px solid rgba(0, 229, 255, 0.2)",
            }}
          >
            <ShieldAlert size={22} color="#00e5ff" />
          </div>
        </div>

        {/* Subcopy */}
        <div
          style={{
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.4)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Sparkles size={14} color="#FF75C3" />
          <span>Core updates in progress. Thank you for your patience!</span>
        </div>
      </div>
    </div>
  );
}
