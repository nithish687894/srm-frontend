"use client";
import { useThemeStore } from "@/lib/themeStore";

interface GaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export default function DynamicGauge({ value, size = 120, strokeWidth = 8 }: GaugeProps) {
  const { theme } = useThemeStore();
  const percentage = Math.min(100, Math.max(0, value));

  if (theme === "jarvis") {
    // Half Circle Arc
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <div style={{ position: "relative", width: size, height: size / 2 + 10, display: "flex", justifyContent: "center" }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          <path
            d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
            fill="none"
            stroke="rgba(0, 168, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out", filter: "drop-shadow(0 0 5px var(--accent))" }}
          />
        </svg>
        <div style={{ position: "absolute", bottom: 0, textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-orbitron)" }}>{value}%</div>
        </div>
      </div>
    );
  }

  if (theme === "ghost") {
    // Horizontal Bar
    return (
      <div style={{ width: "100%", padding: "20px 0" }}>
        <div style={{ height: "1px", background: "#eee", width: "100%", position: "relative", marginBottom: "8px" }}>
          <div style={{ 
            height: "3px", 
            background: "var(--accent)", 
            width: `${percentage}%`, 
            position: "absolute", 
            top: "-1px",
            transition: "width 1s ease-in-out"
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", color: "#aaa" }}>Attendance</span>
          <span style={{ fontSize: "48px", fontWeight: 900, fontFamily: "var(--font-playfair)", lineHeight: 1 }}>{value}%</span>
        </div>
      </div>
    );
  }

  if (theme === "ember") {
    // Segmented Arc
    const segments = 10;
    const activeSegments = Math.round((percentage / 100) * segments);
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center", width: size }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            width: "8px",
            height: "24px",
            background: i < activeSegments ? "var(--accent)" : "rgba(255,107,0,0.1)",
            transform: `skewX(-15deg)`,
            transition: "all 0.3s ease",
            boxShadow: i < activeSegments ? `0 0 10px var(--accent)` : "none"
          }} />
        ))}
        <div style={{ width: "100%", textAlign: "center", marginTop: "8px" }}>
          <span style={{ fontSize: "32px", fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-bebas)" }}>{value}%</span>
        </div>
      </div>
    );
  }

  // Matrix (Locked Default) - Full Ring
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(168, 194, 0, 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div style={{ position: "absolute", fontSize: "24px", fontWeight: 900 }}>{value}%</div>
    </div>
  );
}
