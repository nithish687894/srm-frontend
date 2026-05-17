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

  // Matte color palette
  const color = pct >= 75 ? "#7ecba1" : pct >= 65 ? "#c4a97b" : "#c47b7b";
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (animPct / 100) * circ;

  const statusBg   = pct >= 75 ? "rgba(126,203,161,0.12)" : pct >= 65 ? "rgba(196,169,123,0.12)" : "rgba(196,123,123,0.12)";
  const statusBdr  = pct >= 75 ? "rgba(126,203,161,0.24)" : pct >= 65 ? "rgba(196,169,123,0.24)" : "rgba(196,123,123,0.24)";
  const statusText = pct >= 75 ? "#7ecba1" : pct >= 65 ? "#c4a97b" : "#c47b7b";
  const statusLabel = pct >= 75 ? "Safe" : pct >= 65 ? "Warning" : "Critical";

  const pillColors: Record<string, string> = { P: "#7ecba1", A: "#c47b7b", T: "#7b9ec4" };

  return (
    <div
      style={{
        borderRadius: "14px",
        padding: "18px",
        background: "#3a4f5c",
        border: "1px solid rgba(255,255,255,0.09)",
        transition: "transform 0.1s, border-color 0.2s ease, opacity 0.5s",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
      }}
      onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
      onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
      onPointerLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
    >
      {/* Top color strip */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}99, transparent)`, borderRadius: "14px 14px 0 0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        {/* Animated ring */}
        <div style={{ position: "relative", width: "88px", height: "88px", flexShrink: 0 }}>
          <svg width="88" height="88" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "17px", fontWeight: 700, color }}>{Math.round(animPct)}%</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8f0f4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {course["Course Title"]}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(232,240,244,0.40)", marginTop: "2px" }}>
                {course["Course Code"]}
              </div>
            </div>
            <span style={{
              padding: "3px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 600,
              flexShrink: 0, marginLeft: "8px",
              background: statusBg, color: statusText, border: `1px solid ${statusBdr}`,
            }}>
              {statusLabel}
            </span>
          </div>

          {/* P / A / T pills */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
            {[{ l: "P", v: present }, { l: "A", v: absent }, { l: "T", v: conducted }].map(x => (
              <span key={x.l} style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "2px 8px", borderRadius: "999px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)", fontSize: "11px",
              }}>
                <span style={{ color: pillColors[x.l], fontWeight: 700 }}>{x.l}</span>
                <span style={{ color: "rgba(232,240,244,0.50)" }}>{x.v}</span>
              </span>
            ))}
          </div>

          {/* Required / margin */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color, lineHeight: 1 }}>
              {isAtRisk ? required : margin}
            </span>
            <span style={{ fontSize: "11px", color: "rgba(232,240,244,0.45)", fontWeight: 500 }}>
              {isAtRisk ? "classes needed" : "classes margin"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
