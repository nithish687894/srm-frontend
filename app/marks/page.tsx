"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function ScoreRing({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.min((score / max) * 100, 100);
  const r = 18, sz = 50, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 4px ${color}80)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color, lineHeight: 1 }}>{score.toFixed(0)}</span>
        <span style={{ fontSize: "8px", color: "rgba(232,240,244,0.38)", lineHeight: 1 }}>/{max.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function MarksPage() {
  const { academicData, setAcademicData } = useAuthStore();
  const [marks, setMarks] = useState<any[]>(academicData?.marks || []);
  const [attendance, setAttendance] = useState<any[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.marks);
  const [selected, setSelected] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("srmx_token")) {
      router.push("/"); return;
    }
    if (academicData?.marks && academicData?.attendance) setLoading(false);
    Promise.all([dataAPI.getMarks(), dataAPI.getAttendance()])
      .then(([m, a]) => { 
        setMarks(m.data || []); 
        setAttendance(a.data || []); 
        setAcademicData({ ...academicData, marks: m.data || [], attendance: a.data || [] });
        setLoading(false); 
      })
      .catch(() => { if (!marks.length) router.push("/"); });
  }, []);

  const titleMap: Record<string, string> = {};
  attendance.forEach((c: any) => { titleMap[c["Course Code"]] = c["Course Title"]; });

  const totalScored = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => a + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0), 0);
  const totalMax = marks.reduce((s, m) =>
    s + (m.tests?.reduce((a: number, t: any) => { const [, mx] = t.test.split("/"); return a + (parseFloat(mx) || 0); }, 0) || 0), 0);
  const overallPct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
  const overallColor = overallPct >= 60 ? "#7ecba1" : overallPct >= 40 ? "#c4a97b" : "#c47b7b";

  return (
    <div className="page-root">
      <div className="orb orb-green-1" />
      <div className="orb orb-green-2" />
      <div className="bg-grid" />
      <Sidebar />

      <main className="page-main">
        <div className="srmx-topbar">
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#e8f0f4" }}>Internal Marks</span>
          {!loading && totalMax > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", color: "rgba(232,240,244,0.40)" }}>Overall</span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: overallColor }}>
                {totalScored.toFixed(1)} / {totalMax.toFixed(0)}
              </span>
              <div style={{ width: "80px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(overallPct, 100)}%`, background: overallColor, borderRadius: "99px" }} />
              </div>
            </div>
          )}
        </div>

        <div className="page-content">
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: "12px" }}>
              {[...Array(6)].map((_, i) => <div key={i} className="sk-card" style={{ height: "200px", animationDelay: `${i * 0.1}s` }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: "12px" }}>
              {marks.map((m: any, i: number) => {
                const title = titleMap[m.courseCode] || m.courseCode;
                const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
                const maxTotal = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;
                const totalPct = maxTotal > 0 ? (scored / maxTotal) * 100 : 0;
                const totalColor = totalPct >= 60 ? "#7ecba1" : totalPct >= 40 ? "#c4a97b" : "#c47b7b";
                const isOpen = selected === i;
                const isTheory = m.courseType === "Theory";

                return (
                  <div key={i}
                    onClick={() => setSelected(isOpen ? null : i)}
                    style={{
                      borderRadius: "14px", overflow: "hidden", cursor: "pointer",
                      background: isOpen ? "#3d5a50" : "#3a4f5c",
                      border: isOpen ? "1px solid rgba(126,203,161,0.25)" : "1px solid rgba(255,255,255,0.09)",
                      transition: "all 0.22s cubic-bezier(.22,1,.36,1)",
                      animation: `cardIn 0.4s ${i * 0.05}s both`,
                    }}
                  >
                    <div style={{ height: "2px", background: `linear-gradient(90deg,${totalColor},${totalColor}44)` }} />
                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: "10px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8f0f4", lineHeight: 1.4, marginBottom: "4px" }}>{title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", color: "rgba(232,240,244,0.38)", fontFamily: "monospace" }}>{m.courseCode}</span>
                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(232,240,244,0.22)", flexShrink: 0 }} />
                            <span style={{
                              fontSize: "10px", padding: "1px 7px", borderRadius: "999px",
                              background: isTheory ? "rgba(126,184,196,0.12)" : "rgba(169,139,196,0.12)",
                              color: isTheory ? "#7eb8c4" : "#a98bc4",
                              border: `1px solid ${isTheory ? "rgba(126,184,196,0.24)" : "rgba(169,139,196,0.24)"}`,
                              fontWeight: 600,
                            }}>{m.courseType}</span>
                          </div>
                        </div>
                        {maxTotal > 0 && <ScoreRing score={scored} max={maxTotal} color={totalColor} />}
                      </div>

                      {/* Mini bars */}
                      <div style={{ display: "flex", gap: "3px", marginBottom: isOpen ? "14px" : "8px" }}>
                        {m.tests?.map((t: any, j: number) => {
                          const [, mx] = t.test.split("/");
                          const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                          const p = parseFloat(mx) > 0 ? (sc / parseFloat(mx)) * 100 : 0;
                          const c = t.score === "Abs" ? "#c47b7b" : p >= 60 ? "#7ecba1" : p >= 40 ? "#c4a97b" : "#c47b7b";
                          return (
                            <div key={j} style={{ flex: 1, height: "4px", borderRadius: "99px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(p, 100)}%`, background: c, borderRadius: "99px" }} />
                            </div>
                          );
                        })}
                      </div>

                      {/* Expanded detail */}
                      {isOpen && m.tests?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", animation: "fadeUp 0.25s ease" }}>
                          {m.tests.map((t: any, j: number) => {
                            const [name, maxStr] = t.test.split("/");
                            const max = parseFloat(maxStr) || 100;
                            const score = parseFloat(t.score) || 0;
                            const pct = t.score === "Abs" ? 0 : (score / max) * 100;
                            const isAbs = t.score === "Abs";
                            const color = isAbs ? "#c47b7b" : pct >= 60 ? "#7ecba1" : pct >= 40 ? "#c4a97b" : "#c47b7b";
                            return (
                              <div key={j}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                                  <span style={{ color: "rgba(232,240,244,0.50)" }}>{name} <span style={{ color: "rgba(232,240,244,0.25)" }}>/ {maxStr}</span></span>
                                  <span style={{ color, fontWeight: 700 }}>{isAbs ? "Absent" : t.score}</span>
                                </div>
                                <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", borderRadius: "999px", background: color, width: `${Math.min(pct, 100)}%`, transition: "width 0.8s ease" }} />
                                </div>
                              </div>
                            );
                          })}
                          {maxTotal > 0 && (
                            <div style={{ paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                                <span style={{ color: "rgba(232,240,244,0.50)", fontWeight: 500 }}>Total</span>
                                <span style={{ color: totalColor, fontWeight: 800 }}>{scored.toFixed(1)} / {maxTotal.toFixed(0)}</span>
                              </div>
                              <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg,${totalColor},${totalColor}88)`, width: `${Math.min(totalPct, 100)}%`, transition: "width 0.8s ease" }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!isOpen && (
                        <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.25)", textAlign: "center", marginTop: "4px" }}>tap to expand</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .page-content > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
