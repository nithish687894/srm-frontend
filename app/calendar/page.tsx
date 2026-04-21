"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { dataAPI } from "@/lib/api";
import { buildCalendarIndex, type Semester } from "@/lib/calendarIndex";
import { useQuery } from "@tanstack/react-query";

const DO_COLORS: Record<string, string> = {
  "1": "#7ecba1", "2": "#7eb8c4", "3": "#c4a97b", "4": "#a98bc4", "5": "#7b9ec4",
};

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

  return (
    <div className="page-root">
      <div className="orb orb-green-1" />
      <div className="orb orb-green-2" />
      <Sidebar />

      <main className="page-main">
        <div className="srmx-topbar">
          <h1 style={{ fontWeight: 600, fontSize: "16px", color: "#e8f0f4" }}>Academic Calendar</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "rgba(232,240,244,0.38)" }}>
              {todayInfo
                ? (todayInfo.isHoliday ? "Today: Holiday" : `Today: Day Order ${todayInfo.dayOrder}`)
                : "Planner"}
            </span>
            <div style={{ display: "flex", padding: "3px", gap: "3px", background: "rgba(255,255,255,0.03)", borderRadius: "11px", border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["ODD", "EVEN"] as Semester[]).map(s => (
                <button key={s} onClick={() => { setSem(s); setMonthIdx(0); }}
                  style={{ padding: "5px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: sem === s ? "#7ecba1" : "transparent", color: sem === s ? "#1a3028" : "rgba(232,240,244,0.45)", border: "none", cursor: "pointer", transition: "all 0.18s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="page-content">
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
              <div className="srmx-spinner" style={{ width: "20px", height: "20px" }} />
              <span style={{ color: "rgba(255,255,255,0.28)" }}>Loading calendar...</span>
            </div>
          ) : semMonths.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.22)", fontSize: "14px" }}>No calendar data found</div>
          ) : (
            <>
              {/* Month switcher */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginBottom: "20px" }}>
                <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))}
                  style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer", color: "#e8f0f4", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <h2 style={{ fontSize: "32px", fontWeight: 300, minWidth: "200px", textAlign: "center", color: "#e8f0f4" }}>{current?.name}</h2>
                <button onClick={() => setMonthIdx(i => Math.min(semMonths.length - 1, i + 1))}
                  style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer", color: "#e8f0f4", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>

              {/* Month pills */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "28px" }}>
                {semMonths.map((m, i) => (
                  <button key={i} onClick={() => setMonthIdx(i)}
                    style={{ padding: "4px 14px", borderRadius: "999px", fontSize: "12px", cursor: "pointer", border: "none", background: monthIdx === i ? "#7ecba1" : "rgba(255,255,255,0.05)", color: monthIdx === i ? "#1a3028" : "rgba(232,240,244,0.45)", fontWeight: monthIdx === i ? 700 : 400, transition: "all 0.15s" }}>
                    {m.name.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Days */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "720px", margin: "0 auto" }}>
                {current?.days.map((d, i) => {
                  const isToday = d.isoDate === todayIso;
                  const doColor = d.dayOrder ? (DO_COLORS[String(d.dayOrder)] || "#52525b") : "#c47b7b";

                  return (
                    <button key={i} onClick={() => router.push(`/timetable?date=${encodeURIComponent(d.isoDate)}`)}
                      style={{
                      display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", borderRadius: "12px",
                      background: isToday ? "rgba(126,203,161,0.06)" : d.isHoliday ? "rgba(196,123,123,0.03)" : "#3a4f5c",
                      border: isToday ? "1px solid rgba(126,203,161,0.25)" : d.isHoliday ? "1px solid rgba(196,123,123,0.10)" : "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}>
                      <div style={{ width: "44px", textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: isToday ? "#7ecba1" : d.isHoliday ? "#c47b7b" : "#e8f0f4", lineHeight: 1 }}>{d.dateNum}</div>
                        <div style={{ fontSize: "10px", color: "rgba(232,240,244,0.38)", marginTop: "2px" }}>{d.weekdayLabel}</div>
                      </div>
                      <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.09)" }} />
                      <div style={{ flex: 1, fontSize: "13px", color: d.isHoliday ? "#d69a9a" : "rgba(232,240,244,0.50)" }}>
                        {d.event || (d.isHoliday ? "Holiday" : "Regular Classes")}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isToday && (
                          <span style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "999px", background: "rgba(126,203,161,0.14)", border: "1px solid rgba(126,203,161,0.32)", fontSize: "10px", color: "#7ecba1", fontWeight: 600 }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#7ecba1", animation: "pulse 1.5s infinite", display: "inline-block" }} />
                            Today
                          </span>
                        )}
                        <span style={{ padding: "3px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                          background: d.isHoliday ? "rgba(196,123,123,0.10)" : `${doColor}15`,
                          border: `1px solid ${d.isHoliday ? "rgba(196,123,123,0.22)" : doColor + "30"}`,
                          color: d.isHoliday ? "#c47b7b" : doColor }}>
                          {d.isHoliday ? "Holiday" : `DO ${d.dayOrder}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}