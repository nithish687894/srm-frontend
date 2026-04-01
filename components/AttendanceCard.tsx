"use client";
import { useEffect, useState } from "react";

export default function AttendanceCard({ course }: { course: any }) {
  const pct = parseFloat(course["Attn %"]) || 0;
  const conducted = parseInt(course["Hours Conducted"]) || 0;
  const absent = parseInt(course["Hours Absent"]) || 0;
  const present = conducted - absent;
  const required = Math.ceil((0.75 * conducted - present) / 0.25);
  const margin = Math.floor((present - 0.75 * conducted) / 0.75);
  const isAtRisk = pct < 75;

  const [animPct, setAnimPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true);
      const steps = 60;
      const inc = pct / steps;
      let cur = 0;
      const iv = setInterval(() => {
        cur += inc;
        if (cur >= pct) { setAnimPct(pct); clearInterval(iv); }
        else setAnimPct(cur);
      }, 1500 / steps);
      return () => clearInterval(iv);
    }, 100);
    return () => clearTimeout(t);
  }, [pct]);

  const color = pct >= 75 ? "#00ff87" : pct >= 65 ? "#ffb300" : "#ff4757";
  const colorDim = pct >= 75 ? "#00e676" : pct >= 65 ? "#f59e0b" : "#ef4444";
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (animPct / 100) * circ;

  return (
    <div
      style={{
        borderRadius: "16px",
        padding: "20px",
        background: "rgba(10,10,10,0.55)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.3s ease, opacity 0.5s, transform 0.5s",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,255,135,0.20)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Animated ring */}
        <div style={{ position: "relative", width: "96px", height: "96px", flexShrink: 0 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 8px ${color}50)`, transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color }}>{Math.round(animPct)}%</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {course["Course Title"]}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{course["Course Code"]}</div>
            </div>
            <span style={{
              padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 500,
              flexShrink: 0, marginLeft: "8px",
              background: pct >= 75 ? "rgba(0,255,135,0.08)" : pct >= 65 ? "rgba(255,179,0,0.08)" : "rgba(255,71,87,0.08)",
              color: colorDim,
              border: `1px solid ${pct >= 75 ? "rgba(0,255,135,0.20)" : pct >= 65 ? "rgba(255,179,0,0.20)" : "rgba(255,71,87,0.20)"}`,
            }}>
              {pct >= 75 ? "Safe" : pct >= 65 ? "Warning" : "Critical"}
            </span>
          </div>

          {/* P / A / T pills */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            {[{ l: "P", v: present, c: "#00ff87" }, { l: "A", v: absent, c: "#ff4757" }, { l: "T", v: conducted, c: "#4d8eff" }].map(x => (
              <span key={x.l} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "999px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px" }}>
                <span style={{ color: x.c, fontWeight: 600 }}>{x.l}</span>
                <span style={{ color: "rgba(255,255,255,0.38)" }}>{x.v}</span>
              </span>
            ))}
          </div>

          {/* Required / margin */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: isAtRisk ? "#ff4757" : "#00ff87", lineHeight: 1 }}>
              {isAtRisk ? required : margin}
            </span>
            <span style={{ fontSize: "11px", color: isAtRisk ? "#ff4757" : "#00ff87", fontWeight: 500 }}>
              {isAtRisk ? "classes needed" : "classes margin"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
