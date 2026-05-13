"use client";

interface CyberBackgroundProps {
  /** Color variant: "green" (default), "purple" (cosmos), "lime" (matrix) */
  variant?: "green" | "purple" | "lime";
}

/**
 * Animated cyberpunk mesh background — pure CSS, zero dependencies.
 * Renders subtle floating gradient orbs with a noise-grain overlay.
 */
export default function CyberBackground({ variant = "green" }: CyberBackgroundProps) {
  const colors = {
    green: { a: "rgba(0, 255, 136, 0.08)", b: "rgba(0, 200, 255, 0.05)", c: "rgba(0, 100, 255, 0.04)" },
    purple: { a: "rgba(139, 92, 246, 0.08)", b: "rgba(59, 130, 246, 0.05)", c: "rgba(236, 72, 153, 0.04)" },
    lime: { a: "rgba(168, 194, 0, 0.08)", b: "rgba(200, 220, 0, 0.04)", c: "rgba(100, 150, 0, 0.03)" },
  };

  const c = colors[variant];

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 20% 50%, rgba(10, 15, 30, 1) 0%, rgba(0, 0, 0, 1) 70%)",
        }}
      />

      {/* Floating orb 1 — large, slow drift */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.a} 0%, transparent 70%)`,
          filter: "blur(80px)",
          animation: "cyberFloat1 20s ease-in-out infinite",
        }}
      />

      {/* Floating orb 2 — medium, offset drift */}
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.b} 0%, transparent 70%)`,
          filter: "blur(60px)",
          animation: "cyberFloat2 25s ease-in-out infinite",
        }}
      />

      {/* Floating orb 3 — small accent */}
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: "40%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.c} 0%, transparent 70%)`,
          filter: "blur(50px)",
          animation: "cyberFloat3 18s ease-in-out infinite",
        }}
      />

      {/* Subtle scan line overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)",
          zIndex: 1,
        }}
      />

      {/* Noise grain texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          zIndex: 2,
        }}
      />

      <style>{`
        @keyframes cyberFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes cyberFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.08); }
          66% { transform: translate(15px, -25px) scale(0.92); }
        }
        @keyframes cyberFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
