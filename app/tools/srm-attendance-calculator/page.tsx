"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Share2 } from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";

export default function AttendanceCalculator() {
  const [total, setTotal] = useState<number | "">("");
  const [attended, setAttended] = useState<number | "">("");
  const theme = useThemeStore((state) => state.theme);
  const isLight = theme === "light";

  const t = typeof total === "number" ? total : 0;
  const a = typeof attended === "number" ? attended : 0;
  const percentage = t > 0 ? (a / t) * 100 : 0;
  const classesNeeded = Math.ceil((0.75 * t - a) / 0.25);
  const canSkip = Math.floor(a - 0.75 * t);
  const status = percentage >= 75 ? "safe" : percentage >= 65 ? "borderline" : "detained";

  const pageText = isLight ? "#17111f" : "#ffffff";
  const mutedText = isLight ? "rgba(23,17,31,0.62)" : "rgba(255,255,255,0.58)";
  const cardBg = isLight
    ? "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(243,238,255,0.90))"
    : "linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))";
  const cardBorder = isLight ? "rgba(88,61,145,0.16)" : "rgba(255,255,255,0.08)";
  const fieldBg = isLight ? "rgba(88,61,145,0.07)" : "rgba(0,0,0,0.34)";
  const fieldBorder = isLight ? "rgba(88,61,145,0.16)" : "rgba(255,255,255,0.10)";
  const statusColor = status === "safe" ? "#10b981" : status === "borderline" ? "#f59e0b" : "#ef4444";

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "SRM Attendance Calculator",
        text: `I have ${percentage.toFixed(1)}% attendance. I can bunk ${canSkip > 0 ? canSkip : 0} more classes! Check your bunk budget on SRM Nexus.`,
        url: "https://srmnexus.app/tools/srm-attendance-calculator",
      });
    } catch (err) {
      console.error("Error sharing", err);
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the minimum attendance required at SRM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SRM requires a minimum of 75% attendance in each subject. Students below 75% are detained and not allowed to write the end-semester exam.",
        },
      },
      {
        "@type": "Question",
        name: "Can I get attendance condonation at SRM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Students with 65-74% attendance may apply for condonation with valid medical certificates or other approved reasons. The decision is made by the HOD.",
        },
      },
    ],
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: isLight
          ? "radial-gradient(circle at 12% 0%, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)"
          : "radial-gradient(circle at 18% 0%, rgba(191,90,242,0.14), transparent 34%), #050508",
        color: pageText,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: "34px 18px 120px",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <Link
          href="/tools"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: mutedText,
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 850,
            marginBottom: "28px",
            background: isLight ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.045)",
            border: `1px solid ${cardBorder}`,
            borderRadius: "999px",
            padding: "10px 14px",
            backdropFilter: "blur(18px)",
          }}
        >
          <ArrowLeft size={16} /> Back to Tools
        </Link>

        <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 950, letterSpacing: "-0.04em", margin: "0 0 12px", lineHeight: 1.06 }}>
          SRM Attendance Calculator
        </h1>
        <p style={{ fontSize: "16px", color: mutedText, lineHeight: 1.6, margin: "0 0 28px", fontWeight: 650 }}>
          Calculate your attendance per subject and see the exact recovery or skip margin for the 75% requirement.
        </p>

        <section
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: "28px",
            padding: "22px",
            marginBottom: "42px",
            boxShadow: isLight
              ? "0 18px 38px rgba(88,61,145,0.12), inset 0 1px 0 rgba(255,255,255,0.84)"
              : "0 18px 42px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "22px" }}>
            {[
              { label: "Total Classes Conducted", value: total, setter: setTotal, placeholder: "e.g. 40" },
              { label: "Classes Attended", value: attended, setter: setAttended, placeholder: "e.g. 30" },
            ].map((field) => (
              <label key={field.label} style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 900, color: mutedText, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                  {field.label}
                </span>
                <input
                  type="number"
                  value={field.value}
                  onChange={(event) => field.setter(event.target.value === "" ? "" : Number(event.target.value))}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    background: fieldBg,
                    border: `1px solid ${fieldBorder}`,
                    borderRadius: "16px",
                    padding: "16px",
                    color: pageText,
                    fontSize: "18px",
                    fontWeight: 850,
                    outline: "none",
                  }}
                />
              </label>
            ))}
          </div>

          {(t > 0 || a > 0) && (
            <div
              style={{
                background: isLight ? "rgba(255,255,255,0.66)" : "rgba(0,0,0,0.30)",
                border: `1px solid ${cardBorder}`,
                borderRadius: "22px",
                padding: "24px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: statusColor }} />
              <div style={{ fontSize: "12px", fontWeight: 900, color: mutedText, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                Current Attendance
              </div>
              <div style={{ fontSize: "clamp(48px, 15vw, 64px)", fontWeight: 950, lineHeight: 1, marginBottom: "16px", color: statusColor }}>
                {percentage.toFixed(1)}%
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: statusColor, fontWeight: 900, fontSize: "16px" }}>
                  {status === "safe" ? <CheckCircle size={20} /> : status === "borderline" ? <AlertTriangle size={20} /> : <XCircle size={20} />}
                  {status === "safe" ? "You are safe." : status === "borderline" ? "Borderline zone." : "Detained zone."}
                </div>
                <div style={{ fontSize: "16px", color: pageText, fontWeight: 700, lineHeight: 1.55 }}>
                  {percentage >= 75 ? (
                    <>You can safely bunk <strong style={{ color: statusColor, fontSize: "22px" }}>{Math.max(0, canSkip)}</strong> more classes.</>
                  ) : (
                    <>Attend the next <strong style={{ color: statusColor, fontSize: "22px" }}>{Math.max(0, classesNeeded)}</strong> classes to reach 75%.</>
                  )}
                </div>
              </div>

              <button
                onClick={handleShare}
                style={{
                  marginTop: "28px",
                  background: isLight ? "rgba(88,61,145,0.10)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${cardBorder}`,
                  color: pageText,
                  padding: "12px 20px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Share2 size={16} /> Share Results
              </button>
            </div>
          )}
        </section>

        <section style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: "36px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 22px" }}>SRM&apos;s 75% Attendance Rule - Explained</h2>
          <div style={{ display: "grid", gap: "20px" }}>
            {[
              ["What happens below 75%?", "SRMIST requires a minimum of 75% attendance in each subject. If a subject falls below the threshold, the student can be barred from the end-semester exam for that subject."],
              ["Can you get condonation?", "Students in the 65-74% band may apply with valid documents, but approval depends on department and university rules."],
              ["How to track it automatically?", "SRM Nexus can sync academic records and help you monitor attendance before it becomes a last-minute problem."],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 style={{ fontSize: "17px", fontWeight: 850, margin: "0 0 8px", color: isLight ? "#6d28d9" : "#D8B4FE" }}>{title}</h3>
                <p style={{ color: mutedText, lineHeight: 1.6, fontWeight: 620, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
