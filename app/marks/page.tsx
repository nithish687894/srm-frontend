"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function MarksPage() {
  const { academicData, setAcademicData } = useAuthStore();
  const [marks, setMarks] = useState<any[]>(academicData?.marks || []);
  const [attendance, setAttendance] = useState<any[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.marks);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
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
  
  const hasEmergency = totalMax > 0 && (totalScored / totalMax) < 0.5;

  if (loading && !marks.length) return (
    <div className="page-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="srmx-spinner" />
    </div>
  );

  return (
    <div className="page-root">
      <Sidebar />

      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "140px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "#666666", textTransform: "uppercase" }}>
              Total Marks
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px" }}>
              <div style={{ fontSize: "72px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                {totalScored.toFixed(1)}
              </div>
              <div style={{ fontSize: "24px", color: "#555555", fontWeight: "bold" }}>
                /{totalMax.toFixed(0)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
            <button className="action-btn">
              <div className="icon-l">↑</div>
              <div className="text-c"><span>Target</span><span>Set Score Goals</span></div>
              <div className="icon-r">›</div>
            </button>
          </div>

          {hasEmergency && (
            <div style={{ padding: "24px", background: "#1a0000", border: "2px dashed #ff3b3b", borderRadius: "20px", marginBottom: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ff3b3b", marginBottom: "8px" }}>Academic Emergency</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#ff3b3b", lineHeight: 1 }}>OVERALL SCORE &lt; 50%</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {marks.map((m: any, i: number) => {
              const title = titleMap[m.courseCode] || m.courseCode;
              const scored = m.tests?.reduce((s: number, t: any) => s + (t.score === "Abs" ? 0 : parseFloat(t.score) || 0), 0) || 0;
              const maxTotal = m.tests?.reduce((s: number, t: any) => { const [, mx] = t.test.split("/"); return s + (parseFloat(mx) || 0); }, 0) || 0;

              return (
                <div key={i} style={{ 
                  background: "#1c1c1c", 
                  borderRadius: "20px", 
                  padding: "24px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "20px" }}>
                    <div style={{ width: "80px", flexShrink: 0 }}>
                      <div style={{ fontSize: "40px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                        {scored.toFixed(0)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666666", fontWeight: "bold", marginTop: "4px" }}>
                        /{maxTotal.toFixed(0)} TOTAL
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word", lineHeight: 1.2, paddingRight: "8px" }}>
                          {title}
                        </div>
                        <div style={{ background: "#333333", color: "#ffffff", fontSize: "10px", fontWeight: "bold", padding: "4px 8px", borderRadius: "99px", letterSpacing: "0.05em", flexShrink: 0 }}>
                          {m.courseType.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888888", fontWeight: "bold", letterSpacing: "0.05em" }}>
                        {m.courseCode}
                      </div>
                    </div>
                  </div>

                  {m.tests && m.tests.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {m.tests.map((t: any, j: number) => {
                        const parts = t.test.split("/");
                        const lbl = parts[0];
                        const mx = parseFloat(parts[1]) || 100;
                        const sc = t.score === "Abs" ? 0 : parseFloat(t.score) || 0;
                        const failed = sc < (mx * 0.5) || t.score === "Abs";
                        
                        return (
                          <div key={j} style={{ 
                            background: failed ? "#3d0000" : "#2a3d00",
                            borderRadius: "12px",
                            padding: "8px 12px",
                            minWidth: "80px",
                            display: "flex", flexDirection: "column",
                            border: failed ? "1px solid #5a0000" : "none"
                          }}>
                            <div style={{ fontSize: "11px", color: "#888888", textTransform: "uppercase", marginBottom: "4px", fontWeight: 600 }}>{lbl}</div>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}>{t.score === "Abs" ? "ABS" : sc.toFixed(1)}</span>
                              <span style={{ fontSize: "11px", color: "#666666", marginLeft: "2px" }}>/{mx}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="watermark">Marks</div>
        </div>
      </main>
    </div>
  );
}
