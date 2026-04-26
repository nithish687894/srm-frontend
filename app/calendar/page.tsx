"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex, type Semester } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";
import { useThemeStore } from "@/lib/themeStore";

export default function CalendarPage() {
  const { theme } = useThemeStore();
  const [monthIdx, setMonthIdx] = useState(0);
  const [sem, setSem] = useState<Semester>("EVEN");
  const [selectedHoliday, setSelectedHoliday] = useState<any | null>(null);
  const router = useRouter();

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
  const isEduverse = theme === "cosmos";

  return (
    <div className="page-root" onClick={() => setSelectedHoliday(null)}>
      <Sidebar />

      <main className="page-main">
        <div className="page-content" style={{ paddingBottom: "140px", position: "relative" }}>

          {/* Top Card */}
          <div className="min-card" style={{ 
            borderRadius: "18px", 
            padding: "22px", 
            marginBottom: "22px", 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px",
            background: isEduverse
              ? "linear-gradient(145deg, rgba(36,58,132,0.8), rgba(18,29,67,0.92))"
              : "#1a2600",
            border: isEduverse ? "1px solid rgba(124, 152, 255, 0.35)" : "1px solid var(--border)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ 
                padding: "4px 12px", 
                background: isEduverse ? "linear-gradient(90deg, #3b82f6, #4f46e5)" : "#a8c200", 
                color: isEduverse ? "#eef2ff" : "#000000", 
                fontWeight: "bold", 
                fontSize: "11px", 
                textTransform: "uppercase", 
                borderRadius: "99px", 
                letterSpacing: "0.1em" 
              }}>
                {todayStr}
              </div>
              <div style={{ 
                fontSize: "12px", 
                color: isEduverse ? "#8ab4ff" : "#a8c200", 
                letterSpacing: "0.2em", 
                textTransform: "uppercase", 
                fontWeight: "bold" 
              }}>
                Day Order
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "16px", marginTop: "16px" }}>
              <div style={{ fontSize: "100px", fontWeight: 900, color: isEduverse ? "#dbe8ff" : "#a8c200", lineHeight: 0.85 }}>
                {isTodayHoliday ? "—" : todayInfo?.dayOrder || "—"}
              </div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: isEduverse ? "#8ab4ff" : "#a8c200" }}>
                {todayDateNum}
              </div>
            </div>
            
            <div style={{ textAlign: "right", fontSize: "13px", color: "#aaaaaa", marginTop: "8px", textTransform: "capitalize" }}>
              {isTodayHoliday ? "Holiday" : todayInfo?.event || "Regular Classes"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "22px" }}>
            {(["ODD", "EVEN"] as Semester[]).map(s => (
              <button key={s} onClick={() => { setSem(s); setMonthIdx(0); }}
                style={{ 
                  padding: "8px 20px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, 
                  background: sem === s ? (isEduverse ? "linear-gradient(90deg, #325df8, #5b43ea)" : "#ffffff") : "transparent", 
                  color: sem === s ? "#ffffff" : "var(--text-secondary)", 
                  border: sem === s ? "none" : "1px solid var(--border)", 
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
            <div className="min-card" style={{ background: isEduverse ? "rgba(16, 25, 57, 0.88)" : "#1a1a1a", borderRadius: "18px", padding: "20px", position: "relative" }}>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  {current.name}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))} style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "20px", cursor: "pointer", display: "grid", placeItems: "center" }}>‹</button>
                  <button onClick={() => setMonthIdx(semMonths.findIndex(m => m.days.some((d: any) => d.isoDate === todayIso)) || 0)} style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "14px", cursor: "pointer", display: "grid", placeItems: "center" }}>◎</button>
                  <button onClick={() => setMonthIdx(i => Math.min(semMonths.length - 1, i + 1))} style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "20px", cursor: "pointer", display: "grid", placeItems: "center" }}>›</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "16px" }}>
                {weekDays.map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
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
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: isEduverse ? "linear-gradient(135deg, #325df8, #5b43ea)" : "#6366f1", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold", boxShadow: "0 6px 16px rgba(79, 70, 229, 0.45)" }}>
                          {cell.dateNum}
                        </div>
                      ) : (
                        <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>
                          {cell.dateNum}
                        </div>
                      )}

                      {cell.isHoliday && (
                        <div style={{ position: "absolute", bottom: "-6px", width: "4px", height: "4px", borderRadius: "50%", background: "#ff3b3b" }} />
                      )}

                      {selectedHoliday?.isoDate === cell.isoDate && (
                        <div style={{
                          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                          background: isEduverse ? "rgba(13, 21, 51, 0.96)" : "#2a2a2a", border: "1px solid var(--border)", padding: "12px", borderRadius: "12px",
                          width: "200px", zIndex: 50, marginBottom: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                          cursor: "default"
                        }} onClick={e => e.stopPropagation()}>
                          <div style={{ fontSize: "11px", color: "#888888", marginBottom: "4px" }}>
                            {new Date(cell.isoDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                          </div>
                          <div style={{ fontSize: "14px", color: "#ffffff", fontWeight: "bold" }}>
                            {cell.event || "Holiday"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          <div className="watermark">Calendar</div>
        </div>
      </main>
    </div>
  );
}