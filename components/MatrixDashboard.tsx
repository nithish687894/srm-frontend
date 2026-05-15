"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function MatrixDashboard({ 
  data, riskCount, avgAtt, avgMarks, totalCourses, 
  targetClasses, nextClass, initials, firstName, 
  dayOrder, isHoliday, dayOffset, setDayOffset, 
  onShowStudentInfo, broadcast, nowMin, 
  setIsSyncModalOpen, renderAcademicIntegrityHub, 
  userBatch, totalHours, presentHours, absentHours,
  fmtTimeOnly, parseStart, parseEnd, isNowIn, BATCH_PERIODS, BroadcastBanner
}: any) {
  const PERIODS = BATCH_PERIODS[userBatch as keyof typeof BATCH_PERIODS] || BATCH_PERIODS[1];
  const router = useRouter();
  const profile = data?.profile || {};
  const regNo = profile["Registration Number"] || "UNKNOWN";
  const batchDisplay = profile["Combo / Batch"] || profile["Batch"] || (userBatch ? `Batch ${userBatch}` : "N/A");

  // Find best attendance
  const bestAtt = data?.attendance?.length ? [...data.attendance].sort((a: any, b: any) => parseFloat(b["Attn %"]) - parseFloat(a["Attn %"]))[0] : null;

  return (
    <div style={{ background: "#000000", height: "100vh", display: "flex", flexDirection: "column", color: "#ffffff", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "16px 20px 120px", WebkitOverflowScrolling: "touch" }}>

        {/* System Status / Profile Intro */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#facc15", letterSpacing: "0.2em", fontWeight: 900, marginBottom: "4px" }}>SYSTEM INITIALIZED</div>
              <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>{firstName.toUpperCase()}</div>
              <div style={{ fontSize: "11px", color: "#666", fontWeight: 800, marginTop: "6px" }}>ID: {regNo} • {batchDisplay}</div>
            </div>
            <div>
              <div 
                onClick={onShowStudentInfo}
                style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#1c1c1c", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900, cursor: "pointer" }}>
                 {initials}
              </div>
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                style={{ marginTop: "8px", background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.2)", color: "#facc15", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 900, textTransform: "uppercase" }}
              >
                Unlock History
              </button>
            </div>
          </div>
        </div>

        {/* Hero Performance Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          <motion.div whileTap={{ scale: 0.94 }} onClick={() => router.push("/attendance")} style={{ background: "#1c1c1c", borderRadius: "24px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: "10px", color: "#666", fontWeight: 900, textTransform: "uppercase", marginBottom: "12px" }}>Attnd</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#facc15" }}>{avgAtt}%</div>
          </motion.div>
          <motion.div whileTap={{ scale: 0.94 }} onClick={() => router.push("/marks")} style={{ background: "#1c1c1c", borderRadius: "24px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: "10px", color: "#666", fontWeight: 900, textTransform: "uppercase", marginBottom: "12px" }}>Marks</div>
            <div style={{ fontSize: "24px", fontWeight: 900 }}>{avgMarks}%</div>
          </motion.div>
          <motion.div whileTap={{ scale: 0.94 }} onClick={() => router.push("/attendance?risk=1")} style={{ background: riskCount > 0 ? "#221111" : "#1c1c1c", borderRadius: "24px", padding: "20px", textAlign: "center", border: riskCount > 0 ? "1px solid #ff3b3b" : "none", cursor: "pointer" }}>
            <div style={{ fontSize: "10px", color: "#666", fontWeight: 900, textTransform: "uppercase", marginBottom: "12px" }}>Risk</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: riskCount > 0 ? "#ff3b3b" : "#fff" }}>{riskCount}</div>
          </motion.div>
        </div>

        {/* Highlights / Best Section */}
        {bestAtt && (
          <div style={{ background: "#1c1c1c", borderRadius: "28px", padding: "24px", marginBottom: "40px", border: "1px solid #333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#facc15", letterSpacing: "0.15em", fontWeight: 900 }}>ACADEMIC PEAK</div>
              <div style={{ background: "#facc15", color: "#000", fontSize: "10px", fontWeight: 900, padding: "4px 10px", borderRadius: "8px" }}>TOP TIER</div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, lineHeight: 1.2, marginBottom: "8px" }}>{bestAtt["Course Title"]}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#facc15" }}>{bestAtt["Attn %"]}%</div>
              <div style={{ fontSize: "12px", color: "#666", fontWeight: 800 }}>ATTENDANCE RECORD</div>
            </div>
          </div>
        )}

        {/* New: Unified History Card */}
        {renderAcademicIntegrityHub("matrix")}

        {/* Header */}
        <BroadcastBanner broadcast={broadcast} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <button onClick={() => setDayOffset((o: any) => o - 1)} style={{ background: "#1c1c1c", border: "1px solid #333", color: "#fff", width: "44px", height: "44px", borderRadius: "14px", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            <button onClick={() => setDayOffset((o: any) => o + 1)} style={{ background: "#1c1c1c", border: "1px solid #333", color: "#fff", width: "44px", height: "44px", borderRadius: "14px", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800 }}>{dayOffset === 0 ? "TODAY" : "SCHEDULE"}</div>
            <div style={{ fontSize: "14px", fontWeight: 700 }}>Day Order {dayOrder || "—"}</div>
          </div>
        </div>

        {/* Timeline Classes */}
        <div style={{ position: "relative", paddingLeft: "12px" }}>
          <div style={{ position: "absolute", left: "0", top: "10px", bottom: "10px", width: "1px", background: "#333" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {(() => {
              if (isHoliday) return <div style={{ padding: "40px 0", color: "#444", fontWeight: 700, textAlign: "center" }}>No classes - Holiday</div>;
              
              return PERIODS.map((p: any, pi: number) => {
                const pStart = parseStart(p.start);
                const pEnd = parseEnd(p.end);
                const cls = targetClasses.find((c: any) => {
                  const cs = parseStart(c.startTime);
                  const ce = parseEnd(c.endTime);
                  return cs < pEnd && ce > pStart;
                });
                
                const isActive = cls ? isNowIn(cls.startTime, cls.endTime) : (nowMin >= pStart && nowMin < pEnd);

                return (
                  <div key={pi} style={{ position: "relative", paddingLeft: "32px", marginBottom: "8px" }}>
                    {/* Period Label */}
                    <div style={{ 
                      position: "absolute", left: "-6px", top: "50%", transform: "translateY(-50%)", 
                      width: "12px", height: "12px", borderRadius: "50%", 
                      background: isActive ? "#facc15" : "#222", 
                      border: "2px solid #000", zIndex: 5,
                      boxShadow: isActive ? "0 0 10px #facc15" : "none"
                    }} />
                    
                    <div style={{ 
                      position: "absolute", left: "-32px", top: "50%", transform: "translateY(-50%)", 
                      fontSize: "10px", fontWeight: 900, color: isActive ? "#facc15" : "#444",
                      width: "20px", textAlign: "right"
                    }}>
                      {p.id}
                    </div>

                    {!cls ? (
                      /* Free Period */
                      <div style={{ padding: "12px 0" }}>
                        <div style={{ 
                          height: "1px", width: "100%", borderTop: "2px dashed #333", 
                          opacity: isActive ? 1 : 0.4, borderColor: isActive ? "#facc15" : "#333" 
                        }} />
                      </div>
                    ) : (
                      /* Class Card */
                      <motion.div 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push("/timetable")}
                        style={{ 
                          background: "#121212", borderRadius: "18px", padding: "16px 20px", 
                          border: isActive ? "1px solid #facc15" : "1px solid #222",
                          cursor: "pointer", position: "relative", overflow: "hidden"
                        }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 800, color: "#666", textTransform: "uppercase" }}>
                            {p.start} — {p.end}
                          </div>
                          <div style={{ fontSize: "10px", fontWeight: 900, color: isActive ? "#facc15" : "#444" }}>
                            PERIOD {p.id}
                          </div>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff", textTransform: "capitalize", letterSpacing: "-0.01em", marginBottom: "2px" }}>
                          {cls.courseTitle.toLowerCase()}
                        </div>
                        <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: "#666", fontWeight: 800 }}>
                          <span>{cls.courseCode}</span>
                          <span>•</span>
                          <span>{cls.roomNo || "TBA"}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="watermark" style={{ bottom: "140px" }}>Dashboard</div>
        <div style={{ height: "40px" }} />
      </main>
    </div>
  );
}
