"use client";
import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authAPI, dataAPI } from "@/lib/api";
import { applyUnifiedResponse } from "@/lib/normalizeUnified";
import { useAuthStore } from "@/lib/store";
import { Check, Eye, EyeOff, FileText, GraduationCap, MonitorPlay, Shield, Zap, Bell, TrendingUp } from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "success">("idle");
  const [error, setError] = useState("");
  const [loginStep, setLoginStep] = useState<"hero" | "academia">("hero");
  
  const [connector, setConnector] = useState<"academia" | "student-portal">("academia");
  const [captchaData, setCaptchaData] = useState<{ captcha: string; captchaToken: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const router = useRouter();

  // Enforce granular Zustand selectors to eliminate unnecessary render thrashing
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const authToken = useAuthStore((state) => state.authToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const hasChosenTheme = useAuthStore((state) => state.hasChosenTheme);

  const routeAfterAuth = useCallback(() => {
    // Home is the user's orientation point after sign-in. Timetable remains
    // available from the primary navigation instead of becoming the default.
    const target = "/dashboard";
    router.replace(target);

    window.setTimeout(() => {
      if (window.location.pathname === "/") {
        window.location.assign(target);
      }
    }, 600);
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
    const loginStartMs = Date.now();
    setLoading(true);
    setLoginPhase("auth");
    setError("");
    const canonicalNetId = email.split("@")[0].trim().toLowerCase();

    const MIN_LOADING_MS = 400;
    const MIN_SUCCESS_MS = 450;
    
    try {
      const devBypassCode = typeof window !== "undefined" ? sessionStorage.getItem("developerPasscode") : null;
      const extra: any = {
        ...(devBypassCode ? { developerPasscode: devBypassCode } : {})
      };

      const res = await authAPI.unifiedLogin(canonicalNetId, password, extra);
      
      if (res.authenticated && res.token) {
        setAuthData(res.token, res.refreshToken, canonicalNetId);
        
        if (res.connectors) {
          useAuthStore.getState().setConnectorStatuses({
            academia: res.connectors.academia?.status || "connected",
            studentPortal: res.connectors.studentPortal?.status || "disconnected",
          });
        }

        // Prefetch unified data during success animation so dashboard
        // renders instantly from Zustand cache. Uses the shared normalizer
        // to produce the exact same shape the dashboard expects.
        dataAPI.getUnified().then((d) => {
          applyUnifiedResponse(d);
        }).catch(() => {}); // Dashboard will retry on mount anyway

        // Ensure the loading screen is visible for at least MIN_LOADING_MS before transitioning to success
        const elapsed = Date.now() - loginStartMs;
        const remainingMs = Math.max(0, MIN_LOADING_MS - elapsed);
        await new Promise((r) => setTimeout(r, remainingMs));

        setLoginPhase("success");
        setTimeout(routeAfterAuth, MIN_SUCCESS_MS);
      } else {
        throw new Error(res.error?.message || "Login failed.");
      }
    } catch (e: any) {
      // Ensure at least MIN_LOADING_MS visible before showing error
      const elapsed = Date.now() - loginStartMs;
      const remainingMs = Math.max(0, MIN_LOADING_MS - elapsed);
      await new Promise((r) => setTimeout(r, remainingMs));
      setLoading(false);
      setLoginPhase("idle");
      let errMsg = e?.response?.data?.error?.message || e?.response?.data?.error || e?.message || "LOGIN FAILED";
      if (errMsg.toLowerCase().includes("timeout")) {
        errMsg = "Server was waking up from sleep. Please tap Sign In again now!";
      } else if (!errMsg.toLowerCase().includes("try again")) {
        errMsg = errMsg.endsWith(".") ? `${errMsg} Please try again.` : `${errMsg}. Please try again.`;
      }
      setError(errMsg);
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
      setAuthData(res.token, res.refreshToken, "demo12");
      setLoginPhase("success");
      
      setTimeout(routeAfterAuth, 700);
    } catch (e: any) {
      setLoading(false);
      setLoginPhase("idle");
      let errMsg = e?.response?.data?.error || "DEMO LOGIN FAILED";
      if (!errMsg.toLowerCase().includes("try again")) {
        errMsg = errMsg.endsWith(".") ? `${errMsg} Please try again.` : `${errMsg}. Please try again.`;
      }
      setError(errMsg);
    }
  }

  if (_hasHydrated && authToken) {
    return <div style={{ minHeight: "100dvh", width: "100%", background: "#050508" }} />;
  }

  return (
    <div className="lp-root">
        <div className="nebula-bg" />

        <div>
          {loading && (
            <div className="portal-connection-overlay" role="status" aria-live="polite" aria-label="Connecting SRM portals">
              <div className="portal-connection-brand">
                <Image src="/nexus-logo.png" alt="SRM Nexus" width={40} height={40} priority />
                <span>SRM Nexus</span>
              </div>

              <section className="portal-connection-content" aria-label="Connection progress">
                <p className="portal-connection-eyebrow">Secure connection</p>
                <h1>{loginPhase === "success" ? "Your portals are connected" : "Connecting your SRM portals"}</h1>
                <p className="portal-connection-intro">
                  {loginPhase === "success"
                    ? "Opening your academic workspace now."
                    : "We are securely linking your academic services."}
                </p>

                <div className="portal-connection-map">
                  <div className="portal-connection-origin">
                    <div className={`portal-connection-marker ${loginPhase === "success" ? "complete" : "active"}`}>
                      {loginPhase === "success" ? <Check size={22} strokeWidth={2.5} /> : <GraduationCap size={25} strokeWidth={2} />}
                    </div>
                    <strong>Academia</strong>
                    <span>{loginPhase === "success" ? "Connected" : "Connecting now"}</span>
                  </div>

                  <div className={`portal-connection-line ${loginPhase === "success" ? "complete" : ""}`} aria-hidden="true">
                    <span />
                  </div>

                  <div className="portal-connection-destination">
                    <div className={`portal-connection-marker ${loginPhase === "success" ? "complete" : "pending"}`}>
                      {loginPhase === "success" ? <Check size={22} strokeWidth={2.5} /> : <FileText size={23} strokeWidth={2} />}
                    </div>
                    <strong>Student Portal</strong>
                    <span>{loginPhase === "success" ? "Ready" : "Queued"}</span>
                  </div>
                </div>

                <p className="portal-connection-note">
                  {loginPhase === "success" ? "Taking you to your dashboard…" : "This can take a moment. Keep this screen open."}
                </p>
              </section>
            </div>
          )}
        </div>

        <section className="hero-section">
              {loginStep === "hero" && (
                <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", animation: "slideInUp 0.45s ease-out" }}>
                  <div style={{ display: "inline-flex", padding: "10px", background: "#12121A", borderRadius: "12px", border: "1px solid #292532" }}>
                    <Image src="/nexus-logo.png" alt="SRM Nexus" width={48} height={48} priority style={{ filter: "grayscale(1) brightness(2)" }} />
                  </div>
                  <h1 style={{ fontSize: "clamp(36px, 7vw, 56px)", fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1, margin: 0, color: "#F7F5FA" }}>
                    SRM Nexus
                  </h1>
                  <h2 style={{ fontSize: "clamp(16px, 3vw, 19px)", fontWeight: 600, color: "#B8B2C2", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.25 }}>
                    Your SRM academic workspace.
                  </h2>
                  <p style={{ fontSize: "15px", color: "#B8B2C2", lineHeight: 1.6, margin: "0 0 12px", fontWeight: 500, maxWidth: "500px" }}>
                    Check attendance, internal marks, timetable and academic dates in one private place.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", width: "100%", maxWidth: "440px" }}>
                    <button
                      type="button"
                      onClick={() => setLoginStep("academia")}
                      style={{
                        width: "100%",
                        padding: "18px 28px",
                        background: "#2563EB",
                        border: "1px solid #2563EB",
                        color: "#ffffff",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: "none"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#1D4ED8";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#2563EB";
                      }}
                    >
                      Connect My Portal
                    </button>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: "0.05em", marginTop: "4px" }}>
                      Read-only access · Secure session · Disconnect anytime
                    </div>
                    
                    <button
                      type="button"
                      onClick={launchDemo}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255, 255, 255, 0.45)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                        marginTop: "16px",
                        transition: "color 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255, 255, 255, 0.45)"}
                    >
                      Not ready yet? Preview sample dashboard
                    </button>
                  </div>
                </div>
              )}

              {loginStep === "academia" && (
                <div className="hero-login" style={{ animation: "slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)", width: "100%", maxWidth: "460px", margin: "0 auto" }}>
                  <button
                    type="button"
                    onClick={() => setLoginStep("hero")}
                    style={{
                      background: "#12121A",
                      border: "1px solid #292532",
                      color: "#B8B2C2",
                      padding: "9px 14px",
                      borderRadius: "8px",
                      fontWeight: 650,
                      fontSize: "12px",
                      cursor: "pointer",
                      marginBottom: "16px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#F7F5FA"; e.currentTarget.style.background = "#1A1724"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#B8B2C2"; e.currentTarget.style.background = "#12121A"; }}
                  >
                    ← Back
                  </button>
                  <div className="login-container">
                    <div style={{ marginBottom: "22px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", marginBottom: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                          <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "#09090F", border: "1px solid #292532", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <Image src="/nexus-logo.png" alt="SRM Nexus" width={30} height={30} priority style={{ filter: "grayscale(1) brightness(2)" }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "11px", color: "#B8B2C2", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>SRM Nexus</div>
                            <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em", margin: "3px 0 0", lineHeight: 1.05 }}>Sign in</h2>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(34,197,94,0.28)", background: "rgba(34,197,94,0.10)", color: "#4ADE80", borderRadius: "6px", padding: "7px 9px", fontSize: "11px", fontWeight: 700 }}>
                          <Shield size={13} />
                          Secure
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                        {[
                          ["Attendance", "#60A5FA"],
                          ["Marks", "#60A5FA"],
                          ["Timetable", "#60A5FA"],
                        ].map(([label, color]) => (
                          <div key={label} style={{ border: "1px solid #292532", background: "#09090F", borderRadius: "8px", padding: "9px 8px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "9999px", background: color, marginBottom: "7px" }} />
                            <div style={{ color: "#B8B2C2", fontSize: "11px", fontWeight: 650 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} data-testid="login-form">
                      {error && (
                        <div 
                          data-testid="login-error" 
                          style={{ 
                            background: "rgba(255, 77, 77, 0.12)",
                            border: "1px solid rgba(255, 77, 77, 0.3)",
                            color: "#ff9999",
                            fontSize: "12px",
                            textAlign: "center",
                            marginBottom: "24px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            padding: "12px 16px",
                            borderRadius: "14px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "10px"
                          }}
                        >
                          <span>{error}</span>
                          {(error.toLowerCase().includes("session") || error.toLowerCase().includes("limit")) && (
                            <button
                              type="button"
                              onClick={handleLogin}
                              disabled={loading}
                              style={{
                                background: "linear-gradient(135deg, #FF2D55 0%, #FF3B30 100%)",
                                color: "#fff",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: 900,
                                cursor: loading ? "not-allowed" : "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                boxShadow: "0 4px 16px rgba(255, 45, 85, 0.4)",
                                width: "100%"
                              }}
                            >
                              ⚡ Auto Terminate & Reconnect
                            </button>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: "12.5px", color: "#B8B2C2", fontWeight: 550, textAlign: "left", marginBottom: "10px", paddingLeft: "2px" }}>
                        Use your SRM NetID. We’ll link Academia and Student Portal securely.
                      </div>

                      <input
                        type="text" 
                        placeholder="NETID (e.g. ns4770)"
                        className="login-input"
                        value={email} onChange={e => setEmail(e.target.value)}
                        disabled={loading} maxLength={100}
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
                          style={{ position: 'absolute', right: '14px', top: '13px', width: "28px", height: "28px", borderRadius: "7px", background: '#12121A', border: '1px solid #292532', color: '#B8B2C2', cursor: 'pointer', display: "grid", placeItems: "center" }}
                          data-testid="toggle-password-btn"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <div style={{ marginBottom: "14px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "#B8B2C2", letterSpacing: "0.02em" }}>
                          Secure verification happens automatically
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: "space-between", gap: '12px', marginBottom: '18px', padding: '0 2px' }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input 
                          type="checkbox" 
                          id="remember" 
                          style={{ 
                            accentColor: '#2563EB',
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
                            color: "#B8B2C2",
                            fontWeight: 500,
                            cursor: "pointer"
                          }}
                        >
                          Remember session
                        </label>
                        </div>
                        <a href="/trust" style={{ color: "#60A5FA", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>Privacy</a>
                      </div>

                      <button type="submit" className="login-btn" disabled={loading} data-testid="submit-login-btn">
                        {loading ? "Connecting..." : "Connect SRM Portals"}
                      </button>
                      
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "rgba(255,255,255,0.48)", fontWeight: 700, lineHeight: 1.4, textAlign: "center", marginTop: "14px", padding: "0 8px" }}>
                        <Zap size={13} color="#60A5FA" />
                        Read-only sync. No official portal data is changed.
                      </div>
                    </form>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#F7F5FA", fontWeight: 600, textAlign: "left", marginTop: "20px", borderTop: "1px solid #292532", paddingTop: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#60A5FA" }}>✓</span>
                        <span>Read-only academic sync</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#60A5FA" }}>✓</span>
                        <span>We don’t change official portal data</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#60A5FA" }}>✓</span>
                        <span>Disconnect anytime</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#60A5FA" }}>✓</span>
                        <span>Delete your data anytime</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
        </section>

        <footer style={{ padding: '80px 24px 60px', textAlign: 'center', borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.008)", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "16px" }}>
            SRM NEXUS © 2026 • ENGINEERED FOR EXCELLENCE
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ff75c3'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Privacy Policy</a>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
            <a href="/terms" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#00ff88'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Terms of Service</a>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
            <a href="/trust" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#bf5af2'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>Trust & Privacy</a>
          </div>
        </footer>
      </div>
  );
}
