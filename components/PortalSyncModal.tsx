"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "@/lib/api";
import { X, ShieldCheck, RefreshCw, Lock, Cpu } from "lucide-react";

interface PortalSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  netId: string;
}

export default function PortalSyncModal({ isOpen, onClose, onSuccess, netId }: PortalSyncModalProps) {
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaData, setCaptchaData] = useState<{ captcha: string; captchaToken: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");

  useEffect(() => {
    if (isOpen) {
      fetchCaptcha();
      setStep("form");
      setError("");
      setPassword("");
      setCaptchaAnswer("");
    }
  }, [isOpen]);

  const fetchCaptcha = async () => {
    setCaptchaData(null);
    try {
      const data = await authAPI.initAuth("student-portal");
      setCaptchaData(data);
    } catch (e) {
      setError("SYNC ERROR");
    }
  };

  const handleSync = async () => {
    if (!password || !captchaAnswer) return setError("DATA REQUIRED");
    setLoading(true);
    setError("");

    try {
      await authAPI.login(netId, password, "student-portal", {
        captcha: captchaAnswer,
        captchaToken: captchaData?.captchaToken
      });
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (e: any) {
      setError(e.response?.data?.error || "ACCESS DENIED");
      setCaptchaAnswer("");
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle: any = {
    position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)'
  };

  const cardStyle: any = {
    width: '380px', backgroundColor: '#000', borderRadius: '24px', border: '1px solid #333',
    boxShadow: '0 0 50px rgba(0,0,0,1)', overflow: 'hidden', color: '#fff'
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
          >
            {step === "form" ? (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Cpu size={20} color="#3b82f6" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, textTransform: 'uppercase' }}>Secure Link</h3>
                  </div>
                  <X size={20} style={{ cursor: 'pointer', opacity: 0.3 }} onClick={onClose} />
                </div>

                {error && (
                  <div style={{ padding: '10px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#ff4444' }}>{error}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      placeholder="Student Portal Password"
                      style={{ width: '100%', background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '13px', outline: 'none' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={14} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.2 }} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1, height: '54px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {captchaData?.captcha ? (
                        <div style={{ width: '100%', height: '100%', backgroundImage: `url(${captchaData.captcha})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                      ) : (
                        <RefreshCw size={18} color="#000" className="animate-spin" />
                      )}
                    </div>
                    <button onClick={fetchCaptcha} style={{ width: '54px', height: '54px', background: '#111', border: '1px solid #222', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                      <RefreshCw size={20} />
                    </button>
                  </div>

                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      style={{ width: '100%', background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '18px', fontWeight: 900, textAlign: 'center', letterSpacing: '0.3em', outline: 'none' }}
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                    maxLength={6}
                  />

                  <button
                    onClick={handleSync}
                    disabled={loading}
                    style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', marginTop: '8px' }}
                  >
                    {loading ? "Linking..." : "Establish Hub Link"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '50px', textAlign: 'center' }}>
                <ShieldCheck size={48} color="#22c55e" style={{ marginBottom: '16px' }} />
                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Authorized</h4>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
