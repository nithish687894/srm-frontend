"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const GRADE_TABLE = [
  { min: 91, grade: "O",  points: 10, color: "#00ff87" },
  { min: 81, grade: "A+", points: 9,  color: "#00e676" },
  { min: 71, grade: "A",  points: 8,  color: "#00e5ff" },
  { min: 61, grade: "B+", points: 7,  color: "#4d8eff" },
  { min: 51, grade: "B",  points: 6,  color: "#b388ff" },
  { min: 0,  grade: "C",  points: 5,  color: "#ff4757" },
];

function getGrade(pct: number) {
  return GRADE_TABLE.find(g => pct >= g.min) || GRADE_TABLE[GRADE_TABLE.length - 1];
}

export default function GPAPage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internals, setInternals] = useState<Record<string, number>>({});
  const [externals, setExternals] = useState<Record<string, number>>({});
  const router = useRouter();
  const { ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    Promise.all([dataAPI.getAttendance(), dataAPI.getMarks()])
      .then(([a, m]) => {
        setAttendance(a.data || []);
        setMarks(m.data || []);
        const init: Record<string, number> = {};
        (m.data || []).forEach((mk: any) => {
          const scored = mk.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
          const maxTotal = mk.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
          if (maxTotal > 0) init[mk.courseCode] = Math.round((scored / maxTotal) * 50);
        });
        setInternals(init);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [ready]);

  const theorySubjects = attendance.filter(c => c["Category"] === "Theory");

  const rows = theorySubjects.map(c => {
    const code = c["Course Code"];
    const intMark = internals[code] ?? 25;
    const extMark = externals[code] ?? 60;
    const total = Math.min(intMark, 50) + Math.min(extMark, 50);
    const grade = getGrade(total);
    return { code, title: c["Course Title"], intMark, extMark, total, grade };
  });

  const gpa = rows.length > 0 ? rows.reduce((s, r) => s + r.grade.points, 0) / rows.length : 0;
  const gpaColor = gpa >= 9 ? "#00ff87" : gpa >= 7 ? "#00e5ff" : gpa >= 6 ? "#4d8eff" : "#ff4757";
  const gpaStatus = gpa >= 9 ? "Outstanding" : gpa >= 8 ? "Excellent" : gpa >= 7 ? "Good" : gpa >= 6 ? "Average" : "Needs improvement";

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
                <path d="M9 2l1.8 3.6 4 .6-2.9 2.8.7 4L9 11l-3.6 1.9.7-4L3.2 6.2l4-.6L9 2z" stroke="#00ff87" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>GPA Calculator</span>
          </div>
          <span className="neon-badge">Internal (0–50) + External (0–50)</span>
        </div>

        <div className="page-content">
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "12px" }}>
              <div className="srmx-spinner" style={{ width: "32px", height: "32px" }} />
              <span style={{ color: "rgba(255,255,255,0.22)" }}>Loading subjects…</span>
            </div>
          ) : (
            <>
              {/* GPA Hero */}
              <div style={{
                borderRadius: "20px", padding: "28px 32px",
                background: "rgba(10,10,10,0.55)", border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between",
                position: "relative", overflow: "hidden", transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,255,135,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #00ff87, #00e676)", borderRadius: "20px 20px 0 0" }} />
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>Estimated GPA</div>
                  <div style={{ fontSize: "72px", fontWeight: 800, lineHeight: 1, letterSpacing: "-2px", color: gpaColor }}>{gpa.toFixed(2)}</div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.30)", marginTop: "10px" }}>{gpaStatus}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                  {GRADE_TABLE.map(g => (
                    <div key={g.grade} style={{ display: "flex", alignItems: "center", gap: "10px", opacity: rows.some(r => r.grade.grade === g.grade) ? 1 : 0.2 }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)", width: "50px", textAlign: "right" }}>
                        {g.min === 0 ? "< 51" : `≥ ${g.min}`}%
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: g.color, width: "26px" }}>{g.grade}</span>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)" }}>{g.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "14px" }}>Drag sliders to simulate your GPA</div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {rows.map((r, i) => (
                  <div key={r.code} style={{
                    borderRadius: "14px", padding: "14px 18px",
                    background: "rgba(10,10,10,0.45)", border: "1px solid rgba(255,255,255,0.05)",
                    backdropFilter: "blur(12px)",
                    display: "flex", alignItems: "center", gap: "14px", transition: "border-color 0.2s",
                    animation: `cardIn 0.35s ${i * 0.04}s both`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,255,135,0.15)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
                  >
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${r.grade.color}12`, border: `1px solid ${r.grade.color}25` }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: r.grade.color }}>{r.grade.grade}</span>
                      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.28)", marginTop: "1px" }}>{r.grade.points} pts</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)", fontFamily: "monospace", marginTop: "2px" }}>{r.code}</div>
                    </div>

                    <div style={{ textAlign: "center", width: "96px", flexShrink: 0 }}>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Internal</div>
                      <input type="range" min={0} max={50} value={r.intMark}
                        onChange={e => setInternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                        style={{ width: "80px", accentColor: "#00ff87" }} />
                      <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px", color: "#00ff87" }}>{r.intMark}</div>
                    </div>

                    <div style={{ textAlign: "center", width: "96px", flexShrink: 0 }}>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>External</div>
                      <input type="range" min={0} max={50} value={r.extMark}
                        onChange={e => setExternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                        style={{ width: "80px", accentColor: "#00e5ff" }} />
                      <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px", color: "#00e5ff" }}>{r.extMark}</div>
                    </div>

                    <div style={{ textAlign: "right", width: "48px", flexShrink: 0 }}>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)", marginBottom: "3px" }}>Total</div>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: r.grade.color }}>{r.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .page-content > div:nth-child(1) { flex-direction: column !important; gap: 20px !important; align-items: flex-start !important; }
          .page-content > div:last-child > div { flex-wrap: wrap !important; gap: 10px !important; }
        }
      `}</style>
    </div>
  );
}
