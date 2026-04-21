"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const GRADE_TABLE = [
  { min: 91, grade: "O",  points: 10, color: "#a8c200" },
  { min: 81, grade: "A+", points: 9,  color: "#a8c200" },
  { min: 71, grade: "A",  points: 8,  color: "#ffffff" },
  { min: 61, grade: "B+", points: 7,  color: "#888888" },
  { min: 51, grade: "B",  points: 6,  color: "#666666" },
  { min: 0,  grade: "C",  points: 5,  color: "#ff3b3b" },
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
  const gpaStatus = gpa >= 9 ? "OUTSTANDING" : gpa >= 8 ? "EXCELLENT" : gpa >= 7 ? "GOOD" : gpa >= 6 ? "AVERAGE" : "NEEDS IMPROVEMENT";
  const gpaColor = gpa < 6 ? "#ff3b3b" : "#ffffff";

  return (
    <div className="page-root">
      <Sidebar />

      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "140px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "#666666", textTransform: "uppercase" }}>
              estimated gpa
            </div>
            <div style={{ fontSize: "120px", fontWeight: 900, color: gpaColor, lineHeight: 1, letterSpacing: "-0.05em" }}>
              {gpa.toFixed(2)}
            </div>
            <div style={{ fontSize: "16px", color: gpaColor, fontWeight: "bold", letterSpacing: "0.1em" }}>
              {gpaStatus}
            </div>
          </div>

          <div style={{ padding: "24px", background: "#1c1c1c", borderRadius: "20px", marginBottom: "32px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "16px" }}>
            {GRADE_TABLE.map(g => (
              <div key={g.grade} style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: rows.some(r => r.grade.grade === g.grade) ? 1 : 0.3 }}>
                <span style={{ fontSize: "24px", fontWeight: 900, color: g.color }}>{g.grade}</span>
                <span style={{ fontSize: "10px", color: "#888888", letterSpacing: "0.1em" }}>{g.points} PTS</span>
                <span style={{ fontSize: "10px", color: "#555555" }}>{g.min === 0 ? "< 51" : `≥ ${g.min}`}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "11px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>simulate scores</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {rows.map((r, i) => (
              <div key={r.code} style={{
                borderRadius: "20px", padding: "24px",
                background: "#1c1c1c",
                display: "flex", alignItems: "center", gap: "24px",
                flexWrap: "wrap"
              }}>
                <div style={{ width: "64px", flexShrink: 0, textAlign: "center" }}>
                  <div style={{ fontSize: "36px", fontWeight: 900, color: r.grade.color }}>{r.grade.grade}</div>
                  <div style={{ fontSize: "10px", color: "#666666", fontWeight: "bold", marginTop: "4px" }}>{r.grade.points} PTS</div>
                </div>

                <div style={{ flex: 1, minWidth: "160px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ffffff", marginBottom: "4px" }}>{r.code}</div>
                  <div style={{ fontSize: "12px", color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                </div>

                <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Internal ({r.intMark})</div>
                    <input type="range" min={0} max={50} value={r.intMark}
                      onChange={e => setInternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                      style={{ width: "100px", accentColor: "#ffffff" }} />
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>External ({r.extMark})</div>
                    <input type="range" min={0} max={50} value={r.extMark}
                      onChange={e => setExternals(p => ({ ...p, [r.code]: parseInt(e.target.value) }))}
                      style={{ width: "100px", accentColor: "#888888" }} />
                  </div>

                  <div style={{ textAlign: "right", minWidth: "60px" }}>
                    <div style={{ fontSize: "10px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Total</div>
                    <div style={{ fontSize: "32px", fontWeight: 900, color: r.grade.color }}>{r.total}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="watermark">gpa calculator</div>
        </div>
      </main>
    </div>
  );
}
