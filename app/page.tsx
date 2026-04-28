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
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000000;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          color: #ffffff;
        }

        .login-h1 {
          font-size: 64px; font-weight: 900;
          color: #ffffff; letter-spacing: -0.05em;
          line-height: 1; margin-bottom: 8px;
        }

        .login-h2 {
          font-size: 13px; color: #666666;
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 48px;
        }

        .login-error {
          padding: 16px; border: 2px dashed #ff3b3b;
          background: #1a0000; color: #ff3b3b;
          font-size: 12px; font-weight: bold;
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 24px; text-align: center;
          border-radius: 20px;
        }

        .login-field { margin-bottom: 24px; }

        .login-input {
          width: 100%; padding: 18px 24px;
          background: #f0f4ff; border: none;
          color: #000000; font-size: 18px;
          font-family: inherit; font-weight: 700;
          outline: none; transition: all 0.2s;
          border-radius: 20px;
        }

        .login-input:focus {
          background: #2a2a2a;
        }

        .login-btn {
          width: 100%; padding: 22px;
          background: transparent; border: 2px solid #ffffff;
          color: #ffffff; font-size: 14px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.15em;
          cursor: pointer; display: flex; align-items: center; justify-content: space-between;
          transition: all 0.2s;
          border-radius: 20px;
        }

        .login-btn:hover { opacity: 0.8; }
        .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .pass-wrapper { position: relative; display: flex; align-items: center; }
        .pass-toggle {
          position: absolute; right: 16px; background: none; border: none;
          color: #666; cursor: pointer; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: #fff; }
      `}</style>
      <div className="login-root">
        <div className="login-card">
          <div className="login-brand" style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <div style={{ 
                width: "64px", height: "64px", background: "white", borderRadius: "16px", 
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "8px", boxShadow: "0 0 20px rgba(255,255,255,0.1)"
              }}>
                <img src="/stark-logo.png" style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="Logo" />
              </div>
            </div>
            <h1 className="login-h1">SRMX</h1>
            <h2 className="login-h2" style={{ marginBottom: "8px" }}>authenticate</h2>
            <div style={{ fontSize: "10px", color: "#444", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800, fontStyle: "italic" }}>Winter is coming</div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <input
              type="text"
              placeholder="NETID"
              className="login-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              disabled={loading}
              spellCheck={false}
              autoCapitalize="none"
            />
          </div>

          <div className="login-field">
            <div className="pass-wrapper">
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
                className="pass-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            <span>{loading ? "INITIALIZING..." : "ENTER PORTAL"}</span>
            <span>›</span>
          </button>
        </div>
      </div>
    </>
  );
}
