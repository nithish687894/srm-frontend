"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",   icon: HomeIcon },
  { href: "/attendance", label: "Attendance",   icon: ChartIcon },
  { href: "/marks",      label: "Marks",        icon: StarIcon },
  { href: "/timetable",  label: "Timetable",    icon: CalIcon },
  { href: "/calendar",   label: "Calendar",     icon: CalendarIcon },
  { href: "/gpa",        label: "GPA Calc",     icon: GpaIcon },
  { href: "/ai",         label: "AI Assistant", icon: BotIcon },
];

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuthStore();

  const initials = profile?.["Name"]
    ? profile["Name"].split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      <style>{`
        /* ── DESKTOP SIDEBAR ── */
        .srmx-sidebar {
          position: fixed; top: 0; left: 0;
          width: 260px; height: 100vh;
          background: rgba(8,8,8,0.92);
          border-right: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex; flex-direction: column;
          z-index: 100;
        }

        .srmx-logo-wrap {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .srmx-logo-name {
          font-size: 22px; font-weight: 800;
          letter-spacing: -0.5px; color: #fff;
        }

        .srmx-logo-name span { color: #00ff87; }

        .srmx-logo-sub {
          font-size: 9px; letter-spacing: 3px;
          color: rgba(255,255,255,0.20);
          text-transform: uppercase; margin-top: 3px;
        }

        .srmx-nav { flex: 1; padding: 12px 10px; overflow-y: auto; }

        .srmx-nav-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px; margin-bottom: 2px;
          border: 1px solid transparent;
          cursor: pointer; text-align: left;
          transition: all 0.15s;
          font-size: 13px; font-weight: 400;
          background: transparent;
          color: rgba(255,255,255,0.38);
        }

        .srmx-nav-btn:hover {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
        }

        .srmx-nav-btn.active {
          background: rgba(0,255,135,0.08);
          border-color: rgba(0,255,135,0.20);
          color: #00ff87;
          font-weight: 600;
        }

        .srmx-nav-dot {
          margin-left: auto; width: 5px; height: 5px;
          border-radius: 50%; background: #00ff87;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(0,255,135,0.5);
        }

        .srmx-profile-wrap {
          padding: 12px 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .srmx-profile-inner {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
        }

        .srmx-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #00ff87, #00e676);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #050505;
          flex-shrink: 0;
        }

        .srmx-profile-name {
          font-size: 12px; font-weight: 600; color: #f0f0f0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .srmx-profile-sem {
          font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 1px;
        }

        .srmx-logout-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.25); padding: 4px;
          border-radius: 6px; display: flex; transition: color 0.15s;
        }

        .srmx-logout-btn:hover { color: #ff4757; }

        .srmx-mobile-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 64px;
          background: rgba(8,8,8,0.95);
          border-top: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 100;
          align-items: center; justify-content: flex-start;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          padding: 0 10px;
          gap: 6px;
        }
        .srmx-mobile-nav::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }

        .srmx-mob-btn {
          display: flex; flex-direction: column;
          align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.28);
          padding: 8px 12px;
          transition: color 0.15s;
          min-width: 52px;
        }

        .srmx-mob-btn.active { color: #00ff87; }

        .srmx-mob-btn span {
          font-size: 10px; font-weight: 500;
        }

        .srmx-mob-btn.active span { font-weight: 700; }

        .srmx-mob-indicator {
          width: 4px; height: 4px; border-radius: 50%;
          background: #00ff87; margin-top: 1px;
          box-shadow: 0 0 6px rgba(0,255,135,0.5);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .srmx-sidebar { display: none !important; }
          .srmx-mobile-nav { display: flex !important; }
        }
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="srmx-sidebar">
        {/* Logo */}
        <div className="srmx-logo-wrap">
          <div className="srmx-logo-name">SRM<span>X</span></div>
          <div className="srmx-logo-sub">Student Portal</div>
        </div>

        {/* Nav */}
        <nav className="srmx-nav">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/dashboard" && path.startsWith(href));
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`srmx-nav-btn${active ? " active" : ""}`}
              >
                <Icon active={active} />
                {label}
                {active && <div className="srmx-nav-dot" />}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="srmx-profile-wrap">
          <div className="srmx-profile-inner">
            <div className="srmx-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="srmx-profile-name">{profile?.["Name"] || "Student"}</div>
              <div className="srmx-profile-sem">Sem {profile?.["Semester"] || "—"}</div>
            </div>
            <button className="srmx-logout-btn" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <nav className="srmx-mobile-nav">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`srmx-mob-btn${active ? " active" : ""}`}
            >
              <Icon active={active} />
              <span>{label.split(" ")[0]}</span>
              {active && <div className="srmx-mob-indicator" />}
            </button>
          );
        })}
      </nav>
    </>
  );
}

// ── Icons ──────────────────────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function ChartIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>;
}
function StarIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function CalIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
}
function CalendarIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>;
}
function GpaIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
}
function BotIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
}