"use client";
import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Eye, EyeOff, MonitorPlay, Shield, Zap, Bell, TrendingUp, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "success">("idle");
  const [error, setError] = useState("");
  const [loginStep, setLoginStep] = useState<"hero" | "academia">("hero");
  
  const [connector] = useState<"academia" | "student-portal">("academia");
  const [captchaData, setCaptchaData] = useState<{ captcha: string; captchaToken: string } | null>(null);
  const [captchaAnswer] = useState("");
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const router = useRouter();

  // Teaser page states
  const [showTeaser, setShowTeaser] = useState(true);
  const [logoClicks, setLogoClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [emailInput, setEmailInput] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

  // Enforce granular Zustand selectors to eliminate unnecessary render thrashing
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const authToken = useAuthStore((state) => state.authToken);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const hasChosenTheme = useAuthStore((state) => state.hasChosenTheme);

  const routeAfterAuth = useCallback(() => {
    const target = "/dashboard";
    router.replace(target);

    window.setTimeout(() => {
      if (window.location.pathname === "/") {
        window.location.assign(target);
      }
    }, 1800);
  }, [router]);

  const fetchCaptcha = useCallback(async () => {
    try {
      const data = await authAPI.initAuth("student-portal");
      setCaptchaData(data);
    } catch {
      setError("FAILED TO LOAD CAPTCHA");
    }
  }, []);

  // Admin bypass checks (URL param & SessionStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isBypassed = params.get("bypass") === "true" || sessionStorage.getItem("adminBypass") === "true";
      if (isBypassed) {
        setShowTeaser(false);
      }
    }
  }, []);

  // Keyboard shortcut bypass listener (Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setShowTeaser(false);
        sessionStorage.setItem("adminBypass", "true");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check waitlist subscription state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexusWaitlistSubscribed");
      if (stored === "true") {
        setWaitlistSuccess(true);
      }
    }
  }, []);

  // Countdown ticker to 20 July 2026
  useEffect(() => {
    const targetDate = new Date("2026-07-20T00:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
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

  // Admin bypass logo handler
  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowTeaser(false);
        sessionStorage.setItem("adminBypass", "true");
        return 0;
      }
      return next;
    });
  };

  // Waitlist submission handler
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError("");
    
    if (!emailInput || !emailInput.includes("@")) {
      setWaitlistError("PLEASE ENTER A VALID EMAIL ADDRESS");
      return;
    }

    setWaitlistLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem("nexusWaitlistSubscribed", "true");
      setWaitlistSuccess(true);
    } catch {
      setWaitlistError("FAILED TO JOIN WAITLIST. PLEASE TRY AGAIN.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  async function handleLogin() {
    if (!email || !password) return setError("PROVIDE CREDENTIALS");
    setTimeout(() => {
      setLoading(true);
      setLoginPhase("auth");
    }, 0);
    setError("");
    const finalEmail = email.includes("@") ? email : `${email.trim()}@srmist.edu.in`;
    
    try {
      const extra = connector === "student-portal" ? {
        captcha: captchaAnswer,
        captchaToken: captchaData?.captchaToken
      } : {};

      const res = await authAPI.login(finalEmail, password, connector, extra);
      setAuthData(res.token, res.refreshToken, finalEmail);
      setLoginPhase("success");
      
      setTimeout(routeAfterAuth, 700);
    } catch (e: any) {
      setLoading(false);
      setLoginPhase("idle");
      let errMsg = e?.response?.data?.error || "LOGIN FAILED";
      if (!errMsg.toLowerCase().includes("try again")) {
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
      setAuthData(res.token, res.refreshToken, demoEmail);
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

  return (
    <>
      <style jsx global>{`
        .lp-root {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        .nebula-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: 
            radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
          filter: blur(120px);
          animation: nebulaDrift 35s ease-in-out infinite alternate;
        }

        @keyframes nebulaDrift {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.15) translate(40px, 40px); }
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-section {
          padding: 48px 20px 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          max-width: 1400px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        @media (min-width: 768px) {
          .hero-section {
            gap: 44px;
            padding: 40px 40px 56px;
          }
        }

        @media (min-width: 1024px) {
          .hero-section {
            min-height: 100svh;
            padding: 36px 56px 48px;
            gap: 56px;
          }
        }

        @media (min-width: 1280px) {
          .hero-section {
            padding-inline: 72px;
            gap: 72px;
          }
        }

        .hero-login {
          animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
          max-width: 440px;
          flex: 0 0 min(440px, 35vw);
        }

        .login-container {
          width: 100%;
          max-width: 460px;
          padding: 28px;
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.035)),
            radial-gradient(circle at 18% 12%, rgba(255, 117, 195, 0.18), transparent 34%),
            radial-gradient(circle at 82% 22%, rgba(0, 212, 255, 0.13), transparent 36%),
            rgba(8, 8, 16, 0.86);
          backdrop-filter: blur(34px);
          -webkit-backdrop-filter: blur(34px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.62), inset 0 1px 0 rgba(255,255,255,0.10);
          position: relative;
          z-index: 2;
          overflow: hidden;
        }

        .login-container::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          height: 1px;
        }

        .hero-content {
          width: 100%;
          min-width: 0;
        }

        @media (min-width: 1024px) {
          .login-container {
            max-width: 400px;
            padding: 30px;
            border-radius: 26px;
          }

          .hero-content {
            max-width: 560px !important;
          }

          .login-container h2 {
            font-size: 28px !important;
            margin-top: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 32px 24px;
            border-radius: 28px;
          }
        }

        .login-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-size: 14px;
          font-family: inherit;
          font-weight: 750;
          outline: none;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 14px;
          margin-bottom: 12px;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
          font-weight: 600;
        }

        .login-input:focus { 
          border-color: rgba(139, 92, 246, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
        }

        .login-btn {
          width: 100%;
          height: 52px;
          padding: 0 18px;
          background: linear-gradient(135deg, #7B2CBF 0%, #BF5AF2 52%, #FF75C3 100%);
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          cursor: pointer;
          border: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 34px rgba(191, 90, 242, 0.28);
        }

        .login-btn:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(255, 255, 255, 0.25);
        }

        .login-btn:active {
          transform: translateY(-2px);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 32px;
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
        }

        .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .feature-card:nth-child(2) { animation-delay: 0.2s; }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .video-showcase {
          width: 100%;
          margin-bottom: 40px;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
          background:
            radial-gradient(circle at 24% 20%, rgba(255, 117, 195, 0.16), transparent 32%),
            radial-gradient(circle at 78% 82%, rgba(0, 255, 136, 0.12), transparent 34%),
            rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.46), 0 0 48px rgba(139, 92, 246, 0.08);
          isolation: isolate;
        }

        .video-showcase::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 18%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 34%);
          opacity: 0.42;
        }

        .video-showcase::after {
          content: "";
          position: absolute;
          inset: auto 18px 18px 18px;
          height: 1px;
          z-index: 2;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
        }

        .video-showcase video {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          opacity: 0.92;
          filter: saturate(1.12) contrast(1.05);
        }

        .video-badge {
          position: absolute;
          left: 18px;
          top: 18px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(3, 3, 8, 0.62);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          color: rgba(255, 255, 255, 0.78);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .video-status {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #00ff88;
          box-shadow: 0 0 18px rgba(0, 255, 136, 0.84);
          animation: pulse 1.8s ease-in-out infinite;
        }

        .video-caption {
          position: absolute;
          right: 18px;
          bottom: 18px;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(3, 3, 8, 0.56);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          font-weight: 800;
        }

        @media (max-width: 640px) {
          .video-showcase {
            margin-bottom: 32px;
            border-radius: 22px;
          }

          .video-badge {
            left: 12px;
            top: 12px;
            font-size: 9px;
            padding: 8px 10px;
          }

          .video-caption {
            left: 12px;
            right: 12px;
            bottom: 12px;
            justify-content: center;
          }

          .hero-title {
            font-size: 36px !important;
            letter-spacing: -0.035em !important;
          }

          .feature-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        @media (min-width: 1024px) {
          .hero-title {
            font-size: clamp(52px, 5.7vw, 76px) !important;
            margin-bottom: 24px !important;
          }

          .hero-content p {
            margin-bottom: 28px !important;
          }

          .video-showcase {
            margin-bottom: 24px;
            border-radius: 22px;
          }

          .feature-card {
            padding: 22px;
            border-radius: 20px;
          }

          .feature-grid {
            gap: 16px;
          }
        }

        .compare-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 16px;
        }

        .compare-table tr {
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .compare-table tr:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(8px);
        }

        .compare-table td {
          padding: 28px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-weight: 600;
        }

        .compare-table td:first-child {
          border-radius: 16px 0 0 16px;
          border-right: none;
          background: rgba(139, 92, 246, 0.05);
        }

        .compare-table td:last-child {
          border-radius: 0 16px 16px 0;
          border-left: none;
        }

        @media (max-width: 768px) {
          .compare-table { border-spacing: 0 12px; }
          .compare-table td { padding: 20px; font-size: 14px; }
        }

        @media (max-width: 640px) {
          .compare-table,
          .compare-table tbody,
          .compare-table tr,
          .compare-table td {
            display: block;
            width: 100%;
          }

          .compare-table tr {
            border-radius: 18px;
            overflow: hidden;
          }

          .compare-table td {
            border-radius: 0 !important;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-bottom: 0;
          }

          .compare-table td:last-child {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
        }

        /* Teaser Landing CSS classes */
        .teaser-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          width: 100%;
          max-width: 1100px;
          margin-top: 48px;
        }

        .teaser-feature-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 24px;
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .teaser-feature-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.15), transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .teaser-feature-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.08);
        }

        .teaser-feature-card:hover::before {
          opacity: 1;
        }

        .countdown-segment {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px 12px;
          flex: 1;
          min-width: 60px;
          max-width: 120px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .countdown-segment:hover {
          border-color: rgba(255, 117, 195, 0.3);
          box-shadow: 0 15px 35px rgba(255, 117, 195, 0.1);
          transform: translateY(-4px);
        }

        .countdown-number {
          font-size: 42px;
          font-weight: 950;
          background: linear-gradient(135deg, #ffffff 0%, #CD93FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 6px;
          font-variant-numeric: tabular-nums;
        }

        .countdown-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
        }

        .teaser-logo-container {
          cursor: pointer;
          user-select: none;
          transition: transform 0.3s ease;
        }
        
        .teaser-logo-container:active {
          transform: scale(0.95);
        }

        .waitlist-input {
          flex: 1;
          height: 52px;
          padding: 0 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-size: 14px;
          font-family: inherit;
          font-weight: 700;
          outline: none;
          transition: all 0.3s ease;
          border-radius: 16px;
        }

        .waitlist-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
          font-weight: 600;
        }

        .waitlist-input:focus {
          border-color: rgba(255, 117, 195, 0.5);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 30px rgba(255, 117, 195, 0.12);
        }

        .waitlist-btn {
          height: 52px;
          padding: 0 28px;
          background: linear-gradient(135deg, #7B2CBF 0%, #BF5AF2 50%, #FF75C3 100%);
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(191, 90, 242, 0.25);
        }

        .waitlist-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(255, 117, 195, 0.3);
        }

        .waitlist-btn:active {
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          .waitlist-row {
            flex-direction: column !important;
            gap: 12px;
          }
          .waitlist-input {
            width: 100%;
          }
          .waitlist-btn {
            width: 100%;
          }
        }

        .teaser-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
          box-sizing: border-box;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 36px;
          animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .teaser-logo {
          display: inline-block;
          padding: 16px;
          background: rgba(139, 92, 246, 0.08);
          border-radius: 24px;
          border: 1px solid rgba(139, 92, 246, 0.15);
          margin-bottom: 4px;
          transition: all 0.3s ease;
        }

        .teaser-desc {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.6;
          margin: 16px auto 0;
          font-weight: 500;
          max-width: 580px;
        }

        .countdown-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          width: 100%;
          max-width: 600px;
          flex-wrap: nowrap;
          box-sizing: border-box;
        }

        .teaser-title {
          font-size: clamp(30px, 7vw, 76px);
          font-weight: 950;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin: 0;
        }

        .teaser-preview-heading {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        @media (max-width: 768px) {
          .teaser-container {
            gap: 24px;
          }
          .teaser-logo {
            padding: 12px;
            border-radius: 18px;
          }
          .teaser-logo img {
            width: 60px !important;
            height: 60px !important;
          }
          .teaser-title {
            letter-spacing: -0.03em;
          }
          .teaser-desc {
            font-size: 14px;
            line-height: 1.5;
            padding: 0 8px;
          }
          .countdown-row {
            gap: 8px;
          }
          .countdown-segment {
            padding: 12px 6px;
            min-width: 70px;
            border-radius: 14px;
          }
          .countdown-number {
            font-size: 28px;
            margin-bottom: 2px;
          }
          .countdown-label {
            font-size: 8px;
            letter-spacing: 0.05em;
          }
          .teaser-preview-heading {
            font-size: 11px;
            margin-bottom: 18px;
            letter-spacing: 0.1em;
          }
          .teaser-grid {
            margin-top: 24px;
            gap: 12px;
          }
          .teaser-feature-card {
            padding: 18px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="lp-root">
        <div className="nebula-bg" />

        <div>
          {loading && (
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 10000,
                background: "rgba(0,0,0,0.98)", display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(25px)",
                animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div
                style={{ position: "relative", marginBottom: "72px" }}
              >
                {/* Aura Loading Core */}
                <div style={{
                  width: "120px", height: "120px", borderRadius: "32px",
                  background: loginPhase === "success" 
                    ? "linear-gradient(135deg, #00FF88, #00E6FF)" 
                    : "linear-gradient(135deg, #FF75C3, #CD93FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: loginPhase === "success" 
                    ? "0 0 80px rgba(0, 255, 136, 0.4)" 
                    : "0 0 80px rgba(255, 117, 195, 0.4)",
                  transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  animation: loginPhase === "success" ? "none" : "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                }}>
                  {loginPhase === "success" ? (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  )}
                </div>
                
                {loginPhase !== "success" && (
                  <div
                    style={{
                      position: "absolute", inset: "-24px",
                      border: "2.5px solid rgba(255,117,195,0.1)",
                      borderTopColor: "#FF75C3",
                      borderRadius: "44px",
                      animation: "spin 3s linear infinite"
                    }}
                  />
                )}
              </div>
              
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: "17px", fontWeight: 950, letterSpacing: "0.08em", color: "#fff", textTransform: "uppercase", marginBottom: "18px" }}
                >
                  {loginPhase === "success" ? "AUTHENTICATION GRANTED" : "INITIALIZING SECURE LINK"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase" }}>
                  {loginPhase === "success" ? "ESTABLISHING SECURE CONNECTION..." : "VERIFYING CREDENTIALS / RETRIEVING SESSION..."}
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="hero-section">
          {showTeaser ? (
            <div className="teaser-container">
              {/* Logo / Bypass Trigger */}
              <div 
                className="teaser-logo-container teaser-logo" 
                onClick={handleLogoClick}
              >
                <img src="/nexus-logo.png" alt="Logo" style={{ width: "72px", height: "72px", filter: "drop-shadow(0 0 25px rgba(255, 117, 195, 0.5))" }} />
              </div>

              {/* Title & Badge */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", color: "#CD93FF", fontSize: "11px", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px" }}>
                  <Lock size={12} style={{ color: "#FF75C3" }} /> Launching July 20, 2026
                </div>
                <h1 className="teaser-title">
                  SRM Nexus is <span style={{ background: "linear-gradient(135deg, #BF5AF2 0%, #FF75C3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Coming Soon</span>
                </h1>
                <p className="teaser-desc">
                  Get ready for the ultimate academic companion. Predictive class forecasting, real-time alerts, and advanced GPA estimation, built specifically for SRM students.
                </p>
              </div>

              {/* Ticking Countdown Ticker */}
              <div className="countdown-row">
                {[
                  { label: "Days", val: timeLeft.days },
                  { label: "Hours", val: timeLeft.hours },
                  { label: "Minutes", val: timeLeft.minutes },
                  { label: "Seconds", val: timeLeft.seconds }
                ].map((item, idx) => (
                  <div key={idx} className="countdown-segment">
                    <div className="countdown-number">{String(item.val).padStart(2, "0")}</div>
                    <div className="countdown-label">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Waitlist Sign Up Form */}
              <div style={{ width: "100%", maxWidth: "500px" }}>
                {waitlistSuccess ? (
                  <div 
                    style={{ 
                      background: "rgba(48, 209, 88, 0.08)",
                      border: "1px solid rgba(48, 209, 88, 0.25)",
                      color: "#30D158",
                      borderRadius: "20px",
                      padding: "20px 24px",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontWeight: 950, fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      You're on the list!
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>
                      We'll notify you the moment we launch on July 20, 2026.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ display: "flex", gap: "10px", width: "100%", flexDirection: "row" }} className="waitlist-row">
                      <input 
                        type="email"
                        placeholder="ENTER YOUR SRM EMAIL"
                        className="waitlist-input"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        disabled={waitlistLoading}
                      />
                      <button 
                        type="submit" 
                        className="waitlist-btn"
                        disabled={waitlistLoading}
                      >
                        {waitlistLoading ? "Joining..." : "Get Notified"}
                      </button>
                    </div>
                    {waitlistError && (
                      <div style={{ color: "#ff7b7b", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", marginTop: "4px" }}>
                        {waitlistError}
                      </div>
                    )}
                  </form>
                )}
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.04em", marginTop: "12px" }}>
                  Join the exclusive waitlist today for day-one premium benefits.
                </div>
              </div>

              {/* 5 Premium Features Grid */}
              <div style={{ width: "100%" }}>
                <h3 className="teaser-preview-heading">
                  Exclusive Features Preview
                </h3>
                <div className="teaser-grid">
                  {[
                    {
                      title: "Ad-free Academic Tracking",
                      desc: "Clean, dark dashboard showcasing your marks and attendance without interruptions or ads.",
                      icon: <Shield size={24} style={{ color: "#bf5af2" }} />,
                      glow: "rgba(191, 90, 242, 0.15)"
                    },
                    {
                      title: "Predictive Class Skipper",
                      desc: "Plan your absences without dropping below 75%. Simulates skip risks and bunk buffers.",
                      icon: <MonitorPlay size={24} style={{ color: "#ff75c3" }} />,
                      glow: "rgba(255, 117, 195, 0.15)"
                    },
                    {
                      title: "Priority Database Sync",
                      desc: "High-speed synchronizations update marks and timetable data instantly with zero queues.",
                      icon: <Zap size={24} style={{ color: "#00d4ff" }} />,
                      glow: "rgba(0, 212, 255, 0.15)"
                    },
                    {
                      title: "Target GPA Estimator",
                      desc: "Simulate and forecast exactly what marks are required in internal exams to hit your target grade.",
                      icon: <TrendingUp size={24} style={{ color: "#30d158" }} />,
                      glow: "rgba(48, 209, 88, 0.15)"
                    },
                    {
                      title: "Real-time Push Alerts",
                      desc: "Get instant desktop/browser notifications when new marks or attendance entries are recorded.",
                      icon: <Bell size={24} style={{ color: "#ff9f0a" }} />,
                      glow: "rgba(255, 159, 10, 0.15)"
                    }
                  ].map((feat, idx) => (
                    <div key={idx} className="teaser-feature-card">
                      <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px", boxShadow: `0 0 20px ${feat.glow}` }}>
                        {feat.icon}
                      </div>
                      <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", margin: "0 0 8px 0" }}>{feat.title}</h4>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {loginStep === "hero" && (
                <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", animation: "slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                  <div style={{ display: "inline-block", padding: "16px", background: "rgba(139, 92, 246, 0.08)", borderRadius: "24px", border: "1px solid rgba(139, 92, 246, 0.15)", marginBottom: "4px" }}>
                    <img src="/nexus-logo.png" alt="Logo" style={{ width: "72px", height: "72px", filter: "drop-shadow(0 0 25px rgba(255, 117, 195, 0.5))" }} />
                  </div>
                  <h1 style={{ fontSize: "clamp(48px, 8vw, 84px)", fontWeight: 950, letterSpacing: "-0.05em", lineHeight: 1, margin: 0 }}>
                    SRM Nexus
                  </h1>
                  <h2 style={{ fontSize: "clamp(20px, 3.5vw, 26px)", fontWeight: 800, color: "#FF75C3", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>
                    Your SRM life, decoded.
                  </h2>
                  <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: "0 0 16px", fontWeight: 500, maxWidth: "580px" }}>
                    Connect your SRM portal to view attendance, marks, timetable, GPA, tomorrow skip risk, and marks needed for your target grade — all in one smart dashboard.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", width: "100%", maxWidth: "440px" }}>
                    <button
                      type="button"
                      onClick={() => setLoginStep("academia")}
                      style={{
                        width: "100%",
                        padding: "18px 28px",
                        background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
                        border: "none",
                        color: "#000000",
                        borderRadius: "16px",
                        fontSize: "13px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: "0 8px 24px rgba(255, 255, 255, 0.15)"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 16px 36px rgba(255, 255, 255, 0.25)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 255, 255, 0.15)";
                      }}
                    >
                      Connect My Portal
                    </button>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: "0.05em", marginTop: "4px" }}>
                      Read-only sync • Encrypted sessions • Disconnect anytime
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
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.10)",
                      color: "rgba(255, 255, 255, 0.72)",
                      padding: "9px 14px",
                      borderRadius: "999px",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer",
                      marginBottom: "16px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"; }}
                  >
                    ← Back
                  </button>
                  <div className="login-container">
                    <div style={{ marginBottom: "22px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", marginBottom: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                          <div style={{ width: "54px", height: "54px", borderRadius: "18px", background: "linear-gradient(135deg, rgba(191,90,242,0.24), rgba(0,212,255,0.14))", border: "1px solid rgba(255,255,255,0.14)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <img src="/nexus-logo.png" alt="SRM Nexus" style={{ width: "38px", height: "38px", filter: "drop-shadow(0 0 20px rgba(255, 117, 195, 0.55))" }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.52)", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>SRM Nexus</div>
                            <h2 style={{ fontSize: "26px", fontWeight: 950, letterSpacing: "-0.03em", margin: "3px 0 0", lineHeight: 1.05 }}>Student Access</h2>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(48,209,88,0.28)", background: "rgba(48,209,88,0.10)", color: "#30D158", borderRadius: "999px", padding: "7px 9px", fontSize: "11px", fontWeight: 900 }}>
                          <Shield size={13} />
                          Secure
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                        {[
                          ["Attendance", "#BF5AF2"],
                          ["Marks", "#00D4FF"],
                          ["Exam", "#30D158"],
                        ].map(([label, color]) => (
                          <div key={label} style={{ border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.045)", borderRadius: "12px", padding: "9px 8px" }}>
                            <div style={{ width: "7px", height: "7px", borderRadius: "9999px", background: color, marginBottom: "7px", boxShadow: `0 0 12px ${color}` }} />
                            <div style={{ color: "rgba(255,255,255,0.70)", fontSize: "11px", fontWeight: 850 }}>{label}</div>
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
                            fontSize: "13px",
                            textAlign: "center",
                            marginBottom: "24px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            padding: "12px 16px",
                            borderRadius: "12px"
                          }}
                        >
                          {error}
                        </div>
                      )}

                      <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.62)", fontWeight: 700, textAlign: "left", marginBottom: "10px", paddingLeft: "2px" }}>
                        Use your Academia NETID. SRM Nexus opens the dashboard after sync.
                      </div>

                      <input
                        type="text" placeholder="NETID"
                        className="login-input"
                        value={email} onChange={e => setEmail(e.target.value)}
                        disabled={loading} maxLength={6}
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
                          style={{ position: 'absolute', right: '14px', top: '13px', width: "28px", height: "28px", borderRadius: "8px", background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', display: "grid", placeItems: "center" }}
                          data-testid="toggle-password-btn"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: "space-between", gap: '12px', marginBottom: '18px', padding: '0 2px' }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input 
                          type="checkbox" 
                          id="remember" 
                          style={{ 
                            accentColor: '#ffffff', 
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
                            color: "rgba(255, 255, 255, 0.55)", 
                            fontWeight: 500,
                            cursor: "pointer"
                          }}
                        >
                          Remember session
                        </label>
                        </div>
                        <a href="/trust" style={{ color: "rgba(255,117,195,0.86)", fontSize: "12px", fontWeight: 850, textDecoration: "none" }}>Trust</a>
                      </div>

                      <button type="submit" className="login-btn" disabled={loading} data-testid="submit-login-btn">
                        {loading ? "Connecting..." : "Connect Academia"}
                      </button>
                      
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "rgba(255,255,255,0.48)", fontWeight: 700, lineHeight: 1.4, textAlign: "center", marginTop: "14px", padding: "0 8px" }}>
                        <Zap size={13} color="#00D4FF" />
                        Read-only sync. No official portal data is changed.
                      </div>
                    </form>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "rgba(255,255,255,0.86)", fontWeight: 800, textAlign: "left", marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#00E5FF" }}>✓</span>
                        <span>Read-only academic sync</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#00E5FF" }}>✓</span>
                        <span>We don’t change official portal data</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#00E5FF" }}>✓</span>
                        <span>Disconnect anytime</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#00E5FF" }}>✓</span>
                        <span>Delete your data anytime</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
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
    </>
  );
}
