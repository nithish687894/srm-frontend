"use client";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/marks",      label: "MARKS" },
  { href: "/attendance", label: "ATTND" },
  { href: "/dashboard",  label: "HOME" },
  { href: "/timetable",  label: "TIME" },
  { href: "/calendar",   label: "CAL" },
];

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();

  return (
    <>
      <style>{`
        .srmx-nav-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: calc(72px + env(safe-area-inset-bottom));
          padding-bottom: env(safe-area-inset-bottom);
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          z-index: 100;
        }

        .srmx-nav-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
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
            top: 0; bottom: auto;
            height: 80px;
            padding-bottom: 0;
            justify-content: center;
            gap: 48px;
          }
        }
      `}</style>
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
      </nav>
    </>
  );
}