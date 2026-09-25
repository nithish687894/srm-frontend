"use client";
import React from "react";

export interface NexusLogoProps {
  variant?: "full" | "icon" | "compact" | "horizontal";
  size?: number | "sm" | "md" | "lg" | "xl";
  className?: string;
  theme?: "dark" | "light" | "auto";
  showBadge?: boolean;
  badgeText?: string;
}

const SIZE_MAP = {
  sm: { icon: 24, font: 15, badge: 9, height: 28 },
  md: { icon: 32, font: 17, badge: 10, height: 36 },
  lg: { icon: 40, font: 20, badge: 11, height: 44 },
  xl: { icon: 52, font: 26, badge: 12, height: 56 },
};

/**
 * Pure SVG Nexus Icon Mark:
 * Geometric dual-portal convergence 'N' representing the unified connection between
 * SRM Academia and Student Portal in a crisp, modern vector silhouette.
 */
export const NexusMark: React.FC<{ size?: number; className?: string; colorScheme?: "blue" | "monochrome" }> = ({
  size = 32,
  className = "",
  colorScheme = "blue",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nexusMarkBlue" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="nexusMarkGlow" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="nexusBridge" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Rounded squircle substrate container */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        fill="#12121A"
        stroke="#292532"
        strokeWidth="1.5"
      />

      {/* Background soft subtle inner gradient */}
      <rect
        x="3"
        y="3"
        width="34"
        height="34"
        rx="9"
        fill="url(#nexusMarkGlow)"
        fillOpacity="0.12"
      />

      {/* Left Pillar (Node 1 - Academia Gateway) */}
      <path
        d="M11 11.5C11 10.67 11.67 10 12.5 10H14.5C15.33 10 16 10.67 16 11.5V28.5C16 29.33 15.33 30 14.5 30H12.5C11.67 30 11 29.33 11 28.5V11.5Z"
        fill={colorScheme === "blue" ? "url(#nexusMarkBlue)" : "#F7F5FA"}
      />

      {/* Central High-Speed Diagonal Bridge (The Nexus Gateway Interlink) */}
      <path
        d="M13 11L27 27C27.6 27.6 28.5 27.2 28.5 26.3V24L15.5 9.5C14.9 8.9 14 9.3 14 10.2V11H13Z"
        fill="url(#nexusBridge)"
        opacity="0.95"
      />

      {/* Right Pillar (Node 2 - Student Portal Gateway) */}
      <path
        d="M24 11.5C24 10.67 24.67 10 25.5 10H27.5C28.33 10 29 10.67 29 11.5V28.5C29 29.33 28.33 30 27.5 30H25.5C24.67 30 24 29.33 24 28.5V11.5Z"
        fill={colorScheme === "blue" ? "url(#nexusMarkBlue)" : "#F7F5FA"}
      />

      {/* Convergence Focus Diamond Node in the center */}
      <circle cx="20" cy="20" r="2.2" fill="#FFFFFF" />
    </svg>
  );
};

export default function NexusLogo({
  variant = "full",
  size = "md",
  className = "",
  theme = "auto",
  showBadge = true,
  badgeText = "2026",
}: NexusLogoProps) {
  const resolvedSize = typeof size === "number" ? { icon: size, font: size * 0.52, badge: size * 0.3, height: size } : SIZE_MAP[size] || SIZE_MAP.md;

  if (variant === "icon") {
    return <NexusMark size={resolvedSize.icon} className={className} />;
  }

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ height: resolvedSize.height }}
      aria-label="SRM Nexus"
    >
      <NexusMark size={resolvedSize.icon} />

      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: `${resolvedSize.font}px`,
              fontWeight: 750,
              letterSpacing: "-0.035em",
              color: "#F7F5FA",
              lineHeight: 1.1,
            }}
          >
            SRM Nexus
          </span>

          {showBadge && (
            <span
              style={{
                fontSize: `${resolvedSize.badge}px`,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#60A5FA",
                background: "rgba(37, 99, 235, 0.14)",
                border: "1px solid rgba(37, 99, 235, 0.3)",
                padding: "2px 6px",
                borderRadius: "999px",
                lineHeight: 1,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>

        {variant === "full" && (
          <span
            style={{
              fontSize: `${Math.max(9, resolvedSize.font * 0.55)}px`,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8C8696",
              marginTop: "2px",
            }}
          >
            Academic Platform
          </span>
        )}
      </div>
    </div>
  );
}
