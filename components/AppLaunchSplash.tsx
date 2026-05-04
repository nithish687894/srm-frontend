"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppLaunchSplash({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 1.1,
              filter: "blur(20px)",
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "#000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {/* Ambient Background Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3] 
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                width: "60vw",
                height: "60vw",
                background: "radial-gradient(circle, rgba(168, 194, 0, 0.15) 0%, transparent 70%)",
                filter: "blur(60px)",
                zIndex: -1
              }}
            />

            {/* Nexus Core Logo (SVG) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ position: "relative" }}
            >
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.path
                  d="M20 80V20L80 80V20"
                  stroke="#a8c200"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  stroke="#a8c200" 
                  strokeWidth="2" 
                  strokeDasharray="5 10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
              </svg>
              
              {/* Glitch Effect Overlays */}
              <motion.div 
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 1 }}
                style={{
                  position: "absolute",
                  inset: -10,
                  border: "2px solid #a8c200",
                  borderRadius: "50%",
                  filter: "blur(4px)"
                }}
              />
            </motion.div>

            {/* Branding Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              style={{ textAlign: "center", marginTop: "40px" }}
            >
              <h1 style={{ 
                fontFamily: "var(--font-orbitron)", 
                fontSize: "32px", 
                fontWeight: 900, 
                letterSpacing: "0.4em", 
                color: "#fff",
                margin: 0,
                textIndent: "0.4em"
              }}>
                SRM NEXUS
              </h1>
              <p style={{ 
                fontSize: "10px", 
                color: "#666", 
                textTransform: "uppercase", 
                letterSpacing: "0.6em",
                marginTop: "12px",
                fontWeight: 800
              }}>
                Precision Academic Intelligence
              </p>
            </motion.div>

            {/* Scanning Line */}
            <motion.div 
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: "1px",
                background: "rgba(168, 194, 0, 0.3)",
                boxShadow: "0 0 10px #a8c200",
                zIndex: 10
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 1s ease" }}>
        {children}
      </div>
    </>
  );
}
