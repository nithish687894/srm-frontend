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
  const router = useRouter();
  const { setAuthData, authToken, _hasHydrated } = useAuthStore();
 
   useEffect(() => {
     if (!_hasHydrated) return;
     if (authToken) router.replace("/dashboard");
   }, [_hasHydrated, authToken, router]);
 
   async function handleLogin() {
     if (!email || !password) return setError("PROVIDE CREDENTIALS");
     setLoading(true); setError("");
     try {
       const res = await authAPI.login(email, password);
       setAuthData(res.token, res.refreshToken);
       router.push("/dashboard");
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
        }

        .login-field { margin-bottom: 24px; }

        .login-input {
          width: 100%; padding: 16px;
          background: #1c1c1c; border: none;
          color: #ffffff; font-size: 18px;
          font-family: inherit; font-weight: bold;
          outline: none; transition: background 0.2s;
        }

        .login-input:focus {
          background: #2a2a2a;
        }

        .login-btn {
          width: 100%; padding: 20px;
          background: transparent; border: 2px solid #ffffff;
          color: #ffffff; font-size: 14px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.15em;
          cursor: pointer; display: flex; align-items: center; justify-content: space-between;
          transition: opacity 0.2s;
        }

        .login-btn:hover { opacity: 0.8; }
        .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
      <div className="login-root">
        <div className="login-card">
          <div className="login-brand">
            <h1 className="login-h1">SRMX</h1>
            <h2 className="login-h2">authenticate</h2>
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
            <input
              type="password"
              placeholder="PASSWORD"
              className="login-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              disabled={loading}
            />
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
