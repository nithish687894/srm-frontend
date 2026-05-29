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

  // Circular Ring for both Matrix and Editorial (styled via CSS variables)
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
          stroke="var(--bg-elevated, rgba(255,255,255,0.05))"
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
      <div style={{ position: "absolute", fontSize: `${size/5}px`, fontWeight: 900, color: "var(--text-primary)" }}>{value}%</div>
    </div>
  );
}
