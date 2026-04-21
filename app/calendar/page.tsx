"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex, type Semester } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";

export default function CalendarPage() {
  const [monthIdx, setMonthIdx] = useState(0);
  const [sem, setSem] = useState<Semester>("EVEN");
  const router = useRouter();

  const { data: cal, isLoading } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => dataAPI.getCalendar(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  const { months, byDate } = useMemo(() => buildCalendarIndex(cal), [cal]);
  const semMonths = months[sem] || [];

  const current = semMonths[monthIdx];
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayInfo = byDate.get(todayIso);

  const isTodayHoliday = todayInfo?.isHoliday || [0, 6].includes(today.getDay());

  // Week days for header
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  // Calculate padding for grid
  const gridCells: any[] = [];
  if (current) {
    const firstDate = new Date(`1 ${current.name}`);
    let startDay = firstDate.getDay(); // 0(Sun) - 6(Sat)
    let offset = (startDay + 6) % 7; // Monday = 0
    for (let i = 0; i < offset; i++) {
      gridCells.push(null);
    }
    
    // Add real days
    current.days.forEach((d: any) => gridCells.push(d));

    // Pad end
    while (gridCells.length % 7 !== 0) {
      gridCells.push(null);
    }
  }

  const todayStr = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(today);
  const todayDateNum = today.getDate();

  return (
    <div className="page-root">
      <Sidebar />

      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "140px" }}>

          {/* Top Card */}
          <div style={{ background: "#1a2600", borderRadius: "24px", padding: "24px", marginBottom: "32px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ padding: "4px 12px", background: "#a8c200", color: "#000000", fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", borderRadius: "99px", letterSpacing: "0.1em" }}>
                {todayStr}
              </div>
              <div style={{ fontSize: "12px", color: "#a8c200", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: "bold" }}>
                day order
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "16px", marginTop: "16px" }}>
              <div style={{ fontSize: "100px", fontWeight: 900, color: "#a8c200", lineHeight: 0.85 }}>
                {isTodayHoliday ? "—" : todayInfo?.dayOrder || "—"}
              </div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#a8c200" }}>
                {todayDateNum}
              </div>
            </div>
            
            <div style={{ textAlign: "right", fontSize: "13px", color: "#aaaaaa", marginTop: "8px" }}>
              {isTodayHoliday ? "holiday" : todayInfo?.event || "regular classes"}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "32px" }}>
            {(["ODD", "EVEN"] as Semester[]).map(s => (
              <button key={s} onClick={() => { setSem(s); setMonthIdx(0); }}
                style={{ 
                  padding: "8px 24px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, 
                  background: sem === s ? "#ffffff" : "transparent", 
                  color: sem === s ? "#000000" : "#555555", 
                  border: sem === s ? "none" : "1px solid #333333", 
                  cursor: "pointer", transition: "all 0.18s",
                  letterSpacing: "0.1em"
                }}>
                {s}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><div className="srmx-spinner"/></div>
          ) : !current ? (
            <div style={{ textAlign: "center", color: "#666", padding: "40px" }}>No calendar data</div>
          ) : (
            <div style={{ background: "#1a1a1a", borderRadius: "24px", padding: "24px" }}>
              
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {current.name}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center" }}>‹</button>
                  <button onClick={() => setMonthIdx(semMonths.findIndex(m => m.days.some((d: any) => d.isoDate === todayIso)) || 0)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center" }}>◎</button>
                  <button onClick={() => setMonthIdx(i => Math.min(semMonths.length - 1, i + 1))} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center" }}>›</button>
                </div>
              </div>

              {/* Grid headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "16px" }}>
                {weekDays.map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", color: "#666666" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", rowGap: "12px" }}>
                {gridCells.map((cell, i) => {
                  if (!cell) return <div key={i} />;
                  
                  const isToday = cell.isoDate === todayIso;
                  const isPast = new Date(cell.isoDate) < new Date(todayIso);
                  
                  return (
                    <div key={i} style={{ 
                      position: "relative",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                      height: "48px",
                      opacity: isPast && !isToday ? 0.3 : 1
                    }}>
                      <div style={{ fontSize: "10px", color: "#555555", fontWeight: "bold", marginBottom: "2px" }}>
                      {!cell.isHoliday && cell.dayOrder ? `DO${cell.dayOrder}` : "\u00A0"}
                      </div>

                      {isToday ? (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#a8c200", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold" }}>
                          {cell.dateNum}
                        </div>
                      ) : (
                        <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>
                          {cell.dateNum}
                        </div>
                      )}

                      {cell.isHoliday && (
                        <div style={{ position: "absolute", bottom: "-6px", width: "4px", height: "4px", borderRadius: "50%", background: "#ff3b3b" }} />
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          <div className="watermark">calendar</div>
        </div>
      </main>
    </div>
  );
}