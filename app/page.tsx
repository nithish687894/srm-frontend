"use client";
// Deployment Trigger: 2026-05-15
import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff, MonitorPlay, Shield, Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "success">("idle");
  const [error, setError] = useState("");
  
  const [connector] = useState<"academia" | "student-portal">("academia");
  const [captchaData, setCaptchaData] = useState<{ captcha: string; captchaToken: string } | null>(null);
  const [captchaAnswer] = useState("");
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const router = useRouter();
  
  // Enforce granular Zustand selectors to eliminate unnecessary render thrashing
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const authToken = useAuthStore((state) => state.authToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const hasChosenTheme = useAuthStore((state) => state.hasChosenTheme);

  const routeAfterAuth = useCallback(() => {
    const target = "/dashboard";
    router.replace(target);

    window.setTimeout(() => {
      if (window.location.pathname === "/") {
        window.location.assign(target);
      }
    }, 1800);
  }, [router]);

   const fetchCaptcha = useCallback(async () => {
     try {
       const data = await authAPI.initAuth("student-portal");
       setCaptchaData(data);
     } catch {
       setError("FAILED TO LOAD CAPTCHA");
     }
   }, []);
 
    useEffect(() => {
      if (!_hasHydrated) return;
      if (authToken) {
        router.replace("/dashboard");
      }
    }, [_hasHydrated, authToken, router]);

   useEffect(() => {
     if (connector === "student-portal" && !captchaData) {
       const id = setTimeout(() => fetchCaptcha(), 0);
       return () => clearTimeout(id);
     }
   }, [connector, captchaData, fetchCaptcha]);

   useEffect(() => {
     heroVideoRef.current?.play().catch(() => {
       // Muted inline autoplay can still be paused by some mobile browser policies.
     });
   }, []);
 
    async function handleLogin() {
      if (!email || !password) return setError("PROVIDE CREDENTIALS");
      setTimeout(() => {
        setLoading(true);
        setLoginPhase("auth");
      }, 0);
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
        
        setTimeout(routeAfterAuth, 700);
     } catch (e: AnyValue) {
       setLoading(false);
       setLoginPhase("idle");
       setError(e?.response?.data?.error || "LOGIN FAILED");
     }
   }

   async function launchDemo() {
     setLoading(true);
     setLoginPhase("auth");
     setError("");
     setEmail("demo12");
     setPassword("demo");
     const demoEmail = "demo12@srmist.edu.in";
     
     try {
       const res = await authAPI.login(demoEmail, "demo", "academia");
       setAuthData(res.token, res.refreshToken, demoEmail);
       setLoginPhase("success");
       
       setTimeout(routeAfterAuth, 700);
     } catch (e: AnyValue) {
       setLoading(false);
       setLoginPhase("idle");
       setError(e?.response?.data?.error || "DEMO LOGIN FAILED");
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
            radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
          filter: blur(120px);
          animation: nebulaDrift 35s ease-in-out infinite alternate;
        }

        @keyframes nebulaDrift {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.15) translate(40px, 40px); }
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-section {
          padding: 48px 20px 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          max-width: 1400px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        @media (min-width: 768px) {
          .hero-section {
            flex-direction: row;
            text-align: left;
            justify-content: space-between;
            align-items: center;
            gap: 44px;
            padding: 40px 40px 56px;
          }
        }

        @media (min-width: 1024px) {
          .hero-section {
            min-height: 100svh;
            padding: 36px 56px 48px;
            gap: 56px;
          }
        }

        @media (min-width: 1280px) {
          .hero-section {
            padding-inline: 72px;
            gap: 72px;
          }
        }

        .hero-login {
          animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
          max-width: 440px;
          flex: 0 0 min(440px, 35vw);
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          background: rgba(15, 15, 25, 0.8);
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 50px 150px rgba(0, 0, 0, 0.9);
          position: relative;
          z-index: 2;
        }

        .hero-content {
          width: 100%;
          min-width: 0;
        }

        @media (min-width: 1024px) {
          .login-container {
            max-width: 400px;
            padding: 30px;
            border-radius: 26px;
          }

          .hero-content {
            max-width: 560px !important;
          }

          .login-container h2 {
            font-size: 28px !important;
            margin-top: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 32px 24px;
            border-radius: 28px;
          }
        }

        .login-input {
          width: 100%;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-size: 15px;
          font-family: inherit;
          font-weight: 500;
          outline: none;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 16px;
          margin-bottom: 18px;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
          font-weight: 600;
        }

        .login-input:focus { 
          border-color: rgba(139, 92, 246, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
        }

        .login-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
          color: #000000;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          cursor: pointer;
          border: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.15);
        }

        .login-btn:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(255, 255, 255, 0.25);
        }

        .login-btn:active {
          transform: translateY(-2px);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 32px;
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
        }

        .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .feature-card:nth-child(2) { animation-delay: 0.2s; }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .video-showcase {
          width: 100%;
          margin-bottom: 40px;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
          background:
            radial-gradient(circle at 24% 20%, rgba(255, 117, 195, 0.16), transparent 32%),
            radial-gradient(circle at 78% 82%, rgba(0, 255, 136, 0.12), transparent 34%),
            rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.46), 0 0 48px rgba(139, 92, 246, 0.08);
          isolation: isolate;
        }

        .video-showcase::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 18%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 34%);
          opacity: 0.42;
        }

        .video-showcase::after {
          content: "";
          position: absolute;
          inset: auto 18px 18px 18px;
          height: 1px;
          z-index: 2;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
        }

        .video-showcase video {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          opacity: 0.92;
          filter: saturate(1.12) contrast(1.05);
        }

        .video-badge {
          position: absolute;
          left: 18px;
          top: 18px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(3, 3, 8, 0.62);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          color: rgba(255, 255, 255, 0.78);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .video-status {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #00ff88;
          box-shadow: 0 0 18px rgba(0, 255, 136, 0.84);
          animation: pulse 1.8s ease-in-out infinite;
        }

        .video-caption {
          position: absolute;
          right: 18px;
          bottom: 18px;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(3, 3, 8, 0.56);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          font-weight: 800;
        }

        @media (max-width: 640px) {
          .video-showcase {
            margin-bottom: 32px;
            border-radius: 22px;
          }

          .video-badge {
            left: 12px;
            top: 12px;
            font-size: 9px;
            padding: 8px 10px;
          }

          .video-caption {
            left: 12px;
            right: 12px;
            bottom: 12px;
            justify-content: center;
          }

          .hero-title {
            font-size: 36px !important;
            letter-spacing: -0.035em !important;
          }

          .feature-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        @media (min-width: 1024px) {
          .hero-title {
            font-size: clamp(52px, 5.7vw, 76px) !important;
            margin-bottom: 24px !important;
          }

          .hero-content p {
            margin-bottom: 28px !important;
          }

          .video-showcase {
            margin-bottom: 24px;
            border-radius: 22px;
          }

          .feature-card {
            padding: 22px;
            border-radius: 20px;
          }

          .feature-grid {
            gap: 16px;
          }
        }

        .compare-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 16px;
        }

        .compare-table tr {
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .compare-table tr:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(8px);
        }

        .compare-table td {
          padding: 28px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-weight: 600;
        }

        .compare-table td:first-child {
          border-radius: 16px 0 0 16px;
          border-right: none;
          background: rgba(139, 92, 246, 0.05);
        }

        .compare-table td:last-child {
          border-radius: 0 16px 16px 0;
          border-left: none;
        }

        @media (max-width: 768px) {
          .compare-table { border-spacing: 0 12px; }
          .compare-table td { padding: 20px; font-size: 14px; }
        }

        @media (max-width: 640px) {
          .compare-table,
          .compare-table tbody,
          .compare-table tr,
          .compare-table td {
            display: block;
            width: 100%;
          }

          .compare-table tr {
            border-radius: 18px;
            overflow: hidden;
          }

          .compare-table td {
            border-radius: 0 !important;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-bottom: 0;
          }

          .compare-table td:last-child {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
        }
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
                backdropFilter: "blur(25px)",
                animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div
                style={{ position: "relative", marginBottom: "72px" }}
              >
                {/* Aura Loading Core */}
                <div style={{
                  width: "120px", height: "120px", borderRadius: "32px",
                  background: loginPhase === "success" 
                    ? "linear-gradient(135deg, #00FF88, #00E6FF)" 
                    : "linear-gradient(135deg, #FF75C3, #CD93FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: loginPhase === "success" 
                    ? "0 0 80px rgba(0, 255, 136, 0.4)" 
                    : "0 0 80px rgba(255, 117, 195, 0.4)",
                  transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  animation: loginPhase === "success" ? "none" : "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                }}>
                  {loginPhase === "success" ? (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  )}
                </div>
                
                {loginPhase !== "success" && (
                  <div
                    style={{
                      position: "absolute", inset: "-24px",
                      border: "2.5px solid rgba(255,117,195,0.1)",
                      borderTopColor: "#FF75C3",
                      borderRadius: "44px",
                      animation: "spin 3s linear infinite"
                    }}
                  />
                )}
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: "17px", fontWeight: 950, letterSpacing: "0.08em", color: "#fff", textTransform: "uppercase", marginBottom: "18px" }}
                >
                  {loginPhase === "success" ? "AUTHENTICATION GRANTED" : "INITIALIZING SECURE LINK"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase" }}>
                  {loginPhase === "success" ? "ESTABLISHING SECURE CONNECTION..." : "VERIFYING CREDENTIALS / RETRIEVING SESSION..."}
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
              <div style={{ marginBottom: "48px", textAlign: "center", animation: "slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <div 
                  style={{ 
                    display: "inline-block",
                    padding: "16px",
                    background: "rgba(139, 92, 246, 0.08)",
                    borderRadius: "20px",
                    border: "1px solid rgba(139, 92, 246, 0.15)",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                >
                  <img src="/nexus-logo.png" alt="Logo" style={{ width: "72px", height: "72px", filter: "drop-shadow(0 0 25px rgba(255, 117, 195, 0.5))" }} />
                </div>
                <h2 style={{ fontSize: "32px", fontWeight: 950, letterSpacing: "-0.03em", marginTop: "28px", lineHeight: 1.1 }}>SRM NEXUS</h2>
                <p style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", marginTop: "12px", fontFamily: "monospace" }}>→ IDENTITY SECURE</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} data-testid="login-form">
                {error && (
                  <div 
                    data-testid="login-error" 
                    style={{ 
                      background: "rgba(255, 77, 77, 0.12)",
                      border: "1px solid rgba(255, 77, 77, 0.3)",
                      color: "#ff9999",
                      fontSize: "13px",
                      textAlign: "center",
                      marginBottom: "24px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "12px 16px",
                      borderRadius: "12px"
                    }}
                  >
                    {error}
                  </div>
                )}

                <input
                  type="text" placeholder="NETID (e.g. ab1234)"
                  className="login-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  disabled={loading} maxLength={6}
                  data-testid="netid-input"
                />

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="PASSWORD"
                    className="login-input"
                    value={password} onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    data-testid="password-input"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '20px', top: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                    data-testid="toggle-password-btn"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', padding: '0 4px' }}>
                  <input 
                    type="checkbox" 
                    id="remember" 
                    style={{ 
                      accentColor: '#ffffff', 
                      width: "16px", 
                      height: "16px",
                      cursor: "pointer",
                      borderRadius: "4px"
                    }} 
                    defaultChecked 
                    data-testid="remember-checkbox" 
                  />
                  <label 
                    htmlFor="remember" 
                    style={{ 
                      fontSize: "13px", 
                      color: "rgba(255, 255, 255, 0.55)", 
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    Remember session
                  </label>
                </div>

                <button type="submit" className="login-btn" disabled={loading} data-testid="submit-login-btn">
                  {loading ? "INITIALIZING..." : "ENTER ACADEMIC OS"}
                </button>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={launchDemo} 
                    disabled={loading}
                    data-testid="quick-demo-btn"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.08) 100%)',
                      border: '1.5px solid rgba(139, 92, 246, 0.25)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      padding: '14px 20px',
                      borderRadius: '14px',
                      fontSize: '11px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.08) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Zap size={13} style={{ color: '#00FF88' }} />
                    Quick Launch Demo Mode
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="hero-content" style={{ maxWidth: "600px", animation: "slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards" }}>
            <div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
                <span style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "99px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>v2.0 PRODUCTION</span>
                <span style={{ padding: "8px 14px", background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", color: "#00FF88", borderRadius: "99px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em" }}>SYSTEMS ONLINE</span>
              </div>
              <h1 className="hero-title" style={{ fontSize: "clamp(42px, 9vw, 88px)", fontWeight: 950, letterSpacing: "-0.06em", lineHeight: 1, marginBottom: "36px" }}>
                Dominate Your <span style={{ color: "rgba(255,255,255,0.35)", display: "block" }}>Academic Journey.</span>
              </h1>
              <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: "56px", fontWeight: 500 }}>
                Experience the next generation of student intelligence. Precision metrics, AI-driven predictions, and zero-latency synchronization.
              </p>

              <div className="video-showcase" aria-label="SRM Nexus product launch trailer">
                <video
                  ref={heroVideoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/nexus-logo.png"
                >
                  <source src="/videos/srm-nexus-ad.mp4" type="video/mp4" />
                  <source src="/videos/srm-nexus-ad.webm" type="video/webm" />
                </video>
                <div className="video-badge">
                  <span className="video-status" />
                  Launch trailer
                </div>
                <div className="video-caption">
                  <MonitorPlay size={14} />
                  Your Academic OS
                </div>
              </div>
              
              <div className="feature-grid">
                <div className="feature-card">
                  <Shield size={28} style={{ marginBottom: "20px", color: "#FF75C3" }} />
                  <div style={{ fontWeight: 950, marginBottom: "12px", fontSize: "16px" }}>SECURE SYNC</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontWeight: 500 }}>Bank-grade encryption for all your portal interactions.</div>
                </div>
                <div className="feature-card">
                  <Zap size={28} style={{ marginBottom: "20px", color: "#00FF88" }} />
                  <div style={{ fontWeight: 950, marginBottom: "12px", fontSize: "16px" }}>ULTRA SPEED</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontWeight: 500 }}>Engineered for zero-lag data hydration.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section style={{ padding: "140px 24px", background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "80px" }}>
              <h2 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 950, letterSpacing: "-0.05em", lineHeight: 1.2 }}>The Nexus Advantage</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", marginTop: "16px", fontWeight: 600, fontSize: "16px" }}>Why settle for the official portal?</p>
            </div>
            
            <table className="compare-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 850, fontSize: "15px" }}>Load Speed</td>
                  <td style={{ color: "rgba(255,255,255,0.35)" }}>Academia: ~8.4s</td>
                  <td style={{ color: "#00FF88", fontWeight: 950 }}>Nexus: ~0.4s</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 850, fontSize: "15px" }}>Mobile UX</td>
                  <td style={{ color: "rgba(255,255,255,0.35)" }}>Non-Responsive</td>
                  <td style={{ color: "#00FF88", fontWeight: 950 }}>Pure Native Feel</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 850, fontSize: "15px" }}>Intelligence</td>
                  <td style={{ color: "rgba(255,255,255,0.35)" }}>Static Data</td>
                  <td style={{ color: "#00FF88", fontWeight: 950 }}>AI Prediction</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer style={{ padding: '100px 24px 60px', textAlign: 'center', borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.008)" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "16px" }}>
            SRM NEXUS © 2026 • ENGINEERED FOR EXCELLENCE
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ff75c3'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Privacy Policy</a>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
            <a href="/terms" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#00ff88'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Terms of Service</a>
          </div>
        </footer>
      </div>
    </>
  );
}
