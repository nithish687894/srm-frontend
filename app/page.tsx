"use client";
// Deployment Trigger: 2026-04-27
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
     setLoading(true); setError("");
     try {
       const res = await authAPI.login(email, password);
       setAuthData(res.token, res.refreshToken, email);
       if (hasChosenTheme) router.push("/dashboard");
       else router.push("/setup/theme");
    } catch (e: any) {
      setError(e?.response?.data?.error || "LOGIN FAILED");
    } finally { setLoading(false); }
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
          padding: 120px 24px 60px;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-h1 {
          font-family: var(--font-orbitron), sans-serif;
          font-size: clamp(40px, 8vw, 80px);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 24px;
          background: linear-gradient(to right, #ffffff, #888888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-sub {
          font-size: 18px;
          color: #888888;
          max-width: 600px;
          margin: 0 auto 48px;
          line-height: 1.6;
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
          margin: 80px auto;
          padding: 40px 24px;
          background: #0a0a0a;
          border-radius: 32px;
          border: 1px solid #1a1a1a;
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
        {/* Hero Section */}
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ marginBottom: "32px", display: "flex", justifyContent: "center" }}
          >
            <img src="/nexus-logo.png" alt="Logo" style={{ width: "100px", height: "100px", filter: "drop-shadow(0 0 20px rgba(168, 194, 0, 0.3))" }} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hero-h1"
          >
            SRM NEXUS
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="hero-sub"
          >
            The definitive student intelligence portal for SRM University. 
            Engineered for precision, speed, and academic dominance.
          </motion.p>

          <div className="demo-widgets">
            {/* Attendance Demo */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="widget-demo"
            >
              <span className="widget-label">Live Attendance</span>
              <div className="attn-row">
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Data Science</span>
                <div className="attn-bar"><div className="attn-fill" style={{ width: '88%' }}></div></div>
                <span style={{ fontSize: '12px', fontWeight: 900 }}>88%</span>
              </div>
              <div className="attn-row">
                <span style={{ fontSize: '12px', fontWeight: 600 }}>AI & ML</span>
                <div className="attn-bar"><div className="attn-fill" style={{ width: '74%' }}></div></div>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#ff3b3b' }}>74%</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: '#ff3b3b', fontWeight: 800 }}>⚠️ AT RISK: ATTEND NEXT 2 CLASSES</div>
            </motion.div>

            {/* Marks Demo */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="widget-demo"
            >
              <span className="widget-label">Internal Analytics</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>CT-1 Score</span>
                  <span className="mark-pill">48 / 50</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Model Exam</span>
                  <span className="mark-pill">92 / 100</span>
                </div>
                <div style={{ marginTop: '4px', height: '1px', background: '#1a1a1a' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Predicted Grade</span>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>O (Outstanding)</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '60px' }}
          >
             <a href="#login" className="login-btn" style={{ textDecoration: 'none', textAlign: 'center', width: 'auto', padding: '18px 40px' }}>
                Access Portal
             </a>
          </motion.div>
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
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-orbitron)' }}>Better Than Academia</h2>
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

        {/* Login Section */}
        <section id="login" className="login-container">
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
              {loading ? "INITIALIZING..." : "ENTER PORTAL"}
            </button>
          </form>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Encrypted End-to-End Tunnel
          </div>
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
