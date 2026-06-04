"use client";

export default function LoadingSkeleton() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050508",
        color: "#fff",
        padding: "80px 20px 160px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Aura background blobs */}
      <div
        style={{
          position: "fixed",
          top: "-200px",
          right: "-100px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "#8F92FF",
          filter: "blur(140px)",
          opacity: 0.1,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-200px",
          left: "-100px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "#94FFD8",
          filter: "blur(140px)",
          opacity: 0.08,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content skeleton */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header skeleton */}
        <div style={{ marginBottom: "32px" }}>
          <div
            className="skel-pulse"
            style={{
              width: "120px",
              height: "12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              marginBottom: "12px",
            }}
          />
          <div
            className="skel-pulse"
            style={{
              width: "220px",
              height: "28px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.05)",
            }}
          />
        </div>

        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skel-pulse"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: "24px",
              padding: "24px",
              marginBottom: "16px",
              backdropFilter: "blur(20px)",
              animationDelay: `${i * 150}ms`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.05)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: "60%",
                    height: "14px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.05)",
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: "10px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.03)",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div
                style={{
                  flex: 1,
                  height: "36px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)",
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: "36px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.03)",
                }}
              />
            </div>
          </div>
        ))}

        {/* Small row skeletons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="skel-pulse"
              style={{
                flex: 1,
                height: "72px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                animationDelay: `${(i + 3) * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes skelPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .skel-pulse {
          animation: skelPulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </main>
  );
}
