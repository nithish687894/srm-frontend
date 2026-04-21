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
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #36454F;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #2e3a42;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 20px;
          padding: 40px 36px;
          color: #e8f0f4;
        }

        .login-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 36px;
          text-align: center;
        }

        .login-icon-wrap {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: rgba(126,203,161,0.12);
          border: 1px solid rgba(126,203,161,0.22);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }

        .login-h1 {
          font-size: 26px; font-weight: 800;
          color: #e8f0f4;
          letter-spacing: -0.4px; margin: 0;
        }

        .login-h2 {
          font-size: 13px;
          color: rgba(232,240,244,0.40);
          margin-top: 6px;
        }

        .login-error {
          margin-bottom: 20px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(196,123,123,0.10);
          border: 1px solid rgba(196,123,123,0.22);
          color: #c47b7b;
          font-size: 13px;
          display: flex; align-items: center; gap: 8px;
        }

        .login-field { margin-bottom: 18px; position: relative; }

        .login-label {
          display: block;
          font-size: 11px; font-weight: 600;
          color: rgba(232,240,244,0.45);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .login-input-wrap { position: relative; }

        .login-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: rgba(232,240,244,0.30);
          pointer-events: none;
          display: flex;
        }

        .login-input {
          width: 100%;
          padding: 13px 14px 13px 44px;
          background: #3a4f5c;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          color: #e8f0f4;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .login-input::placeholder { color: rgba(232,240,244,0.25); }
        .login-input:focus {
          border-color: rgba(126,203,161,0.40);
          background: #425866;
        }

        .login-pass-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(232,240,244,0.30); padding: 4px;
          border-radius: 6px; display: flex;
          transition: color 0.2s;
        }
        .login-pass-toggle:hover { color: rgba(232,240,244,0.70); }

        .login-btn {
          width: 100%; padding: 14px;
          border-radius: 12px;
          background: #7ecba1;
          color: #1a3028;
          font-weight: 700; font-size: 15px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
          transition: background 0.2s, transform 0.1s;
          letter-spacing: 0.3px;
        }
        .login-btn:hover:not(:disabled) { background: #6ab58d; }
        .login-btn:active:not(:disabled) { transform: scale(0.99); }
        .login-btn:disabled { opacity: 0.60; cursor: not-allowed; }

        .login-btn .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(26,48,40,0.25);
          border-top-color: #1a3028;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .login-footer {
          margin-top: 28px; text-align: center;
          font-size: 11px; color: rgba(232,240,244,0.22);
          letter-spacing: 0.5px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .login-card {
            padding: 28px 20px;
            border-radius: 16px;
          }
          .login-h1 { font-size: 22px; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#7ecba1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="login-h1">SRMX Portal</h1>
            <p className="login-h2">Sign in to your academic account</p>
          </div>

          <div>
            {error && (
              <div className="login-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#c47b7b" strokeWidth="1.5"/>
                  <path d="M8 5v3.5M8 11v.5" stroke="#c47b7b" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@srmist.edu.in"
                  className="login-input"
                  id="login-email"
                />
                <span className="login-input-icon">
                  <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M1.5 5.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="login-input"
                  id="login-password"
                />
                <span className="login-input-icon">
                  <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                <button className="login-pass-toggle" onClick={() => setShowPass(p => !p)} type="button" aria-label="Toggle password">
                  {showPass
                    ? <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>
                  }
                </button>
              </div>
            </div>

            <button className="login-btn" onClick={handleLogin} disabled={loading} id="login-submit">
              {loading
                ? <><div className="spinner" /> Signing in…</>
                : <>
                    Sign In
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
              }
            </button>
          </div>

          <div className="login-footer">
            SRM Institute of Science and Technology
          </div>
        </div>
      </div>
    </>
  );
}
