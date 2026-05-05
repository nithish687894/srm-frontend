"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [logIndex, setLogIndex] = useState(0);

  const statusLogs = [
    "INITIALIZING NEURAL CORE",
    "ESTABLISHING SECURE TUNNEL",
    "SYNCING ACADEMIC RECORDS",
    "OPTIMIZING INTERFACE",
    "ESTABLISHING CONNECTION",
    "AUTHENTICATING SESSION",
    "READY"
  ];

  useEffect(() => {
    const hasSplashed = sessionStorage.getItem("srmx_splashed");
    if (hasSplashed) {
      setIsLoaded(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoaded(true);
      sessionStorage.setItem("srmx_splashed", "true");
    }, 3200);

    const logInterval = setInterval(() => {
      setLogIndex(prev => (prev < statusLogs.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => {
      clearTimeout(timer);
      clearInterval(logInterval);
    };
  }, []);

  const brandingText = "SRM NEXUS";

  return (
    <>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              filter: "blur(20px)",
              scale: 1.1,
              transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } 
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "#000000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {/* HUD Overlay Elements */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.4 }}>
              <div style={{ position: "absolute", top: "10%", left: "10%", width: "40px", height: "40px", borderTop: "2px solid rgba(255,255,255,0.1)", borderLeft: "2px solid rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", top: "10%", right: "10%", width: "40px", height: "40px", borderTop: "2px solid rgba(255,255,255,0.1)", borderRight: "2px solid rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", bottom: "10%", left: "10%", width: "40px", height: "40px", borderBottom: "2px solid rgba(255,255,255,0.1)", borderLeft: "2px solid rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "40px", height: "40px", borderBottom: "2px solid rgba(255,255,255,0.1)", borderRight: "2px solid rgba(255,255,255,0.1)" }} />
            </div>

            {/* Ambient Background Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                width: "800px",
                height: "800px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                filter: "blur(60px)",
                zIndex: 0
              }}
            />

            {/* Central Animated HUD Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                width: "320px",
                height: "320px",
                borderRadius: "50%",
                border: "1px dashed rgba(255,255,255,0.05)",
                zIndex: 1
              }}
            />

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                width: "380px",
                height: "380px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.03)",
                borderTopColor: "rgba(59, 130, 246, 0.1)",
                zIndex: 1
              }}
            />

            {/* Logo and Main Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div style={{ position: "relative" }}>
                 <img 
                    src="/nexus-logo.png" 
                    alt="SRM NEXUS" 
                    style={{ width: "140px", height: "140px", userSelect: "none", filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))" }} 
                 />
                 <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ position: "absolute", inset: "-10px", borderRadius: "50%", border: "2px solid rgba(59, 130, 246, 0.2)" }}
                 />
              </div>

              <div style={{ marginTop: "48px", textAlign: "center" }}>
                <motion.div style={{ display: "flex", justifyContent: "center", overflow: "hidden", marginBottom: "12px" }}>
                  {brandingText.split("").map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.6 + (i * 0.05), ease: [0.16, 1, 0.3, 1] }}
                      style={{ 
                        fontFamily: "var(--font-orbitron)", 
                        fontSize: "32px", 
                        fontWeight: 900, 
                        letterSpacing: char === " " ? "0.6em" : "0.2em", 
                        color: "#fff",
                        display: "inline-block"
                      }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </motion.div>

                {/* Status Logs Animation */}
                <div style={{ height: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={logIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      style={{ 
                        fontSize: "9px", 
                        fontFamily: "monospace",
                        color: logIndex === statusLogs.length - 1 ? "#00E676" : "rgba(255,255,255,0.4)", 
                        textTransform: "uppercase",
                        letterSpacing: "0.4em",
                        fontWeight: 800
                      }}
                    >
                      {statusLogs[logIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Bottom Progress Bar */}
            <div style={{ position: "absolute", bottom: "10%", width: "200px", height: "2px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" }}>
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    width: "40%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
                  }}
                />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 1.2s ease-in-out" }}>
        {children}
      </div>
    </>
  );
}
