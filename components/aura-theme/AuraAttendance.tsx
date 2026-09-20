"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { RefreshCcw, X, AlertCircle, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import AuraBackground from "./effects/AuraBackground";

const getStatusColor = (pct: number) => {
  if (pct === 0) return "#94A3B8";
  if (pct < 75) return "#EF4444"; // Red
  if (pct < 80) return "#F59E0B"; // Amber Warning
  if (pct < 90) return "#2563EB"; // Blue
  return "#10B981"; // Green
};

const getStatusBg = (pct: number) => {
  if (pct === 0) return "rgba(148, 163, 184, 0.1)";
  if (pct < 75) return "rgba(239, 68, 68, 0.1)";
  if (pct < 80) return "rgba(245, 158, 11, 0.1)";
  return "rgba(16, 185, 129, 0.1)";
};

const getStatusBorder = (pct: number) => {
  if (pct === 0) return "rgba(148, 163, 184, 0.2)";
  if (pct < 75) return "rgba(239, 68, 68, 0.25)";
  if (pct < 80) return "rgba(245, 158, 11, 0.25)";
  return "rgba(16, 185, 129, 0.25)";
};

function AttendanceRegister({
  activeTheme,
  stars,
  stats,
  filteredAttendance,
  filter,
  setFilter,
  sortOption,
  setSortOption,
  demoPreview,
  isSpConnected,
  isSyncing,
  handleSync,
  timeAgoStr,
  isLoading,
  selectedSubject,
  handleOpenSubject,
  handleCloseSubject
}: AnyValue) {
  const overallColor = getStatusColor(stats.overallAvg);

  return (
    <AuraBackground theme={activeTheme} stars={stars}>
      <main style={{ minHeight: "100dvh", padding: "calc(env(safe-area-inset-top, 0px) + 54px) 16px calc(env(safe-area-inset-bottom, 0px) + 76px)" }}>
        <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto" }}>
          
          {/* Header */}
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "22px" }}>
            <div>
              <p style={{ margin: "0 0 6px", color: "#60A5FA", fontSize: "11px", fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {demoPreview ? "Demo workspace" : "Academic workspace"}
              </p>
              <h1 style={{ margin: 0, color: "#F7F5FA", fontSize: "30px", letterSpacing: "-0.04em", fontWeight: 850 }}>
                Attendance
              </h1>
              <p style={{ margin: "5px 0 0", color: "#9C96A7", fontSize: "13px" }}>
                {demoPreview ? "Sample semester records" : timeAgoStr || "Current semester records"}
              </p>
            </div>
            <button
              onClick={demoPreview ? undefined : handleSync}
              disabled={isSyncing}
              aria-label="Refresh attendance"
              style={{
                height: "38px",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "10px",
                border: "1px solid #292532",
                background: "#12121A",
                color: demoPreview || isSpConnected ? "#93C5FD" : "#FBBF24",
                fontSize: "12px",
                fontWeight: 700,
                cursor: demoPreview || isSyncing ? "default" : "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <RefreshCcw size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>{demoPreview ? "Sample data" : isSyncing ? "Refreshing…" : isSpConnected ? "Refresh" : "Connect portal"}</span>
            </button>
          </header>

          {/* Overall Attendance Card */}
          <section style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "14px", padding: "18px 20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <div style={{ color: "#9C96A7", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 750 }}>
                  Overall attendance
                </div>
                <div style={{ fontSize: "40px", color: overallColor, fontWeight: 850, letterSpacing: "-0.06em", lineHeight: 1.1, marginTop: "6px" }}>
                  {stats.overallAvg.toFixed(1)}%
                </div>
                <div style={{ color: "#8F8998", fontSize: "12px", marginTop: "6px", fontWeight: 600 }}>
                  {stats.totalAttended} attended of {stats.totalConducted} conducted classes
                </div>
              </div>

              <div style={{ borderLeft: "1px solid #292532", paddingLeft: "16px", display: "grid", gap: "8px", minWidth: "110px", textAlign: "right" }}>
                <div>
                  <div style={{ color: "#F7F5FA", fontSize: "18px", fontWeight: 800 }}>{stats.totalSubs}</div>
                  <div style={{ color: "#8F8998", fontSize: "11px" }}>Courses</div>
                </div>
                <div>
                  <div style={{ color: stats.atRiskCount ? "#EF4444" : "#10B981", fontSize: "18px", fontWeight: 800 }}>{stats.atRiskCount}</div>
                  <div style={{ color: "#8F8998", fontSize: "11px" }}>Below 75%</div>
                </div>
              </div>
            </div>

            <div style={{ height: "4px", background: "#25252F", borderRadius: "999px", overflow: "hidden", marginTop: "16px" }}>
              <div style={{ height: "100%", width: `${Math.min(100, stats.overallAvg)}%`, background: overallColor, borderRadius: "999px" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", color: "#807A88", fontSize: "11px" }}>
              <span>Target: 75%</span>
              <span>{demoPreview ? "Preview dataset" : "Active registration"}</span>
            </div>
          </section>

          {/* Recovery Alert if any subject is below 75% */}
          {stats.atRiskCount > 0 && (
            <button
              onClick={() => setFilter("At Risk")}
              style={{
                width: "100%",
                display: "flex",
                textAlign: "left",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
                borderRadius: "10px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.24)",
                color: "#FCA5A5",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>{stats.atRiskCount} {stats.atRiskCount === 1 ? "course" : "courses"} below 75% requirement.</span>
              </div>
              <ChevronRight size={15} color="#F87171" />
            </button>
          )}

          {/* Filters & Sort Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                ["All", stats.totalSubs],
                ["At Risk", stats.atRiskCount],
                ["Safe", stats.safeCount]
              ].map(([label, count]) => (
                <button
                  key={String(label)}
                  onClick={() => setFilter(String(label))}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: filter === label ? "1px solid #2563EB" : "1px solid #292532",
                    background: filter === label ? "#2563EB" : "#12121A",
                    color: filter === label ? "#FFFFFF" : "#B8B2C2",
                    fontSize: "12px",
                    fontWeight: 750,
                    cursor: "pointer"
                  }}
                >
                  {label} <span style={{ opacity: 0.75 }}>{count}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <SlidersHorizontal size={13} color="#8F8998" />
              <select
                aria-label="Sort courses"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                style={{
                  background: "#12121A",
                  border: "1px solid #292532",
                  color: "#C9C4D0",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  fontWeight: 650,
                  cursor: "pointer"
                }}
              >
                <option value="default">Default order</option>
                <option value="lowest">Lowest attendance first</option>
                <option value="highest">Highest attendance first</option>
                <option value="alpha">Course title (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Course List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {isLoading ? (
              <div style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "12px", padding: "28px 20px", textAlign: "center", color: "#8F8998", fontSize: "13px" }}>
                Loading attendance records…
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "12px", padding: "28px 20px", textAlign: "center", color: "#8F8998", fontSize: "13px" }}>
                No courses match the selected filter.
              </div>
            ) : (
              filteredAttendance.map((course: AnyValue, index: number) => {
                const color = getStatusColor(course.pct);
                const safe = course.pct >= 75;

                return (
                  <button
                    key={`${course.courseCode}-${index}`}
                    onClick={() => handleOpenSubject(course)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "#12121A",
                      border: "1px solid #292532",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px"
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 style={{ margin: 0, color: "#F7F5FA", fontSize: "14px", fontWeight: 750, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {course.courseTitle}
                      </h2>
                      <div style={{ color: "#8F8998", fontSize: "11px", marginTop: "3px", fontWeight: 650 }}>
                        {course.courseCode} · {course.attended}/{course.conducted} classes
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color, fontSize: "18px", lineHeight: 1, fontWeight: 850, letterSpacing: "-0.03em" }}>
                        {course.pct.toFixed(1)}%
                      </div>
                      <div style={{ color: safe ? "#10B981" : "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: 700 }}>
                        {safe
                          ? course.skipBuffer > 0
                            ? `${course.skipBuffer} classes margin`
                            : "At 75% threshold"
                          : `${course.requiredToPass} classes required`}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>
      </main>

      {/* Modal Detail Sheet */}
      {selectedSubject && (
        <div className="modal-overlay" onClick={handleCloseSubject}>
          <section className="modal-sheet" onClick={(event) => event.stopPropagation()} style={{ maxWidth: "540px", borderRadius: "16px" }}>
            <button onClick={handleCloseSubject} style={{ float: "right", border: "none", background: "transparent", color: "#B8B2C2", cursor: "pointer" }} aria-label="Close course details">
              <X size={20} />
            </button>
            <p style={{ color: "#8F8998", margin: 0, fontSize: "11px", fontWeight: 700 }}>{selectedSubject.courseCode}</p>
            <h2 style={{ margin: "6px 36px 18px 0", color: "#F7F5FA", fontSize: "18px", lineHeight: 1.3, fontWeight: 800 }}>{selectedSubject.courseTitle}</h2>
            
            <div style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${getStatusBorder(selectedSubject.pct)}`, background: getStatusBg(selectedSubject.pct), display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ color: getStatusColor(selectedSubject.pct), fontWeight: 850, fontSize: "32px", lineHeight: 1 }}>{selectedSubject.pct.toFixed(1)}%</div>
                <div style={{ color: "#8F8998", fontSize: "11px", marginTop: "4px", fontWeight: 650 }}>Recorded percentage</div>
              </div>
              <div style={{ color: "#C6C0CB", fontSize: "12px", lineHeight: 1.6, textAlign: "right" }}>
                <div><strong style={{ color: "#F7F5FA" }}>{selectedSubject.attended}</strong> attended</div>
                <div><strong style={{ color: "#F7F5FA" }}>{selectedSubject.conducted}</strong> conducted</div>
                <div><strong style={{ color: selectedSubject.absent ? "#EF4444" : "#F7F5FA" }}>{selectedSubject.absent}</strong> absent</div>
              </div>
            </div>

            <div style={{ marginTop: "16px", color: "#D1CBD7", fontSize: "13px", lineHeight: 1.5, background: "#0E0E15", border: "1px solid #22222C", padding: "12px 14px", borderRadius: "10px" }}>
              {selectedSubject.pct >= 75 ? (
                selectedSubject.skipBuffer > 0 ? (
                  <span>Safe. You have a margin of <strong style={{ color: "#10B981" }}>{selectedSubject.skipBuffer}</strong> class{selectedSubject.skipBuffer === 1 ? "" : "es"} before falling below the 75% requirement.</span>
                ) : (
                  <span>At limit. You are currently exactly at 75%. Attendance in your next scheduled class is required to maintain safety.</span>
                )
              ) : (
                <span>Below 75%. You must attend the next <strong style={{ color: "#EF4444" }}>{selectedSubject.requiredToPass}</strong> consecutive class{selectedSubject.requiredToPass === 1 ? "" : "es"} without absence to restore 75% attendance.</span>
              )}
            </div>
          </section>
        </div>
      )}
    </AuraBackground>
  );
}

export default function AuraAttendance({ 
  attendance = [], 
  handleSync, 
  onReconnect,
  isSyncing = false, 
  isLoading = false,
  attendanceState = "unavailable",
  unavailableMessage = "Attendance could not be loaded. Please try again.",
  timeAgoStr = "",
  studentPortalStatus = "disconnected",
  demoPreview = false
}: AnyValue) {
  const [filter, setFilter] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("default");
  const [selectedSubject, setSelectedSubject] = useState<AnyValue | null>(null);
  const { activeTheme, stars } = useAuraTheme();

  const isSpConnected = studentPortalStatus === "connected";

  // Handle browser back button when modal is open
  useEffect(() => {
    const handlePopState = () => {
      if (selectedSubject) setSelectedSubject(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedSubject]);

  const handleOpenSubject = useCallback((sub: AnyValue) => {
    if (!sub) return;
    try {
      window.history.pushState({ modal: "subject_detail" }, "");
    } catch {}
    setSelectedSubject(sub);
  }, []);

  const handleCloseSubject = useCallback(() => {
    setSelectedSubject(null);
    if (window.history.state?.modal === "subject_detail") {
      try { window.history.back(); } catch {}
    }
  }, []);

  const processedAttendance = useMemo(() => {
    if (!Array.isArray(attendance) || attendance.length === 0) return [];

    const MONTH_REGEX = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-\s_]?\d{2,4}$/i;

    return attendance.filter((a: AnyValue) => {
      if (!a || typeof a !== "object") return false;
      const code = String(a["Course Code"] || a.courseCode || a.code || "").trim();
      const title = String(a["Course Title"] || a.courseTitle || a.title || "").trim();
      if (MONTH_REGEX.test(code) || MONTH_REGEX.test(title)) return false;
      if (code.toLowerCase().includes('total') || code.toLowerCase().includes('aggregate')) return false;
      return true;
    }).map((a: AnyValue) => {
      const pctStr = a["Attn %"] ?? a.pct ?? a.percentage ?? a.attendancePercentage;
      const parsedPct = parseFloat(String(pctStr)) || 0;
      let conducted = parseInt(String(a["Hours Conducted"] ?? a.conducted ?? a.hoursConducted)) || 0;
      let absent = parseInt(String(a["Hours Absent"] ?? a.absent ?? a.hoursAbsent)) || 0;
      
      if (conducted === 0 && pctStr !== undefined && pctStr !== null && pctStr !== "null") {
        conducted = 30;
        const presentEst = Math.round(conducted * (parsedPct / 100));
        absent = conducted - presentEst;
      }
      
      const attended = Math.max(0, conducted - absent);
      const computedPct = conducted > 0 ? (attended / conducted) * 100 : (parsedPct || 0);

      // Skips and recovery calculations
      const skipBuffer = Math.max(0, Math.floor((attended - 0.75 * conducted) / 0.75));
      const requiredToPass = Math.max(0, Math.ceil(3 * conducted - 4 * attended));

      return {
        courseCode: a["Course Code"] || a.courseCode || a.code || "SUBJ",
        courseTitle: a["Course Title"] || a.courseTitle || a.title || "Subject",
        conducted,
        attended,
        absent,
        pct: computedPct,
        skipBuffer,
        requiredToPass,
      };
    });
  }, [attendance]);

  const stats = useMemo(() => {
    const totalSubs = processedAttendance.length;
    const totalConducted = processedAttendance.reduce((s, a) => s + a.conducted, 0);
    const totalAttended = processedAttendance.reduce((s, a) => s + a.attended, 0);
    const overallAvg = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
    const atRiskCount = processedAttendance.filter(a => a.pct < 75).length;
    const safeCount = totalSubs - atRiskCount;
    return { totalSubs, totalConducted, totalAttended, overallAvg, atRiskCount, safeCount };
  }, [processedAttendance]);

  const filteredAttendance = useMemo(() => {
    let result = [...processedAttendance];
    if (filter === "At Risk") {
      result = result.filter((a: AnyValue) => a.pct < 75);
    } else if (filter === "Safe") {
      result = result.filter((a: AnyValue) => a.pct >= 75);
    }

    if (sortOption === "lowest") {
      result.sort((a: AnyValue, b: AnyValue) => a.pct - b.pct);
    } else if (sortOption === "highest") {
      result.sort((a: AnyValue, b: AnyValue) => b.pct - a.pct);
    } else if (sortOption === "alpha") {
      result.sort((a: AnyValue, b: AnyValue) => a.courseTitle.localeCompare(b.courseTitle));
    }

    return result;
  }, [processedAttendance, filter, sortOption]);

  const isUnavailable = !demoPreview && (attendanceState === "unavailable" || attendanceState === "loading");
  const retryLabel = isSpConnected ? "Retry" : "Reconnect";

  if (isUnavailable) {
    return (
      <AuraBackground theme={activeTheme} stars={stars}>
        <main style={{ minHeight: "100dvh", padding: "calc(env(safe-area-inset-top, 0px) + 54px) 16px calc(env(safe-area-inset-bottom, 0px) + 76px)" }}>
          <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto" }}>
            <h1 style={{ fontSize: "30px", fontWeight: 850, letterSpacing: "-0.04em", margin: "0 0 20px", color: "#F7F5FA" }}>Attendance</h1>
            <section style={{ background: "#12121A", border: "1px solid #292532", borderRadius: "14px", padding: "24px", textAlign: "left" }}>
              <AlertCircle size={22} color="#F59E0B" aria-hidden="true" />
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#F7F5FA", margin: "14px 0 8px" }}>Attendance unavailable</h2>
              <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#B8B2C2", margin: "0 0 20px" }}>{unavailableMessage}</p>
              <button
                onClick={isSpConnected ? handleSync : (onReconnect || handleSync)}
                disabled={isSyncing}
                style={{ minHeight: "40px", padding: "0 16px", border: "none", borderRadius: "8px", background: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: 750, cursor: isSyncing ? "wait" : "pointer" }}
              >
                {isSyncing ? "Trying again…" : retryLabel}
              </button>
            </section>
          </div>
        </main>
      </AuraBackground>
    );
  }

  return (
    <AttendanceRegister
      activeTheme={activeTheme}
      stars={stars}
      stats={stats}
      filteredAttendance={filteredAttendance}
      filter={filter}
      setFilter={setFilter}
      sortOption={sortOption}
      setSortOption={setSortOption}
      demoPreview={demoPreview}
      isSpConnected={isSpConnected}
      isSyncing={isSyncing}
      handleSync={handleSync}
      timeAgoStr={timeAgoStr}
      isLoading={isLoading}
      selectedSubject={selectedSubject}
      handleOpenSubject={handleOpenSubject}
      handleCloseSubject={handleCloseSubject}
    />
  );
}
