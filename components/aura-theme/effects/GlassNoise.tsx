import React from "react";

export default function GlassNoise() {
  return (
    <svg 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0, 
        opacity: 0.04, 
        pointerEvents: 'none' 
      }}
    >
      <filter id="noise">
        <feTurbulence 
          type="fractalNoise" 
          baseFrequency="0.65" 
          numOctaves="3" 
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)"/>
    </svg>
  );
}
