"use client";
import { useUnsplash } from "@/hooks/useUnsplash";

interface UnsplashBackgroundProps {
  query: string;
  /** Overlay opacity 0-100, default 80 */
  overlayOpacity?: number;
}

/**
 * Full-viewport Unsplash background with dark gradient overlay.
 * Images lazy load with a fade-in transition.
 * Photographer credit shown in bottom-right corner.
 */
export default function UnsplashBackground({
  query,
  overlayOpacity = 80,
}: UnsplashBackgroundProps) {
  const { data, loading } = useUnsplash(query);

  if (!data?.imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    >
      {/* Image */}
      <img
        src={data.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loading ? 0 : 0.25,
          transition: "opacity 1.2s ease-in-out",
        }}
      />

      {/* Dark gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,${overlayOpacity / 100}) 0%, rgba(0,0,0,0.95) 100%)`,
          zIndex: 1,
        }}
      />

      {/* Photographer credit */}
      {data.photographer && (
        <div
          style={{
            position: "absolute",
            bottom: "90px",
            right: "16px",
            fontSize: "9px",
            color: "rgba(255,255,255,0.15)",
            fontFamily: "monospace",
            zIndex: 2,
            letterSpacing: "0.05em",
          }}
        >
          Photo by {data.photographer} / Unsplash
        </div>
      )}
    </div>
  );
}
