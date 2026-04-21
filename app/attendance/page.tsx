"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store";

export default function AttendancePage() {
  const { ready } = useAuth();
  const { academicData, setAcademicData } = useAuthStore();
  const [att, setAtt] = useState<any[]>(academicData?.attendance || []);
  const [loading, setLoading] = useState(!academicData?.attendance);

  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (academicData?.attendance) setLoading(false);
    dataAPI.getAttendance()
      .then(d => { setAtt(d.data || []); setAcademicData({ ...academicData, attendance: d.data || [] }); setLoading(false); })
      .catch(() => { if (!att.length) router.push("/"); });
  }, [ready]);

  const riskClasses = att.filter(c => parseFloat(c["Attn %"]) < 75);
  const avgAtt = att.length
    ? (att.reduce((s, c) => s + parseFloat(c["Attn %"] || 0), 0) / att.length).toFixed(1)
    : "—";

  if (loading && !att.length) return (
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
              overall attendance
            </div>
            <div style={{ fontSize: "96px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
              {avgAtt}%
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
            <button className="action-btn">
              <div className="icon-l">?</div>
              <div className="text-c"><span>predict</span><span>attendance calculator</span></div>
              <div className="icon-r">›</div>
            </button>
          </div>

          {riskClasses.length > 0 && (
            <div style={{ padding: "24px", background: "#1a0000", border: "2px dashed #ff3b3b", borderRadius: "20px", marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ff3b3b", marginBottom: "8px" }}>action required</div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#ff3b3b", lineHeight: 1 }}>{riskClasses.length} SUBJECTS AT RISK</div>
              <div style={{ fontSize: "12px", color: "#ff3b3b", fontStyle: "italic", marginTop: "8px", textAlign: "center" }}>aint nobody savin you</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {att.map((c: any, i: number) => {
              const attn = parseFloat(c["Attn %"]) || 0;
              const isRisk = attn < 75;
              const cond = parseInt(c["Hours Conducted"]) || 0;
              const abs = parseInt(c["Hours Absent"]) || 0;
              const pres = cond - abs;
              
              return (
                <div key={i} style={{ 
                  background: isRisk ? "#1a0000" : "#1c1c1c", 
                  border: isRisk ? "2px dashed #ff3b3b" : "none",
                  borderRadius: "20px", 
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ width: "60px" }}>
                      <div style={{ fontSize: "48px", fontWeight: 900, color: isRisk ? "#ff3b3b" : "#ffffff", lineHeight: 1 }}>
                        {pres}
                      </div>
                      <div style={{ fontSize: "10px", color: "#666666", textTransform: "uppercase", marginTop: "4px" }}>
                        /{cond} attended
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ffffff", paddingBottom: "4px" }}>
                        {c["Course Code"]}
                      </div>
                      <div style={{ fontSize: "14px", color: "#888888", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c["Course Title"]}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: "32px", fontWeight: 900, color: isRisk ? "#ff3b3b" : "#a8c200" }}>
                    {attn}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="watermark">attendance</div>
        </div>
      </main>
    </div>
  );
}
