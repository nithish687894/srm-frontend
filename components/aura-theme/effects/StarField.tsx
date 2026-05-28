import React from "react";
import { Star } from "../system/useAuraTheme";

interface StarFieldProps {
  stars: Star[];
  visible?: boolean;
}

export default function StarField({ stars, visible = true }: StarFieldProps) {
  if (!visible || !stars || stars.length === 0) return null;

  return (
    <div 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        overflow: 'hidden', 
        pointerEvents: 'none', 
        zIndex: 0 
      }}
    >
      {stars.map((star) => (
        <div 
          key={star.id} 
          className="twinkling-star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animation: `twinkle ${star.duration} ease-in-out infinite`,
            animationDelay: star.delay
          }}
        />
      ))}
    </div>
  );
}
