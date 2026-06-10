"use client";

import { useState } from "react";
import { X, Sparkles, Zap, Bell, Shield, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Shuffle, Headphones, Users, Tv } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import { paymentAPI } from "@/lib/api";
import confetti from "canvas-confetti";

type PremiumPlanId = "30_day_pass" | "semester_pass" | "buddy_pass";

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { email: string };
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
}

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => { open: () => void };

type APIErrorLike = {
  response?: { data?: { error?: string; message?: string } };
  message?: string;
};

function getCheckoutErrorMessage(err: unknown, fallback: string) {
  const error = err as APIErrorLike;
  return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
}

interface PremiumCheckoutProps {
  onClose: () => void;
  showToast: (title: string, body: string, type?: "success" | "error" | "info") => void;
}

export default function PremiumCheckout({ onClose, showToast }: PremiumCheckoutProps) {
  const { theme } = useThemeStore();
  const { email, isPremium, premiumExpiresAt, setPremium } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanId>("semester_pass");
  const [buddyEmail, setBuddyEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const isLight = theme === "light";

  const plans: Array<{
    id: PremiumPlanId;
    name: string;
    price: string;
    description: string;
    badge: string;
  }> = [
    {
      id: "30_day_pass",
      name: "30-Day Premium Pass",
      price: "₹10",
      description: "Perfect for temporary tracking & test prep",
      badge: "Flexible",
    },
    {
      id: "semester_pass",
      name: "Semester Premium Pass",
      price: "₹40",
      description: "Complete academic year tracking & support",
      badge: "Best Value",
    },
    {
      id: "buddy_pass",
      name: "Buddy Premium Pass",
      price: "₹16",
      description: "Premium for you + 1 friend (existing or new user)",
      badge: "Buddy Deal",
    },
  ];

  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M11.66 6.1L8.3 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4.3l3.36 2.9a.5.5 0 0 0 .84-.37V6.47a.5.5 0 0 0-.84-.37z" />
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
      ),
      title: "Ad-free academic tracking",
      desc: "No ads or sync interruption windows. Clean, focused dashboard.",
    },
    {
      icon: <Shuffle size={20} style={{ flexShrink: 0 }} />,
      title: "Predictive Class Skipper",
      desc: "Instantly simulate how many classes you can skip while staying above attendance thresholds.",
    },
    {
      icon: <Headphones size={20} style={{ flexShrink: 0 }} />,
      title: "Priority Database Sync",
      desc: "Instantly fetch your latest internal marks and timetable with priority sync speed.",
    },
    {
      icon: <Users size={20} style={{ flexShrink: 0 }} />,
      title: "Target GPA Estimator",
      desc: "Calculate internals and end-sem grades needed to reach your dream CGPA.",
    },
    {
      icon: <Tv size={20} style={{ flexShrink: 0 }} />,
      title: "Real-time Push Alerts",
      desc: "Immediate browser notifications for mark updates, class changes, and attendance drops.",
    },
  ];

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      const win = window as Window & { Razorpay?: RazorpayConstructor };
      if (win.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      if (selectedPlan === "buddy_pass") {
        if (!buddyEmail) {
          showToast("Error", "Please enter your friend's email address.", "error");
          setLoading(false);
          return;
        }
        const cleanEmail = buddyEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          showToast("Error", "Please enter a valid email address.", "error");
          setLoading(false);
          return;
        }
        if (cleanEmail === email?.toLowerCase().trim()) {
          showToast("Error", "You cannot enter your own email as your buddy email.", "error");
          setLoading(false);
          return;
        }
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Error", "Failed to load Razorpay checkout script. Check your internet connection.", "error");
        setLoading(false);
        return;
      }

      const res = await paymentAPI.createOrder(selectedPlan, selectedPlan === "buddy_pass" ? buddyEmail.trim().toLowerCase() : undefined);
      if (!res.success) {
        throw new Error(res.message || "Failed to initialize payment.");
      }

      const { orderId, amount, currency, keyId } = res;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "SRM Nexus Premium",
        description:
          selectedPlan === "30_day_pass"
            ? "30-Day Premium Pass"
            : selectedPlan === "buddy_pass"
            ? "30-Day Buddy Pass (for 2 people)"
            : "Semester Premium Pass",
        order_id: orderId,
        prefill: {
          email: email || "",
        },
        theme: {
          color: selectedPlan === "30_day_pass" ? "#7B2CBF" : selectedPlan === "buddy_pass" ? "#10b981" : "#BF5AF2",
        },
        handler: async function (response: RazorpayPaymentResponse) {
          setLoading(true);
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setPremium(true, verifyRes.premiumExpiresAt);
              showToast("Premium Active! 🎉", "Welcome to Nexus Premium. All features are now unlocked.", "success");
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
              });
              onClose();
            } else {
              showToast("Verification Failed", "Payment verification did not pass. Please contact support.", "error");
            }
          } catch (err: unknown) {
            console.error("Verification error:", err);
            showToast("Payment Error", getCheckoutErrorMessage(err, "Signature verification failed."), "error");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            showToast("Payment Cancelled", "The payment checkout was cancelled.", "info");
          },
        },
      };

      const RazorpayCheckout = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout is not available.");
      }
      const razorpayObj = new RazorpayCheckout(options);
      razorpayObj.open();
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      showToast("Checkout Failed", getCheckoutErrorMessage(err, "Something went wrong."), "error");
      setLoading(false);
    }
  };

  const activeAccent = isLight ? "#7B2CBF" : "#BF5AF2";
  const bgMain = isLight ? "#FFFFFF" : "#0A090F";
  const borderCol = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const fontColor = isLight ? "#1F1F23" : "#F4F4F6";
  const mutedFont = isLight ? "#707075" : "#A1A1A8";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(3, 2, 7, 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 480px)",
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          background: bgMain,
          border: `1px solid ${borderCol}`,
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          position: "relative",
        }}
      >
        {/* Back navigation in step 2 */}
        {!isPremium && step === 2 && (
          <button
            onClick={() => setStep(1)}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
              border: "none",
              color: fontColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
            border: "none",
            color: fontColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>

        {/* ─── CASE A: USER IS PREMIUM (Show Active Pass Details) ─── */}
        {isPremium ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "10px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "99px",
                  background: "rgba(52, 199, 89, 0.12)",
                  color: "#34C759",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                <CheckCircle2 size={14} />
                NEXUS PREMIUM ACTIVE
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: fontColor, margin: 0, letterSpacing: "-0.02em" }}>
                You&apos;re a Supporter!
              </h2>
              <p style={{ color: mutedFont, fontSize: "14px", marginTop: "6px", margin: "6px 0 0" }}>
                All premium Academic Utilities are unlocked for your email.
              </p>
            </div>

            {/* Active Benefits list with verification */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {benefits.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: "16px",
                    background: isLight ? "#F8F7FF" : "rgba(255, 255, 255, 0.01)",
                    border: `1.5px solid ${isLight ? "rgba(52, 199, 89, 0.15)" : "rgba(52, 199, 89, 0.25)"}`,
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ color: activeAccent, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {b.icon}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: fontColor }}>{b.title}</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#34C759", textTransform: "uppercase" }}>
                    Unlocked
                  </span>
                </div>
              ))}
            </div>

            {/* Premium Expiration card */}
            <div
              style={{
                padding: "16px",
                borderRadius: "16px",
                background: isLight ? "rgba(123, 44, 191, 0.04)" : "rgba(191, 90, 242, 0.04)",
                border: `1px solid ${isLight ? "rgba(123,44,191,0.08)" : "rgba(191,90,242,0.08)"}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", color: mutedFont, textTransform: "uppercase", fontWeight: 800 }}>
                Pass Expiration Date
              </div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: activeAccent, marginTop: "6px" }}>
                {premiumExpiresAt
                  ? new Date(premiumExpiresAt).toLocaleDateString(undefined, { dateStyle: "long" })
                  : "Never Expires"}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                background: isLight ? "#1F1F23" : "#FFFFFF",
                color: isLight ? "#FFFFFF" : "#0A090F",
                border: "none",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* ─── CASE B: USER IS FREE (Show wizard flow) ─── */
          <>
            {/* STEP 1: DETAILS ONLY (What we get) */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ textAlign: "center", padding: "10px 0 0 0" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "99px",
                      background: isLight ? "rgba(123, 44, 191, 0.08)" : "rgba(191, 90, 242, 0.12)",
                      color: activeAccent,
                      fontSize: "12px",
                      fontWeight: 700,
                      marginBottom: "12px",
                    }}
                  >
                    <Sparkles size={14} />
                    SRM NEXUS PREMIUM
                  </div>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: fontColor, margin: 0, letterSpacing: "-0.02em" }}>
                    Why join Nexus Premium?
                  </h2>
                  <p style={{ color: mutedFont, fontSize: "14px", marginTop: "6px", margin: "6px 0 0" }}>
                    Unlock cutting-edge tools to secure your university goals.
                  </p>
                </div>

                {/* Benefits List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {benefits.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "14px",
                        padding: "14px",
                        borderRadius: "16px",
                        background: isLight ? "#F8F7FF" : "rgba(255, 255, 255, 0.015)",
                        border: `1px solid ${borderCol}`,
                      }}
                    >
                      <div style={{ marginTop: "2px", flexShrink: 0, color: activeAccent, display: 'flex', alignItems: 'center' }}>{b.icon}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: fontColor }}>{b.title}</span>
                        <span style={{ fontSize: "12px", color: mutedFont, lineHeight: "1.45" }}>{b.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Primary CTA (Opens Step 2 Plans screen) */}
                <button
                  onClick={() => setStep(2)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "16px",
                    background: activeAccent,
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: "15px",
                    fontWeight: 750,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: `0 8px 20px ${isLight ? "rgba(123, 44, 191, 0.25)" : "rgba(191, 90, 242, 0.25)"}`,
                    marginTop: "10px",
                  }}
                >
                  Get Premium Pass
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 2: PLANS & CHECKOUT SCREEN (Only shown after clicking button) */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ textAlign: "center", padding: "10px 0 0 0" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: fontColor, margin: 0, letterSpacing: "-0.02em" }}>
                    Select Your Pass
                  </h2>
                  <p style={{ color: mutedFont, fontSize: "13.5px", marginTop: "6px", margin: "6px 0 0" }}>
                    One-time manual UPI pass. No auto-debit subscriptions.
                  </p>
                </div>

                {/* Plans List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plans.map((p) => {
                    const isSelected = selectedPlan === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlan(p.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px",
                          borderRadius: "16px",
                          border: `2px solid ${isSelected ? activeAccent : borderCol}`,
                          background: isSelected
                            ? isLight
                              ? "rgba(123, 44, 191, 0.04)"
                              : "rgba(191, 90, 242, 0.04)"
                            : isLight
                            ? "#FFFFFF"
                            : "rgba(255, 255, 255, 0.01)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: `2px solid ${isSelected ? activeAccent : mutedFont}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {isSelected && (
                              <div
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  background: activeAccent,
                                }}
                              />
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: fontColor }}>{p.name}</span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: "99px",
                                  background: isSelected
                                    ? isLight
                                      ? "rgba(123, 44, 191, 0.1)"
                                      : "rgba(191, 90, 242, 0.2)"
                                    : isLight
                                    ? "rgba(0,0,0,0.05)"
                                    : "rgba(255,255,255,0.05)",
                                  color: isSelected ? activeAccent : mutedFont,
                                }}
                              >
                                {p.badge}
                              </span>
                            </div>
                            <span style={{ fontSize: "11px", color: mutedFont }}>{p.description}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: fontColor }}>{p.price}</div>
                      </div>
                    );
                  })}
                </div>

                {selectedPlan === "buddy_pass" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "5px 0" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: mutedFont }}>Buddy&apos;s Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. friend@srmist.edu.in"
                      value={buddyEmail}
                      onChange={(e) => setBuddyEmail(e.target.value)}
                      disabled={loading}
                      style={{
                        background: isLight ? "#f1f1f4" : "#1a1a1a",
                        border: `1.5px solid ${borderCol}`,
                        borderRadius: "10px",
                        padding: "12px 14px",
                        fontSize: "13px",
                        color: fontColor,
                        outline: "none",
                        width: "100%",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: mutedFont, lineHeight: 1.4 }}>
                      Enter your friend&apos;s email. If they don&apos;t have an account yet, Premium will activate when they sign up with this email.
                    </span>
                  </div>
                )}

                {/* Razorpay checkout button */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "16px",
                      background: activeAccent,
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: 750,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: `0 8px 20px ${isLight ? "rgba(123, 44, 191, 0.25)" : "rgba(191, 90, 242, 0.25)"}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      color: mutedFont,
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    <Shield size={12} style={{ color: "#34C759" }} />
                    <span>Secured by Razorpay. UPI / Cards / NetBanking.</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
