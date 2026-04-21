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

const THEMES = [
  { id: "", label: "Midnight Void", color: "#000000" },
  { id: "theme-cyberpunk", label: "Neon Cyberpunk", color: "#140b2e" },
  { id: "theme-arctic", label: "Arctic Chill", color: "#0b1622" },
  { id: "theme-matcha", label: "Matcha Zen", color: "#091a0d" },
  { id: "theme-crimson", label: "Crimson Overdrive", color: "#240606" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("srmx-theme") || "";
    document.body.className = t;
    setActiveTheme(t);
  }, []);

  const handleTheme = (t: string) => {
    document.body.className = t;
    localStorage.setItem("srmx-theme", t);
    setActiveTheme(t);
  };

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
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          z-index: 100;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .srmx-nav-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: #555555;
          font-weight: 500;
          transition: color 0.2s, font-weight 0.2s;
          padding: 10px 0;
        }

        .srmx-nav-btn.active {
          color: #ffffff;
          font-weight: 800;
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
            gap: 48px;
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
                Select Theme
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {THEMES.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => handleTheme(t.id)}
                    style={{
                      background: activeTheme === t.id ? "#333" : "transparent",
                      border: "none", color: "#fff", display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 16px", borderRadius: "12px", cursor: "pointer", fontWeight: 600,
                      textAlign: "left"
                    }}
                  >
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: t.color, border: "2px solid #555" }} />
                    {t.label}
                  </button>
                ))}
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
          className="srmx-nav-btn"
          style={{ fontSize: "16px", paddingLeft: "8px", color: menuOpen ? "#fff" : "#555" }}
        >
          ⚙️
        </button>
      </nav>
    </>
  );
}