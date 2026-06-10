"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UserSquare, 
  Award, 
  Bed, 
  Bus, 
  CreditCard, 
  FileText, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import LoadingSkeleton from "@/components/aura-theme/LoadingSkeleton";

const SERVICES = [
  {
    name: "Identity Vault",
    sub: "STUDENT_PROFILE",
    desc: "Personal details, parental linkages, advisor details, and department settings.",
    icon: UserSquare,
    color: "#BF5AF2",
    bg: "rgba(191, 90, 242, 0.1)",
    href: "/portal/student-dashboard"
  },
  {
    name: "Grades & Records",
    sub: "ACADEMIC_LEDGER",
    desc: "Detailed semester grades, total earned credits, arrears, and evaluated records.",
    icon: Award,
    color: "#00E5FF",
    bg: "rgba(0, 229, 255, 0.1)",
    href: "/portal/grade-mark-credit"
  },
  {
    name: "Hostel & Booking",
    sub: "HOSTEL_PORTAL",
    desc: "Room details, block booking status, warden information, and student hostel records.",
    icon: Bed,
    color: "#FF2D55",
    bg: "rgba(255, 45, 85, 0.1)",
    href: "/portal/hostel-booking"
  },
  {
    name: "Transport & Bus",
    sub: "TRANSPORT_PORTAL",
    desc: "Bus route coordinates, bus timings, allocated routes, and stop locations.",
    icon: Bus,
    color: "#34C759",
    bg: "rgba(52, 199, 89, 0.1)",
    href: "/portal/transport-bus"
  },
  {
    name: "Fee Ledger",
    sub: "FINANCE_PORTAL",
    desc: "Receipt summaries, active payment links, tuition fees, and outstanding balances.",
    icon: CreditCard,
    color: "#FF9500",
    bg: "rgba(255, 149, 0, 0.1)",
    href: "/portal/fees-ledger"
  },
  {
    name: "Exam Hall Ticket",
    sub: "ACADEMICS_OS",
    desc: "Seat allocations, exam dates, exam rooms, and dynamic hall ticket access.",
    icon: FileText,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.1)",
    href: "/portal/hall-ticket"
  }
];

export default function PortalHubPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<"lumina" | "light">("lumina");

  useEffect(() => { 
    const id = setTimeout(() => setMounted(true), 0); 
    return () => clearTimeout(id); 
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolve = () => {
      if (theme === "system") {
        setResolvedTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "lumina");
      } else {
        setResolvedTheme(theme === "light" ? "light" : "lumina");
      }
    };
    resolve();
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      media.addEventListener("change", resolve);
      return () => media.removeEventListener("change", resolve);
    }
  }, [theme, mounted]);

  if (!mounted) return <LoadingSkeleton />;

  const isLight = resolvedTheme === "light";

  return (
    <div style={{ background: isLight ? "var(--app-bg, #f7f5ff)" : "#050508", minHeight: "100dvh", display: "flex", flexDirection: "column", color: isLight ? "#15111d" : "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        .aura-blob {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; filter: blur(140px);
          opacity: ${isLight ? 0.05 : 0.08}; pointer-events: none; z-index: 0;
        }
        .aura-purple { 
          background: #BF5AF2; 
          top: -200px; right: -200px; 
          animation: drift-purple 20s infinite ease-in-out;
        }
        .aura-cyan { 
          background: #00E5FF; 
          bottom: -200px; left: -200px; 
          animation: drift-cyan 25s infinite ease-in-out;
        }
        @keyframes drift-purple {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.08); }
          66% { transform: translate(-30px, 30px) scale(0.92); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift-cyan {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.12); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .service-card {
          position: relative;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .service-card:hover {
          transform: translateY(-2px) scale(1.01);
          border-color: var(--card-border) !important;
          box-shadow: ${
            isLight
              ? '0 12px 30px rgba(124, 58, 237, 0.04), 0 0 22px var(--card-glow)'
              : '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 25px var(--card-glow)'
          };
        }
      `}} />

      {/* Glowing Aura Background Elements */}
      <div className="aura-blob aura-purple" />
      <div className="aura-blob aura-cyan" />

      {/* Main Container */}
      <main style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, padding: "60px 24px 140px", width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        
        {/* Navigation & Header */}
        <header style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button 
            onClick={() => router.push("/dashboard")}
            style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "12px", 
              background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)", 
              border: isLight ? "1px solid rgba(0,0,0,0.05)" : "1px solid rgba(255,255,255,0.08)", 
              color: isLight ? "#15111d" : "#fff", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer",
              transition: "transform 0.2s active"
            }}
            className="active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: "10px", color: isLight ? "#8b5cf6" : "#BF5AF2", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>Nexus Bridge Node</div>
            <h1 style={{ fontSize: "22px", fontWeight: 900, margin: "2px 0 0", letterSpacing: "-0.02em" }}>Student Portal</h1>
          </div>
        </header>

        {/* Dynamic Card Hub Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {SERVICES.map((srv) => {
            const Icon = srv.icon;
            return (
              <button
                key={srv.name}
                onClick={() => router.push(srv.href)}
                style={{
                  background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(20px)",
                  border: isLight ? "1px solid rgba(0,0,0,0.04)" : "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "24px",
                  padding: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  "--card-glow": `${srv.color}20`,
                  "--card-border": `${srv.color}35`
                } as React.CSSProperties}
                className="service-card group"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
                  {/* Glowing Icon Container */}
                  <div 
                    style={{ 
                      width: "48px", 
                      height: "48px", 
                      borderRadius: "16px", 
                      background: srv.bg, 
                      color: srv.color, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      border: `1px solid ${srv.color}20`,
                      flexShrink: 0
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  {/* Text Details */}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span 
                        style={{ 
                          fontSize: "8px", 
                          fontWeight: 900, 
                          color: srv.color, 
                          textTransform: "uppercase", 
                          letterSpacing: "0.08em",
                          background: `${srv.color}15`,
                          padding: "2px 6px",
                          borderRadius: "6px",
                          border: `1px solid ${srv.color}25`
                        }}
                      >
                        {srv.sub}
                      </span>
                      <span
                        style={{
                          fontSize: "7.5px",
                          fontWeight: 800,
                          color: isLight ? "rgba(21,17,29,0.4)" : "rgba(255,255,255,0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}
                      >
                        • {srv.name === "Identity Vault" || srv.name === "Grades & Records" ? "Core API" : "Live Feed"}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "14px", fontWeight: 800, margin: "2px 0 4px", color: isLight ? "#15111d" : "#fff" }}>{srv.name}</h3>
                    <p style={{ fontSize: "11px", color: isLight ? "rgba(21,17,29,0.5)" : "rgba(255,255,255,0.4)", margin: 0, fontWeight: 500, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{srv.desc}</p>
                  </div>
                </div>

                <ChevronRight 
                  size={16} 
                  color={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"} 
                  style={{ marginLeft: "12px", flexShrink: 0 }}
                  className="group-hover:translate-x-0.5 transition-all duration-300"
                />
              </button>
            );
          })}
        </div>

      </main>
    </div>
  );
}
