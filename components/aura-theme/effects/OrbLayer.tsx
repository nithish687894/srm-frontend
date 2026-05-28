import React from "react";
import { OrbConfig } from "../system/theme-engine";

interface OrbLayerProps {
  blobs: OrbConfig[];
}

export default function OrbLayer({ blobs }: OrbLayerProps) {
  if (!blobs || blobs.length === 0) return null;

  return (
    <>
      {blobs.map((blob, index) => (
        <div 
          key={index} 
          className="aura-blob" 
          style={{ 
            background: blob.color, 
            top: blob.top, 
            left: blob.left, 
            right: blob.right, 
            bottom: blob.bottom,
            animationDelay: blob.delay || '0s' 
          }} 
        />
      ))}
    </>
  );
}
