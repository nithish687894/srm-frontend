"use client";
import { useState, useEffect, useCallback } from "react";
import { authAPI, dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { X, ShieldCheck, RefreshCw, Cpu, Eye, EyeOff } from "lucide-react";

interface PortalSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  netId: string;
  type?: "academia" | "student-portal";
}

export default function PortalSyncModal({
  isOpen,
  onClose,
  onSuccess,
  netId,
  type = "student-portal",
}: PortalSyncModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localNetId, setLocalNetId] = useState(netId);
  const [step, setStep] = useState<"form" | "syncing" | "success">("form");

  const theme = useThemeStore((state) => state.theme) || "aura";
  const isAura = true;
  const isMatrix = false;

  // Dynamic theme-aware premium colors configuration
  const colors = {
    accent: isAura ? "#FF75C3" : isMatrix ? "#a8c200" : "#38BDF8",
    accentRgb: isAura ? "255, 117, 195" : isMatrix ? "168, 194, 0" : "56, 189, 248",
    secondary: isAura ? "#A78BFA" : isMatrix ? "#6f8000" : "#00b3ff",
    secondaryRgb: isAura ? "167, 139, 250" : isMatrix ? "111, 128, 0" : "0, 179, 255",
    iconBg: isAura ? "rgba(255, 117, 195, 0.08)" : isMatrix ? "rgba(168, 194, 0, 0.08)" : "rgba(56, 189, 248, 0.08)",
    iconBorder: isAura ? "1px solid rgba(255, 117, 195, 0.2)" : isMatrix ? "1px solid rgba(168, 194, 0, 0.2)" : "1px solid rgba(56, 189, 248, 0.2)",
    iconGlow: isAura ? "0 0 15px rgba(255, 117, 195, 0.15)" : isMatrix ? "0 0 15px rgba(168, 194, 0, 0.1)" : "0 0 15px rgba(56, 189, 248, 0.15)",
    headerGrad: isAura 
      ? "linear-gradient(90deg, #FF75C3 0%, #C084FC 100%)" 
      : isMatrix 
        ? "linear-gradient(90deg, #a8c200 0%, #839600 100%)" 
        : "linear-gradient(90deg, #38BDF8 0%, #00b3ff 100%)",
    cardBorder: isAura 
      ? "1px solid rgba(255, 117, 195, 0.18)" 
      : isMatrix 
        ? "1px solid rgba(168, 194, 0, 0.15)" 
        : "1px solid rgba(56, 189, 248, 0.18)",
    cardShadowGlow: isAura 
      ? "0 0 50px rgba(255, 117, 195, 0.08)" 
      : isMatrix 
        ? "0 0 50px rgba(168, 194, 0, 0.03)" 
        : "0 0 50px rgba(56, 189, 248, 0.08)",
    btnGrad: isAura
      ? "linear-gradient(135deg, #FF75C3 0%, #A78BFA 100%)"
      : isMatrix
        ? "linear-gradient(135deg, #a8c200 0%, #6f8000 100%)"
        : "linear-gradient(135deg, #38BDF8 0%, #00b3ff 100%)",
    btnHoverGrad: isAura
      ? "linear-gradient(135deg, #FF94D2 0%, #B9A2FC 100%)"
      : isMatrix
        ? "linear-gradient(135deg, #b9d500 0%, #839600 100%)"
        : "linear-gradient(135deg, #54CFFF 0%, #29C0FF 100%)",
    btnShadow: isAura
      ? "0 10px 25px -5px rgba(255, 117, 195, 0.35), 0 0 20px rgba(255, 117, 195, 0.15)"
      : isMatrix
        ? "0 10px 25px -5px rgba(168, 194, 0, 0.35), 0 0 20px rgba(168, 194, 0, 0.15)"
        : "0 10px 25px -5px rgba(56, 189, 248, 0.35), 0 0 20px rgba(56, 189, 248, 0.15)",
    btnNormalShadow: isAura
      ? "0 8px 20px -6px rgba(255, 117, 195, 0.2)"
      : isMatrix
        ? "0 8px 20px -6px rgba(168, 194, 0, 0.2)"
        : "0 8px 20px -6px rgba(56, 189, 248, 0.2)",
  };

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  // Manual CAPTCHA fallback state
  const [captcha, setCaptcha] = useState("");
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showManualCaptcha, setShowManualCaptcha] = useState(false);
  const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);

  const storeEmail = useAuthStore((state) => state.email);
  const effectiveNetId = (netId || storeEmail || "").split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  const fetchNewCaptcha = useCallback(async () => {
    setRefreshingCaptcha(true);
    try {
      const res = await authAPI.getStudentPortalCaptcha();
      if (res?.success && res.captchaImage) {
        setCaptchaImage(res.captchaImage);
        setCaptchaToken(res.captchaToken || null);
        setShowManualCaptcha(true);
        setCaptcha("");
      }
    } catch (err: AnyValue) {
      console.warn("[PortalSync] Failed to refresh captcha", err);
    } finally {
      setRefreshingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    const rawId = netId || storeEmail || "";
    if (type === "student-portal") {
      setLocalNetId(rawId.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
    } else {
      setLocalNetId(rawId);
    }
  }, [netId, storeEmail, type]);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setError("");
      setPassword("");
      setShowPassword(false);
      setCaptcha("");
      if (type === "student-portal") {
        setShowManualCaptcha(true);
        fetchNewCaptcha();
      } else {
        setShowManualCaptcha(false);
        setCaptchaImage(null);
        setCaptchaToken(null);
      }
    }
  }, [isOpen, type, fetchNewCaptcha]);

  const handleSync = async () => {
    if (!password) {
      setError("PASSWORD REQUIRED");
      return;
    }
    if (showManualCaptcha && !captcha) {
      setError("CAPTCHA CODE REQUIRED");
      return;
    }
    const cleanId = type === "student-portal"
      ? (localNetId || effectiveNetId).trim()
      : localNetId.trim();

    if (type !== "student-portal" && !cleanId) {
      setError("CREDENTIALS REQUIRED");
      return;
    }
    setLoading(true);
    setError("");

    try {
      if (type === "student-portal") {
        const extraPayload: Record<string, AnyValue> = {};
        if (cleanId) extraPayload.netId = cleanId;
        if (showManualCaptcha && captcha) {
          extraPayload.captcha = captcha.trim(); // Exact raw user input, no modification
          if (captchaToken) extraPayload.captchaToken = captchaToken;
        }
        const unlockRes = await authAPI.unlockStudentPortal(password, extraPayload);
        if (unlockRes.studentPortal?.status === "connected") {
          useAuthStore.getState().setStudentPortalConnected(true);
          useAuthStore.getState().setConnectorStatus("studentPortal", "connected");
          if (unlockRes.attendance?.data) {
            useAuthStore.getState().setStudentPortalData({
              attendance: Array.isArray(unlockRes.attendance.data) ? unlockRes.attendance.data : (unlockRes.attendance.data?.attendance || []),
              sessionStatus: "active",
              lastSyncedAt: new Date().toISOString(),
            });
          }
        } else if (unlockRes.studentPortal?.status === "captcha_required" || unlockRes.error?.code === "CAPTCHA_REQUIRED" || unlockRes.error?.code === "INVALID_CAPTCHA" || unlockRes.error?.code === "AUTH_FLOW_FAILED") {
          setShowManualCaptcha(true);
          if (unlockRes.captchaImage) {
            setCaptchaImage(unlockRes.captchaImage);
            setCaptchaToken(unlockRes.captchaToken || null);
          } else {
            fetchNewCaptcha();
          }
          setError(unlockRes.error?.message || "CAPTCHA was incorrect or expired. Fresh CAPTCHA loaded above, please try again.");
          setLoading(false);
          return;
        } else if (unlockRes.error?.code === "INVALID_CREDENTIALS") {
          setShowManualCaptcha(true);
          fetchNewCaptcha();
          setError("Student Portal password rejected. Note: Student Portal (Evarsity) may have a different password than your Academia login. Please enter your Student Portal password with the fresh CAPTCHA loaded below.");
          setLoading(false);
          return;
        } else {
          setError(unlockRes.error?.message || "Authentication failed. Fresh CAPTCHA loaded above.");
          fetchNewCaptcha();
          setLoading(false);
          return;
        }
      } else {
        await authAPI.login(cleanId, password, type, {
          captcha: "auto",
          captchaToken: "auto",
        });
        useAuthStore.getState().setAcademiaConnected(true);
        useAuthStore.getState().setConnectorStatus("academia", "connected");
      }
      setStep("syncing");

      try {
        const unified = await dataAPI.getUnified();
        if (unified?.success) {
          const mergedAcademia = {
            ...unified.academia,
            studentPortal: unified.studentPortal,
          };
          useAuthStore.getState().setAcademicData(mergedAcademia);
          if (unified.studentPortal) {
            useAuthStore.getState().setStudentPortalData(unified.studentPortal);
          }
        }
      } catch {
        console.warn("[PortalSync] Unified data fetch failed post-connect, will retry on page load");
      }

      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (e: AnyValue) {
      const rawError = e.response?.data?.error?.message 
        || (typeof e.response?.data?.error === 'string' ? e.response?.data?.error : null)
        || e.response?.data?.message 
        || e.message 
        || "";

      let userFriendlyMsg = rawError;
      if (rawError.includes("Invalid credentials") || rawError.includes("INVALID_CREDENTIALS") || rawError.includes("INVALID_CAPTCHA")) {
        userFriendlyMsg = "CAPTCHA expired/incorrect or password invalid — fresh CAPTCHA loaded below, please try again.";
      } else if (!userFriendlyMsg) {
        userFriendlyMsg = "Authentication failed. Fresh CAPTCHA loaded below.";
      }

      setError(userFriendlyMsg);
      if (type === "student-portal") {
        useAuthStore.getState().setStudentPortalConnected(false);
        // Automatically fetch fresh CAPTCHA on error so student can retry immediately
        fetchNewCaptcha();
      } else {
        useAuthStore.getState().setAcademiaConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto Terminate bypasses CAPTCHA validation and retries login directly
  const handleAutoTerminate = async () => {
    if (!localNetId.trim() || !password) {
      setError("NETID & PASSWORD REQUIRED");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await authAPI.login(localNetId.trim(), password, type, {
        captcha: "auto",
        captchaToken: "auto",
      });

      if (type === "student-portal") {
        useAuthStore.getState().setStudentPortalConnected(true);
      } else {
        useAuthStore.getState().setAcademiaConnected(true);
      }
      setStep("syncing");

      try {
        const unified = await dataAPI.getUnified();
        if (unified?.success) {
          const mergedAcademia = {
            ...unified.academia,
            studentPortal: unified.studentPortal,
          };
          useAuthStore.getState().setAcademicData(mergedAcademia);
          if (unified.studentPortal) {
            useAuthStore.getState().setStudentPortalData(unified.studentPortal);
          }
        }
      } catch {
        console.warn("[PortalSync] Unified data fetch failed post-connect, will retry on page load");
      }

      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (e: AnyValue) {
      const errMsg = e.response?.data?.error?.message 
        || (typeof e.response?.data?.error === 'string' ? e.response?.data?.error : null)
        || e.response?.data?.message 
        || e.message 
        || "Auto terminate failed. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 10001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    backgroundColor: "rgba(3, 3, 5, 0.8)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    animation: "fadeIn 0.3s ease-out",
    overflowY: "auto",
  };

  const cardStyle: React.CSSProperties = {
    width: "390px",
    maxHeight: "calc(100dvh - 40px)",
    overflowY: "auto",
    background: "linear-gradient(135deg, #09090e 0%, #12121f 100%)",
    borderRadius: "28px",
    border: colors.cardBorder,
    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), " + colors.cardShadowGlow + ", inset 0 1px 0 rgba(255, 255, 255, 0.08)",
    color: "#fff",
    position: "relative",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isOpen ? "scale(1)" : "scale(0.95)",
    opacity: isOpen ? 1 : 0,
    margin: "auto",
  };

  const closeButtonStyle: React.CSSProperties = {
    background: isCloseHovered ? "rgba(255, 255, 255, 0.06)" : "none",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isCloseHovered ? "rotate(90deg)" : "none",
  };

  const getInputStyle = (field: string): React.CSSProperties => {
    const isFocused = focusedInput === field;
    return {
      width: "100%",
      background: "rgba(255, 255, 255, 0.02)",
      border: isFocused 
        ? "1px solid rgba(" + colors.accentRgb + ", 0.6)" 
        : "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "14px",
      padding: "15px 16px",
      color: "#fff",
      fontSize: "13px",
      outline: "none",
      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: isFocused 
        ? "0 0 15px rgba(" + colors.accentRgb + ", 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.2)" 
        : "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
    };
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    background: loading 
      ? "rgba(255, 255, 255, 0.05)" 
      : isBtnHovered 
        ? colors.btnHoverGrad 
        : colors.btnGrad,
    color: loading ? "rgba(255,255,255,0.3)" : "#050508",
    border: "none",
    padding: "16px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    cursor: loading ? "not-allowed" : "pointer",
    marginTop: "8px",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: loading 
      ? "none" 
      : isBtnHovered 
        ? colors.btnShadow 
        : colors.btnNormalShadow,
    transform: isBtnHovered && !loading ? "translateY(-1px)" : "none",
  };

  return (
    <>
      {isOpen && (
        <div style={overlayStyle}>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeIn {
              from { opacity: 0; backdrop-filter: blur(0px); }
              to { opacity: 1; backdrop-filter: blur(20px); }
            }
            @keyframes spin-slow {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse-icon {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(0.93); opacity: 0.7; }
            }
          `}} />

          <div
            style={cardStyle}
            role="dialog"
            aria-label={type === "student-portal" ? "Connect Student Portal" : "Connect Academia Portal"}
          >
            {step === "form" ? (
              <div style={{ padding: "26px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "26px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: colors.iconBg,
                      border: colors.iconBorder,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: colors.iconGlow,
                    }}>
                      <Cpu 
                        size={18} 
                        color={colors.accent} 
                        style={{ animation: "pulse-icon 2s infinite ease-in-out" }} 
                      />
                    </div>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        background: colors.headerGrad,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}>
                        {type === "student-portal" ? "Connect Student Portal" : "Connect Portal"}
                      </h3>
                      <span style={{
                        fontSize: "9px",
                        color: "rgba(255, 255, 255, 0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "block",
                        marginTop: "1px"
                      }}>
                        {type === "student-portal" ? "Student Portal Gateway" : "Academia Portal Gateway"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    onMouseEnter={() => setIsCloseHovered(true)}
                    onMouseLeave={() => setIsCloseHovered(false)}
                    aria-label="Close modal"
                    style={closeButtonStyle}
                  >
                    <X size={18} style={{ opacity: isCloseHovered ? 1 : 0.4, transition: "opacity 0.2s" }} />
                  </button>
                </div>

                {error && (
                  <div
                    style={{
                      padding: "11px 14px",
                      background: "rgba(255, 68, 68, 0.08)",
                      border: "1px solid rgba(255, 68, 68, 0.2)",
                      borderRadius: "12px",
                      marginBottom: "20px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px"
                    }}
                    role="alert"
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 900,
                        color: "#ff5555",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase"
                      }}
                    >
                      {error}
                    </span>
                    {(error.toLowerCase().includes("session") || error.toLowerCase().includes("limit")) && (
                      <button
                        onClick={handleAutoTerminate}
                        disabled={loading}
                        style={{
                          background: "#FF2D55",
                          color: "#fff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "10px",
                          fontWeight: 900,
                          cursor: loading ? "not-allowed" : "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          boxShadow: "0 4px 12px rgba(255, 45, 85, 0.3)"
                        }}
                      >
                        ⚡ Auto Terminate & Reconnect
                      </button>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {type === "student-portal" ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "12px 16px",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.06em" }}>
                          Target Account
                        </span>
                        <span style={{ fontSize: "13px", color: "#fff", fontWeight: 800, fontFamily: "monospace", marginTop: "2px" }}>
                          {localNetId || effectiveNetId || "Active NetID"}
                        </span>
                      </div>
                      <span style={{
                        fontSize: "9.5px",
                        background: "rgba(255, 117, 195, 0.12)",
                        color: colors.accent,
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontWeight: 900,
                        letterSpacing: "0.05em"
                      }}>
                        NETID
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Username / Email"
                      style={getInputStyle("netId")}
                      value={localNetId}
                      onFocus={() => setFocusedInput("netId")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setLocalNetId(e.target.value)}
                      aria-label="Username"
                    />
                  )}

                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={type === "student-portal" ? "Student Portal Password" : "Password"}
                      style={getInputStyle("password")}
                      value={password}
                      autoFocus
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && password && !loading) {
                          handleSync();
                        }
                      }}
                      aria-label="Password"
                    />
                    <div
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.35,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        transition: "opacity 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.75"}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = "0.35"}
                      role="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </div>
                  </div>

                  {showManualCaptcha && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "16px",
                        padding: "10px 14px",
                        gap: "14px",
                      }}>
                        <div style={{
                          background: "#ffffff",
                          borderRadius: "10px",
                          padding: "6px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "50px",
                          minWidth: "160px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(0,0,0,0.06)",
                          border: "1px solid rgba(0,0,0,0.08)"
                        }}>
                          {captchaImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={captchaImage}
                              alt="SRM Security Captcha"
                              style={{ height: "42px", maxWidth: "100%", objectFit: "contain", borderRadius: "4px" }}
                            />
                          ) : (
                            <span style={{ fontSize: "11px", color: "#666", fontWeight: 700 }}>
                              {refreshingCaptcha ? "Fetching Captcha..." : "Loading Captcha..."}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={fetchNewCaptcha}
                          disabled={refreshingCaptcha || loading}
                          aria-label="Refresh Captcha"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            background: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            color: "#fff",
                            padding: "10px 14px",
                            borderRadius: "12px",
                            fontSize: "11.5px",
                            fontWeight: 800,
                            cursor: refreshingCaptcha || loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <RefreshCw size={14} style={{ animation: refreshingCaptcha ? "spin-slow 1s linear infinite" : "none" }} />
                          Refresh CAPTCHA
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Enter 5 or 6-character Captcha"
                        maxLength={8}
                        style={{
                          ...getInputStyle("captcha"),
                          fontFamily: "monospace",
                          letterSpacing: "0.12em",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                        value={captcha}
                        autoFocus
                        onFocus={() => setFocusedInput("captcha")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setCaptcha(e.target.value.trim())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && password && captcha && !loading) {
                            handleSync();
                          }
                        }}
                        aria-label="Captcha"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSync}
                    onMouseEnter={() => setIsBtnHovered(true)}
                    onMouseLeave={() => setIsBtnHovered(false)}
                    disabled={loading || !password || (showManualCaptcha && !captcha)}
                    style={{
                      ...buttonStyle,
                      opacity: (!password || (showManualCaptcha && !captcha)) && !loading ? 0.6 : 1,
                      cursor: (!password || (showManualCaptcha && !captcha)) && !loading ? "not-allowed" : buttonStyle.cursor,
                    }}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <RefreshCw size={14} style={{ animation: "spin-slow 1s linear infinite" }} />
                        Connecting Portal...
                      </span>
                    ) : type === "student-portal" ? "Connect Student Portal" : "Establish Hub Link"}
                  </button>

                  <div style={{ textAlign: "center", marginTop: "2px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.35)", letterSpacing: "0.02em" }}>
                      {showManualCaptcha 
                        ? "📝 Enter the exact characters from the image above" 
                        : "🔒 Zero-friction auto-CAPTCHA solver active"}
                    </span>
                  </div>
                </div>
              </div>
            ) : step === "syncing" ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
                  <div style={{
                    position: "absolute",
                    inset: "-8px",
                    borderRadius: "50%",
                    border: "2px solid rgba(" + colors.accentRgb + ", 0.1)",
                    borderTopColor: colors.accent,
                    animation: "spin-slow 1s linear infinite"
                  }} />
                  <RefreshCw
                    size={36}
                    color={colors.accent}
                    style={{ display: "block" }}
                  />
                </div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#fff"
                  }}
                >
                  Syncing Data
                </h4>
                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.4)",
                    lineHeight: 1.6
                  }}
                >
                  Establishing secure connection and retrieving official academic records...
                </p>
              </div>
            ) : (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(52, 211, 153, 0.08)",
                  border: "1px solid rgba(52, 211, 153, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px auto",
                  boxShadow: "0 0 30px rgba(52, 211, 153, 0.15)"
                }}>
                  <ShieldCheck
                    size={36}
                    color="#34D399"
                  />
                </div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.10em",
                    color: "#34D399"
                  }}
                >
                  Authorized
                </h4>
                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.4)",
                    lineHeight: 1.6
                  }}
                >
                  {type === "student-portal" ? "Student Portal successfully linked with your Academic OS hub." : "Academia Portal successfully linked with your Academic OS hub."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
