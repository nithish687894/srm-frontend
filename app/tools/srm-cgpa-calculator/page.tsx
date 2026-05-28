"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

const GRADE_POINTS: Record<string, number> = {
  "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "F": 0, "W": 0, "Ab": 0, "I": 0
};

type Subject = {
  id: string;
  name: string;
  credits: number;
  grade: string;
  isClearedArrear?: boolean;
};

type Semester = {
  id: string;
  name: string;
  subjects: Subject[];
};

export default function CGPACalculator() {
  const [semesters, setSemesters] = useState<Semester[]>([
    {
      id: "sem-1",
      name: "Semester 1",
      subjects: [
        { id: "sub-1", name: "Mathematics", credits: 4, grade: "A+" },
        { id: "sub-2", name: "Physics", credits: 3, grade: "A" },
        { id: "sub-3", name: "Programming", credits: 3, grade: "B+" },
      ],
    }
  ]);

  const addSemester = () => {
    const newSemNum = semesters.length + 1;
    setSemesters([...semesters, {
      id: `sem-${Date.now()}`,
      name: `Semester ${newSemNum}`,
      subjects: [
        { id: `sub-${Date.now()}-1`, name: "New Subject", credits: 3, grade: "A" }
      ]
    }]);
  };

  const removeSemester = (semId: string) => {
    setSemesters(semesters.filter(sem => sem.id !== semId));
  };

  const addSubject = (semId: string) => {
    setSemesters(semesters.map(sem => {
      if (sem.id === semId) {
        return {
          ...sem,
          subjects: [...sem.subjects, { id: `sub-${Date.now()}`, name: "New Subject", credits: 3, grade: "A" }]
        };
      }
      return sem;
    }));
  };

  const removeSubject = (semId: string, subId: string) => {
    setSemesters(semesters.map(sem => {
      if (sem.id === semId) {
        return { ...sem, subjects: sem.subjects.filter(s => s.id !== subId) };
      }
      return sem;
    }));
  };

  const updateSubject = (semId: string, subId: string, field: keyof Subject, value: AnyValue) => {
    setSemesters(semesters.map(sem => {
      if (sem.id === semId) {
        return {
          ...sem,
          subjects: sem.subjects.map(sub => sub.id === subId ? { ...sub, [field]: value } : sub)
        };
      }
      return sem;
    }));
  };

  // -- Calculations --
  const getSGPA = (subjects: Subject[]) => {
    const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
    const totalPoints = subjects.reduce((sum, s) => {
      const credits = Number(s.credits) || 0;
      const points = GRADE_POINTS[s.grade] || 0;
      return sum + (credits * points);
    }, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  };

  const cgpaData = useMemo(() => {
    const allSubjects = semesters.flatMap(sem => sem.subjects);
    const totalCredits = allSubjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
    const totalPoints = allSubjects.reduce((sum, s) => {
      const credits = Number(s.credits) || 0;
      const points = GRADE_POINTS[s.grade] || 0;
      return sum + (credits * points);
    }, 0);
    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    return { cgpa, totalCredits, totalPoints };
  }, [semesters]);

  const arrears = useMemo(() => {
    const arr: { semId: string; semName: string; subject: Subject }[] = [];
    semesters.forEach(sem => {
      sem.subjects.forEach(sub => {
        if (sub.grade === "F") {
          arr.push({ semId: sem.id, semName: sem.name, subject: sub });
        }
      });
    });
    return arr;
  }, [semesters]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SRM CGPA Calculator",
          text: `I just calculated my CGPA: ${cgpaData.cgpa}! Use SRM Nexus to calculate yours instantly.`,
          url: "https://srmnexus.app/tools/srm-cgpa-calculator",
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    }
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        
        <Link href="/tools" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888", textDecoration: "none", fontSize: "14px", fontWeight: 700, marginBottom: "32px", width: "max-content" }}>
          <ArrowLeft size={16} /> Back to Tools
        </Link>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "24px", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 12px 0", lineHeight: 1.1 }}>
              SRM CGPA Calculator
            </h1>
            <p style={{ fontSize: "16px", color: "#888", lineHeight: 1.6, maxWidth: "600px" }}>
              Multi-semester absolute grading calculator. Add semesters, track SGPAs, and manage arrears dynamically.
            </p>
          </div>
          <button 
            onClick={addSemester}
            style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "14px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
          >
            <Plus size={18} /> Add Semester
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
          
          {/* Main Semesters Area */}
          <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "32px" }}>
            {semesters.length === 0 && (
               <div style={{ textAlign: "center", padding: "60px", background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                 <p style={{ color: "#666", fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>No semesters added yet.</p>
                 <button onClick={addSemester} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}>Start Calculating</button>
               </div>
            )}

            {semesters.map((sem, sIndex) => {
              const sgpa = getSGPA(sem.subjects);
              return (
                <div key={sem.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "32px", height: "32px", background: "#3b82f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "14px" }}>
                        {sIndex + 1}
                      </div>
                      <input 
                        type="text" 
                        value={sem.name}
                        onChange={(e) => setSemesters(semesters.map(s => s.id === sem.id ? { ...s, name: e.target.value } : s))}
                        style={{ background: "transparent", border: "none", color: "#fff", fontSize: "18px", fontWeight: 800, outline: "none", width: "150px" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", padding: "6px 12px", borderRadius: "8px", fontWeight: 900, fontSize: "14px" }}>
                        SGPA: {sgpa}
                      </div>
                      <button onClick={() => removeSemester(sem.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ padding: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      {sem.subjects.map((sub, i) => {
                        const isF = sub.grade === "F";
                        return (
                          <div key={sub.id} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", background: isF ? "rgba(239, 68, 68, 0.05)" : "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "12px", border: isF ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid transparent" }}>
                            <div style={{ flex: "1 1 200px" }}>
                              <input 
                                type="text"
                                placeholder="Subject Name"
                                value={sub.name}
                                onChange={e => updateSubject(sem.id, sub.id, "name", e.target.value)}
                                style={{ width: "100%", background: "transparent", border: "none", color: "#fff", fontSize: "14px", fontWeight: 700, outline: "none" }}
                              />
                            </div>
                            
                            <select 
                              value={sub.credits} 
                              onChange={e => updateSubject(sem.id, sub.id, "credits", Number(e.target.value))}
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", color: "#fff", outline: "none", appearance: "none", width: "100px", fontSize: "14px", fontWeight: 700 }}
                            >
                              {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} Credits</option>)}
                            </select>

                            <select 
                              value={sub.grade} 
                              onChange={e => updateSubject(sem.id, sub.id, "grade", e.target.value)}
                              style={{ background: isF ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.05)", border: isF ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", color: isF ? "#fca5a5" : "#fff", outline: "none", appearance: "none", width: "100px", fontSize: "14px", fontWeight: 900 }}
                            >
                              {Object.keys(GRADE_POINTS).map(g => <option key={g} value={g}>Grade {g}</option>)}
                            </select>

                            <button onClick={() => removeSubject(sem.id, sub.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: "8px", transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#ef4444"} onMouseOut={e => e.currentTarget.style.color = "#666"}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                    <button onClick={() => addSubject(sem.id)} style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", color: "#aaa", padding: "12px", borderRadius: "12px", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }} onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#aaa"; }}>
                      <Plus size={14} /> Add Subject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Sidebar / CGPA Output */}
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ position: "sticky", top: "40px", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              <div style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "24px", padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Cumulative GPA
                </div>
                <div style={{ fontSize: "80px", fontWeight: 900, lineHeight: 1, marginBottom: "24px", background: "linear-gradient(to right, #60a5fa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {cgpaData.cgpa}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "16px", borderRadius: "16px", marginBottom: "32px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: 800, marginBottom: "4px" }}>Total Credits</div>
                    <div style={{ fontSize: "20px", fontWeight: 800 }}>{cgpaData.totalCredits}</div>
                  </div>
                  <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: 800, marginBottom: "4px" }}>Grade Points</div>
                    <div style={{ fontSize: "20px", fontWeight: 800 }}>{cgpaData.totalPoints}</div>
                  </div>
                </div>

                <button 
                  onClick={handleShare}
                  style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", padding: "16px", borderRadius: "14px", fontSize: "16px", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
                >
                  <Share2 size={18} /> Share Result
                </button>
              </div>

              {/* Arrear Tracker Block */}
              {arrears.length > 0 && (
                <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "24px", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", marginBottom: "16px" }}>
                    <AlertTriangle size={18} />
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Arrear Tracker</h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "20px", lineHeight: 1.5 }}>
                    Clear arrears by assigning a new passing grade. The CGPA will automatically recalculate.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {arrears.map((arr, i) => (
                      <div key={i} style={{ background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{arr.subject.name}</div>
                            <div style={{ fontSize: "11px", color: "#666", fontWeight: 700, marginTop: "2px" }}>{arr.semName} • {arr.subject.credits} CR</div>
                          </div>
                          <div style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "12px", fontWeight: 900, padding: "4px 8px", borderRadius: "6px" }}>F</div>
                        </div>
                        
                        <div style={{ display: "flex", gap: "8px" }}>
                          <select 
                            value="F"
                            onChange={e => updateSubject(arr.semId, arr.subject.id, "grade", e.target.value)}
                            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px", color: "#a8c200", outline: "none", fontSize: "12px", fontWeight: 800 }}
                          >
                            <option value="F" disabled>Clear this arrear...</option>
                            <option value="O">Cleared with O</option>
                            <option value="A+">Cleared with A+</option>
                            <option value="A">Cleared with A</option>
                            <option value="B+">Cleared with B+</option>
                            <option value="B">Cleared with B</option>
                            <option value="C">Cleared with C</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
