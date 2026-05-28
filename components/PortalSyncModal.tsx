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
}

export default function PortalSyncModal({
  isOpen,
  onClose,
  onSuccess,
  netId,
}: PortalSyncModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaData, setCaptchaData] = useState<{
    captcha: string;
    captchaToken: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localNetId, setLocalNetId] = useState(netId);
  const [step, setStep] = useState<"form" | "syncing" | "success">("form");

  const theme = useThemeStore((state) => state.theme) || "aura";
  const isAura = theme === "aura";

  // Dynamic theme-aware premium colors configuration
  const colors = {
    // Primary accent color (Aura: hot pink, Cosmos: cool cyan)
    accent: isAura ? "#FF75C3" : "#38BDF8",
    accentRgb: isAura ? "255, 117, 195" : "56, 189, 248",
    
    // Secondary accent color (Aura: lavender, Cosmos: sky blue)
    secondary: isAura ? "#A78BFA" : "#00b3ff",
    secondaryRgb: isAura ? "167, 139, 250" : "0, 179, 255",
    
    // Icon badge styles
    iconBg: isAura ? "rgba(255, 117, 195, 0.08)" : "rgba(56, 189, 248, 0.08)",
    iconBorder: isAura ? "1px solid rgba(255, 117, 195, 0.2)" : "1px solid rgba(56, 189, 248, 0.2)",
    iconGlow: isAura ? "0 0 15px rgba(255, 117, 195, 0.15)" : "0 0 15px rgba(56, 189, 248, 0.15)",

    // Header title text gradient
    headerGrad: isAura
      ? "linear-gradient(90deg, #FF75C3 0%, #C084FC 100%)"
      : "linear-gradient(90deg, #38BDF8 0%, #00b3ff 100%)",

    // Premium card border and ambient glow
    cardBorder: isAura
      ? "1px solid rgba(255, 117, 195, 0.18)"
      : "1px solid rgba(56, 189, 248, 0.18)",
    
    cardShadowGlow: isAura
      ? "0 0 50px rgba(255, 117, 195, 0.08)"
      : "0 0 50px rgba(56, 189, 248, 0.08)",

    // Submit button gradient presets
    btnGrad: isAura
      ? "linear-gradient(135deg, #FF75C3 0%, #A78BFA 100%)"
      : "linear-gradient(135deg, #38BDF8 0%, #00b3ff 100%)",
        
    btnHoverGrad: isAura
      ? "linear-gradient(135deg, #FF94D2 0%, #B9A2FC 100%)"
      : "linear-gradient(135deg, #54CFFF 0%, #29C0FF 100%)",
        
    btnShadow: isAura
      ? "0 10px 25px -5px rgba(255, 117, 195, 0.35), 0 0 20px rgba(255, 117, 195, 0.15)"
      : "0 10px 25px -5px rgba(56, 189, 248, 0.35), 0 0 20px rgba(56, 189, 248, 0.15)",
        
    btnNormalShadow: isAura
      ? "0 8px 20px -6px rgba(255, 117, 195, 0.2)"
      : "0 8px 20px -6px rgba(56, 189, 248, 0.2)",
  };

  // Interaction Hover/Focus States
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isRefreshHovered, setIsRefreshHovered] = useState(false);

  useEffect(() => {
    setLocalNetId(netId);
  }, [netId]);

  useEffect(() => {
    if (isOpen) {
      fetchCaptcha();
      setStep("form");
      setError("");
      setPassword("");
      setCaptchaAnswer("");
      setShowPassword(false);
    }
  }, [isOpen]);

  const fetchCaptcha = useCallback(async () => {
    setCaptchaData(null);
    try {
      const data = await authAPI.initAuth("student-portal");
      setCaptchaData(data);
    } catch {
      setError("CAPTCHA UNAVAILABLE — TRY AGAIN");
    }
  }, []);

  const handleSync = async () => {
    if (!password || !captchaAnswer) {
      setError("ALL FIELDS REQUIRED");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1. Authenticate with Student Portal
      await authAPI.login(localNetId, password, "student-portal", {
        captcha: captchaAnswer,
        captchaToken: captchaData?.captchaToken,
      });

      // 2. Mark connected in Zustand IMMEDIATELY (persists to localStorage)
      useAuthStore.getState().setStudentPortalConnected(true);

      setStep("syncing");

      // 3. Fetch unified data to pull in Student Portal data
      try {
        const unified = await dataAPI.getUnified();
        if (unified?.success) {
          // Merge academia data
          const mergedAcademia = {
            ...unified.academia,
            studentPortal: unified.studentPortal,
          };
          useAuthStore.getState().setAcademicData(mergedAcademia);

          // Store Student Portal data separately
          if (unified.studentPortal) {
            useAuthStore.getState().setStudentPortalData(unified.studentPortal);
          }
        }
      } catch {
        // Unified fetch failed — portal is still connected, data will load on next page visit
        console.warn("[PortalSync] Unified data fetch failed post-connect, will retry on page load");
      }

      setStep("success");
      setTimeout(() => {
        onSuccess(); // This calls window.location.reload() in parent
        onClose();
      }, 2000);
    } catch (e: AnyValue) {
      setError(e.response?.data?.error || "ACCESS DENIED");
      setCaptchaAnswer("");
      fetchCaptcha();
      // Revert connection state on actual auth failure
      useAuthStore.getState().setStudentPortalConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Styling Tokens & Theme System ──────────────────────────────────────────

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
  };

  const cardStyle: React.CSSProperties = {
    width: "390px",
    background: "linear-gradient(135deg, #09090e 0%, #12121f 100%)",
    borderRadius: "28px",
    border: colors.cardBorder,
    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), " + colors.cardShadowGlow + ", inset 0 1px 0 rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    color: "#fff",
    position: "relative",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isOpen ? "scale(1)" : "scale(0.95)",
    opacity: isOpen ? 1 : 0,
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

  const captchaContainerStyle: React.CSSProperties = {
    flex: 1,
    height: "54px",
    background: "rgba(255, 255, 255, 0.96)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.15)",
    transition: "all 0.3s ease",
  };

  const refreshButtonStyle: React.CSSProperties = {
    width: "54px",
    height: "54px",
    background: isRefreshHovered ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.02)",
    border: isRefreshHovered ? "1px solid rgba(" + colors.accentRgb + ", 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: isRefreshHovered ? colors.accent : "#fff",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    transform: isRefreshHovered ? "scale(1.03)" : "none",
    boxShadow: isRefreshHovered ? "0 0 15px rgba(" + colors.accentRgb + ", 0.1)" : "none",
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
          {/* Dynamic keyframe CSS injection */}
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
            aria-label="Connect Student Portal"
          >
            {step === "form" ? (
              <div style={{ padding: "26px" }}>
                {/* Header */}
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
                        Secure Link
                      </h3>
                      <span style={{
                        fontSize: "9px",
                        color: "rgba(255, 255, 255, 0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "block",
                        marginTop: "1px"
                      }}>
                        Student Portal Gateway
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

                {/* Error Box */}
                {error && (
                  <div
                    style={{
                      padding: "11px 14px",
                      background: "rgba(255, 68, 68, 0.08)",
                      border: "1px solid rgba(255, 68, 68, 0.2)",
                      borderRadius: "12px",
                      marginBottom: "20px",
                      textAlign: "center",
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
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* NetID */}
                  <input
                    type="text"
                    placeholder="NetID (e.g. ns4770)"
                    style={getInputStyle("netId")}
                    value={localNetId}
                    onFocus={() => setFocusedInput("netId")}
                    onBlur={() => setFocusedInput(null)}
                    onChange={(e) =>
                      setLocalNetId(e.target.value.split("@")[0])
                    }
                    aria-label="NetID"
                  />

                  {/* Password */}
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Student Portal Password"
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

                  {/* Captcha Image Container */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={captchaContainerStyle}>
                      {captchaData?.captcha ? (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundImage: `url(${captchaData.captcha})`,
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                        />
                      ) : (
                        <RefreshCw
                          size={18}
                          color="#020205"
                          style={{ animation: "spin-slow 1s linear infinite" }}
                        />
                      )}
                    </div>
                    <button
                      onClick={fetchCaptcha}
                      onMouseEnter={() => setIsRefreshHovered(true)}
                      onMouseLeave={() => setIsRefreshHovered(false)}
                      aria-label="Refresh captcha"
                      style={refreshButtonStyle}
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>

                  {/* Captcha Input */}
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    style={{
                      ...getInputStyle("captcha"),
                      fontSize: "18px",
                      fontWeight: 900,
                      textAlign: "center",
                      letterSpacing: "0.3em",
                    }}
                    value={captchaAnswer}
                    onFocus={() => setFocusedInput("captcha")}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    maxLength={6}
                    aria-label="Captcha answer"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSync();
                    }}
                  />

                  {/* Submit Button */}
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
                        Linking...
                      </span>
                    ) : "Establish Hub Link"}
                  </button>
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
                  Student Portal successfully linked with your Academic OS hub.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
