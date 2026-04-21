"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AttendanceCard from "@/components/AttendanceCard";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";

export default function AttendancePage() {
  const { ready } = useAuth();
  const { academicData, setAcademicData } = useAuthStore();
  const [att, setAtt] = useState<any[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.attendance);

  const router = useRouter();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!ready) return;
    if (academicData?.attendance) setLoading(false);
    dataAPI.getAttendance()
      .then(d => { setAtt(d.data || []); setAcademicData({ ...academicData, attendance: d.data || [] }); setLoading(false); })
      .catch(() => { if (!att.length) router.push("/"); });
  }, [ready]);

  const filtered = att.filter(c =>
    filter === "all" ? true : filter === "safe" ? parseFloat(c["Attn %"]) >= 75 : parseFloat(c["Attn %"]) < 75
  );

  const safeCount = att.filter(c => parseFloat(c["Attn %"]) >= 75).length;
  const riskCount = att.filter(c => parseFloat(c["Attn %"]) < 75).length;
  const avgAtt = att.length
    ? (att.reduce((s, c) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";

  const filters = [
    { key: "all",  label: "All",     count: att.length },
    { key: "safe", label: "Safe",    count: safeCount },
    { key: "risk", label: "At Risk", count: riskCount },
  ];

  return (
    <div className="page-root">
      <div className="orb orb-green-1" />
      <div className="orb orb-green-2" />
      <div className="bg-grid" />
      <Sidebar />

      <main className="page-main">
        <div className="srmx-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(126,203,161,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="2" width="12" height="14" rx="2" stroke="#7ecba1" strokeWidth="1.5"/>
                <path d="M6 7h6M6 10h4" stroke="#7ecba1" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#e8f0f4", letterSpacing: "-0.3px" }}>Attendance</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 500,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "7px",
                  transition: "all 0.2s", border: "none",
                  background: filter === f.key ? "linear-gradient(135deg, #7ecba1, #5aaf85)" : "rgba(255,255,255,0.05)",
                  color: filter === f.key ? "#1a3028" : "rgba(232,240,244,0.45)",
                }}>
                {f.label}
                <span style={{
                  padding: "1px 7px", borderRadius: "999px", fontSize: "10px", fontWeight: 600,
                  background: filter === f.key ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.08)",
                  color: filter === f.key ? "#1a3028" : "rgba(232,240,244,0.30)",
                }}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="page-content">
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
              {[
                { label: "Average", value: `${avgAtt}%`, sub: "Overall attendance", color: "#7ecba1" },
                { label: "Safe", value: safeCount, sub: "Subjects ≥ 75%", color: "#7eb8c4" },
                { label: "At Risk", value: riskCount, sub: "Subjects < 75%", color: "#c47b7b" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#3a4f5c", border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${s.color}90, transparent)`, borderRadius: "14px 14px 0 0" }} />
                  <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase", color: "rgba(232,240,244,0.35)", marginBottom: "10px" }}>{s.label}</div>
                  <div style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "rgba(232,240,244,0.38)", marginTop: "6px" }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: "16px" }}>
              <div className="srmx-spinner" />
              <span style={{ fontSize: "14px", color: "rgba(232,240,244,0.38)" }}>Fetching attendance data…</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(232,240,244,0.40)", letterSpacing: "1.2px", textTransform: "uppercase" }}>Subjects</span>
                <span style={{ fontSize: "11px", color: "rgba(232,240,244,0.28)" }}>{filtered.length} shown</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
                {filtered.map((c: any) => (
                  <AttendanceCard key={c["Course Code"] + c["Category"]} course={c} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .page-content > div:first-child { grid-template-columns: 1fr !important; }
          .page-content > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
