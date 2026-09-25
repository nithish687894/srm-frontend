"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import styles from "./NexusHome.module.css";

const shortcuts = [
  { href: "/gpa", label: "GPA Calculator", icon: Calculator },
  { href: "/notes", label: "My Notes", icon: FileText },
  { href: "/exam-library", label: "Exam Library", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

function percentage(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || value === "—") return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

function countdown(minutes: number | null | undefined, ending = false) {
  if (minutes == null || !Number.isFinite(minutes)) return "";
  if (minutes < 1) return ending ? "Ending now" : "Starting now";
  const hours = Math.floor(minutes / 60);
  const remainder = Math.floor(minutes % 60);
  return `${ending ? "Ends" : "Starts"} in ${hours ? `${hours}h ` : ""}${remainder ? `${remainder}m` : ""}`.trim();
}

export default function NexusHome(props: AnyValue) {
  const {
    data,
    avgAtt,
    avgMarks,
    nextClass,
    currentClass,
    currentClassMeta,
    nextClassMeta,
    todaySchedule = [],
    upcomingEvents = [],
    riskySubjectsCount,
    dayOrder,
  } = props;
  const email = useAuthStore((state) => state.email);
  const [today] = useState(() => new Date());

  const demo =
    (email || "").split("@")[0].toLowerCase() === "demo12" ||
    data?.profile?.["Name"] === "AURA NEBULA DEMO" ||
    data?.profile?.["Registration Number"] === "RA2311003010999";
  const attendance = percentage(avgAtt);
  const averageMarks = percentage(avgMarks);
  const lesson = currentClass || nextClass;
  const lessonLabel = currentClass ? "In class now" : nextClassMeta?.isTomorrow ? "Tomorrow's first class" : "Next class";
  const allTodayClasses = Array.isArray(todaySchedule)
    ? todaySchedule.filter((course: AnyValue) => course?.courseCode || course?.courseTitle)
    : [];
  const trackSchedule = allTodayClasses.slice(0, 4);
  const remainingScheduleCount = Math.max(0, allTodayClasses.length - trackSchedule.length);
  const records = data?.attendance || data?.studentPortal?.attendance || [];
  const subjectName = (course: AnyValue) => {
    const match = records.find((item: AnyValue) => (item["Course Code"] || item.courseCode) === course.courseCode);
    return match?.["Course Title"] || match?.courseTitle || course.courseTitle || course.courseCode || "Class";
  };

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(today);

  return (
    <main className={styles.home} data-home-dashboard>
      <div className={styles.container}>
        {/* HEADER */}
        <header className={styles.header}>
          <div className={styles.topline}>
            <span className={styles.brand}>SRM NEXUS</span>
            {demo ? (
              <span className={styles.pill}>DEMO</span>
            ) : dayOrder ? (
              <span className={styles.pill}>Day order {dayOrder}</span>
            ) : null}
          </div>
          <h1 className={styles.greetingTitle}>Today</h1>
          <p className={styles.dateSubtitle} suppressHydrationWarning>
            {dateLabel}
          </p>
        </header>

        {/* RESPONSIVE DASHBOARD GRID */}
        <div className={styles.dashboardGrid}>
          {/* MAIN COLUMN (PRIMARY ACTIONS & METRICS) */}
          <div className={styles.mainColumn}>
            {/* 1. TODAY / SCHEDULE CARD */}
            <section className={`${styles.card} ${styles.scheduleCard} ${styles.scheduleCardWrapper}`}>
              <div className={styles.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 className={styles.cardHeading}>{lesson ? lessonLabel : "Today's schedule"}</h2>
                  {currentClass && (
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#4CAF73", flexShrink: 0 }} aria-label="Live" />
                  )}
                </div>
                <Link href="/timetable" className={styles.cardActionLink}>
                  Timetable <ChevronRight size={14} />
                </Link>
              </div>

              {lesson ? (
                <div className={styles.activeSchedule}>
                  <div className={styles.trackHeroBody}>
                    <div className={styles.trackTime}>
                      <span>{lesson.startTime}</span>
                      <small>{lesson.endTime}</small>
                    </div>
                    <div className={styles.trackCourse}>
                      <h3 className={styles.courseName}>{subjectName(lesson)}</h3>
                      <div className={styles.courseMeta}>
                        <span>
                          <MapPin size={13} /> {lesson.roomNo ? `Room ${lesson.roomNo}` : "Room to be confirmed"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.scheduleBottomRow}>
                    <span className={styles.trackLabel}><Clock size={13} /> {currentClass ? "Class in progress" : "Upcoming session"}</span>
                    {countdown(
                      currentClass ? currentClassMeta?.endsInMinutes : nextClassMeta?.startsInMinutes,
                      !!currentClass
                    ) && (
                      <span className={styles.countdownRow}>
                      {countdown(
                        currentClass ? currentClassMeta?.endsInMinutes : nextClassMeta?.startsInMinutes,
                        !!currentClass
                      )}
                      </span>
                    )}
                  </div>
                </div>
              ) : allTodayClasses.length > 0 ? (
                <div className={styles.emptySchedule}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span className={styles.completedBadge}>
                      <CheckCircle2 size={13} /> Day Complete
                    </span>
                  </div>
                  <p className={styles.emptyTitle}>All classes finished for today</p>
                  <p className={styles.emptySubtitle}>
                    Completed all {allTodayClasses.length} scheduled {allTodayClasses.length === 1 ? "class" : "classes"} {dayOrder ? `for Day order ${dayOrder}` : "today"}.
                  </p>
                </div>
              ) : (
                <div className={styles.emptySchedule}>
                  <p className={styles.emptyTitle}>No classes scheduled today.</p>
                  <p className={styles.emptySubtitle}>Your timetable is clear.</p>
                </div>
              )}
            </section>

            {/* 2. ACADEMICS */}
            <section className={`${styles.sectionWrap} ${styles.academicsWrapper}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Academics</h2>
              </div>

              <div className={styles.academicBoard}>
                <Link href="/attendance" className={styles.academicTile}>
                  <div className={styles.dataCopy}>
                    <span className={styles.academicKicker}>Attendance safety</span>
                    <span className={styles.dataLabel}>Attendance</span>
                    <span className={attendance === null ? styles.dataNote : riskySubjectsCount > 0 ? styles.riskNote : styles.safeNote}>
                      {attendance === null ? "Connect Student Portal" : riskySubjectsCount > 0 ? `${riskySubjectsCount} ${riskySubjectsCount === 1 ? "course" : "courses"} below 75%` : "All courses at or above 75%"}
                    </span>
                    {attendance !== null && (
                      <span className={styles.metricTrack} aria-hidden="true">
                        <span className={styles.metricFill} data-risk={riskySubjectsCount > 0 ? "true" : undefined} style={{ width: `${attendance}%` }} />
                      </span>
                    )}
                  </div>
                  <div className={styles.academicMetric}>
                    <strong className={styles.dataValue} data-risk={attendance !== null && riskySubjectsCount > 0 ? "true" : undefined} data-safe={attendance !== null && riskySubjectsCount === 0 ? "true" : undefined}>
                      {attendance === null ? "—" : `${attendance.toFixed(1)}%`}
                    </strong>
                    <ChevronRight size={15} className={styles.rowChevron} />
                  </div>
                </Link>
                <Link href="/marks" className={styles.academicTile}>
                  <div className={styles.dataCopy}>
                    <span className={styles.academicKicker}>Semester progress</span>
                    <span className={styles.dataLabel}>Internal marks</span>
                    <span className={styles.dataNote}>{averageMarks === null ? "No scores yet" : "Current semester average"}</span>
                    {averageMarks !== null && (
                      <span className={styles.metricTrack} aria-hidden="true">
                        <span className={styles.metricFill} style={{ width: `${averageMarks}%` }} />
                      </span>
                    )}
                  </div>
                  <div className={styles.academicMetric}>
                    <strong className={styles.dataValue}>
                      {averageMarks === null ? "—" : `${averageMarks.toFixed(1)}%`}
                    </strong>
                    <ChevronRight size={15} className={styles.rowChevron} />
                  </div>
                </Link>
              </div>
            </section>

            {/* 3. TOOLS (COMPACT 2x2 GRID CARDS) */}
            <section className={`${styles.sectionWrap} ${styles.toolsWrapper}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Tools</h2>
                <Link href="/tools" className={styles.headerAction}>
                  All tools <ChevronRight size={14} />
                </Link>
              </div>

              <div className={styles.toolShelf}>
                {shortcuts.map(({ href, label, icon: Icon }) => (
                  <Link href={href} key={href} className={styles.toolButton}>
                    <span className={styles.toolIconWrap}><Icon size={17} strokeWidth={1.8} className={styles.toolIcon} /></span>
                    <span>{label}</span>
                    <ChevronRight size={14} className={styles.toolChevron} />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* SIDE COLUMN (TIMELINE & AGENDA) */}
          <div className={styles.sideColumn}>
            {/* 4. YOUR DAY */}
            <section className={`${styles.sectionWrap} ${styles.yourDayWrapper}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Your day</h2>
                {dayOrder && <span className={styles.dayOrderLabel}>Day order {dayOrder}</span>}
              </div>
              <div className={styles.dayTrack}>
                {trackSchedule.length ? trackSchedule.map((course: AnyValue, index: number) => {
                  const isFocus = lesson && course.courseCode && course.courseCode === lesson.courseCode;
                  return (
                    <Link href="/timetable" className={`${styles.trackRow} ${isFocus ? styles.trackRowActive : ""}`} key={`${course.courseCode || course.courseTitle}-${index}`}>
                      <div className={styles.trackRowTime}>
                        <strong>{course.startTime || "—"}</strong>
                        <span>{course.endTime || ""}</span>
                      </div>
                      <span className={styles.trackDot} aria-hidden="true" />
                      <div className={styles.trackRowCourse}>
                        <strong>{subjectName(course)}</strong>
                        <span>{course.roomNo ? `Room ${course.roomNo}` : "Room to be confirmed"}</span>
                      </div>
                      <ChevronRight size={15} className={styles.rowChevron} />
                    </Link>
                  );
                }) : (
                  <Link href="/timetable" className={styles.noTrack}>
                    <CalendarDays size={17} /> Open your full timetable <ChevronRight size={15} />
                  </Link>
                )}
                {remainingScheduleCount > 0 && (
                  <Link href="/timetable" className={styles.moreTrackClasses}>
                    <span>{remainingScheduleCount} more {remainingScheduleCount === 1 ? "class" : "classes"} today</span>
                    <span>View timetable <ChevronRight size={15} /></span>
                  </Link>
                )}
              </div>
            </section>

            {/* 5. COMING UP (TIMELINE CARD) */}
            <section className={`${styles.sectionWrap} ${styles.comingUpWrapper}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Coming up</h2>
                <Link href="/calendar" className={styles.headerAction}>
                  Calendar <ChevronRight size={14} />
                </Link>
              </div>

              <div className={styles.eventAgenda}>
                {upcomingEvents.length ? (
                  upcomingEvents.slice(0, 3).map((event: AnyValue, index: number) => (
                    <Link
                      href="/calendar"
                      className={styles.eventRow}
                      key={`${event.dateNum}-${event.event}-${index}`}
                    >
                      <div className={styles.eventBadge}>
                        <strong>{String(event.dateNum).padStart(2, "0")}</strong>
                        <span>{String(event.monthLabel || "").trim().slice(0, 3).toUpperCase()}</span>
                      </div>
                      <div className={styles.eventDetails}>
                        <h4>{event.event}</h4>
                        <p>{event.weekdayLabel}</p>
                      </div>
                      <ChevronRight size={13} className={styles.eventChevron} />
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyEvents}>
                    <CalendarDays size={18} />
                    <p>No upcoming events in calendar.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>SRM Nexus · Academic Portal</p>
        </footer>
      </div>
    </main>
  );
}
