"use client";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authAPI, dataAPI } from "@/lib/api";
import { applyUnifiedResponse } from "@/lib/normalizeUnified";
import { useAuthStore } from "@/lib/store";
import { 
  Check, 
  Eye, 
  EyeOff, 
  FileText, 
  GraduationCap, 
  Shield, 
  Zap, 
  Calendar, 
  Award, 
  Users, 
  Car, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Lock
} from "lucide-react";
import NexusLogo, { NexusMark } from "@/components/brand/NexusLogo";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "success">("idle");
  const [error, setError] = useState("");

  const router = useRouter();

  // Enforce granular Zustand selectors to eliminate unnecessary render thrashing
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const authToken = useAuthStore((state) => state.authToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  const routeAfterAuth = useCallback(() => {
    const target = "/dashboard";
    router.replace(target);

    window.setTimeout(() => {
      if (window.location.pathname === "/") {
        window.location.assign(target);
      }
    }, 600);
  }, [router]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (authToken) {
      router.replace("/dashboard");
    }
  }, [_hasHydrated, authToken, router]);

  async function handleLogin() {
    if (!email || !password) return setError("Please enter your NetID and password");
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

        // Prefetch unified data during success animation so dashboard renders instantly
        dataAPI.getUnified().then((d) => {
          applyUnifiedResponse(d);
        }).catch(() => {});

        const elapsed = Date.now() - loginStartMs;
        const remainingMs = Math.max(0, MIN_LOADING_MS - elapsed);
        await new Promise((r) => setTimeout(r, remainingMs));

        setLoginPhase("success");
        setTimeout(routeAfterAuth, MIN_SUCCESS_MS);
      } else {
        throw new Error(res.error?.message || "Login failed.");
      }
    } catch (e: any) {
      const elapsed = Date.now() - loginStartMs;
      const remainingMs = Math.max(0, MIN_LOADING_MS - elapsed);
      await new Promise((r) => setTimeout(r, remainingMs));
      setLoading(false);
      setLoginPhase("idle");
      let errMsg = e?.response?.data?.error?.message || e?.response?.data?.error || e?.message || "Login failed";
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
      let errMsg = e?.response?.data?.error || "Demo login failed";
      if (!errMsg.toLowerCase().includes("try again")) {
        errMsg = errMsg.endsWith(".") ? `${errMsg} Please try again.` : `${errMsg}. Please try again.`;
      }
      setError(errMsg);
    }
  }

  if (_hasHydrated && authToken) {
    return <div style={{ minHeight: "100dvh", width: "100%", background: "#09090F" }} />;
  }

  return (
    <div className="nexus-auth-root">
      {/* Background glow */}
      <div className="nexus-auth-glow" aria-hidden="true" />

      {/* Connection progress overlay */}
      {loading && (
        <div className="portal-connection-overlay" role="status" aria-live="polite" aria-label="Connecting SRM portals">
          <div className="portal-connection-brand">
            <NexusLogo variant="compact" size="md" />
          </div>

          <section className="portal-connection-content" aria-label="Connection progress">
            <p className="portal-connection-eyebrow">Secure Dual-Connector Sync</p>
            <h1>{loginPhase === "success" ? "Portals Connected" : "Connecting your SRM portals"}</h1>
            <p className="portal-connection-intro">
              {loginPhase === "success"
                ? "Opening your academic workspace now."
                : "Establishing authenticated session with Academia and Student Portal."}
            </p>

            <div className="portal-connection-map">
              <div className="portal-connection-origin">
                <div className={`portal-connection-marker ${loginPhase === "success" ? "complete" : "active"}`}>
                  {loginPhase === "success" ? <Check size={22} strokeWidth={2.5} /> : <GraduationCap size={24} strokeWidth={2} />}
                </div>
                <strong>Academia</strong>
                <span>{loginPhase === "success" ? "Connected" : "Connecting…"}</span>
              </div>

              <div className={`portal-connection-line ${loginPhase === "success" ? "complete" : ""}`} aria-hidden="true">
                <span />
              </div>

              <div className="portal-connection-destination">
                <div className={`portal-connection-marker ${loginPhase === "success" ? "complete" : "pending"}`}>
                  {loginPhase === "success" ? <Check size={22} strokeWidth={2.5} /> : <FileText size={22} strokeWidth={2} />}
                </div>
                <strong>Student Portal</strong>
                <span>{loginPhase === "success" ? "Synchronized" : "Queued"}</span>
              </div>
            </div>

            <p className="portal-connection-note">
              {loginPhase === "success" ? "Redirecting to your dashboard…" : "Fetching authoritative attendance, marks and timetable."}
            </p>
          </section>
        </div>
      )}

      {/* Main Authentic Entry Split View */}
      <main className="nexus-auth-container">
        <div className="nexus-auth-split">
          {/* Left Panel: Clean Brand & Overview */}
          <div className="nexus-hero-panel">
            <div className="nexus-badge-row">
              <NexusLogo variant="compact" size="lg" />
              <div className="nexus-status-pill">
                <span className="nexus-status-dot" />
                <span>Portals Live</span>
              </div>
            </div>

            <h1 className="nexus-hero-title">
              Your SRM academic workspace.
            </h1>

            <p className="nexus-hero-desc">
              Authoritative Student Portal attendance, component-wise internal marks, Day Order timetables, and Friends Sync in one fast, private place.
            </p>

            {/* Feature Pills */}
            <div className="nexus-feature-pills">
              <div className="nexus-pill">
                <span className="nexus-pill-indicator" style={{ background: "#4ADE80" }} />
                <span>Student Portal Attendance (Margin Forecaster)</span>
              </div>
              <div className="nexus-pill">
                <span className="nexus-pill-indicator" style={{ background: "#60A5FA" }} />
                <span>Internal Marks & Component Breakdown</span>
              </div>
              <div className="nexus-pill">
                <span className="nexus-pill-indicator" style={{ background: "#A78BFA" }} />
                <span>Day Order 1–5 Timetable & Slots</span>
              </div>
              <div className="nexus-pill">
                <span className="nexus-pill-indicator" style={{ background: "#FBBF24" }} />
                <span>Friends Sync & Mutual Free Time</span>
              </div>
              <div className="nexus-pill">
                <span className="nexus-pill-indicator" style={{ background: "#38BDF8" }} />
                <span>SRM Campus Parking Hub</span>
              </div>
            </div>

            {/* Live Data Card Preview on Desktop */}
            <div className="nexus-showcase-box">
              <div className="nexus-showcase-header">
                <span className="nexus-showcase-label">Academic Sync Capabilities</span>
                <span className="nexus-showcase-tag">Dual-Connector Active</span>
              </div>

              <div className="nexus-showcase-row">
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#F7F5FA" }}>Authoritative Attendance</div>
                  <div style={{ fontSize: "11.5px", color: "#8C8696" }}>Direct from Student Portal with safe bunk calculation</div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#4ADE80" }}>88.5%</div>
              </div>

              <div className="nexus-showcase-row">
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#F7F5FA" }}>Day Order Schedule</div>
                  <div style={{ fontSize: "11.5px", color: "#8C8696" }}>Batch slot timeline and period countdowns</div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 750, color: "#60A5FA" }}>DO 1–5</div>
              </div>
            </div>
          </div>

          {/* Right Panel: Direct Sign-In Card (Front & Center) */}
          <div className="nexus-card-panel">
            <div className="nexus-login-card">
              <div className="nexus-login-header">
                <div className="nexus-login-title-wrap">
                  <div>
                    <h2 className="nexus-login-title">Sign in</h2>
                    <div className="nexus-login-subtitle">Connect your SRM NetID</div>
                  </div>
                </div>
                <div className="nexus-security-badge">
                  <Shield size={13} />
                  <span>Secure</span>
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
                      marginBottom: "16px",
                      fontWeight: 700,
                      padding: "10px 14px",
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span>{error}</span>
                  </div>
                )}

                <div className="nexus-input-wrap">
                  <div>
                    <label htmlFor="netid-input" style={{ display: "block", fontSize: "11.5px", fontWeight: 650, color: "#B8B2C2", marginBottom: "6px" }}>
                      SRM NetID
                    </label>
                    <input
                      id="netid-input"
                      type="text" 
                      placeholder="e.g. ns4770"
                      className="nexus-input"
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading} 
                      maxLength={100}
                      autoComplete="username"
                      data-testid="netid-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="password-input" style={{ display: "block", fontSize: "11.5px", fontWeight: 650, color: "#B8B2C2", marginBottom: "6px" }}>
                      Password
                    </label>
                    <div className="nexus-input-password-row">
                      <input
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="SRM password"
                        className="nexus-input"
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                        autoComplete="current-password"
                        data-testid="password-input"
                      />
                      <button
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="nexus-password-toggle"
                        data-testid="toggle-password-btn"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: "space-between", gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input 
                      type="checkbox" 
                      id="remember" 
                      style={{ 
                        accentColor: '#2563EB',
                        width: "15px", 
                        height: "15px", 
                        cursor: "pointer",
                        borderRadius: "4px"
                      }} 
                      defaultChecked 
                      data-testid="remember-checkbox" 
                    />
                    <label 
                      htmlFor="remember" 
                      style={{ 
                        fontSize: "12.5px", 
                        color: "#B8B2C2",
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      Remember session
                    </label>
                  </div>
                  <a href="/trust" style={{ color: "#60A5FA", fontSize: "12px", fontWeight: 650, textDecoration: "none" }}>Privacy policy</a>
                </div>

                <button type="submit" className="nexus-btn-connect" disabled={loading} data-testid="submit-login-btn">
                  {loading ? "Connecting…" : "Connect SRM Portals"}
                  <ArrowRight size={15} />
                </button>

                <button 
                  type="button" 
                  className="nexus-btn-demo"
                  onClick={launchDemo}
                  disabled={loading}
                >
                  <Sparkles size={15} color="#60A5FA" />
                  Try Sample Demo Dashboard
                </button>
              </form>

              {/* Security & Checklist footer */}
              <div className="nexus-card-checklist">
                <div className="nexus-checklist-item">
                  <CheckCircle2 size={14} className="nexus-checklist-check" />
                  <span>Read-only sync · Never modifies university records</span>
                </div>
                <div className="nexus-checklist-item">
                  <CheckCircle2 size={14} className="nexus-checklist-check" />
                  <span>Encrypted session tokens · Disconnect anytime</span>
                </div>
                <div className="nexus-checklist-item">
                  <CheckCircle2 size={14} className="nexus-checklist-check" />
                  <span>Independent Academia & Student Portal connectors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="nexus-auth-footer">
        <div>
          SRM NEXUS © 2026 · Built for SRMIST Students
        </div>
        <div className="nexus-auth-footer-links">
          <a href="/privacy" className="nexus-auth-footer-link">Privacy</a>
          <a href="/terms" className="nexus-auth-footer-link">Terms</a>
          <a href="/trust" className="nexus-auth-footer-link">Security & Trust</a>
          <a href="/support" className="nexus-auth-footer-link">Support</a>
        </div>
      </footer>
    </div>
  );
}
