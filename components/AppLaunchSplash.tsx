"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasSplashed = sessionStorage.getItem("srmx_splashed");
    if (hasSplashed) {
      setIsLoaded(true);
      return;
    }

    // Pro timing: 2.8s for full sequence
    const timer = setTimeout(() => {
      setIsLoaded(true);
      sessionStorage.setItem("srmx_splashed", "true");
    }, 2800);
    return () => clearTimeout(timer);
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
              transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] } 
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "#050505",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {/* Ultra-subtle scanline texture */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
              backgroundSize: "100% 2px, 3px 100%",
              pointerEvents: "none",
              zIndex: 2,
              opacity: 0.3
            }} />

            {/* Logo Core */}
            <motion.div
              initial={{ opacity: 0, scale: 1.1, filter: "brightness(0)" }}
              animate={{ opacity: 1, scale: 1, filter: "brightness(1)" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", zIndex: 3 }}
            >
              <img 
                src="/nexus-logo.png" 
                alt="SRM NEXUS" 
                style={{ width: "120px", height: "120px", userSelect: "none" }} 
              />
              
              {/* Subtle light sweep */}
              <motion.div 
                animate={{ left: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "40px",
                  background: "linear-gradient(90deg, transparent, rgba(168, 194, 0, 0.2), transparent)",
                  transform: "skewX(-20deg)",
                  zIndex: 4
                }}
              />
            </motion.div>

            {/* Staggered Branding Reveal */}
            <div style={{ textAlign: "center", marginTop: "32px", zIndex: 3 }}>
              <motion.div
                initial="hidden"
                animate="visible"
                style={{ display: "flex", justifyContent: "center", overflow: "hidden" }}
              >
                {brandingText.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { y: "100%", opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.4 + (i * 0.05),
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    style={{ 
                      fontFamily: "var(--font-orbitron)", 
                      fontSize: "28px", 
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

              {/* Slogan with letter-spacing animation */}
              <motion.p
                initial={{ opacity: 0, letterSpacing: "1.2em" }}
                animate={{ opacity: 1, letterSpacing: "0.6em" }}
                transition={{ delay: 1.2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ 
                  fontSize: "9px", 
                  color: "rgba(255,255,255,0.4)", 
                  textTransform: "uppercase", 
                  marginTop: "16px",
                  fontWeight: 800,
                  textIndent: "0.6em"
                }}
              >
                Precision Academic Intelligence
              </motion.p>
            </div>

            {/* Bottom Progress Indicator (Subtle) */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "120px" }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              style={{
                position: "absolute",
                bottom: "15%",
                height: "1px",
                background: "linear-gradient(90deg, transparent, #a8c200, transparent)",
                boxShadow: "0 0 8px rgba(168, 194, 0, 0.5)"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
