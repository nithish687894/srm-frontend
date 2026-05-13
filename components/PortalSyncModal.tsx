"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI, dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { X, ShieldCheck, RefreshCw, Lock, Cpu, Eye, EyeOff } from "lucide-react";

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
        onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e.response?.data?.error || "ACCESS DENIED");
      setCaptchaAnswer("");
      fetchCaptcha();
      // Revert connection state on actual auth failure
      useAuthStore.getState().setStudentPortalConnected(false);
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
    backgroundColor: "rgba(0,0,0,0.95)",
    backdropFilter: "blur(10px)",
  };

  const cardStyle: React.CSSProperties = {
    width: "380px",
    backgroundColor: "#000",
    borderRadius: "24px",
    border: "1px solid #333",
    boxShadow: "0 0 50px rgba(0,0,0,1)",
    overflow: "hidden",
    color: "#fff",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "12px",
    padding: "14px",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={overlayStyle}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={cardStyle}
            role="dialog"
            aria-label="Connect Student Portal"
          >
            {step === "form" ? (
              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Cpu size={20} color="#00ff88" />
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      Secure Link
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}
                  >
                    <X size={20} style={{ opacity: 0.3 }} />
                  </button>
                </div>

                {error && (
                  <div
                    style={{
                      padding: "10px",
                      background: "rgba(255,0,0,0.1)",
                      border: "1px solid rgba(255,0,0,0.2)",
                      borderRadius: "10px",
                      marginBottom: "20px",
                      textAlign: "center",
                    }}
                    role="alert"
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 900,
                        color: "#ff4444",
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
                    style={inputStyle}
                    value={localNetId}
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
                      style={inputStyle}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-label="Password"
                    />
                    <div
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.4,
                        cursor: "pointer",
                      }}
                      role="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </div>
                  </div>

                  {/* Captcha */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div
                      style={{
                        flex: 1,
                        height: "54px",
                        background: "#fff",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
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
                          color="#000"
                          className="animate-spin"
                        />
                      )}
                    </div>
                    <button
                      onClick={fetchCaptcha}
                      aria-label="Refresh captcha"
                      style={{
                        width: "54px",
                        height: "54px",
                        background: "#111",
                        border: "1px solid #222",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>

                  {/* Captcha Input */}
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    style={{
                      ...inputStyle,
                      fontSize: "18px",
                      fontWeight: 900,
                      textAlign: "center",
                      letterSpacing: "0.3em",
                    }}
                    value={captchaAnswer}
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

                  {/* Submit */}
                  <button
                    onClick={handleSync}
                    disabled={loading}
                    style={{
                      width: "100%",
                      background: loading ? "#333" : "#00ff88",
                      color: "#000",
                      border: "none",
                      padding: "16px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: "8px",
                      transition: "background 0.2s",
                    }}
                  >
                    {loading ? "Linking..." : "Establish Hub Link"}
                  </button>
                </div>
              </div>
            ) : step === "syncing" ? (
              <div style={{ padding: "50px", textAlign: "center" }}>
                <RefreshCw
                  size={48}
                  color="#00ff88"
                  className="animate-spin"
                  style={{ marginBottom: "16px", display: "inline-block" }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Syncing Data...
                </h4>
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Pulling your academic records
                </p>
              </div>
            ) : (
              <div style={{ padding: "50px", textAlign: "center" }}>
                <ShieldCheck
                  size={48}
                  color="#00ff88"
                  style={{ marginBottom: "16px" }}
                />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 900,
                  }}
                >
                  Authorized
                </h4>
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Student Portal linked successfully
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
