"use client";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function CosmosAttendance({ 
  att, avgAtt, totalAgg, presentAgg, absentAgg, 
  showPredictor, setShowPredictor, next30Days, selectedDates, toggleDate, 
  calculatePredictions, predictions, setSelectedDates, setPredictions, showRiskOnly, timeAgoStr
}: any) {
  const attPct = parseFloat(avgAtt as string) || 0;
  const riskCount = att.filter((c: any) => parseFloat(c["Attn %"]) < 75).length;

  return (
    <div style={{ height: "100vh", width: "100vw", background: "transparent", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#FFFFFF", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "16px", WebkitOverflowScrolling: "touch" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "24px 0 32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>Attendance</h1>
            {timeAgoStr && <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, marginTop: "2px" }}>{timeAgoStr}</div>}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
            <div style={{ fontSize: "20px" }}>🔔</div>
            <div style={{ 
              width: "48px", height: "24px", borderRadius: "12px", background: "rgba(26, 117, 255, 0.4)", position: "relative",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--accent-secondary)" }}>{avgAtt}%</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase" }}>Overall</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>{att.length}</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase" }}>Subjects</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: riskCount > 0 ? "var(--accent-red)" : "#fff" }}>{riskCount}</div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 700, textTransform: "uppercase" }}>Below 75%</div>
          </div>
        </div>

        {/* Subject Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {(showRiskOnly ? att.filter((c: any) => parseFloat(c["Attn %"]) < 75) : att).map((c: any, i: number) => {
            const attn = parseFloat(c["Attn %"]) || 0;
            const cond = parseInt(c["Hours Conducted"]) || 0;
            const abs = parseInt(c["Hours Absent"]) || 0;
            const pres = parseInt(c["Hours Attended"]) || (cond - abs);
            const isRisk = attn < 75;
            
            // Calculate margin (classes safe to skip or needed to recover)
            let margin = 0;
            let statusColor = "#00FF88"; // Vibrant Green
            let statusText = "Margin";

            if (attn < 75) {
              margin = Math.ceil(3 * cond - 4 * pres);
              statusColor = "var(--accent-red)";
              statusText = "Attend";
            } else {
              margin = Math.floor((pres / 0.75) - cond);
              if (attn < 80 || margin <= 1) {
                statusColor = "#ff8c00"; // Orange
                statusText = "Critical";
              }
            }

            // Handle 0/0 case
            const isNoData = cond === 0;
            if (isNoData) {
              statusColor = "rgba(255,255,255,0.2)";
              statusText = "No Data";
            }

            return (
              <div key={i} className="min-card" style={{ padding: "20px", opacity: isNoData ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ flex: 1, paddingRight: "16px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{c["Course Title"]}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 600 }}>{c["Course Code"]} • Theory</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 900, color: statusColor }}>{isNoData ? "—" : (attn < 75 ? margin : margin)}</div>
                    <div style={{ fontSize: "9px", color: statusColor, fontWeight: 800, textTransform: "uppercase" }}>{statusText}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <div style={{ background: "rgba(0, 255, 136, 0.1)", color: "var(--accent-secondary)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>P {pres}</div>
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--accent-red)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>A {abs}</div>
                    <div style={{ background: "rgba(26, 117, 255, 0.1)", color: "var(--accent)", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>T {cond}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "14px", fontWeight: 900, color: statusColor }}>{attn}%</div>
                </div>

                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden", position: "relative" }}>
                  <div style={{ 
                    height: "100%", 
                    background: statusColor, 
                    width: `${attn}%`,
                    boxShadow: `0 0 10px ${statusColor}4D`,
                    transition: "width 1s ease-in-out"
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {showPredictor && (
          <div className="min-card" style={{ padding: "24px", marginBottom: "32px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", animation: "slideDown 0.3s ease-out forwards" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Predictor</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Select dates you plan to skip</div>
              </div>
              {predictions && (
                <button onClick={() => { setSelectedDates(new Set()); setPredictions(null); }} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>Reset</button>
              )}
            </div>

            <div style={{ display: "flex", overflowX: "auto", gap: "10px", paddingBottom: "16px", scrollbarWidth: "none" }}>
              {next30Days.map((d: any) => {
                const sel = selectedDates.has(d.iso);
                const isWknd = [0, 6].includes(d.date.getDay());
                return (
                  <div key={d.iso} onClick={() => !isWknd && toggleDate(d.iso)}
                    style={{ 
                      flexShrink: 0, width: "50px", height: "66px", borderRadius: "14px", 
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: sel ? "var(--accent-red)" : "rgba(255,255,255,0.05)", 
                      cursor: isWknd ? "not-allowed" : "pointer",
                      opacity: isWknd ? 0.3 : 1, transition: "all 0.2s"
                    }}>
                    <div style={{ fontSize: "10px", color: sel ? "#fff" : "var(--text-muted)", fontWeight: 800, textTransform: "uppercase" }}>{d.dayStr}</div>
                    <div style={{ fontSize: "18px", color: "#fff", fontWeight: 900 }}>{d.dateNum}</div>
                  </div>
                );
              })}
            </div>

            <button onClick={calculatePredictions} style={{ width: "100%", padding: "16px", background: "var(--accent)", borderRadius: "14px", color: "#fff", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer" }}>
              Run Prediction
            </button>

            {predictions && (
              <div style={{ 
                marginTop: "24px", 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                gap: "12px" 
              }}>
                {predictions.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", gridColumn: "1 / -1" }}>No classes missed on selected dates.</div>
                ) : predictions.map((p: any, i: number) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "flex-start" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", flex: 1, paddingRight: "10px", lineHeight: 1.3 }}>{p.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>{p.currentPct.toFixed(0)}%</span>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>→</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: p.projPct >= 75 ? "var(--accent-secondary)" : "var(--accent-red)" }}>{p.projPct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: p.marginSafe ? "var(--accent-secondary)" : "var(--accent-red)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                      {p.marginLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
          <button 
            className="theme-cosmos action-btn" 
            onClick={() => setShowPredictor(!showPredictor)}
            style={{ padding: "14px 32px", borderRadius: "14px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", border: "none" }}
          >
            🔮 {showPredictor ? "Close Predictor" : "Predict Attendance"}
          </button>
        </div>

      </main>
    </div>
  );
}
