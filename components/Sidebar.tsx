"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";





export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile, email } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  const ADMIN_EMAILS = ["ns4770@srmist.edu.in", "ts0014@srmist.edu.in"];
  const userEmail = (email || profile?.Email || profile?.["Email"] || "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

  const NAV = [
    { href: "/dashboard",  label: "Home" },
    { href: "/marks",      label: "Marks" },
    { href: "/attendance", label: "Attnd" },
    { href: "/timetable",  label: "Time" },
    { href: "/calendar",   label: "Cal" },
    { href: "/ai",         label: "✨ AI" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch { }
    useAuthStore.getState().logout();
    router.push("/");
  };

  const navContent = (
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
          box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.35);
        }

        .srmx-nav-bar::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.24) 50%, transparent 100%);
          opacity: 0.55;
          pointer-events: none;
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

        .theme-matrix .srmx-nav-bar {
          background: rgba(10, 10, 10, 0.95);
          border-top: 1px solid var(--accent);
          box-shadow: 0 -4px 20px rgba(168, 194, 0, 0.15);
        }

        .theme-matrix .srmx-nav-btn {
          color: #666;
          font-weight: 800;
        }

        .theme-matrix .srmx-nav-btn.active {
          color: var(--accent);
          text-shadow: 0 0 10px rgba(168, 194, 0, 0.8);
          background: rgba(168, 194, 0, 0.15);
          border-radius: 12px;
          box-shadow: inset 0 0 10px rgba(168, 194, 0, 0.1);
        }

        .theme-matrix .srmx-nav-btn:hover {
          color: #fff;
          text-shadow: 0 0 8px var(--accent);
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
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          isolation: isolate;
          transition:
            color 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 220ms ease,
            box-shadow 220ms ease;
        }

        .nav-label {
          letter-spacing: 0.09em;
          font-weight: 760;
          line-height: 1;
          text-rendering: geometricPrecision;
          font-feature-settings: "kern" 1, "liga" 1;
        }

        .srmx-nav-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }

        .srmx-nav-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 65%);
          transform: scale(0.35);
          opacity: 0;
          pointer-events: none;
        }

        .srmx-nav-btn::after {
          content: "";
          position: absolute;
          left: 8%;
          right: 8%;
          bottom: 2px;
          height: 2px;
          border-radius: 99px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%);
          opacity: 0;
          transform: scaleX(0.45);
          transform-origin: center;
          pointer-events: none;
          transition: opacity 240ms ease, transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
        }

        .srmx-nav-btn:active {
          transform: scale(0.92) translateY(1px);
        }

        .srmx-nav-btn:active::before {
          animation: navTapRipple 360ms ease-out;
        }

        .srmx-nav-settings-btn {
          flex-shrink: 0 !important;
          font-size: 16px;
          padding-left: 4px;
        }

        .srmx-nav-btn.active {
          color: var(--text-primary);
          animation: navActivePop 340ms cubic-bezier(0.2, 0.9, 0.2, 1);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        .srmx-nav-btn.active .nav-label {
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.16);
        }

        .theme-matrix .srmx-nav-btn.active {
          box-shadow: inset 0 0 0 1px rgba(168, 194, 0, 0.22), 0 8px 18px rgba(0, 0, 0, 0.3);
        }

        .srmx-nav-btn.active::after {
          opacity: 0.92;
          transform: scaleX(1);
          animation: navShimmer 900ms ease-out 1;
        }

        @keyframes navTapRipple {
          0% { opacity: 0.45; transform: scale(0.35); }
          100% { opacity: 0; transform: scale(1.75); }
        }

        @keyframes navActivePop {
          0% { transform: scale(0.92); }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }

        @keyframes navShimmer {
          0% { opacity: 0.6; transform: scaleX(0.6); }
          50% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0.82; transform: scaleX(1); }
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

        @media (prefers-reduced-motion: reduce) {
          .srmx-nav-btn,
          .srmx-nav-btn::before,
          .srmx-nav-btn::after,
          .srmx-nav-btn.active {
            animation: none !important;
            transition: none !important;
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
          .theme-matrix .srmx-nav-bar {
            border: 1px solid var(--accent);
            box-shadow: 0 0 20px rgba(168, 194, 0, 0.2);
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
            background: "var(--bg-surface)", 
            padding: "24px", 
            borderRadius: "28px",
            width: "90%", 
            maxWidth: "400px", 
            display: "flex", 
            flexDirection: "column", 
            gap: "24px",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, marginBottom: "20px" }}>
                Control Center
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button 
                  onClick={() => { setMenuOpen(false); router.push("/settings/theme"); }}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "12px",
                    padding: "18px", borderRadius: "20px", cursor: "pointer", fontWeight: 800,
                    textAlign: "left", fontSize: "14px", transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                >
                  🎭 Personalize Interface
                </button>

                <button 
                  onClick={async () => {
                    const shareData = {
                      title: 'SRM Nexus',
                      text: 'Check out SRM Nexus - The Ultimate Student Portal for SRM Students!',
                      url: 'https://srmnexus.app',
                    };
                    if (navigator.share) {
                      try { await navigator.share(shareData); } catch (err) { console.log(err); }
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`, '_blank');
                    }
                  }}
                  style={{
                    background: "rgba(168, 194, 0, 0.1)",
                    border: "1px solid rgba(168, 194, 0, 0.3)", color: "var(--accent)", display: "flex", alignItems: "center", gap: "12px",
                    padding: "18px", borderRadius: "20px", cursor: "pointer", fontWeight: 800,
                    textAlign: "left", fontSize: "14px", transition: "all 0.2s"
                  }}
                >
                  🚀 Share Nexus Portal
                </button>
              </div>
            </div>

            <div style={{ height: "1px", background: "var(--border)" }} />

            <button 
              onClick={handleLogout}
              style={{
                background: "rgba(255, 59, 59, 0.1)", color: "#ff3b3b", border: "1px solid #ff3b3b",
                padding: "18px", borderRadius: "20px", fontSize: "13px", fontWeight: 900,
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.15em"
              }}
            >
              Terminate Session
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
              <span className="nav-label">{label}</span>
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

  if (!mounted) return null;
  return createPortal(navContent, document.body);
}
