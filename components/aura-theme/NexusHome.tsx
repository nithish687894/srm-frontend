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

function getAttendanceHumanStatus(
  attendance: number | null,
  riskyCount: number,
  safeSkips: number
): { text: string; noteClass: string; isRisk: boolean } {
  if (attendance === null) {
    return { text: "Sync portal to check your status", noteClass: styles.dataNote, isRisk: false };
  }

  if (riskyCount > 0) {
    const text = riskyCount === 1
      ? "1 subject needs recovery · Below 75%"
      : `${riskyCount} subjects need recovery · Below 75%`;
    return { text, noteClass: styles.riskNote, isRisk: true };
  }

  if (safeSkips > 0) {
    const text = safeSkips === 1
      ? "Safe zone · 1 class you can miss"
      : `Safe zone · ${safeSkips} classes you can miss`;
    return { text, noteClass: styles.safeNote, isRisk: false };
  }

  return { text: "On track · Attend upcoming classes to stay safe", noteClass: styles.safeNote, isRisk: false };
}

function getMarksHumanStatus(averageMarks: number | null): { text: string; noteClass: string } {
  if (averageMarks === null) {
    return { text: "No test scores published yet", noteClass: styles.dataNote };
  }
  if (averageMarks >= 80) {
    return { text: "Strong standing · Aiming for A/S grade", noteClass: styles.safeNote };
  }
  if (averageMarks >= 65) {
    return { text: "Good standing · Keep up performance", noteClass: styles.safeNote };
  }
  if (averageMarks >= 50) {
    return { text: "Passing internals · Push for finals", noteClass: styles.dataNote };
  }
  return { text: "Needs a boost in upcoming tests", noteClass: styles.riskNote };
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
    upcomingEvents = [],
    riskySubjectsCount = 0,
    totalSafeSkips = 0,
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
  const records = data?.attendance || data?.studentPortal?.attendance || [];
  const subjectName = (course: AnyValue) => {
    const match = records.find((item: AnyValue) => (item["Course Code"] || item.courseCode) === course.courseCode);
    return match?.["Course Title"] || match?.courseTitle || course.courseTitle || course.courseCode || "Class";
  };

  const attStatus = getAttendanceHumanStatus(attendance, Number(riskySubjectsCount) || 0, Number(totalSafeSkips) || 0);
  const marksStatus = getMarksHumanStatus(averageMarks);

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(today);

  const countdownText = countdown(
    currentClass ? currentClassMeta?.endsInMinutes : nextClassMeta?.startsInMinutes,
    !!currentClass
  );

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
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.greetingTitle}>Home</h1>
            <p className={styles.dateSubtitle} suppressHydrationWarning>
              {dateLabel}
            </p>
          </div>
        </header>

        {/* 1. TODAY / SCHEDULE CARD */}
        <section className={`${styles.card} ${styles.scheduleCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              {currentClass ? (
                <div className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  <span>In class now</span>
                </div>
              ) : (
                <h2 className={styles.cardHeading}>
                  {nextClassMeta?.isTomorrow ? "Tomorrow's first class" : lesson ? "Next class" : "Today’s schedule"}
                </h2>
              )}
            </div>
            <Link href="/timetable" className={styles.cardActionLink}>
              Timetable <ChevronRight size={14} />
            </Link>
          </div>

          {lesson ? (
            <div className={styles.activeSchedule}>
              <h3 className={styles.courseName}>{subjectName(lesson)}</h3>
              <div className={styles.courseMeta}>
                <span>
                  <Clock size={13} /> {lesson.startTime} – {lesson.endTime}
                </span>
                <span>
                  <MapPin size={13} /> {lesson.roomNo ? `Room ${lesson.roomNo}` : "Room to be confirmed"}
                </span>
                {countdownText && (
                  <span className={styles.countdownBadge}>
                    {countdownText}
                  </span>
                )}
              </div>
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
            <h2 className={styles.sectionTitle}>Academics</h2>
          </div>

          <div className={styles.dataList}>
            <Link href="/attendance" className={styles.dataRow}>
              <div className={styles.dataCopy}>
                <span className={styles.dataLabel}>Attendance</span>
                <span className={attStatus.noteClass}>{attStatus.text}</span>
              </div>
              <strong className={`${styles.dataValue} ${attStatus.isRisk ? styles.riskValue : ""}`}>
                {attendance === null ? "—" : `${attendance.toFixed(1)}%`}
              </strong>
              <ChevronRight size={15} className={styles.rowChevron} />
            </Link>
            <Link href="/marks" className={styles.dataRow}>
              <div className={styles.dataCopy}>
                <span className={styles.dataLabel}>Internal marks</span>
                <span className={marksStatus.noteClass}>{marksStatus.text}</span>
              </div>
              <strong className={styles.dataValue}>
                {averageMarks === null ? "—" : `${averageMarks.toFixed(1)}%`}
              </strong>
              <ChevronRight size={15} className={styles.rowChevron} />
            </Link>
          </div>
        </section>

        {/* 3. COMING UP (TIMELINE CARD) */}
        <section className={styles.sectionWrap}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Coming up</h2>
            <Link href="/calendar" className={styles.headerAction}>
              Calendar <ChevronRight size={14} />
            </Link>
          </div>

          <div className={styles.eventsList}>
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

        {/* 4. TOOLS (COMPACT 2x2 GRID CARDS) */}
        <section className={styles.sectionWrap}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tools</h2>
            <Link href="/tools" className={styles.headerAction}>
              All tools <ChevronRight size={14} />
            </Link>
          </div>

          <div className={styles.toolsGrid}>
            {shortcuts.map(({ href, label, icon: Icon }) => (
              <Link href={href} key={href} className={styles.toolButton}>
                <Icon size={16} strokeWidth={1.8} className={styles.toolIcon} />
                <span>{label}</span>
                <ChevronRight size={14} className={styles.toolChevron} />
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
