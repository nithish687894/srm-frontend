"use client";
// Deployment Trigger: 2026-05-15
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff, Shield, Zap, Target } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "success">("idle");
  const [error, setError] = useState("");
  
  const [connector, setConnector] = useState<"academia" | "student-portal">("academia");
  const [captchaData, setCaptchaData] = useState<{ captcha: string; captchaToken: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const router = useRouter();
  const { setAuthData, authToken, _hasHydrated, hasChosenTheme } = useAuthStore();
 
   useEffect(() => {
     if (!_hasHydrated) return;
     if (authToken) {
       if (hasChosenTheme) router.replace("/dashboard");
       else router.replace("/setup/theme");
     }
   }, [_hasHydrated, authToken, hasChosenTheme, router]);

   useEffect(() => {
     if (connector === "student-portal" && !captchaData) {
       fetchCaptcha();
     }
   }, [connector, captchaData]);

   async function fetchCaptcha() {
     try {
       const data = await authAPI.initAuth("student-portal");
       setCaptchaData(data);
     } catch (e) {
       setError("FAILED TO LOAD CAPTCHA");
     }
   }
 
    async function handleLogin() {
      if (!email || !password) return setError("PROVIDE CREDENTIALS");
      setLoading(true); 
      setLoginPhase("auth");
      setError("");
      const finalEmail = email.includes("@") ? email : `${email.trim()}@srmist.edu.in`;
      
      try {
        const extra = connector === "student-portal" ? {
          captcha: captchaAnswer,
          captchaToken: captchaData?.captchaToken
        } : {};

        const res = await authAPI.login(finalEmail, password, connector, extra);
        setAuthData(res.token, res.refreshToken, finalEmail);
        setLoginPhase("success");
        
        setTimeout(() => {
          if (hasChosenTheme) router.push("/dashboard");
          else router.push("/setup/theme");
        }, 1200);
     } catch (e: any) {
       setLoading(false);
       setLoginPhase("idle");
       setError(e?.response?.data?.error || "LOGIN FAILED");
     }
   }

  return (
    <>
      <style jsx global>{`
        .lp-root {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        .nebula-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: 
            radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 60%);
          filter: blur(100px);
          animation: nebulaDrift 30s ease-in-out infinite alternate;
        }

        @keyframes nebulaDrift {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.1) translate(30px, 30px); }
        }

        .hero-section {
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        @media (min-width: 1024px) {
          .hero-section {
            flex-direction: row;
            text-align: left;
            justify-content: space-between;
            min-height: 100vh;
            padding: 40px;
          }
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 48px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 40px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
        }

        .login-input {
          width: 100%; padding: 20px 24px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff; font-size: 16px;
          font-family: inherit; font-weight: 600;
          outline: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 20px;
          margin-bottom: 20px;
        }

        .login-input:focus { 
          border-color: rgba(255, 255, 255, 0.3); 
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.05);
        }

        .login-btn {
          width: 100%; padding: 20px;
          background: #ffffff; color: #000000;
          font-size: 15px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.15em;
          cursor: pointer; border: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }

        .login-btn:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(255, 255, 255, 0.2); }
        .login-btn:active { transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .feature-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 32px;
          border-radius: 32px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-8px);
        }

        .compare-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 12px;
        }

        .compare-table tr {
          background: rgba(255, 255, 255, 0.02);
          transition: background 0.3s;
        }

        .compare-table tr:hover { background: rgba(255, 255, 255, 0.04); }

        .compare-table td { padding: 24px; }
        .compare-table td:first-child { border-radius: 20px 0 0 20px; }
        .compare-table td:last-child { border-radius: 0 20px 20px 0; }
      `}</style>

      <div className="lp-root">
        <div className="nebula-bg" />

        <div>
          {loading && (
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 10000,
                background: "rgba(0,0,0,0.98)", display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(20px)"
              }}
            >
              <div
                style={{ position: "relative", marginBottom: "64px" }}
              >
                {/* Aura Loading Core */}
                <div style={{
                  width: "100px", height: "100px", borderRadius: "30px",
                  background: loginPhase === "success" 
                    ? "linear-gradient(135deg, #00FF88, #00E6FF)" 
                    : "linear-gradient(135deg, #FF75C3, #CD93FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: loginPhase === "success" 
                    ? "0 0 60px rgba(0, 255, 136, 0.3)" 
                    : "0 0 60px rgba(255, 117, 195, 0.3)",
                  transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                  {loginPhase === "success" ? (
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <div>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  )}
                </div>
                
                {loginPhase !== "success" && (
                  <div
                    style={{
                      position: "absolute", inset: "-20px",
                      border: "2px solid rgba(255,255,255,0.05)",
                      borderTopColor: "#FF75C3",
                      borderRadius: "40px"
                    }}
                  />
                )}
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "0.6em", color: "#fff", textTransform: "uppercase", marginBottom: "16px" }}
                >
                  {loginPhase === "success" ? "AUTHENTICATION GRANTED" : "BREACHING GATEWAY"}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", fontWeight: 600 }}>
                  {loginPhase === "success" ? "INITIATING NEBULA HANDSHAKE..." : "BYPASSING FIREWALLS / SYNCHRONIZING CORE..."}
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="hero-section">
          <div 
            className="hero-login"
          >
            <div className="login-container">
              <div style={{ marginBottom: "40px", textAlign: "center" }}>
                <div 
                  style={{ display: "inline-block" }}
                >
                  <img src="/nexus-logo.png" alt="Logo" style={{ width: "80px", height: "80px", filter: "drop-shadow(0 0 20px rgba(255, 117, 195, 0.4))" }} />
                </div>
                <h2 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em", marginTop: "24px" }}>SRM NEXUS</h2>
                <p style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", marginTop: "8px" }}>Identity Secure</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                {error && <div style={{ color: "#ff4d4d", fontSize: "13px", textAlign: "center", marginBottom: "20px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{error}</div>}

                <input
                  type="text" placeholder="NETID (e.g. ab1234)"
                  className="login-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  disabled={loading} maxLength={6}
                />

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="PASSWORD"
                    className="login-input"
                    value={password} onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '20px', top: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '0 4px' }}>
                  <input type="checkbox" id="remember" style={{ accentColor: '#fff', width: "18px", height: "18px" }} defaultChecked />
                  <label htmlFor="remember" style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>Remember session</label>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "INITIALIZING..." : "ENTER ACADEMIC OS"}
                </button>
              </form>
            </div>
          </div>

          <div className="hero-content" style={{ maxWidth: "600px" }}>
            <div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <span style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>v2.0 PRODUCTION</span>
                <span style={{ padding: "6px 12px", background: "rgba(0,255,136,0.1)", color: "#00FF88", borderRadius: "99px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>SYSTEMS ONLINE</span>
              </div>
              <h1 style={{ fontSize: "clamp(40px, 8vw, 84px)", fontWeight: 950, letterSpacing: "-0.05em", lineHeight: 0.9, marginBottom: "32px" }}>
                Dominate Your <span style={{ color: "rgba(255,255,255,0.4)" }}>Academic Journey.</span>
              </h1>
              <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "48px" }}>
                Experience the next generation of student intelligence. Precision metrics, AI-driven predictions, and zero-latency synchronization.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="feature-card">
                  <Shield size={24} style={{ marginBottom: "16px", color: "#FF75C3" }} />
                  <div style={{ fontWeight: 900, marginBottom: "8px" }}>SECURE SYNC</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Bank-grade encryption for all your portal interactions.</div>
                </div>
                <div className="feature-card">
                  <Zap size={24} style={{ marginBottom: "16px", color: "#00FF88" }} />
                  <div style={{ fontWeight: 900, marginBottom: "8px" }}>ULTRA SPEED</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Engineered for zero-lag data hydration.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section style={{ padding: "120px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <h2 style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.04em" }}>The Nexus Advantage</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "12px", fontWeight: 700 }}>Why settle for the official portal?</p>
            </div>
            
            <table className="compare-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 800 }}>Load Speed</td>
                  <td style={{ color: "rgba(255,255,255,0.3)" }}>Academia: ~8.4s</td>
                  <td style={{ color: "#00FF88", fontWeight: 900 }}>Nexus: ~0.4s</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 800 }}>Mobile UX</td>
                  <td style={{ color: "rgba(255,255,255,0.3)" }}>Non-Responsive</td>
                  <td style={{ color: "#00FF88", fontWeight: 900 }}>Pure Native Feel</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 800 }}>Intelligence</td>
                  <td style={{ color: "rgba(255,255,255,0.3)" }}>Static Data</td>
                  <td style={{ color: "#00FF88", fontWeight: 900 }}>AI Prediction</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer style={{ padding: '80px 24px', textAlign: 'center', borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>
            SRM NEXUS © 2026 • BUILT FOR DOMINANCE
          </div>
        </footer>
      </div>
    </>
  );
}
