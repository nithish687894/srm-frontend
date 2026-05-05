"use client";
// Deployment Trigger: 2026-04-27
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "success">("idle");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setAuthData, authToken, _hasHydrated, hasChosenTheme } = useAuthStore();
 
   useEffect(() => {
     if (!_hasHydrated) return;
     if (authToken) {
       if (hasChosenTheme) router.replace("/dashboard");
       else router.replace("/setup/theme");
     }
   }, [_hasHydrated, authToken, hasChosenTheme, router]);
 
    async function handleLogin() {
      if (!email || !password) return setError("PROVIDE CREDENTIALS");
      setLoading(true); 
      setLoginPhase("auth");
      setError("");
      const finalEmail = email.includes("@") ? email : `${email.trim()}@srmist.edu.in`;
      try {
        const res = await authAPI.login(finalEmail, password);
        setAuthData(res.token, res.refreshToken, finalEmail);
        setLoginPhase("success");
        
        // Brief delay for success animation before redirect
        setTimeout(() => {
          if (hasChosenTheme) router.push("/dashboard");
          else router.push("/setup/theme");
        }, 800);
     } catch (e: any) {
       setLoading(false);
       setLoginPhase("idle");
       setError(e?.response?.data?.error || "LOGIN FAILED");
     }
   }

  return (
    <>
      <style>{`
        .lp-root {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          font-family: var(--font-inter), sans-serif;
          overflow-x: hidden;
        }

        .hero-section {
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
          gap: 32px;
        }

        .hero-content {
          flex: 1;
        }

        .hero-h1 {
          font-family: var(--font-orbitron), sans-serif;
          font-size: clamp(32px, 6vw, 64px);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1.1;
          margin-bottom: 24px;
          background: linear-gradient(to right, #ffffff, #888888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-sub {
          font-size: 16px;
          color: #888888;
          max-width: 500px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        @media (min-width: 1024px) {
          .hero-section {
            flex-direction: row;
            text-align: left;
            justify-content: space-between;
            align-items: center;
            padding: 120px 24px;
            gap: 60px;
          }
          .hero-content {
            text-align: left;
            order: 1 !important;
          }
          .hero-login {
            order: 2 !important;
          }
          .hero-sub {
            margin: 0 0 40px 0;
          }
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto 80px;
          padding: 0 24px;
        }

        .feature-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          padding: 32px;
          border-radius: 24px;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          border-color: #333333;
          transform: translateY(-5px);
        }

        .feature-icon { color: #ffffff; margin-bottom: 16px; }
        .feature-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .feature-desc { color: #666666; font-size: 14px; line-height: 1.6; }

        .demo-widgets {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 60px;
          flex-wrap: wrap;
        }

        .widget-demo {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 24px;
          padding: 24px;
          text-align: left;
          width: 280px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: float 6s ease-in-out infinite;
        }

        .widget-demo:nth-child(2) { animation-delay: -3s; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .widget-label { font-size: 10px; color: #444; font-weight: 900; text-transform: uppercase; margin-bottom: 16px; display: block; letter-spacing: 0.1em; }
        
        .attn-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .attn-bar { height: 4px; background: #111; border-radius: 2px; flex: 1; margin: 0 12px; overflow: hidden; }
        .attn-fill { height: 100%; background: #ffffff; border-radius: 2px; }

        .mark-pill { background: #111; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #888; }

        .compare-section {
          background: #050505;
          padding: 80px 24px;
          text-align: center;
        }

        .compare-table {
          max-width: 800px;
          margin: 48px auto 0;
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .compare-table th, .compare-table td {
          padding: 20px;
          border-bottom: 1px solid #111;
        }

        .compare-tag {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .tag-nexus { background: #ffffff; color: #000000; }
        .tag-academia { background: #111; color: #444; }

        .login-container {
          max-width: 400px;
          width: 100%;
          padding: 40px 24px;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .login-input {
          width: 100%; padding: 18px 24px;
          background: #111; border: 1px solid #1a1a1a;
          color: #ffffff; font-size: 16px;
          font-family: inherit; font-weight: 600;
          outline: none; transition: all 0.2s;
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .login-input:focus { border-color: #444; background: #151515; }

        .login-btn {
          width: 100%; padding: 18px;
          background: #ffffff; color: #000000;
          font-size: 14px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.1em;
          cursor: pointer; border: none;
          transition: all 0.2s;
          border-radius: 16px;
        }

        .login-btn:hover { transform: scale(1.02); }
        .login-btn:disabled { opacity: 0.5; }

        .login-error {
          color: #ff3b3b; font-size: 12px; text-align: center; margin-bottom: 16px; font-weight: 700;
        }
      `}</style>

      <div className="lp-root">
        {/* Auth Transition Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                background: "rgba(0,0,0,0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)"
              }}
            >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", marginBottom: "40px" }}
            >
              <div style={{
                width: "80px", height: "80px", borderRadius: "20px",
                background: loginPhase === "success" ? "#00E676" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: loginPhase === "success" ? "0 0 40px rgba(0, 230, 118, 0.4)" : "0 0 40px rgba(59, 130, 246, 0.4)",
                transition: "all 0.5s ease"
              }}>
                {loginPhase === "success" ? (
                  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></motion.svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
              </div>
              {loginPhase !== "success" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: "absolute", inset: "-15px",
                    border: "2px solid rgba(255,255,255,0.1)",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%"
                  }}
                />
              )}
            </motion.div>
            
            <div style={{ textAlign: "center" }}>
               <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "0.4em", color: "#fff", textTransform: "uppercase", marginBottom: "8px" }}
               >
                  {loginPhase === "success" ? "Access Granted" : "Authenticating"}
               </motion.div>
               <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}>
                  {loginPhase === "success" ? "DIVERTING TO SECURE DASHBOARD..." : "ESTABLISHING SECURE HANDSHAKE..."}
               </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section className="hero-section">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="hero-login"
            style={{ width: '100%', maxWidth: '400px', order: 1 }}
          >
            <div id="login" className="login-container">
              <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
                <img src="/nexus-logo.png" alt="Logo" style={{ width: "64px", height: "64px", filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))" }} />
              </div>
              <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '24px' }}>Secure Login</h2>
              <p style={{ textAlign: 'center', color: '#444', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '32px' }}>
                Use your SRM NETID credentials
              </p>
              
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                {error && <div className="login-error">{error}</div>}

                <div style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="NETID (e.g. ab1234)"
                    className="login-input"
                    style={{ marginBottom: 0 }}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="PASSWORD"
                    className="login-input"
                    style={{ marginBottom: 0 }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    style={{ position: 'absolute', right: '16px', top: '18px', background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '0 8px' }}>
                  <input type="checkbox" id="remember" style={{ accentColor: '#fff' }} defaultChecked />
                  <label htmlFor="remember" style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}>Remember this device</label>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loginPhase === "success" ? "ACCESS GRANTED" : (loading ? "INITIALIZING..." : "ENTER PORTAL")}
                </button>
              </form>
            </div>
          </motion.div>

          <div className="hero-content" style={{ order: 2 }}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="hero-h1"
              style={{ fontSize: "clamp(24px, 5vw, 48px)" }}
            >
              SRM NEXUS — SRM ACADEMIA PORTAL
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="hero-sub"
              style={{ fontSize: "14px", marginBottom: "20px" }}
            >
              The definitive student intelligence portal for SRM University. 
              Engineered for precision, speed, and dominance.
            </motion.p>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="feature-grid">
          <div className="feature-card">
            <div className="feature-title">Live Attendance Tracker</div>
            <p className="feature-desc">Real-time sync with SRM Academia. Calculate safe-miss limits and target percentages instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-title">Internal Marks Analytics</div>
            <p className="feature-desc">Deep analysis of your CT and Model marks. Predict your final grades before the exams even start.</p>
          </div>
          <div className="feature-card">
            <div className="feature-title">Smart SGPA Calculator</div>
            <p className="feature-desc">The most accurate SGPA/CGPA engine calibrated for SRM's specific credit systems.</p>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="compare-section">
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-orbitron)' }}>Nexus Academia — Better Than the Official Portal</h2>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>SRM Academia</th>
                <th>SRM Nexus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Load Speed</td>
                <td><span className="compare-tag tag-academia">Slow (5-10s)</span></td>
                <td><span className="compare-tag tag-nexus">Instant (0.5s)</span></td>
              </tr>
              <tr>
                <td>Mobile UI</td>
                <td><span className="compare-tag tag-academia">None / Poor</span></td>
                <td><span className="compare-tag tag-nexus">Premium Native</span></td>
              </tr>
              <tr>
                <td>AI Insights</td>
                <td><span className="compare-tag tag-academia">No</span></td>
                <td><span className="compare-tag tag-nexus">Yes (Antigravity AI)</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Footer SEO Text */}
        <footer style={{ padding: '60px 24px', textAlign: 'center', color: '#222', fontSize: '12px' }}>
          <p>© 2026 SRM NEXUS. Not affiliated with SRMIST. Built for students by students.</p>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/tools/srm-attendance-calculator" style={{ color: 'inherit' }}>Attendance Tracker</Link>
            <Link href="/tools/srm-cgpa-calculator" style={{ color: 'inherit' }}>SGPA Calculator</Link>
            <Link href="/tools" style={{ color: 'inherit' }}>All Public Tools</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
