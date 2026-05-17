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
          padding: 40px 24px;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .nebula-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
          filter: blur(80px);
          animation: drift 20s ease-in-out infinite alternate;
        }

        @keyframes drift {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.1) translate(20px, 20px); }
        }

        .onboarding-container {
          max-width: 1200px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .title {
          font-size: clamp(40px, 8vw, 64px);
          font-weight: 900;
          letter-spacing: -0.04em;
          margin-bottom: 12px;
          line-height: 1;
          background: linear-gradient(to bottom, #fff, #999);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.4em;
          margin-bottom: 80px;
          font-weight: 800;
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 80px;
        }

        @media (max-width: 1000px) {
          .theme-grid { grid-template-columns: 1fr; max-width: 400px; margin-inline: auto; }
        }

        .theme-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          padding: 40px;
          text-align: left;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .theme-card:hover {
          transform: translateY(-12px) scale(1.02);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
        }

        .theme-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 40px;
          padding: 1px;
          background: linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent, rgba(255,255,255,0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.5s;
        }

        .theme-card:hover::after { opacity: 1; }

        .theme-name {
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .theme-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin-bottom: 32px;
          flex-grow: 1;
        }

        .preview-box {
          height: 180px;
          border-radius: 24px;
          margin-top: auto;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .aura-preview {
          background: linear-gradient(135deg, #FF75C3 0%, #FFA647 20%, #FFE83F 40%, #9FFF5B 60%, #70E2FF 80%, #CD93FF 100%);
          background-size: 200% 200%;
          animation: auraGradient 8s linear infinite;
        }

        @keyframes auraGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .matrix-preview { background: #000; }
        .matrix-line {
          width: 50%;
          height: 3px;
          background: #a8c200;
          box-shadow: 0 0 15px #a8c200, 0 0 30px rgba(168, 194, 0, 0.5);
          border-radius: 10px;
        }

        .cosmos-preview {
          background: radial-gradient(circle at center, #2A1B7A 0%, #0A061F 100%);
        }
        .cosmos-orbit {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px dashed rgba(0, 255, 136, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: spin 12s linear infinite;
        }
        .cosmos-core {
          width: 12px;
          height: 12px;
          background: #00FF88;
          border-radius: 50%;
          box-shadow: 0 0 20px #00FF88;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .select-btn {
          width: 100%;
          padding: 20px;
          border-radius: 20px;
          border: none;
          background: #fff;
          color: #000;
          font-weight: 900;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 32px;
        }

        .theme-card:hover .select-btn {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
        }

        .footer-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.2);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
      `}</style>

      <div className="nebula-bg" />

      <div className="onboarding-container">
        <div>
          <h1 className="title">Select Interface</h1>
          <p className="subtitle">Choose your visual environment</p>
        </div>

        <div className="theme-grid">
          <div 
            className="theme-card" onClick={() => handleSelect("aura")}
          >
            <div className="theme-name">Aura</div>
            <p className="theme-desc">The default high-fidelity experience. Vibrant nebula gradients and deep glass effects.</p>
            <div className="preview-box aura-preview">
              <div style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)", padding: "12px 24px", borderRadius: "14px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>Vibrancy Active</div>
            </div>
            <button className="select-btn" style={{ background: "linear-gradient(90deg, #FF75C3, #CD93FF)", color: "#fff" }}>Initialize Aura</button>
          </div>

          <div 
            className="theme-card" onClick={() => handleSelect("matrix")}
          >
            <div className="theme-name">Matrix</div>
            <p className="theme-desc">Industrial efficiency. Minimalist carbon design with tactical cyber-green accents.</p>
            <div className="preview-box matrix-preview">
              <div className="matrix-line" />
            </div>
            <button className="select-btn" style={{ background: "#a8c200", color: "#000" }}>Initialize Matrix</button>
          </div>

          <div 
            className="theme-card" onClick={() => handleSelect("cosmos")}
          >
            <div className="theme-name">EduVerse</div>
            <p className="theme-desc">Deep space productivity. Dark cosmic navy with vibrant neon highlights.</p>
            <div className="preview-box cosmos-preview">
              <div className="cosmos-orbit">
                <div className="cosmos-core" />
              </div>
            </div>
            <button className="select-btn" style={{ background: "linear-gradient(90deg, #2f63f2, #4d7dff)", color: "#fff" }}>Initialize EduVerse</button>
          </div>
        </div>

        <p 
          className="footer-text"
        >
          You can change this anytime in settings
        </p>
      </div>
    </div>
  );
}
