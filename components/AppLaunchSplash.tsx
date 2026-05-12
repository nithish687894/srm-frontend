"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { APP_VERSION } from "@/lib/version";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);

  const statusLogs = [
    "INITIALIZING NEURAL CORE",
    "ESTABLISHING SECURE TUNNEL",
    "SYNCING ACADEMIC RECORDS",
    "OPTIMIZING INTERFACE",
    "AUTHENTICATING SESSION",
    "READY"
  ];

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        
        // Version comparison logic: simple string comparison works for semantic versioning
        if (data.minVersion && APP_VERSION < data.minVersion) {
          setNeedsUpdate(true);
          setUpdateData(data);
        }
      } catch (e) {
        console.error("Version check failed", e);
      }
    };

    checkVersion();

    const hasSplashed = sessionStorage.getItem("srmx_splashed");
    
    // If already splashed, we still show a quick 800ms fade-in for smoothness
    const duration = hasSplashed ? 800 : 2800;

    const timer = setTimeout(() => {
      setIsLoaded(true);
      sessionStorage.setItem("srmx_splashed", "true");
    }, duration);

    const logInterval = setInterval(() => {
      setLogIndex(prev => (prev < statusLogs.length - 1 ? prev + 1 : prev));
    }, duration / statusLogs.length);

    return () => {
      clearTimeout(timer);
      clearInterval(logInterval);
    };
  }, []);

  const brandingText = "SRM NEXUS";

  return (
    <>
      <AnimatePresence>
        {(!isLoaded || needsUpdate) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              filter: "blur(20px)",
              scale: 1.05,
              transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } 
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
            {/* Background Effects */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "140vw",
                  height: "140vw",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(54, 115, 255, 0.1) 0%, transparent 70%)",
                  filter: "blur(80px)",
                }}
              />
            </div>

            {needsUpdate ? (
              // ─── Mandatory Update UI ───
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                  position: "relative", zIndex: 10, textAlign: "center",
                  padding: "40px", maxWidth: "340px", width: "90%",
                  background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: "32px"
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>🚀</div>
                <div style={{ 
                  fontFamily: "var(--font-orbitron)", fontSize: "20px", fontWeight: 900, 
                  color: "#fff", marginBottom: "12px", letterSpacing: "0.1em" 
                }}>
                  UPDATE REQUIRED
                </div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "32px", fontWeight: 600 }}>
                  {updateData?.message || "A critical update is available to keep your SRM Nexus experience smooth and secure."}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    width: "100%", padding: "16px", borderRadius: "16px", border: "none",
                    background: "linear-gradient(135deg, #3673ff, #7c58ff)",
                    color: "#fff", fontWeight: 900, fontSize: "14px", cursor: "pointer",
                    boxShadow: "0 8px 32px rgba(54, 115, 255, 0.3)",
                    textTransform: "uppercase", letterSpacing: "0.1em"
                  }}
                >
                  Refresh App
                </button>
                <div style={{ marginTop: "20px", fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                  Current: v{APP_VERSION} • Required: v{updateData?.minVersion}
                </div>
              </motion.div>
            ) : (
              // ─── Regular Splash UI ───
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <div style={{ position: "relative" }}>
                   <motion.img 
                      src="/nexus-logo.png" 
                      alt="SRM NEXUS" 
                      animate={{ scale: [0.95, 1, 0.95] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: "120px", height: "120px", filter: "drop-shadow(0 0 30px rgba(54, 115, 255, 0.4))" }} 
                   />
                </div>

                <div style={{ marginTop: "40px", textAlign: "center" }}>
                  <motion.div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                    {brandingText.split("").map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, filter: "blur(10px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        style={{ 
                          fontFamily: "var(--font-orbitron)", 
                          fontSize: "28px", 
                          fontWeight: 900, 
                          letterSpacing: char === " " ? "0.6em" : "0.15em", 
                          color: "#fff",
                          textShadow: "0 0 20px rgba(255,255,255,0.2)"
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </motion.div>

                  <div style={{ height: "24px" }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={logIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ 
                          fontSize: "10px", 
                          fontFamily: "monospace",
                          color: logIndex === statusLogs.length - 1 ? "#00FF88" : "rgba(255,255,255,0.4)", 
                          textTransform: "uppercase",
                          letterSpacing: "0.4em",
                          fontWeight: 900
                        }}
                      >
                        {statusLogs[logIndex]}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        style={{ 
          opacity: isLoaded && !needsUpdate ? 1 : 0,
          pointerEvents: isLoaded && !needsUpdate ? "auto" : "none"
        }}
        animate={{ opacity: isLoaded && !needsUpdate ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
