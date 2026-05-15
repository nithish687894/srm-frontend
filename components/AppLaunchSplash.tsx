"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { APP_VERSION } from "@/lib/version";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [mounted, setMounted] = useState(false);

  const statusLogs = [
    "INITIALIZING NEURAL CORE",
    "ESTABLISHING SECURE TUNNEL",
    "SYNCING ACADEMIC RECORDS",
    "OPTIMIZING INTERFACE",
    "AUTHENTICATING SESSION",
    "READY"
  ];

  useEffect(() => {
    setMounted(true);
    
    // Recovery: Force load after 5 seconds no matter what
    const recoveryTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 5000);

    const checkVersion = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.minVersion && APP_VERSION < data.minVersion) {
            setNeedsUpdate(true);
          }
        }
      } catch (e) {
        console.warn("Version check skipped:", e);
      }
    };

    checkVersion();

    const hasSplashed = typeof window !== 'undefined' ? sessionStorage.getItem("srmx_splashed") : null;
    const duration = hasSplashed ? 1000 : 3000;

    const timer = setTimeout(() => {
      setIsLoaded(true);
      if (typeof window !== 'undefined') sessionStorage.setItem("srmx_splashed", "true");
    }, duration);

    const logInterval = setInterval(() => {
      setLogIndex(prev => (prev < statusLogs.length - 1 ? prev + 1 : prev));
    }, duration / statusLogs.length);

    return () => {
      clearTimeout(timer);
      clearTimeout(recoveryTimer);
      clearInterval(logInterval);
    };
  }, []);

  // Hydration safety
  if (!mounted) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {(!isLoaded || needsUpdate) && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              filter: "blur(20px)",
              scale: 1.05,
              transition: { duration: 0.8, ease: "easeInOut" } 
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              background: "#000000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {/* Background Glow */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: "140vw", height: "140vw", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(54, 115, 255, 0.15) 0%, transparent 70%)",
                  filter: "blur(80px)",
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <motion.img 
                src="/nexus-logo.png" 
                alt="SRM NEXUS" 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "100px", height: "100px", filter: "drop-shadow(0 0 20px rgba(54, 115, 255, 0.4))", marginBottom: "40px" }} 
              />

              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-orbitron)", fontSize: "24px", fontWeight: 900, letterSpacing: "0.2em", color: "#fff", marginBottom: "16px" }}>
                  SRM NEXUS
                </div>
                <div style={{ height: "20px" }}>
                   <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.4em", fontWeight: 900 }}>
                      {statusLogs[logIndex]}
                   </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div 
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 1s ease-in-out",
          pointerEvents: isLoaded ? "auto" : "none",
          visibility: isLoaded ? "visible" : "hidden"
        }}
      >
        {children}
      </div>
    </>
  );
}
