"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Plus, Trash2 } from "lucide-react";

const GRADE_POINTS: Record<string, number> = {
  "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "W": 0, "F": 0, "Ab": 0, "I": 0
};

export default function CGPACalculator() {
  const [subjects, setSubjects] = useState<{ id: number, credits: number, grade: string }[]>([
    { id: 1, credits: 4, grade: "A" },
    { id: 2, credits: 3, grade: "A+" },
    { id: 3, credits: 3, grade: "B+" },
    { id: 4, credits: 2, grade: "O" },
  ]);

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), credits: 3, grade: "A" }]);
  };

  const removeSubject = (id: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const updateSubject = (id: number, field: "credits" | "grade", value: any) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
  const totalPoints = subjects.reduce((sum, s) => {
    const credits = Number(s.credits) || 0;
    const points = GRADE_POINTS[s.grade] || 0;
    return sum + (credits * points);
  }, 0);

  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SRM CGPA Calculator",
          text: `I just calculated my GPA: ${sgpa}! Use SRM Nexus to calculate yours instantly.`,
          url: "https://srmnexus.app/tools/srm-cgpa-calculator",
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SRM CGPA Calculator",
    "url": "https://srmnexus.app/tools/srm-cgpa-calculator",
    "applicationCategory": "EducationApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "Calculate SRM University CGPA and SGPA instantly. Supports 2018 and 2021 regulations for all branches.",
    "provider": {
      "@type": "Organization",
      "name": "SRM Nexus",
      "url": "https://srmnexus.app"
    }
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How is CGPA calculated in SRM?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "CGPA is calculated by dividing the sum of (Course Credits × Grade Points) for all courses by the total number of credits attempted."
        }
      },
      {
        "@type": "Question",
        "name": "What is the grade point for O grade in SRM?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An 'O' (Outstanding) grade carries 10 grade points. A+ carries 9 points, A carries 8 points, B+ carries 7 points, B carries 6 points, and C carries 5 points."
        }
      }
    ]
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <Link href="/tools" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted, #888)", textDecoration: "none", fontSize: "14px", fontWeight: 700, marginBottom: "32px" }}>
        <ArrowLeft size={16} /> Back to Tools
      </Link>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 16px 0", lineHeight: 1.1 }}>
          SRM SGPA/CGPA Calculator
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-secondary, #aaa)", lineHeight: 1.6, marginBottom: "40px" }}>
          Calculate your semester grade point average accurately. Pre-configured for SRM University's 10-point absolute grading scale.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", marginBottom: "48px" }}>
          
          {/* Calculator Form */}
          <div style={{ flex: "1 1 400px", background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Semester Courses</h2>
              <button onClick={addSubject} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <Plus size={14} /> Add Subject
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {subjects.map((sub, i) => (
                <div key={sub.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "32px", height: "32px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "var(--text-muted, #888)" }}>
                    {i + 1}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <select 
                      value={sub.credits} 
                      onChange={e => updateSubject(sub.id, "credits", Number(e.target.value))}
                      style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#fff", outline: "none", appearance: "none" }}
                    >
                      {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} Credits</option>)}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <select 
                      value={sub.grade} 
                      onChange={e => updateSubject(sub.id, "grade", e.target.value)}
                      style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", outline: "none", appearance: "none", fontWeight: 800, color: sub.grade === 'F' ? '#ef4444' : '#fff' }}
                    >
                      {Object.keys(GRADE_POINTS).map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => removeSubject(sub.id)} 
                    disabled={subjects.length <= 1}
                    style={{ background: "none", border: "none", color: subjects.length <= 1 ? "rgba(255,255,255,0.1)" : "#ef4444", cursor: subjects.length <= 1 ? "not-allowed" : "pointer", padding: "8px" }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Result Card */}
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ 
              position: "sticky", top: "100px",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))", 
              border: "1px solid rgba(59, 130, 246, 0.2)", 
              borderRadius: "24px", padding: "40px", textAlign: "center"
            }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                Estimated SGPA
              </div>
              <div style={{ fontSize: "80px", fontWeight: 900, lineHeight: 1, marginBottom: "24px", background: "linear-gradient(to right, #60a5fa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {sgpa}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "16px", borderRadius: "16px", marginBottom: "32px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted, #888)", textTransform: "uppercase", fontWeight: 800, marginBottom: "4px" }}>Total Credits</div>
                  <div style={{ fontSize: "20px", fontWeight: 800 }}>{totalCredits}</div>
                </div>
                <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted, #888)", textTransform: "uppercase", fontWeight: 800, marginBottom: "4px" }}>Grade Points</div>
                  <div style={{ fontSize: "20px", fontWeight: 800 }}>{totalPoints}</div>
                </div>
              </div>

              <button 
                onClick={handleShare}
                style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", padding: "16px", borderRadius: "14px", fontSize: "16px", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
              >
                <Share2 size={18} /> Share Result
              </button>
            </div>
          </div>
        </div>

        {/* SEO Content Section */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "48px", marginTop: "48px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>SRM Grading System Explained</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "var(--accent, #a8c200)" }}>The 10-Point Absolute Grading Scale</h3>
              <p style={{ color: "var(--text-secondary, #aaa)", lineHeight: 1.6 }}>
                SRM IST utilizes a 10-point absolute grading system for all recent regulations (2018, 2021). The grades are awarded based on your final combined score (Internal marks + End Semester Evaluation).
              </p>
              
              <div style={{ marginTop: "16px", overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <th style={{ padding: "12px", color: "var(--text-muted, #888)" }}>Marks Range</th>
                      <th style={{ padding: "12px", color: "var(--text-muted, #888)" }}>Grade</th>
                      <th style={{ padding: "12px", color: "var(--text-muted, #888)" }}>Grade Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px" }}>91 - 100</td><td style={{ padding: "12px", fontWeight: 800, color: "#a8c200" }}>O (Outstanding)</td><td style={{ padding: "12px", fontWeight: 800 }}>10</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px" }}>81 - 90</td><td style={{ padding: "12px", fontWeight: 800 }}>A+ (Excellent)</td><td style={{ padding: "12px", fontWeight: 800 }}>9</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px" }}>71 - 80</td><td style={{ padding: "12px", fontWeight: 800 }}>A (Very Good)</td><td style={{ padding: "12px", fontWeight: 800 }}>8</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px" }}>61 - 70</td><td style={{ padding: "12px", fontWeight: 800 }}>B+ (Good)</td><td style={{ padding: "12px", fontWeight: 800 }}>7</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px" }}>56 - 60</td><td style={{ padding: "12px", fontWeight: 800 }}>B (Above Average)</td><td style={{ padding: "12px", fontWeight: 800 }}>6</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px" }}>50 - 55</td><td style={{ padding: "12px", fontWeight: 800 }}>C (Average)</td><td style={{ padding: "12px", fontWeight: 800 }}>5</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "12px" }}>&lt; 50</td><td style={{ padding: "12px", fontWeight: 800, color: "#ef4444" }}>F (Fail)</td><td style={{ padding: "12px", fontWeight: 800 }}>0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px", color: "var(--accent, #a8c200)" }}>Automatic Tracking</h3>
              <p style={{ color: "var(--text-secondary, #aaa)", lineHeight: 1.6 }}>
                Instead of estimating your grades manually, sign in to <strong>SRM Nexus</strong>. We automatically fetch your internal marks, calculate the minimum required external marks for every grade, and track your historical SGPA curve across semesters.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
