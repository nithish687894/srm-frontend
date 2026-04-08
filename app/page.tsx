"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
 const { setToken, token, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (token) router.replace("/dashboard");
  }, [_hasHydrated, token, router]);
  async function handleLogin() {
    if (!email || !password) return setError("Please enter your email and password.");
    setLoading(true); setError("");
    try {
      const res = await authAPI.login(email, password);
      setToken(res.token);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        /* ── NEXT-GEN FUTURISTIC GLASS THEME ── */
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          overflow: hidden;
          position: relative;
          font-family: var(--font-inter), system-ui, sans-serif;
        }

        /* ── IMMERSIVE BACKGROUND & GLOWS ── */
        .login-bg-mesh {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(0, 255, 135, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 85% 30%, rgba(0, 229, 255, 0.08) 0%, transparent 40%);
        }

        .login-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
        }

        .login-orb-animated {
          position: absolute; top: 50%; left: 50%; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(0,255,135,0.12) 0%, transparent 60%);
          border-radius: 50%; filter: blur(60px); opacity: 0.6; pointer-events: none;
          transform: translate(-50%, -50%);
          animation: pulseOrb 8s ease-in-out infinite alternate;
          z-index: 1;
        }

        @keyframes pulseOrb {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
        }

        /* ── GLASSMORPHISM CARD CONTAINER ── */
        .login-glass-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 440px;
          padding: 50px 48px;
          background: rgba(10, 10, 10, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
          opacity: 0; transform: translateY(30px) scale(0.98);
          animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #fff;
        }

        .login-glass-card::before {
          content: "";
          position: absolute; inset: -1px; z-index: -1;
          border-radius: 33px;
          background: linear-gradient(135deg, rgba(0,255,135,0.4), rgba(0,229,255,0.1), transparent 60%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          padding: 1px; pointer-events: none;
        }

        @keyframes slideUpFade {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── BRANDING & TYPOGRAPHY ── */
        .login-brand-center {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          margin-bottom: 40px; text-align: center;
        }

        .login-brand-icon-holo {
          width: 64px; height: 64px; border-radius: 20px;
          background: rgba(0,255,135,0.05);
          border: 1px solid rgba(0,255,135,0.2);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(0,255,135,0.15), inset 0 0 20px rgba(0,255,135,0.05);
          margin-bottom: 20px;
          position: relative;
        }
        
        .login-brand-icon-holo::after {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          box-shadow: 0 0 20px #00ff87 inset; opacity: 0.2; pointer-events: none;
        }

        .login-brand-icon-holo svg { width: 32px; height: 32px; fill: #00ff87; drop-shadow: 0 0 8px rgba(0,255,135,0.8); }

        .login-h1 {
          font-size: 28px; font-weight: 800; color: #fff;
          letter-spacing: -0.5px; margin: 0;
          background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .login-h2 {
          font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.4);
          margin-top: 8px; letter-spacing: 0.5px;
        }

        /* ── FORM ELEMENTS ── */
        .login-error {
          margin-bottom: 24px; padding: 14px 18px; border-radius: 12px;
          background: rgba(255, 71, 87, 0.08); border: 1px solid rgba(255, 71, 87, 0.2);
          color: #ff6b7a; font-size: 13px; display: flex; align-items: center; gap: 10px;
          backdrop-filter: blur(10px);
        }

        .login-field { margin-bottom: 24px; position: relative; }

        .login-input-wrap {
          position: relative; transition: all 0.3s ease;
        }

        .login-input-icon {
          position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.3); pointer-events: none; display: flex;
          transition: color 0.3s ease;
        }

        .login-input {
          width: 100%; padding: 16px 18px 16px 50px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; color: #fff; font-size: 15px;
          outline: none; transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .login-input::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; }

        .login-input:focus {
          border-color: rgba(0,255,135,0.5); background: rgba(0,255,135,0.02);
          box-shadow: 0 0 0 4px rgba(0,255,135,0.1), inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .login-input:focus + .login-input-icon, 
        .login-input:focus ~ .login-pass-toggle { color: #00ff87; }

        .login-pass-toggle {
          position: absolute; right: 18px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3);
          display: flex; padding: 4px; transition: color 0.3s ease; outline: none;
        }
        .login-pass-toggle:hover { color: #fff; }

        /* ── BUTTON OVERHAUL ── */
        .login-btn-holo {
          width: 100%; padding: 16px; border-radius: 16px;
          background: linear-gradient(135deg, #00ff87 0%, #00b3ff 100%);
          color: #000; font-weight: 800; font-size: 16px; letter-spacing: 0.5px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-top: 32px; transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          box-shadow: 0 10px 30px rgba(0,255,135,0.3), inset 0 1px 0 rgba(255,255,255,0.4);
          position: relative; overflow: hidden;
        }

        .login-btn-holo::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%); transition: transform 0.5s ease;
        }

        .login-btn-holo:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(0,255,135,0.4), inset 0 1px 0 rgba(255,255,255,0.5);
        }
        .login-btn-holo:hover:not(:disabled)::before { transform: translateX(100%); }
        .login-btn-holo:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 5px 15px rgba(0,255,135,0.3); }
        .login-btn-holo:disabled { opacity: 0.7; cursor: not-allowed; filter: grayscale(50%); }

        .login-btn-holo .spinner {
          width: 18px; height: 18px; border: 2.5px solid rgba(0,0,0,0.2);
          border-top-color: #000; border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* ── FOOTER ── */
        .login-footer-holo {
          margin-top: 32px; text-align: center;
          font-size: 12px; color: rgba(255,255,255,0.3);
          font-weight: 500; letter-spacing: 0.5px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="login-bg-mesh" />
        <div className="login-grid" />
        <div className="login-orb-animated" />

        <div className="login-glass-card">
          <div className="login-brand-center">
            <div className="login-brand-icon-holo">
               <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#00ff87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <h1 className="login-h1">SRMX Portal</h1>
            <p className="login-h2">Secure Access Gateway</p>
          </div>

          <div className="login-form-inner">
            {error && (
              <div className="login-error">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ff6b7a" strokeWidth="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="#ff6b7a" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <div className="login-field">
              <div className="login-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Academia Email"
                  className="login-input"
                />
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 5.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                </span>
              </div>
            </div>

            <div className="login-field">
              <div className="login-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Master Password"
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="login-input"
                />
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </span>
                <button className="login-pass-toggle" onClick={() => setShowPass(p => !p)} type="button" aria-label="Toggle password">
                  {showPass
                    ? <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>
            </div>

            <button className="login-btn-holo" onClick={handleLogin} disabled={loading}>
              {loading
                ? <><div className="spinner" /> Authenticating…</>
                : <>
                    Authenticate
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </>
              }
            </button>
          </div>

          <div className="login-footer-holo">
            CLIENT-SIDE ENCRYPTION ACTIVE
          </div>
        </div>
      </div>
    </>
  );
}
