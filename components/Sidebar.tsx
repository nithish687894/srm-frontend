"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard",  label: "Home" },
  { href: "/marks",      label: "Marks" },
  { href: "/attendance", label: "Attnd" },
  { href: "/timetable",  label: "Time" },
  { href: "/calendar",   label: "Cal" },
  { href: "/ai",         label: "✨ AI" },
];



export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    // Simplified: Theme now managed by ThemeWrapper
  }, []);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { }
    useAuthStore.getState().logout();
    router.push("/");
  };

  return (
    <>
      <style>{`
        .srmx-nav-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: calc(72px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: var(--nav-bg);
          backdrop-filter: blur(var(--nav-blur));
          -webkit-backdrop-filter: blur(var(--nav-blur));
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px; /* Reduced base gap */
          z-index: 100;
          border-top: 1px solid var(--border);
          transition: all 0.4s ease;
          overflow: hidden; /* Prevent any scrolling */
        }

        .theme-cosmos .srmx-nav-bar {
          background: rgba(15,15,19,0.97);
          border-top: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
        }

        .theme-cosmos .srmx-nav-btn {
          color: #55556a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 9px;
        }

        .theme-cosmos .srmx-nav-btn.active {
          color: #a78bfa;
          background: rgba(124,58,237,0.12);
          border-radius: 12px;
        }

        .theme-editorial .srmx-nav-bar {
          background: rgba(245,242,235,0.97);
          border-top: 1px solid #111111;
          backdrop-filter: blur(20px);
        }

        .theme-editorial .srmx-nav-btn {
          color: #999999;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          letter-spacing: 0.15em;
          border-radius: 0;
        }

        .theme-editorial .srmx-nav-btn.active {
          color: #111111;
          background: none;
          border-bottom: 2px solid #111111;
        }

        .srmx-nav-btn {
          flex-shrink: 1;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          font-weight: 700;
          transition: all 0.2s;
          padding: 6px 8px;
          text-transform: uppercase;
          border-radius: 99px;
          white-space: nowrap;
        }

        .srmx-nav-settings-btn {
          flex-shrink: 0 !important;
          font-size: 16px;
          padding-left: 4px;
        }

        .srmx-nav-btn.active {
          color: var(--text-primary);
        }

        @media (max-width: 480px) {
          .srmx-nav-bar {
            gap: 4px;
          }
          .srmx-nav-btn {
            font-size: 9px;
            padding: 6px 4px;
            letter-spacing: 0.05em;
          }
        }

        @media (min-width: 769px) {
          .srmx-nav-bar {
            top: 24px; bottom: auto;
            width: max-content;
            margin: 0 auto;
            padding: 0 48px;
            border-radius: 99px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            height: 64px;
            gap: 40px;
            background: rgba(10, 15, 30, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }
      `}</style>

      {/* Settings Overlay */}
      {menuOpen && (
        <div 
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)",
            zIndex: 99, display: "flex", flexDirection: "column",
            justifyContent: "flex-end", alignItems: "center", paddingBottom: "120px"
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: "#1c1c1c", padding: "24px", borderRadius: "24px",
            width: "90%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "24px"
          }}>
            <div>
              <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, marginBottom: "16px" }}>
                Settings
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button 
                  onClick={() => { setMenuOpen(false); router.push("/settings/theme"); }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "none", color: "#fff", display: "flex", alignItems: "center", gap: "12px",
                    padding: "16px", borderRadius: "16px", cursor: "pointer", fontWeight: 700,
                    textAlign: "left", fontSize: "14px"
                  }}
                >
                  🎭 Personalize Interface
                </button>
              </div>
            </div>

            <div style={{ height: "1px", background: "#333" }} />

            <button 
              onClick={handleLogout}
              style={{
                background: "#ff3b3b22", color: "#ff3b3b", border: "1px dashed #ff3b3b",
                padding: "16px", borderRadius: "16px", fontSize: "14px", fontWeight: "bold",
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em"
              }}
            >
              Log Out of SRMX
            </button>
          </div>
        </div>
      )}

      <nav className="srmx-nav-bar">
        {NAV.map(({ href, label }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`srmx-nav-btn${active ? " active" : ""}`}
            >
              {label}
            </button>
          );
        })}
        
        {/* Menu Toggle */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={`srmx-nav-btn srmx-nav-settings-btn${menuOpen ? " active" : ""}`}
        >
          ⚙️
        </button>
      </nav>
    </>
  );
}