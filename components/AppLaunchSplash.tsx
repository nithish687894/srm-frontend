"use client";
import { useEffect, useState, useMemo } from "react";
import { APP_VERSION } from "@/lib/version";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [minVersion, setMinVersion] = useState("");
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  const statusLogs = [
    "BOOTING_NEURAL_CORE",
    "ESTABLISHING_VPN_TUNNEL",
    "DECRYPTING_ACADEMIC_KEYS",
    "SYNCING_REGISTRY_V2",
    "OPTIMIZING_QUANTUM_UI",
    "READY_FOR_LAUNCH"
  ];

  const hexCodes = ["0x00A4", "0x1F2B", "0x8C92", "0x7E3A", "0x90BF", "0x4E7C"];
  const prefixes = ["[ BOOT ]", "[ SECURE ]", "[ AUTH ]", "[ SYNC ]", "[ DATA ]", "[ READY ]"];
  const latencies = ["12ms", "45ms", "22ms", "88ms", "5ms", "0ms"];
  const results = ["OK", "SECURED", "PARSED", "SYNCHRONIZED", "COMPLETED", "ACTIVE"];

  useEffect(() => {
    setMounted(true);
    
    // Generate 15 premium background floating star elements
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1, // 1px to 4px
      delay: Math.random() * 5,
      duration: Math.random() * 8 + 6,
    }));
    setParticles(generated);

    // Safety recovery timer: ensures splash screen disappears after 6 seconds even if something fails
    const recoveryTimer = setTimeout(() => {
      setIsExiting(true);
      const destroyTimer = setTimeout(() => {
        setIsDestroyed(true);
      }, 600);
      return () => clearTimeout(destroyTimer);
    }, 6000);

    const checkVersionAndRun = async () => {
      let requiresUpdate = false;
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          setLatestVersion(data.version || "");
          setMinVersion(data.minVersion || "");
          if (data.minVersion && APP_VERSION < data.minVersion) {
            setNeedsUpdate(true);
            requiresUpdate = true;
          }
        }
      } catch (e) {
        console.warn("Version check skipped:", e);
      }

      if (requiresUpdate) {
        clearTimeout(recoveryTimer);
        return;
      }

      const hasSplashed = typeof window !== 'undefined' ? sessionStorage.getItem("srmx_splashed") : null;
      const duration = hasSplashed ? 400 : 2000;

      // Smooth step logs interval
      const logInterval = setInterval(() => {
        setLogIndex(prev => (prev < statusLogs.length - 1 ? prev + 1 : prev));
      }, duration / statusLogs.length);

      // Dismiss splash
      const timer = setTimeout(() => {
        setIsExiting(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem("srmx_splashed", "true");
        }
        
        const destroyTimer = setTimeout(() => {
          setIsDestroyed(true);
        }, 600); // Matches CSS transition duration
      }, duration + 200);

      return () => {
        clearInterval(logInterval);
        clearTimeout(timer);
      };
    };

    checkVersionAndRun();

    return () => {
      clearTimeout(recoveryTimer);
    };
  }, []);

  // Compute the rolling active terminal logs list
  const rollingLogs = useMemo(() => {
    const list = [];
    const startIdx = Math.max(0, logIndex - 2);
    for (let i = startIdx; i <= logIndex; i++) {
      list.push({
        index: i,
        hex: hexCodes[i] || "0x0000",
        prefix: prefixes[i] || "[ SYS ]",
        text: statusLogs[i],
        latency: latencies[i] || "0ms",
        result: results[i] || "OK",
        isLatest: i === logIndex
      });
    }
    return list;
  }, [logIndex]);

  if (!mounted) return null;

  return (
    <>
      {/* Dynamic Keyframes injected into the page */}
      <style>{`
        @keyframes srmx-spin-glow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes srmx-breath-glow {
          0% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.9) rotate(0deg); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.08) rotate(180deg); }
          100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.9) rotate(360deg); }
        }
        @keyframes srmx-logo-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }
        @keyframes srmx-rotate-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes srmx-rotate-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes srmx-terminal-pulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes srmx-shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes srmx-pulse-shadow {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(255, 45, 85, 0.45)) drop-shadow(0 0 5px rgba(255, 45, 85, 0.2)); }
          50% { filter: drop-shadow(0 0 40px rgba(0, 229, 255, 0.6)) drop-shadow(0 0 10px rgba(0, 229, 255, 0.3)); }
        }
        @keyframes srmx-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes srmx-fade-in {
          from { opacity: 0; transform: scale(0.95); filter: blur(5px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes srmx-text-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes srmx-pulse-dot {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes srmx-particle-float {
          0% { transform: translateY(0px) scale(0.5); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
        }
        @keyframes srmx-laser-scan {
          0%, 100% { top: 0%; opacity: 0.1; }
          50% { top: 100%; opacity: 1; filter: drop-shadow(0 0 6px #00E5FF); }
        }
        @keyframes srmx-gloss-sweep {
          0% { left: -150%; }
          50% { left: 150%; }
          100% { left: 150%; }
        }
        @keyframes srmx-pulse-halo {
          0%, 100% { transform: scale(0.95); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.5; }
        }
        @keyframes srmx-cursor-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .srmx-splash-container {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #020204;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1), filter 600ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform, filter;
        }
        .srmx-splash-container.exiting {
          opacity: 0;
          transform: scale(1.06);
          filter: blur(25px);
          pointer-events: none;
        }
        .srmx-app-wrapper {
          transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
          width: 100%;
          height: 100%;
        }
        .srmx-app-wrapper.loading {
          opacity: 0;
          transform: scale(0.96);
          pointer-events: none;
        }
        .srmx-app-wrapper.ready {
          opacity: 1;
          transform: scale(1);
        }
        
        .srmx-shimmer-title {
          font-size: 28px; 
          font-weight: 950; 
          background: linear-gradient(90deg, #ffffff, #FF2D55, #BF5AF2, #00E5FF, #ffffff);
          background-size: 200% auto;
          color: transparent; 
          -webkit-background-clip: text;
          background-clip: text;
          animation: srmx-text-shimmer 4s linear infinite;
          margin-bottom: 4px; 
          text-transform: uppercase;
          letter-spacing: 0.16em;
          text-shadow: 0 0 35px rgba(191, 90, 242, 0.35);
        }

        .srmx-badge {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 100px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03);
          font-size: 8.5px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .srmx-settings-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.65);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }
        .srmx-settings-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 229, 255, 0.45);
          color: #ffffff;
          transform: rotate(60deg) scale(1.05);
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
        }

        .srmx-star {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          filter: drop-shadow(0 0 4px #00E5FF);
          animation: srmx-particle-float linear infinite;
          opacity: 0;
          pointer-events: none;
        }

        /* Rolling Logs Animation */
        .srmx-rolling-log {
          animation: srmx-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          margin-bottom: 5px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Webkit range resets for preview loader */
        input[type=range] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type=range]:focus {
          outline: none;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        input[type=range]::-webkit-slider-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -6px;
          box-shadow: 0 0 10px rgba(191, 90, 242, 0.8), 0 0 2px #fff;
          border: 1px solid rgba(191,90,242,0.3);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .srmx-desktop-flex {
          display: none;
        }
        @media (min-width: 768px) {
          .srmx-desktop-flex {
            display: flex;
          }
        }
      `}</style>

      {!isDestroyed && (
        <div className={`srmx-splash-container ${isExiting ? "exiting" : ""}`}>
          
          {/* Diagnostic Capsules Bar */}
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '20px',
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 15
          }}>
            <div className="srmx-badge">
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#FF9500',
                boxShadow: '0 0 8px #FF9500',
                animation: 'srmx-pulse-dot 1.5s infinite'
              }} />
              <span>Offline Portal</span>
            </div>

            {/* Diagnostic Core Status capsule */}
            <div className="srmx-badge srmx-desktop-flex" style={{ opacity: 0.85 }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#34C759',
                boxShadow: '0 0 8px #34C759',
                animation: 'srmx-pulse-dot 1.8s infinite'
              }} />
              <span>SYS_INTEGRITY: 100%</span>
            </div>
            
            <button className="srmx-settings-btn" aria-label="Settings">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scale(0.95)' }}>
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          {/* Dynamic Background Overlays & Particles */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            {/* Drifting Background Star Particles */}
            {particles.map(p => (
              <div
                key={p.id}
                className="srmx-star"
                style={{
                  left: `${p.x}%`,
                  bottom: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}

            {/* Drifting HSL Conic Backdrop */}
            <div 
              style={{
                position: "absolute", top: "50%", left: "50%",
                width: "140vw", height: "140vw", borderRadius: "50%",
                background: "conic-gradient(from 0deg, #FF2D55 0%, #BF5AF2 25%, #00E5FF 50%, #FF2D55 100%)",
                filter: "blur(140px)",
                animation: "srmx-spin-glow 24s linear infinite, srmx-breath-glow 12s ease-in-out infinite",
                willChange: "transform, opacity",
              }}
            />

            {/* Cybernetic Tech Grid Overlay */}
            <div 
              style={{
                position: "absolute", inset: 0,
                backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
                backgroundPosition: "center",
                maskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
                WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 80%)",
                opacity: 0.65,
              }}
            />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 10%, #020204 85%)" }} />
          </div>

          {!needsUpdate ? (
            <div
              style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", width: '100%', maxWidth: '380px', padding: '0 24px' }}
            >
              {/* Sci-Fi HUD Radar & Rotating Rings */}
              <div 
                className="srmx-logo-wrapper"
                style={{ 
                  position: 'relative', 
                  marginBottom: '42px',
                  width: '144px',
                  height: '144px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: "srmx-logo-float 4.5s ease-in-out infinite",
                  willChange: "transform"
                }}
              >
                {/* Outermost Dashed Cyan Tech Ring */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    width: '144px',
                    height: '144px',
                    borderRadius: '50%', 
                    border: '1.2px dashed rgba(0, 229, 255, 0.35)',
                    animation: "srmx-rotate-cw 20s linear infinite" 
                  }}
                />

                {/* Middle Pink Tech Compass Ring */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    width: '124px',
                    height: '124px',
                    borderRadius: '50%', 
                    border: '1.5px dashed rgba(255, 45, 85, 0.2)',
                    borderTop: '2px solid rgba(255, 45, 85, 0.75)',
                    borderBottom: '2px solid rgba(191, 90, 242, 0.75)',
                    animation: "srmx-rotate-ccw 10s linear infinite" 
                  }}
                />

                {/* Pulsing Solid Tech Halo */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    width: '104px',
                    height: '104px',
                    borderRadius: '50%', 
                    background: 'radial-gradient(circle, rgba(191, 90, 242, 0.05) 0%, transparent 70%)',
                    border: '1px solid rgba(191, 90, 242, 0.15)',
                    animation: "srmx-pulse-halo 4s ease-in-out infinite"
                  }}
                />

                {/* Cybernetic Radar Sweeper Line */}
                <div 
                  style={{
                    position: 'absolute',
                    width: '104px',
                    height: '104px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, rgba(0, 229, 255, 0.15) 0%, transparent 40%)',
                    animation: "srmx-rotate-cw 4s linear infinite",
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />
                
                {/* Premium Glossy Squircle Glass Logo Box */}
                <div style={{
                  position: 'relative',
                  width: '84px',
                  height: '84px',
                  borderRadius: '24px',
                  background: 'rgba(5, 5, 8, 0.65)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 45px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                  zIndex: 3
                }}>
                  {/* Cybernetic Laser scanning line */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #00E5FF 30%, #00E5FF 70%, transparent)',
                    animation: 'srmx-laser-scan 2.5s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 10
                  }} />

                  {/* Glass Gloss Sweeper glint */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '35%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
                    transform: 'skewX(-25deg)',
                    animation: 'srmx-gloss-sweep 3.5s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 5
                  }} />

                  <img 
                    src="/nexus-logo.png" 
                    alt="SRM NEXUS" 
                    style={{ 
                      width: "56px", 
                      height: "56px", 
                      borderRadius: "14px",
                      display: "block",
                      animation: "srmx-pulse-shadow 4s ease-in-out infinite",
                      zIndex: 4
                    }} 
                  />
                </div>
              </div>

              {/* Holographic branding */}
              <div style={{ textAlign: "center", width: '100%' }}>
                <h1 className="srmx-shimmer-title">
                  SRM NEXUS
                </h1>
                <div style={{
                  fontSize: '8.5px',
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.38em',
                  textTransform: 'uppercase',
                  marginBottom: '32px'
                }}>
                  Academic Intelligence Suite
                </div>

                {/* Progress bar info layout */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  width: '200px',
                  margin: '0 auto 8px',
                  fontFamily: 'monospace',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  letterSpacing: '0.05em'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>DECRYPTING</span>
                  <span style={{ color: '#00E5FF', textShadow: '0 0 8px rgba(0, 229, 255, 0.4)' }} className="tabular-nums">
                    {Math.round(((logIndex + 1) / statusLogs.length) * 100)}%
                  </span>
                </div>
                
                {/* Premium Polished Progress Chamber */}
                <div 
                  style={{ 
                    width: '200px', 
                    height: '5px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '100px', 
                    margin: '0 auto 28px', 
                    overflow: 'visible',
                    position: 'relative',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
                    border: '0.8px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <div 
                    style={{ 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #FF2D55, #BF5AF2, #00E5FF, #FF2D55)', 
                      backgroundSize: '300% 100%',
                      width: `${((logIndex + 1) / statusLogs.length) * 100}%`,
                      transition: "width 400ms cubic-bezier(0.25, 0.8, 0.25, 1)",
                      position: "relative",
                      borderRadius: '100px',
                      boxShadow: '0 0 12px rgba(0, 229, 255, 0.65)',
                      animation: "srmx-gradient-shift 4s ease infinite"
                    }}
                  >
                    {/* Glowing Leading edge Pointer Spark */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '-4px',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 0 12px #00E5FF, 0 0 4px #ffffff',
                        animation: 'srmx-terminal-pulse 0.4s alternate infinite'
                      }}
                    />
                    
                    {/* Shimmer gloss track sweep */}
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                        animation: 'srmx-shimmer 2.2s infinite',
                        transform: 'translateX(-100%)'
                      }}
                    />
                  </div>
                </div>

                {/* Cyberpunk Stacked Scrolling Terminal Console */}
                <div style={{
                  width: '240px',
                  height: '76px',
                  background: 'rgba(5, 5, 8, 0.5)',
                  backdropFilter: 'blur(20px)',
                  border: '1.2px solid rgba(191, 90, 242, 0.15)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  margin: '0 auto',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
                }}>
                  {rollingLogs.map((log) => (
                    <div 
                      key={log.index} 
                      className="srmx-rolling-log"
                      style={{
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: log.isLatest ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        opacity: log.isLatest ? 1 : log.index === logIndex - 1 ? 0.55 : 0.25,
                        transition: 'all 0.3s'
                      }}
                    >
                      <span style={{ color: log.isLatest ? '#FF2D55' : 'rgba(255, 45, 85, 0.45)', marginRight: '6px' }}>
                        {log.hex}
                      </span>
                      <span style={{ color: log.isLatest ? '#00E5FF' : 'rgba(0, 229, 255, 0.45)', marginRight: '8px' }}>
                        {log.prefix}
                      </span>
                      <span style={{ color: log.isLatest ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)' }}>
                        {log.text}
                      </span>
                      {log.isLatest ? (
                        <span style={{
                          display: 'inline-block',
                          width: '5px',
                          height: '9px',
                          background: '#00E5FF',
                          marginLeft: '4px',
                          verticalAlign: 'middle',
                          animation: 'srmx-cursor-blink 0.8s infinite'
                        }} />
                      ) : (
                        <span style={{ color: '#34C759', marginLeft: '6px', fontSize: '8px' }}>
                          ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ) : (
            /* Premium force update warning overlay */
            <div style={{
              position: "relative",
              zIndex: 100,
              width: "90%",
              maxWidth: "380px",
              background: "rgba(10, 10, 15, 0.8)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1.5px solid rgba(255, 45, 85, 0.3)",
              borderRadius: "28px",
              padding: "36px 28px",
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(255, 45, 85, 0.15)",
              animation: "srmx-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(255, 45, 85, 0.08)",
                border: "1.5px solid rgba(255, 45, 85, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF2D55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h2 style={{ fontSize: "19px", fontWeight: 950, color: "#ffffff", marginBottom: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Update Required
              </h2>
              <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.6)", lineHeight: "1.65", marginBottom: "28px", fontFamily: "system-ui, sans-serif" }}>
                Your client version (<strong style={{ color: "#ffffff" }}>v{APP_VERSION}</strong>) is outdated. 
                Please update to at least <strong style={{ color: "#ffffff" }}>v{minVersion}</strong> (latest is <strong style={{ color: "#ffffff" }}>v{latestVersion}</strong>) to sync with the new SRM dual connectors.
              </p>
              <button 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #FF2D55, #BF5AF2)",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: "800",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(255, 45, 85, 0.35)",
                  transition: "transform 200ms ease"
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Reload & Apply Update
              </button>
            </div>
          )}

          {/* Bottom Holographic Version Stamp */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            fontSize: '8.5px',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.24em',
            fontWeight: 900,
            textTransform: 'uppercase'
          }}>
            SYSTEM_VER_{APP_VERSION}_STABLE
          </div>
        </div>
      )}

      {/* Premium Content Reveal Transition Wrapper */}
      <div 
        className={`srmx-app-wrapper ${!isExiting ? "loading" : "ready"}`}
      >
        {children}
      </div>
    </>
  );
}
