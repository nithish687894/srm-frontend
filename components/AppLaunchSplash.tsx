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
    "BOOTING_NEURAL_CORE",
    "ESTABLISHING_VPN_TUNNEL",
    "DECRYPTING_ACADEMIC_KEYS",
    "SYNCING_REGISTRY_V2",
    "OPTIMIZING_QUANTUM_UI",
    "READY_FOR_LAUNCH"
  ];

  useEffect(() => {
    setMounted(true);
    
    const recoveryTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 6000);

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
    const duration = hasSplashed ? 1200 : 4000;

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
              filter: "blur(40px) brightness(1.5)",
              scale: 1.1,
              transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } 
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
            {/* Dynamic Neural Field */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1], 
                  opacity: [0.05, 0.15, 0.05],
                  rotate: [0, 90, 180, 270, 360] 
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: "150vw", height: "150vw", borderRadius: "50%",
                  background: "conic-gradient(from 0deg, #FF75C3, #8F92FF, #94FFD8, #FF75C3)",
                  filter: "blur(120px)",
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #000 80%)' }} />
            </div>



            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div style={{ position: 'relative', marginBottom: '40px' }}>
                <motion.div 
                   animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '1px solid rgba(255,117,195,0.3)', filter: 'blur(5px)' }}
                />
                <motion.img 
                  src="/nexus-logo.png" 
                  alt="SRM NEXUS" 
                  animate={{ y: [0, -10, 0], rotateY: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: "100px", height: "100px", filter: "drop-shadow(0 0 30px rgba(255, 117, 195, 0.5))" }} 
                />
              </div>

              <div style={{ textAlign: "center" }}>
                <motion.div 
                  initial={{ letterSpacing: "1em", opacity: 0 }}
                  animate={{ letterSpacing: "0.3em", opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  style={{ fontSize: "28px", fontWeight: 900, color: "#fff", marginBottom: "20px", textTransform: 'uppercase' }}
                >
                  SRM NEXUS
                </motion.div>
                
                {/* Progress Bar Container */}
                <div style={{ width: '180px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', margin: '0 auto 12px', overflow: 'hidden' }}>
                   <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ width: `${((logIndex + 1) / statusLogs.length) * 100}%` }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #FF75C3, #8F92FF)' }}
                   />
                </div>

                <div style={{ height: "20px" }}>
                   <motion.p 
                      key={logIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 900 }}>
                      {statusLogs[logIndex]}
                   </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Bottom Version Branding */}
            <div style={{ position: 'absolute', bottom: '40px', fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
               SYSTEM_VER_{APP_VERSION}_STABLE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1 }}
        style={{ 
          pointerEvents: isLoaded ? "auto" : "none",
          visibility: isLoaded ? "visible" : "hidden"
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
