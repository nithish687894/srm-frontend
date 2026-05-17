"use client";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function CosmosDashboard({ 
  data, riskCount, avgAtt, avgMarks, totalCourses, 
  targetClasses, nextClass, recentTop5, initials, 
  firstName, dayOrder, isHoliday, onShowStudentInfo, 
  broadcast, setIsSyncModalOpen, renderAcademicIntegrityHub, 
  userBatch, totalHours, presentHours, absentHours,
  fmtTimeOnly, fmt12, BroadcastBanner
}: any) {
  const router = useRouter();
  const marksPct = parseFloat(avgMarks as string) || 0;
  const profile = data?.profile || {};
  const regNo = profile["Registration Number"] || "";
  const batchDisplay = profile["Combo / Batch"] || profile["Batch"] || (userBatch ? `Batch ${userBatch}` : "");

  return (
    <div style={{ background: "transparent", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FFFFFF", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "16px", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", gap: "12px" }}>
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg, #eef2ff 0%, #a5b4fc 50%, #fbcfe8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome back, {firstName}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Let&apos;s continue where you left off
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isHoliday ? "Today: Holiday" : `Today: Day Order ${dayOrder || "—"}`}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <div 
              onClick={onShowStudentInfo}
              style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #3055d7, #d946ef)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 15px rgba(217, 70, 239, 0.28)", cursor: "pointer" }}>
              {initials}
            </div>
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "4px 8px", borderRadius: "8px", fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}
            >
              Unlock More
            </button>
          </div>
        </div>

        <div className="min-card" style={{ padding: "10px 14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", borderRadius: "999px", background: "rgba(13, 20, 46, 0.6)" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "12px" }}>
            <span style={{ opacity: 0.8 }}>🔎</span>
            Search courses, assessments...
          </div>
          <div style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: "999px", padding: "6px 14px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", boxShadow: "0 2px 10px rgba(139, 92, 246, 0.35)" }}>
            AI Tutor
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "Enrolled", value: totalCourses, sub: "Courses", tone: "#00f0ff", shadow: "rgba(0, 240, 255, 0.16)" },
            { label: "Attendance", value: `${avgAtt}%`, sub: "Health", tone: "#f59e0b", shadow: "rgba(245, 158, 11, 0.16)", href: "/attendance" },
            { label: "Academics", value: `${avgMarks}%`, sub: "Average", tone: "#00E676", shadow: "rgba(0, 230, 118, 0.16)", href: "/marks" },
            { label: "At Risk", value: riskCount, sub: "Focus", tone: "#d946ef", shadow: "rgba(217, 70, 239, 0.18)", href: "/attendance?risk=1" },
          ].map((card, i) => (
            <div key={i} className="min-card" onClick={card.href ? () => router.push(card.href) : undefined} style={{ padding: "12px", borderRadius: "16px", borderTop: `1px solid ${card.tone}`, boxShadow: `0 8px 18px ${card.shadow}`, cursor: card.href ? "pointer" : "default" }}>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{card.label}</div>
              <div style={{ fontSize: "24px", fontWeight: 800, lineHeight: 1.1, color: "#fff" }}>{card.value}</div>
              <div style={{ fontSize: "10px", color: card.tone, marginTop: "6px", fontWeight: 700 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div className="min-card" style={{ padding: "18px", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1.1 }}>Continue Learning</div>
              <button onClick={() => router.push("/marks")} style={{ background: "none", border: "none", color: "#00f0ff", cursor: "pointer", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>View All</button>
            </div>
            <div style={{ background: "linear-gradient(145deg, rgba(59,130,246,0.15), rgba(124,58,237,0.12))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px", color: "#fff" }}>{nextClass?.courseTitle || "No upcoming class"}</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>{nextClass?.courseCode || "Schedule is clear for now"}</div>
              <div style={{ marginTop: "14px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}>
                <div style={{ width: "72%", height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #00f0ff, #d946ef)", boxShadow: "0 0 10px rgba(217, 70, 239, 0.4)" }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            {renderAcademicIntegrityHub("default")}
          </div>

          <div className="min-card" style={{ padding: "18px", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1.1 }}>Today&apos;s Schedule</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  {isHoliday ? "Holiday" : `Day ${dayOrder || "—"}`}
                </span>
                <button onClick={() => router.push("/timetable")} style={{ background: "none", border: "none", color: "#00f0ff", cursor: "pointer", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Calendar</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {targetClasses.length === 0 && (
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No classes planned.</div>
              )}
              {targetClasses.slice(0, 3).map((cls: any, i: number) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: "10px", background: "rgba(13, 20, 46, 0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", padding: "10px 12px", alignItems: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--accent-secondary)", fontWeight: 800, lineHeight: 1.2 }}>{fmt12(cls.startTime).replace(" ", "\n")}</div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{cls.courseTitle}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 600 }}>{cls.roomNo || "TBA"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {[
            { key: "marks", label: "Marks", value: `${avgMarks}%`, pct: marksPct, color: "#60A5FA", onClick: () => router.push("/marks") },
            { key: "risk", label: "Risk", value: `${riskCount}`, pct: Math.min((riskCount / Math.max(totalCourses || 1, 1)) * 100, 100), color: "#EF4444", onClick: () => router.push("/attendance?risk=1") },
            { key: "Recent", label: "Recent", value: `${recentTop5.length}`, pct: Math.min((recentTop5.length / 5) * 100, 100), color: "#8B5CF6" },
          ].map((s) => {
            const r = 18;
            const c = 2 * Math.PI * r;
            const offset = c * (1 - s.pct / 100);
            return (
              <div key={s.key} onClick={s.onClick} className="min-card" style={{ padding: "10px 8px", textAlign: "center", cursor: s.onClick ? "pointer" : "default", background: "rgba(255,255,255,0.03)" }}>
                <svg width="50" height="50" viewBox="0 0 50 50" style={{ marginBottom: "6px" }}>
                  <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                  <circle cx="25" cy="25" r={r} fill="none" stroke={s.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 25 25)" />
                </svg>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "3px", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "12px" }}>
          {regNo} {batchDisplay ? `• ${batchDisplay}` : ""}
        </div>
      </main>
    </div>
  );
}
