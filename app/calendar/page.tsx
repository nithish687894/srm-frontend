"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex, type Semester } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";
import { useThemeStore } from "@/lib/themeStore";

export default function CalendarPage() {
  const [monthIdx, setMonthIdx] = useState(0);
  const [sem, setSem] = useState<Semester>("EVEN");
  const [selectedHoliday, setSelectedHoliday] = useState<any | null>(null);
  const router = useRouter();
  const { theme } = useThemeStore();

  const { data: cal, isLoading } = useQuery({
    queryKey: ["calendar"],
    queryFn: () => dataAPI.getCalendar(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  const { months, byDate } = useMemo(() => buildCalendarIndex(cal), [cal]);
  const semMonths = months[sem] || [];

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  
  // Set month to current automatically
  useEffect(() => {
    if (semMonths.length > 0) {
      const idx = semMonths.findIndex(m => m.days.some((d: any) => d.isoDate === todayIso));
      if (idx !== -1) setMonthIdx(idx);
    }
  }, [semMonths, todayIso]);

  const current = semMonths[monthIdx];
  const todayInfo = byDate.get(todayIso);
  const isTodayHoliday = todayInfo?.isHoliday || [0, 6].includes(today.getDay());

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  const gridCells: any[] = [];
  if (current) {
    const firstDate = new Date(`1 ${current.name}`);
    let startDay = firstDate.getDay(); // 0(Sun) - 6(Sat)
    let offset = (startDay + 6) % 7; // Monday = 0
    for (let i = 0; i < offset; i++) gridCells.push(null);
    current.days.forEach((d: any) => gridCells.push(d));
    while (gridCells.length % 7 !== 0) gridCells.push(null);
  }

  const todayStr = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(today);
  const todayDateNum = today.getDate();
  const isCosmos = theme === "cosmos";

  const topCardStyle = isCosmos
    ? {
        background: "linear-gradient(145deg, rgba(26,117,255,0.24), rgba(107,51,255,0.2) 55%, rgba(0,255,136,0.08))",
        border: "1px solid rgba(130,150,255,0.28)",
      }
    : {
        background: "#1a2600",
        border: "1px solid transparent",
      };

  return (
    <div className="page-root" onClick={() => setSelectedHoliday(null)}>
      <Sidebar />

      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "140px", position: "relative" }}>

          {/* Top Card */}
          <div style={{ ...topCardStyle, borderRadius: "24px", padding: "24px", marginBottom: "32px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ padding: "4px 12px", background: isCosmos ? "rgba(255,255,255,0.12)" : "#a8c200", color: isCosmos ? "#fff" : "#000000", fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", borderRadius: "99px", letterSpacing: "0.1em" }}>
                {todayStr}
              </div>
              <div style={{ fontSize: "12px", color: isCosmos ? "#9EC5FF" : "#a8c200", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: "bold" }}>
                Day Order
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "16px", marginTop: "16px" }}>
              <div style={{ fontSize: "100px", fontWeight: 900, color: isCosmos ? "#fff" : "#a8c200", lineHeight: 0.85 }}>
                {isTodayHoliday ? "—" : todayInfo?.dayOrder || "—"}
              </div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: isCosmos ? "#8FD3FF" : "#a8c200" }}>
                {todayDateNum}
              </div>
            </div>
            
            <div style={{ textAlign: "right", fontSize: "13px", color: "#aaaaaa", marginTop: "8px", textTransform: "capitalize" }}>
              {isTodayHoliday ? "Holiday" : todayInfo?.event || "Regular Classes"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "32px" }}>
            {(["ODD", "EVEN"] as Semester[]).map(s => (
              <button key={s} onClick={() => { setSem(s); setMonthIdx(0); }}
                style={{ 
                  padding: "8px 24px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, 
                  background: sem === s ? (isCosmos ? "linear-gradient(90deg, #1A75FF, #6B33FF)" : "#ffffff") : "transparent", 
                  color: sem === s ? "#ffffff" : (isCosmos ? "#7E88B6" : "#555555"), 
                  border: sem === s ? "none" : `1px solid ${isCosmos ? "rgba(255,255,255,0.12)" : "#333333"}`, 
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
            <div style={{ textAlign: "center", color: "#666", padding: "40px" }}>No Calendar Data</div>
          ) : (
            <div style={{ background: isCosmos ? "linear-gradient(180deg, rgba(36,40,84,0.48), rgba(19,20,48,0.45))" : "#1a1a1a", borderRadius: "24px", padding: "24px", position: "relative", border: isCosmos ? "1px solid rgba(255,255,255,0.08)" : "none", backdropFilter: isCosmos ? "blur(14px)" : "none" }}>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {current.name}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center" }}>‹</button>
                  <button onClick={() => setMonthIdx(semMonths.findIndex(m => m.days.some((d: any) => d.isoDate === todayIso)) || 0)} style={{ background: "none", border: "none", color: isCosmos ? "#8FD3FF" : "#ffffff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center" }}>◎</button>
                  <button onClick={() => setMonthIdx(i => Math.min(semMonths.length - 1, i + 1))} style={{ background: "none", border: "none", color: "#ffffff", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center" }}>›</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "16px" }}>
                {weekDays.map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold", color: "#666666" }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", rowGap: "12px", position: "relative" }}>
                {gridCells.map((cell, i) => {
                  if (!cell) return <div key={i} />;
                  
                  const isToday = cell.isoDate === todayIso;
                  const isPast = new Date(cell.isoDate) < new Date(todayIso);
                  
                  return (
                    <div key={i} 
                      onClick={(e) => {
                        if (cell.isHoliday) {
                          e.stopPropagation();
                          setSelectedHoliday(selectedHoliday?.isoDate === cell.isoDate ? null : cell);
                        }
                      }}
                      style={{ 
                        position: "relative",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                        height: "48px", cursor: cell.isHoliday ? "pointer" : "default",
                        opacity: isPast && !isToday ? 0.3 : 1
                      }}>
                      <div style={{ fontSize: "10px", color: "#555555", fontWeight: "bold", marginBottom: "2px" }}>
                        {!cell.isHoliday && cell.dayOrder ? `DO${cell.dayOrder}` : "\u00A0"}
                      </div>

                      {isToday ? (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isCosmos ? "linear-gradient(135deg,#1A75FF,#6B33FF)" : "#6366f1", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold", boxShadow: isCosmos ? "0 8px 18px rgba(26,117,255,0.45)" : "0 4px 12px rgba(99, 102, 241, 0.4)" }}>
                          {cell.dateNum}
                        </div>
                      ) : (
                        <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold", color: "#ffffff" }}>
                          {cell.dateNum}
                        </div>
                      )}

                      {cell.isHoliday && (
                        <div style={{ position: "absolute", bottom: "-6px", width: "4px", height: "4px", borderRadius: "50%", background: isCosmos ? "#F97316" : "#ff3b3b" }} />
                      )}

                      {selectedHoliday?.isoDate === cell.isoDate && (
                        <div style={{
                          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                          background: isCosmos ? "rgba(22, 25, 56, 0.95)" : "#2a2a2a", border: isCosmos ? "1px solid rgba(255,255,255,0.12)" : "1px solid #444", padding: "12px", borderRadius: "12px",
                          width: "200px", zIndex: 50, marginBottom: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                          cursor: "default"
                        }} onClick={e => e.stopPropagation()}>
                          <div style={{ fontSize: "11px", color: "#888888", marginBottom: "4px" }}>
                            {new Date(cell.isoDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                          </div>
                          <div style={{ fontSize: "14px", color: "#ffffff", fontWeight: "bold" }}>
                            {cell.event || (cell.weekdayLabel.toLowerCase().startsWith("sun") ? "Sunday / Weekly Off" : "Holiday")}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Events List Section */}
          {current && (
            <div style={{ marginTop: "40px", animation: "slideUp 0.4s ease-out forwards" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: isCosmos ? "#9EC5FF" : "#a8c200", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  {current.name} — Events
                </div>
                <div style={{ display: "flex", background: isCosmos ? "rgba(255,255,255,0.05)" : "#1c1c1c", borderRadius: "12px", padding: "4px", border: isCosmos ? "1px solid rgba(255,255,255,0.08)" : "1px solid #333" }}>
                   <div style={{ padding: "6px 16px", borderRadius: "8px", background: isCosmos ? "rgba(26,117,255,0.2)" : "#333", fontSize: "11px", fontWeight: 800, color: isCosmos ? "#8FD3FF" : "#fff" }}>Events</div>
                   <div style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, color: "#666" }}>Tasks</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {current.days.filter((d: any) => d.event).length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px dashed rgba(255,255,255,0.1)", color: "#666", fontSize: "13px" }}>
                    No specific events or holidays recorded for this month.
                  </div>
                ) : (
                  current.days.filter((d: any) => d.event).map((d: any, idx: number) => {
                    const isHoliday = d.isHoliday;
                    const dateObj = new Date(d.isoDate);
                    const dayStr = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    
                    return (
                      <div key={idx} style={{ 
                        background: isCosmos ? "rgba(255,255,255,0.03)" : "#1c1c1c", 
                        borderRadius: "20px", padding: "16px", 
                        display: "flex", alignItems: "center", gap: "20px",
                        borderLeft: isHoliday ? `4px solid ${isCosmos ? "#F97316" : "#ff3b3b"}` : "4px solid transparent",
                        border: isCosmos ? "1px solid rgba(255,255,255,0.05)" : "none",
                        transition: "transform 0.2s"
                      }}>
                        <div style={{ 
                          width: "44px", height: "44px", borderRadius: "14px", 
                          background: isHoliday ? (isCosmos ? "rgba(249,115,22,0.1)" : "rgba(255,59,59,0.1)") : "rgba(255,255,255,0.05)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "18px", fontWeight: 900, color: isHoliday ? (isCosmos ? "#F97316" : "#ff3b3b") : "#fff"
                        }}>
                          {d.dateNum}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
                            {d.event || (dayStr === "Sun" ? "Sunday / Weekly Off" : "Holiday")}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", fontWeight: 700 }}>
                            {dayStr} • {isHoliday ? "No Class" : `Day Order ${d.dayOrder}`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="watermark">Calendar</div>
        </div>
      </main>
    </div>
  );
}