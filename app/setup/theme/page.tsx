"use client";
import { useRouter } from "next/navigation";
import { ThemeType, useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import { useEffect, useState } from "react";

export default function ThemeOnboarding() {
  const { setTheme, theme } = useThemeStore();
  const { setHasChosenTheme, authToken, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (_hasHydrated && !authToken) {
      router.replace("/");
    }
  }, [_hasHydrated, authToken, router]);

  const handleSelect = (t: ThemeType) => {
    setTheme(t);
    setHasChosenTheme(true);
    router.push("/dashboard");
  };

  if (!mounted) return null;

  return (
    <div className="onboarding-root">
      <style jsx global>{`
        .onboarding-root {
          min-height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .onboarding-container {
          max-width: 800px;
          width: 100%;
          text-align: center;
        }

        .title {
          font-size: 48px;
          fontWeight: 900;
          letter-spacing: -1.5px;
          margin-bottom: 8px;
          line-height: 1;
        }

        .subtitle {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-bottom: 64px;
          font-weight: 800;
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 64px;
        }

        .theme-card {
          position: relative;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 32px;
          padding: 32px;
          text-align: left;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .theme-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .theme-card.active {
          border-color: #fff;
          background: #111;
        }

        .theme-name {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .theme-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .preview-box {
          height: 160px;
          border-radius: 16px;
          background: #000;
          margin-top: 16px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .matrix-preview {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .matrix-line {
          width: 60%;
          height: 2px;
          background: #a8c200;
          box-shadow: 0 0 10px #a8c200;
        }

        .cosmos-preview {
          background: radial-gradient(circle at 50% 0%, #2A1B7A 0%, #0A061F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cosmos-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px dashed #00FF88;
          animation: spin 10s linear infinite;
        }

        .neo-preview {
          background: linear-gradient(155deg, #ffffff 0%, #f2f2f8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .neo-core {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          border: 2px solid #6d28d9;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(109, 40, 217, 0.2);
          position: relative;
        }
        .neo-core::after {
          content: "";
          position: absolute;
          inset: 14px;
          border-radius: 10px;
          background: #6d28d9;
          opacity: 0.22;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .select-btn {
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          border: none;
          background: #fff;
          color: #000;
          font-weight: 900;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .select-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="onboarding-container">
        <h1 className="title">Select Interface</h1>
        <p className="subtitle">Choose your visual environment</p>

        <div className="theme-grid">
          <div className="theme-card" onClick={() => handleSelect("matrix")}>
            <div className="theme-name">Matrix</div>
            <p className="theme-desc">The classic industrial look. Raw, minimal, and high-performance. Focused on pure data.</p>
            <div className="preview-box matrix-preview">
              <div className="matrix-line" />
            </div>
            <div style={{ marginTop: "32px" }}>
              <button className="select-btn">Initialize Matrix</button>
            </div>
          </div>

          <div className="theme-card" onClick={() => handleSelect("cosmos")}>
            <div className="theme-name">EduVerse</div>
            <p className="theme-desc">Campus dashboard style interface with dark blue cards and productivity-first layout.</p>
            <div className="preview-box cosmos-preview">
              <div className="cosmos-circle" />
            </div>
            <div style={{ marginTop: "32px" }}>
              <button className="select-btn" style={{ background: "linear-gradient(90deg, #2f63f2, #4d7dff)", color: "#fff" }}>Initialize EduVerse</button>
            </div>
          </div>

          <div className="theme-card" onClick={() => handleSelect("neo-minimal")} style={{ background: "#ffffff", border: "1px solid #ececec", color: "#111" }}>
            <div className="theme-name" style={{ color: "#111" }}>Neo Minimal</div>
            <p className="theme-desc" style={{ color: "#555" }}>Pure white and black with violet focus accents. Clean interface with subtle depth.</p>
            <div className="preview-box neo-preview" style={{ border: "1px solid rgba(109, 40, 217, 0.18)" }}>
              <div className="neo-core" />
            </div>
            <div style={{ marginTop: "32px" }}>
              <button className="select-btn" style={{ background: "#6d28d9", color: "#fff" }}>Initialize Neo Minimal</button>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "11px", color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          You can change this anytime in settings
        </p>
      </div>
    </div>
  );
}
