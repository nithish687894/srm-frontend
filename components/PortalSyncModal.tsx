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

  useEffect(() => {
    if (type === "student-portal") {
      setLocalNetId((netId || "").split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 6));
    } else {
      setLocalNetId(netId || "");
    }
  }, [netId, type]);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setError("");
      setPassword("");
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSync = async () => {
    const cleanId = type === "student-portal"
      ? localNetId.trim().split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 6)
      : localNetId.trim();

    if (!cleanId || !password) {
      setError(type === "student-portal" ? "6-CHAR NETID & PASSWORD REQUIRED" : "CREDENTIALS REQUIRED");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await authAPI.login(cleanId, password, type, {
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
      setError(e.response?.data?.error || "ACCESS DENIED");
      if (type === "student-portal") {
        useAuthStore.getState().setStudentPortalConnected(false);
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
      setError(e.response?.data?.error || "Auto terminate failed. Please try again.");
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
                        Connect Portal
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
                  <input
                    type="text"
                    placeholder={type === "student-portal" ? "NetID (e.g. ns4770)" : "Username / Email"}
                    style={getInputStyle("netId")}
                    value={localNetId}
                    maxLength={type === "student-portal" ? 6 : undefined}
                    onFocus={() => setFocusedInput("netId")}
                    onBlur={() => setFocusedInput(null)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (type === "student-portal") {
                        setLocalNetId(val.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 6));
                      } else {
                        setLocalNetId(val);
                      }
                    }}
                    aria-label={type === "student-portal" ? "NetID" : "Username"}
                  />

                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      style={getInputStyle("password")}
                      value={password}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setPassword(e.target.value)}
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

                  <button
                    onClick={handleSync}
                    onMouseEnter={() => setIsBtnHovered(true)}
                    onMouseLeave={() => setIsBtnHovered(false)}
                    disabled={loading}
                    style={buttonStyle}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <RefreshCw size={14} style={{ animation: "spin-slow 1s linear infinite" }} />
                        Connecting Portal...
                      </span>
                    ) : type === "student-portal" ? "⚡ Connect Student Portal" : "Establish Hub Link"}
                  </button>

                  <div style={{ textAlign: "center", marginTop: "2px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.35)", letterSpacing: "0.02em" }}>
                      🔒 Zero-friction auto-CAPTCHA solver active
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
