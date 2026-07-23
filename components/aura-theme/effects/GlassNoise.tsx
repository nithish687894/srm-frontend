"use client";

import React from "react";

export default function GlassNoise() {
  // SVG feTurbulence causes heavy GPU rasterization lag on mobile viewports
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  if (isMobile) return null;

  return (
    <svg 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0, 
        opacity: 0.03, 
        pointerEvents: 'none' 
      }}
    >
      <filter id="noise">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.65" 
          numOctaves="2" 
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)"/>
    </svg>
  );
}
