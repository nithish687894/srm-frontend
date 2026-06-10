"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";
import { paymentAPI } from "@/lib/api";
import { Sparkles, Zap, Bell, Shield, Loader2, ArrowRight, CheckCircle2, Award, Check, Shuffle, Headphones, Users, Tv } from "lucide-react";
import Toast from "@/components/Toast";
import confetti from "canvas-confetti";

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

export default function PremiumPage() {
  const { theme } = useThemeStore();
  const { email, isPremium, premiumExpiresAt, setPremium } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [buddyEmail, setBuddyEmail] = useState("");
  const [toast, setToast] = useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);
  const plansRef = useRef<HTMLDivElement>(null);

  const showToast = (title: string, body: string, type: "success" | "error" | "info" = "success") => {
    setToast({ title, body, type });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isLight = theme === "light";

  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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

  const plans = [
    {
      id: "30_day_pass",
      name: "Standard",
      price: "₹10",
      duration: "30 days",
      color: "#bf5af2", // Purple
      bullets: [
        "1 Standard active session",
        "Predictive Class Skipper unlocked",
        "Target GPA Estimator unlocked",
        "Real-time Push Alerts active",
        "High sync priority speed",
        "Cancel anytime",
        "One-time payment",
      ],
      btnLabel: "Get Premium Standard",
    },
    {
      id: "semester_pass",
      name: "Platinum",
      price: "₹40",
      duration: "semester",
      color: "#f1d82f", // Gold
      bullets: [
        "1 Semester active session",
        "Predictive Class Skipper unlocked",
        "Target GPA Estimator unlocked",
        "Real-time Push Alerts active",
        "Priority sync speed & support",
        "Stackable duration (+180 days)",
        "One-time payment",
      ],
      btnLabel: "Get Premium Platinum",
    },
    {
      id: "buddy_pass",
      name: "Buddy Pass",
      price: "₹16",
      duration: "30 days",
      color: "#10b981", // Emerald Green
      bullets: [
        "Premium for you + 1 friend",
        "Friend can be existing or new user",
        "Predictive Class Skipper unlocked for both",
        "Target GPA Estimator unlocked for both",
        "Real-time Push Alerts active for both",
        "One-time payment (₹16 total)",
      ],
      btnLabel: "Get Premium Buddy",
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

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);

    try {
      if (planId === "buddy_pass") {
        if (!buddyEmail) {
          showToast("Error", "Please enter your friend's email address.", "error");
          setLoadingPlan(null);
          return;
        }
        const cleanEmail = buddyEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          showToast("Error", "Please enter a valid email address.", "error");
          setLoadingPlan(null);
          return;
        }
        if (cleanEmail === email?.toLowerCase().trim()) {
          showToast("Error", "You cannot enter your own email as your buddy email.", "error");
          setLoadingPlan(null);
          return;
        }
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Error", "Failed to load Razorpay checkout script. Check your internet connection.", "error");
        setLoadingPlan(null);
        return;
      }

      const res = await paymentAPI.createOrder(planId, planId === "buddy_pass" ? buddyEmail.trim().toLowerCase() : undefined);
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
          planId === "30_day_pass"
            ? "30-Day Premium Pass"
            : planId === "buddy_pass"
            ? "30-Day Buddy Pass (for 2 people)"
            : "Semester Premium Pass",
        order_id: orderId,
        prefill: {
          email: email || "",
        },
        theme: {
          color:
            planId === "30_day_pass"
              ? "#7B2CBF"
              : planId === "buddy_pass"
              ? "#10b981"
              : "#f1d82f",
        },
        handler: async function (response: RazorpayPaymentResponse) {
          setLoadingPlan(planId);
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
            } else {
              showToast("Verification Failed", "Payment verification did not pass. Please contact support.", "error");
            }
          } catch (err: unknown) {
            console.error("Verification error:", err);
            showToast("Payment Error", getCheckoutErrorMessage(err, "Signature verification failed."), "error");
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
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
      setLoadingPlan(null);
    }
  };

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Lumina / Aura Theme Palettes
  const bgMain = isLight 
    ? "radial-gradient(circle at 12% 0%, rgba(191,90,242,0.06), transparent 34%), var(--app-bg, #f7f5ff)"
    : "#050508";
  const cardBg = isLight 
    ? "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(243,238,255,0.90))"
    : "rgba(255, 255, 255, 0.01)";
  const cardBorder = isLight 
    ? "1px solid rgba(88,61,145,0.12)"
    : "1px solid rgba(192, 132, 252, 0.2)";
  const textTitle = isLight ? "#17111f" : "#ffffff";
  const textMuted = isLight ? "rgba(23,17,31,0.62)" : "rgba(255, 255, 255, 0.55)";
  const borderCol = isLight ? "rgba(88,61,145,0.12)" : "rgba(255, 255, 255, 0.08)";

  return (
    <div
      style={{
        background: bgMain,
        minHeight: "100dvh",
        width: "100%",
        paddingBottom: "calc(130px + env(safe-area-inset-bottom))", // Spacing for bottom nav
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: textTitle,
        overflowY: "auto",
        position: 'relative'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(140px);
          opacity: 0.12; z-index: 0; pointer-events: none;
          animation: orbit 25s infinite linear;
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translate(80px) rotate(0deg); }
          to { transform: rotate(360deg) translate(80px) rotate(-360deg); }
        }
        .premium-plan-card:hover {
          border-color: ${isLight ? "rgba(88,61,145,0.24)" : "rgba(192, 132, 252, 0.45)"} !important;
          transform: translateY(-4px);
        }
      `}} />

      {!isLight && (
        <>
          <div className="aura-blob" style={{ background: "#FF75C3", top: '-200px', left: '-100px' }} />
          <div className="aura-blob" style={{ background: "#8F92FF", bottom: '-200px', right: '-100px', animationDelay: '-8s' }} />
        </>
      )}

      {/* 1. Header Hero Area */}
      <header
        style={{
          padding: "50px 24px 30px",
          textAlign: "left",
          maxWidth: "480px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative",
          zIndex: 1,
          background: "transparent",
        }}
      >
        {/* Slanted Card Collage */}
        <div style={{
          position: "relative",
          height: "190px",
          overflow: "hidden",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <div style={{
            position: "relative",
            width: "320px",
            height: "160px",
            transform: "rotate(-12deg) translateY(-10px)",
            display: "flex",
            gap: "10px",
            justifyContent: "center"
          }}>
            {/* Card 1: SKIPPERS (purple) */}
            <div style={{
              width: "80px",
              height: "115px",
              background: "linear-gradient(135deg, #bf5af2 0%, #581c87 100%)",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transform: "translateY(20px)",
              flexShrink: 0
            }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>SKIPPER</span>
              <div style={{ alignSelf: "flex-end" }}>
                <Zap size={14} color="#fff" />
              </div>
            </div>

            {/* Card 2: GPA FORECAST (gold/yellow) */}
            <div style={{
              width: "80px",
              height: "115px",
              background: "linear-gradient(135deg, #f1d82f 0%, #854d0e 100%)",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transform: "translateY(0px)",
              flexShrink: 0
            }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>GPA 10</span>
              <div style={{ alignSelf: "flex-end" }}>
                <Sparkles size={14} color="#fff" />
              </div>
            </div>

            {/* Card 3: PUSH ALERTS (red/rose) */}
            <div style={{
              width: "80px",
              height: "115px",
              background: "linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transform: "translateY(12px)",
              flexShrink: 0
            }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>ALERTS</span>
              <div style={{ alignSelf: "flex-end" }}>
                <Bell size={14} color="#fff" />
              </div>
            </div>

            {/* Card 4: SYNC (emerald green) */}
            <div style={{
              width: "80px",
              height: "115px",
              background: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transform: "translateY(-6px)",
              flexShrink: 0
            }}>
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>SYNC</span>
              <div style={{ alignSelf: "flex-end" }}>
                <Award size={14} color="#fff" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={18} color="#bf5af2" className="floating" />
          <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.12em", textTransform: 'uppercase', color: "#bf5af2" }}>Nexus Premium</span>
        </div>

        <h1
          style={{
            fontSize: "32px",
            fontWeight: 950,
            lineHeight: "1.12",
            letterSpacing: "-0.04em",
            margin: "4px 0 0",
            color: textTitle,
          }}
        >
          {isPremium
            ? "Your Premium Pass is fully active."
            : "Get more out of academics with Nexus Premium."}
        </h1>

        {!isPremium && (
          <>
            <button
              onClick={scrollToPlans}
              style={{
                background: "linear-gradient(135deg, #BF5AF2, #FF2D55)",
                color: "#ffffff",
                border: "none",
                borderRadius: "99px",
                padding: "16px 32px",
                fontSize: "13px",
                fontWeight: 900,
                alignSelf: "flex-start",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(191,90,242,0.35)",
                marginTop: "10px",
                transition: "transform 0.15s ease",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Get Premium Pass
            </button>
            <p style={{ fontSize: "11px", color: textMuted, margin: 0, fontWeight: 700 }}>
              Terms apply. One-time payment pass.
            </p>
          </>
        )}
      </header>

      {/* Main container */}
      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: "32px", position: 'relative', zIndex: 1 }}>
        
        {/* 2. Active status header for Premium users */}
        {isPremium && (
          <div
            style={{
              background: cardBg,
              backdropFilter: isLight ? "none" : "blur(40px)",
              WebkitBackdropFilter: isLight ? "none" : "blur(40px)",
              border: cardBorder,
              borderRadius: "28px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "20px",
              boxShadow: isLight
                ? "0 18px 38px rgba(88,61,145,0.08), inset 0 1px 0 rgba(255,255,255,0.85)"
                : "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#bf5af2" }}>
              <CheckCircle2 size={18} />
              <span style={{ fontWeight: 900, fontSize: "14px", letterSpacing: '-0.01em' }}>Status: Active Premium Member</span>
            </div>
            <p style={{ fontSize: "13px", color: textMuted, margin: 0, lineHeight: 1.5, fontWeight: 650 }}>
              Thank you for supporting SRM Nexus! All features including the Skippable Class Simulator, Target GPA Forecasts, and Push Alerts are active on your account.
            </p>
            {premiumExpiresAt && (
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#bf5af2", marginTop: "4px" }}>
                Valid until: {new Date(premiumExpiresAt).toLocaleDateString(undefined, { dateStyle: "long" })}
              </span>
            )}
          </div>
        )}

        {/* 3. Why Join Card */}
        <section
          style={{
            background: cardBg,
            backdropFilter: isLight ? "none" : "blur(40px)",
            WebkitBackdropFilter: isLight ? "none" : "blur(40px)",
            border: cardBorder,
            borderRadius: "28px",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxShadow: isLight
              ? "0 18px 38px rgba(88,61,145,0.08), inset 0 1px 0 rgba(255,255,255,0.85)"
              : "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: 950, margin: 0, letterSpacing: "-0.02em", color: textTitle }}>
            Why join Nexus Premium?
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {benefits.map((b, idx) => (
              <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ color: "#bf5af2", marginTop: "2px", flexShrink: 0 }}>{b.icon}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: textTitle, letterSpacing: '-0.01em' }}>{b.title}</span>
                  <span style={{ fontSize: "12px", color: textMuted, lineHeight: "1.45", fontWeight: 650 }}>{b.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Available Plans Section */}
        <section ref={plansRef} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 950, margin: "10px 0 0", letterSpacing: "-0.03em", color: textTitle }}>
            Available plans
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {plans.map((p) => {
              const isPurchasing = loadingPlan === p.id;
              return (
                <div
                  key={p.id}
                  className="premium-plan-card"
                  style={{
                    background: cardBg,
                    backdropFilter: isLight ? "none" : "blur(40px)",
                    WebkitBackdropFilter: isLight ? "none" : "blur(40px)",
                    border: cardBorder,
                    borderRadius: "28px",
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    position: "relative",
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isLight
                      ? "0 18px 38px rgba(88,61,145,0.08), inset 0 1px 0 rgba(255,255,255,0.85)"
                      : "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Plan Card Header */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={14} style={{ color: p.color }} className="floating" />
                      <span style={{ fontSize: "11px", fontWeight: 900, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nexus Premium</span>
                    </div>
                    
                    <h3 style={{ fontSize: "24px", fontWeight: 950, color: p.color, margin: "6px 0 0", letterSpacing: '-0.03em' }}>
                      {p.name}
                    </h3>
                    
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
                      <span style={{ fontSize: "28px", fontWeight: 950, color: textTitle }} className="tabular-nums">{p.price}</span>
                      <span style={{ fontSize: "12px", color: textMuted, fontWeight: 700 }}>/ {p.duration}</span>
                    </div>
                  </div>

                  <div style={{ height: "1px", background: borderCol, width: "100%" }} />

                  {/* Bullet Points */}
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "20px",
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      color: textTitle,
                    }}
                  >
                    {p.bullets.map((b, idx) => (
                      <li key={idx} style={{ fontSize: "13px", lineHeight: "1.4", fontWeight: 650 }}>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {p.id === "buddy_pass" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "10px 0 5px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 800, color: textMuted }}>Buddy&apos;s Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. friend@srmist.edu.in"
                        value={buddyEmail}
                        onChange={(e) => setBuddyEmail(e.target.value)}
                        disabled={isPremium || loadingPlan !== null}
                        style={{
                          background: isLight ? "rgba(88,61,145,0.06)" : "rgba(0,0,0,0.3)",
                          border: cardBorder,
                          borderRadius: "12px",
                          padding: "12px 14px",
                          fontSize: "13px",
                          color: textTitle,
                          outline: "none",
                          width: "100%",
                          fontWeight: 800
                        }}
                      />
                      <span style={{ fontSize: "11px", color: textMuted, lineHeight: 1.4, fontWeight: 650 }}>
                        Enter your friend&apos;s email. If they don&apos;t have an account yet, Premium will activate when they sign up with this email.
                      </span>
                    </div>
                  )}

                  {/* Primary & Secondary Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                    {isPremium ? (
                      <div
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "99px",
                          background: isLight ? "rgba(88,61,145,0.06)" : "rgba(255,255,255,0.03)",
                          color: textMuted,
                          border: `1px solid ${borderCol}`,
                          fontSize: "13px",
                          fontWeight: 800,
                          textAlign: "center",
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Plan Active
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCheckout(p.id)}
                          disabled={loadingPlan !== null}
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "99px",
                            background: p.color,
                            color: "#000000",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: 900,
                            cursor: loadingPlan !== null ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: `0 4px 12px ${p.color}25`,
                            transition: "all 0.2s ease",
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          {isPurchasing ? (
                            <>
                              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                              Contacting Gateway...
                            </>
                          ) : (
                            p.btnLabel
                          )}
                        </button>

                        <button
                          onClick={() => handleCheckout(p.id)}
                          disabled={loadingPlan !== null}
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "99px",
                            background: "transparent",
                            color: textTitle,
                            border: isLight ? "1px solid #17111f" : "1px solid rgba(255,255,255,0.25)",
                            fontSize: "13px",
                            fontWeight: 900,
                            cursor: loadingPlan !== null ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight ? "rgba(23,17,31,0.03)" : "rgba(255,255,255,0.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          One-time payment
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {toast && (
        <Toast
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
