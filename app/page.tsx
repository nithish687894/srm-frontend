"use client";
// Deployment Trigger: 2026-04-27
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff } from "lucide-react";

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
          <h1 className="hero-h1">SRM NEXUS</h1>
          <p className="hero-sub">
            The definitive student intelligence portal for SRM University. 
            Engineered for precision, speed, and academic dominance.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
             <a href="#login" className="login-btn" style={{ textDecoration: 'none', textAlign: 'center', width: 'auto', padding: '18px 40px' }}>
                Access Portal
             </a>
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
          <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px' }}>Secure Login</h2>
          
          {error && <div className="login-error">{error}</div>}

          <input
            type="text"
            placeholder="NETID (e.g. ab1234)"
            className="login-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="PASSWORD"
              className="login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
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

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "INITIALIZING..." : "ENTER PORTAL"}
          </button>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Encrypted End-to-End Tunnel
          </div>
        </section>

        {/* Footer SEO Text */}
        <footer style={{ padding: '60px 24px', textAlign: 'center', color: '#222', fontSize: '12px' }}>
          <p>© 2026 SRM NEXUS. Not affiliated with SRMIST. Built for students by students.</p>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a href="/srm-attendance" style={{ color: 'inherit' }}>Attendance Tracker</a>
            <a href="/srm-sgpa-calculator" style={{ color: 'inherit' }}>SGPA Calculator</a>
            <a href="/srm-timetable" style={{ color: 'inherit' }}>Personal Timetable</a>
          </div>
        </footer>
      </div>
    </>
  );
}
