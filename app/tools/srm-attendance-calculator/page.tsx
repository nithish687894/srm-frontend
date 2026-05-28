"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Share2 } from "lucide-react";

export default function AttendanceCalculator() {
  const [total, setTotal] = useState<number | "">("");
  const [attended, setAttended] = useState<number | "">("");

  const t = typeof total === "number" ? total : 0;
  const a = typeof attended === "number" ? attended : 0;
  
  const percentage = t > 0 ? (a / t) * 100 : 0;
  const classesNeeded = Math.ceil((0.75 * t - a) / 0.25);
  const canSkip = Math.floor(a - 0.75 * t);

  const status = percentage >= 75 ? "safe" : percentage >= 65 ? "borderline" : "detained";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SRM Attendance Calculator",
          text: `I have ${percentage.toFixed(1)}% attendance. I can bunk ${canSkip > 0 ? canSkip : 0} more classes! Check your bunk budget on SRM Nexus.`,
          url: "https://srmnexus.app/tools/srm-attendance-calculator",
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the minimum attendance required at SRM?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "SRM requires a minimum of 75% attendance in each subject. Students below 75% are detained and not allowed to write the end-semester exam."
        }
      },
      {
        "@type": "Question",
        "name": "Can I get attendance condonation at SRM?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Students with 65-74% attendance may apply for condonation with valid medical certificates or other approved reasons. The decision is made by the HOD."
        }
      },
      {
        "@type": "Question",
        "name": "How many classes can I miss at SRM?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "If you have attended 60 out of 80 total classes, you're at 75% — exactly the threshold. Use the SRM Nexus attendance calculator to see your exact bunk budget."
        }
      }
    ]
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/tools" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted, #888)", textDecoration: "none", fontSize: "14px", fontWeight: 700, marginBottom: "32px" }}>
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 16px 0", lineHeight: 1.1 }}>
          SRM Attendance Calculator
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-secondary, #aaa)", lineHeight: 1.6, marginBottom: "40px" }}>
          Calculate your SRM attendance instantly. Know exactly how many classes you can skip while staying above the 75% requirement.
        </p>

        <div style={{ 
          background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", marginBottom: "48px"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "32px" }}>
            <div style={{ flex: "1 1 300px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "var(--text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Total Classes Conducted</label>
              <input 
                type="number" 
                value={total} 
                onChange={(e) => setTotal(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 40"
                style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", color: "#fff", fontSize: "18px", outline: "none" }}
              />
            </div>
            <div style={{ flex: "1 1 300px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "var(--text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Classes Attended</label>
              <input 
                type="number" 
                value={attended} 
                onChange={(e) => setAttended(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 30"
                style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", color: "#fff", fontSize: "18px", outline: "none" }}
              />
            </div>
          </div>

          {(t > 0 || a > 0) && (
            <div style={{ 
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", 
              borderRadius: "16px", padding: "24px", textAlign: "center", position: "relative", overflow: "hidden"
            }}>
              {status === "safe" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "#10b981" }} />}
              {status === "borderline" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "#f59e0b" }} />}
              {status === "detained" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "#ef4444" }} />}

              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Current Attendance
              </div>
              <div style={{ fontSize: "64px", fontWeight: 900, lineHeight: 1, marginBottom: "16px", color: status === "safe" ? "#10b981" : status === "borderline" ? "#f59e0b" : "#ef4444" }}>
                {percentage.toFixed(1)}%
              </div>

              {percentage >= 75 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 800, fontSize: "16px" }}>
                    <CheckCircle size={20} /> You are safe.
                  </div>
                  <div style={{ fontSize: "18px", color: "var(--text-primary, #fff)" }}>
                    You can safely bunk <strong style={{ color: "var(--accent, #a8c200)", fontSize: "24px" }}>{canSkip}</strong> more classes.
                  </div>
                </div>
              ) : percentage >= 65 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", fontWeight: 800, fontSize: "16px" }}>
                    <AlertTriangle size={20} /> Borderline/Condonation Zone.
                  </div>
                  <div style={{ fontSize: "18px", color: "var(--text-primary, #fff)" }}>
                    Attend the next <strong style={{ color: "#f59e0b", fontSize: "24px" }}>{classesNeeded}</strong> classes to reach 75%.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontWeight: 800, fontSize: "16px" }}>
                    <XCircle size={20} /> Detained Zone.
                  </div>
                  <div style={{ fontSize: "18px", color: "var(--text-primary, #fff)" }}>
                    You must attend the next <strong style={{ color: "#ef4444", fontSize: "24px" }}>{classesNeeded}</strong> classes to recover to 75%.
                  </div>
                </div>
              )}

              <button 
                onClick={handleShare}
                style={{ marginTop: "32px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 24px", borderRadius: "99px", fontSize: "14px", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
              >
                <Share2 size={16} /> Share Results
              </button>
            </div>
          )}
        </div>

        {/* SEO Content Section */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "48px", marginTop: "48px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>SRM&apos;s 75% Attendance Rule — Explained</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "var(--accent, #a8c200)" }}>What happens below 75%?</h3>
              <p style={{ color: "var(--text-secondary, #aaa)", lineHeight: 1.6 }}>
                SRM Institute of Science and Technology (SRMIST) strictly enforces a 75% attendance mandate for all subjects. If your attendance falls below this threshold by the end of the semester, you will be detained and barred from appearing in the End Semester Examinations (ESE) for that specific subject.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "var(--accent, #a8c200)" }}>Can you get a condonation?</h3>
              <p style={{ color: "var(--text-secondary, #aaa)", lineHeight: 1.6 }}>
                Students whose attendance falls between 65% and 74% are eligible to apply for condonation. This is typically granted only for valid, documented medical reasons or participation in university-approved events. Condonation requires approval from the Head of the Department (HOD) and usually involves paying a condonation fine.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "var(--accent, #a8c200)" }}>How to track it automatically?</h3>
              <p style={{ color: "var(--text-secondary, #aaa)", lineHeight: 1.6 }}>
                Instead of manually calculating your attendance every week, you can log into <strong>SRM Nexus</strong>. Our student portal automatically syncs with Academia, tracks your live attendance across all subjects, and alerts you when you drop into the danger zone.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
