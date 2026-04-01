"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";
import { Clock, BookCheck, AlertTriangle, FileText } from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, variant, delay = 0 }: any) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const variants: any = {
    green: { bg: "rgba(0,255,135,0.06)",  iconBg: "rgba(0,255,135,0.12)",  text: "#00ff87",  bar: "#00ff87" },
    cyan:  { bg: "rgba(0,229,255,0.06)",  iconBg: "rgba(0,229,255,0.12)",  text: "#00e5ff",  bar: "#00e5ff" },
    red:   { bg: "rgba(255,71,87,0.06)",   iconBg: "rgba(255,71,87,0.12)",  text: "#ff4757",  bar: "#ff4757" },
    blue:  { bg: "rgba(77,142,255,0.06)",  iconBg: "rgba(77,142,255,0.12)", text: "#4d8eff",  bar: "#4d8eff" },
  };
  const v = variants[variant] || variants.green;

  return (
    <div style={{
      borderRadius: "16px",
      padding: "22px 24px",
      background: v.bg,
      border: "1px solid rgba(255,255,255,0.05)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(18px)",
      position: "relative",
      overflow: "hidden",
      cursor: "default",
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,255,135,0.15)")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${v.bar}, transparent)`, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: "rgba(255,255,255,0.28)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "2px" }}>{title}</p>
          <p style={{ fontSize: "32px", fontWeight: "800", color: v.text, marginBottom: "6px", lineHeight: 1 }}>{value}</p>
          {subtitle && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>{subtitle}</p>}
        </div>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: v.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={v.text} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { ready } = useAuth();
  const { setProfile } = useAuthStore();

  useEffect(() => {
    if (!ready) return;
    dataAPI.getAll()
      .then(d => { setData(d); if (d.profile) setProfile(d.profile); setLoading(false); })
      .catch(() => router.push("/"));
  }, [ready]);

  const att = data?.attendance || [];
  const avg = att.length
    ? (att.reduce((s: number, c: any) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";
  const risk = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;
  const theoryCount = att.filter((c: any) => c["Category"] === "Theory").length;
  const labCount = att.filter((c: any) => c["Category"] === "Practical").length;
  const firstName = data?.profile?.["Name"]?.split(" ")[0] || "Student";

  if (loading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#050505", flexDirection: "column", gap: "18px" }}>
      <div className="srmx-spinner" />
      <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "14px", letterSpacing: "0.3px" }}>Loading your portal…</p>
    </div>
  );

  return (
    <div className="page-root">
      <div className="orb orb-green-1" />
      <div className="orb orb-green-2" />
      <div className="bg-grid" />
      <Sidebar />

      <main className="page-main">
        <div className="srmx-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(0,255,135,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#00ff87" strokeWidth="1.5"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#00ff87" strokeWidth="1.5"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#00ff87" strokeWidth="1.5"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#00ff87" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Dashboard</span>
          </div>
          <span className="neon-badge">
            Sem {data?.profile?.["Semester"]} · {data?.profile?.["Specialization"]}
          </span>
        </div>

        <div className="page-content">
          {/* Greeting */}
          <div style={{ marginBottom: "32px", animation: "fadeUp 0.6s ease" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: "6px", lineHeight: 1.2 }}>
              Welcome back, <span style={{ color: "#00ff87", fontStyle: "italic" }}>{firstName}</span>
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.28)", lineHeight: 1.6 }}>
              Here&apos;s what&apos;s happening with your academics today.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "36px" }}>
            <StatCard
              title="Overall Attendance"
              value={avg + "%"}
              subtitle="This semester"
              icon={Clock}
              variant={parseFloat(avg) >= 75 ? "green" : "red"}
              delay={0}
            />
            <StatCard
              title="Total Courses"
              value={att.length}
              subtitle={`${theoryCount} Theory · ${labCount} Lab`}
              icon={BookCheck}
              variant="cyan"
              delay={100}
            />
            <StatCard
              title="Subjects at Risk"
              value={risk}
              subtitle={risk > 0 ? "Need attention" : "All safe!"}
              icon={AlertTriangle}
              variant={risk > 0 ? "red" : "green"}
              delay={200}
            />
            <StatCard
              title="Mark Entries"
              value={data?.marks?.length || 0}
              subtitle="Recorded tests"
              icon={FileText}
              variant="blue"
              delay={300}
            />
          </div>

          {/* Attendance Grid */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Subject-wise Attendance</span>
            <span className="neon-badge">{att.length} subjects</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
            {att.map((c: any) => (
              <AttendanceCard key={c["Course Code"] + c["Category"]} course={c} />
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 1200px) {
          .page-content > div:nth-child(2) { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .page-content > div:nth-child(2) { grid-template-columns: 1fr !important; }
          .page-content > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
