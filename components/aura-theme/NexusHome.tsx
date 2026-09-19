"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Calculator,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
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
    firstName,
    nextClass,
    currentClass,
    currentClassMeta,
    nextClassMeta,
    upcomingEvents = [],
    safeSubjectsCount,
    riskySubjectsCount,
    dayOrder,
  } = props;
  const { activeTheme } = useAuraTheme();
  const email = useAuthStore((state) => state.email);
  const [today] = useState(() => new Date());

  const demo =
    (email || "").split("@")[0].toLowerCase() === "demo12" ||
    data?.profile?.["Name"] === "AURA NEBULA DEMO" ||
    data?.profile?.["Registration Number"] === "RA2311003010999";
  const attendance = percentage(avgAtt);
  const averageMarks = percentage(avgMarks);
  const lesson = currentClass || nextClass;
  const lessonLabel = currentClass
    ? "In class now"
    : nextClassMeta?.isTomorrow
    ? "Tomorrow's first class"
    : "Next class";
  const rawName = String(firstName || "Student");
  const name = rawName === rawName.toUpperCase() ? rawName.charAt(0) + rawName.slice(1).toLowerCase() : rawName;
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
    <main className={styles.home}>
      <div className={styles.container}>
        {/* HEADER */}
        <header className={styles.header}>
          <div className={styles.topline}>
            <span className={styles.brand}>NEXUS</span>
            {demo ? (
              <span className={styles.pill}>Demo preview</span>
            ) : dayOrder ? (
              <span className={styles.pill}>Day order {dayOrder}</span>
            ) : null}
          </div>
          <h1 className={styles.greetingTitle}>
            {activeTheme.greeting}
          </h1>
          <p className={styles.dateSubtitle} suppressHydrationWarning>
            {dateLabel}
          </p>
        </header>

        {/* 1. TODAY / SCHEDULE CARD */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <span className={styles.cardEyebrow}>TODAY</span>
              <h2 className={styles.cardHeading}>Schedule</h2>
            </div>
            <Link href="/timetable" className={styles.cardActionLink}>
              Timetable <ChevronRight size={14} />
            </Link>
          </div>

          {lesson ? (
            <div className={styles.activeSchedule}>
              <div className={styles.lessonTagRow}>
                <span className={styles.liveBadge}>
                  <span className={styles.livePulse} />
                  {lessonLabel}
                </span>
                {lesson.slot && <span className={styles.slotPill}>Slot {lesson.slot}</span>}
              </div>
              <h3 className={styles.courseName}>{subjectName(lesson)}</h3>
              <div className={styles.courseMeta}>
                <span>
                  <Clock size={13} /> {lesson.startTime} – {lesson.endTime}
                </span>
                <span>
                  <MapPin size={13} /> {lesson.roomNo ? `Room ${lesson.roomNo}` : "Room to be confirmed"}
                </span>
              </div>
              {countdown(
                currentClass ? currentClassMeta?.endsInMinutes : nextClassMeta?.startsInMinutes,
                !!currentClass
              ) && (
                <div className={styles.countdownRow}>
                  {countdown(
                    currentClass ? currentClassMeta?.endsInMinutes : nextClassMeta?.startsInMinutes,
                    !!currentClass
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptySchedule}>
              <p className={styles.emptyTitle}>No classes scheduled today.</p>
              <p className={styles.emptySubtitle}>Your timetable is clear.</p>
            </div>
          )}
        </section>

        {/* 2. ACADEMICS (ATTENDANCE & MARKS CARDS) */}
        <section className={styles.sectionWrap}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Academics</h3>
            <span className={styles.sectionMuted}>Active semester</span>
          </div>

          <div className={styles.metricsRow}>
            {/* ATTENDANCE CARD */}
            <Link href="/attendance" className={`${styles.card} ${styles.metricCard}`}>
              <div className={styles.metricTop}>
                <div className={styles.metricIconTitle}>
                  <TrendingUp size={15} className={styles.metricIcon} />
                  <span>Attendance</span>
                </div>
                <ChevronRight size={14} className={styles.chevron} />
              </div>

              <div className={styles.metricMain}>
                <div className={styles.statValue}>
                  {attendance === null ? "—" : attendance.toFixed(1)}
                  {attendance !== null && <small>%</small>}
                </div>
                <span className={styles.targetLabel}>Target 75%</span>
              </div>

              <div className={styles.metricBottom}>
                {attendance === null ? (
                  <span className={styles.tagNeutral}>Connect portal</span>
                ) : riskySubjectsCount > 0 ? (
                  <span className={styles.tagRisk}>
                    <AlertCircle size={12} />
                    {riskySubjectsCount} {riskySubjectsCount === 1 ? "course" : "courses"} below 75%
                  </span>
                ) : (
                  <span className={styles.tagSafe}>
                    <CheckCircle2 size={12} />
                    All courses safe (≥ 75%)
                  </span>
                )}
              </div>
            </Link>

            {/* MARKS CARD */}
            <Link href="/marks" className={`${styles.card} ${styles.metricCard}`}>
              <div className={styles.metricTop}>
                <div className={styles.metricIconTitle}>
                  <GraduationCap size={15} className={styles.metricIcon} />
                  <span>Internal Marks</span>
                </div>
                <ChevronRight size={14} className={styles.chevron} />
              </div>

              <div className={styles.metricMain}>
                <div className={styles.statValue}>
                  {averageMarks === null ? "—" : averageMarks.toFixed(1)}
                  {averageMarks !== null && <small>%</small>}
                </div>
                <span className={styles.targetLabel}>Average</span>
              </div>

              <div className={styles.metricBottom}>
                {averageMarks === null ? (
                  <span className={styles.tagNeutral}>No scores yet</span>
                ) : (
                  <span className={styles.tagSafe}>
                    <CheckCircle2 size={12} />
                    Active assessments
                  </span>
                )}
              </div>
            </Link>
          </div>
        </section>

        {/* 3. COMING UP (TIMELINE CARD) */}
        <section className={styles.sectionWrap}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Coming up</h3>
            <Link href="/calendar" className={styles.headerAction}>
              Calendar <ChevronRight size={14} />
            </Link>
          </div>

          <div className={`${styles.card} ${styles.eventsCard}`}>
            {upcomingEvents.length ? (
              upcomingEvents.slice(0, 3).map((event: AnyValue, index: number) => (
                <Link
                  href="/calendar"
                  className={styles.eventRow}
                  key={`${event.dateNum}-${event.event}-${index}`}
                >
                  <div className={styles.eventBadge}>
                    <strong>{String(event.dateNum).padStart(2, "0")}</strong>
                    <span>{String(event.monthLabel || "").split(" ")[0].toUpperCase()}</span>
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

        {/* 4. TOOLS (COMPACT 2x2 GRID CARDS) */}
        <section className={styles.sectionWrap}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Tools</h3>
            <Link href="/tools" className={styles.headerAction}>
              All tools <ChevronRight size={14} />
            </Link>
          </div>

          <div className={styles.toolsGrid}>
            {shortcuts.map(({ href, label, icon: Icon }) => (
              <Link href={href} key={href} className={`${styles.card} ${styles.toolButton}`}>
                <Icon size={16} strokeWidth={1.8} className={styles.toolIcon} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <p>SRM Nexus · Academic Portal</p>
        </footer>
      </div>
    </main>
  );
}
