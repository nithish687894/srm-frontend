"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarDays, Calculator, ChevronRight, Clock, FileText, Bell, IdCard, MapPin, AlertCircle, CheckCircle2, Link2, RefreshCcw } from "lucide-react";
import { useAuraTheme } from "./system/useAuraTheme";
import { useAuthStore } from "@/lib/store";
import Toast from "@/components/Toast";
import { enableAcademicAlerts } from "@/lib/notificationHelper";
import styles from "./NexusHome.module.css";

const shortcuts = [
  { href: "/gpa", label: "GPA calculator", icon: Calculator },
  { href: "/notes", label: "My notes", icon: FileText },
  { href: "/exam-library", label: "Exam library", icon: BookOpen },
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
    data, avgAtt, avgMarks, firstName, nextClass, currentClass,
    currentClassMeta, nextClassMeta, onShowStudentInfo, upcomingEvents = [],
    tomorrowSkipStats, safeSubjectsCount, riskySubjectsCount, onConnectPortal,
    syncError, dayOrder,
  } = props;
  const { activeTheme } = useAuraTheme();
  const isPremium = useAuthStore((state) => state.isPremium);
  const connected = useAuthStore((state) => state.studentPortalConnected);
  const email = useAuthStore((state) => state.email);
  const prompted = useAuthStore((state) => state.academicAlertsPrompted);
  const alertsEnabled = useAuthStore((state) => state.academicAlertsEnabled);
  const setPrompted = useAuthStore((state) => state.setAcademicAlertsPrompted);
  const [toast, setToast] = useState<{ title: string; body: string; type: "success" | "error" | "info" } | null>(null);
  const [enablingAlerts, setEnablingAlerts] = useState(false);
  const [renderedAt] = useState(() => Date.now());
  const [today] = useState(() => new Date());

  const demo = (email || "").split("@")[0].toLowerCase() === "demo12"
    || data?.profile?.["Name"] === "AURA NEBULA DEMO"
    || data?.profile?.["Registration Number"] === "RA2311003010999";
  const attendance = percentage(avgAtt);
  const averageMarks = percentage(avgMarks);
  const lesson = currentClass || nextClass;
  const lessonLabel = currentClass ? "In class now" : nextClassMeta?.isTomorrow ? "Tomorrow's first class" : "Next class";
  const rawName = String(firstName || "Student");
  const name = rawName === rawName.toUpperCase() ? rawName.charAt(0) + rawName.slice(1).toLowerCase() : rawName;
  const records = data?.attendance || data?.studentPortal?.attendance || [];
  const subjectName = (course: AnyValue) => {
    const match = records.find((item: AnyValue) => (item["Course Code"] || item.courseCode) === course.courseCode);
    return match?.["Course Title"] || match?.courseTitle || course.courseTitle || course.courseCode || "Class";
  };
  const fetchedAt = data?.studentPortal?.lastSyncedAt || data?.lastFetchedAt;
  const fetchedTime = typeof fetchedAt === "number" ? fetchedAt : Date.parse(fetchedAt || "");
  const fresh = Number.isFinite(fetchedTime) && renderedAt - fetchedTime < 15 * 60 * 1000;
  const canPlan = connected && fresh && attendance !== null && !demo;
  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(today);

  async function enableAlerts() {
    setEnablingAlerts(true);
    try { await enableAcademicAlerts((title, body, type = "success") => setToast({ title, body, type })); }
    finally { setEnablingAlerts(false); }
  }

  return (
    <main className={styles.home}>
      <div className={styles.content}>
        <header className={styles.greeting}>
          <div className={styles.topline}><span className={styles.eyebrow}>Nexus</span>{demo ? <span className={styles.badge}>Demo preview</span> : dayOrder ? <span className={styles.badge}>Day order {dayOrder}</span> : null}</div>
          <h1>{activeTheme.greeting}, {name}<span>.</span></h1>
          <div className={styles.date}><span suppressHydrationWarning>{dateLabel}</span></div>
        </header>

        <div className={styles.layout}>
          <div className={styles.primaryColumn}>
            <section className={styles.schedule} aria-labelledby="home-today">
              <div className={styles.scheduleHeading}><div><p>Today</p><h2 id="home-today">Your schedule</h2></div><Link href="/timetable">Timetable <ChevronRight size={15} /></Link></div>
              <div className={styles.scheduleBody}>
                <span className={styles.scheduleIcon}><Clock size={21} strokeWidth={1.8} /></span>
                <div className={styles.lesson}>
                  <p className={styles.caption}>{lesson ? lessonLabel : "Schedule"}</p>
                  <h3>{lesson ? subjectName(lesson) : "No upcoming classes to show"}</h3>
                  {lesson ? <><div className={styles.lessonMeta}><span>{lesson.startTime} – {lesson.endTime}</span><span><MapPin size={13} /> {lesson.roomNo ? `Room ${lesson.roomNo}` : "Room to be confirmed"}</span>{lesson.slot && <span>Slot {lesson.slot}</span>}</div><p className={styles.countdown}>{countdown(currentClass ? currentClassMeta?.endsInMinutes : nextClassMeta?.startsInMinutes, !!currentClass)}</p></> : <p>Open your timetable to check your day orders and schedule.</p>}
                </div>
              </div>
              <Link className={styles.primaryButton} href="/timetable">Open timetable <ArrowUpRight size={17} /></Link>
            </section>

            <section aria-labelledby="home-academics">
              <div className={styles.sectionHeading}><h2 id="home-academics">This semester</h2><span>Academic overview</span></div>
              <div className={styles.metrics}>
                <Link href="/attendance" className={styles.metric}><div className={styles.metricLabel}>Attendance <ArrowUpRight size={16} /></div><strong>{attendance === null ? "—" : attendance.toFixed(1)}{attendance !== null && <small>%</small>}</strong><p>{attendance === null ? "Not available yet" : "Overall attendance"}</p><div className={styles.metricFoot}>{attendance === null ? "Connect your portal" : <>Target <b>75%</b></>}</div></Link>
                <Link href="/marks" className={styles.metric}><div className={styles.metricLabel}>Marks <ArrowUpRight size={16} /></div><strong>{averageMarks === null ? "—" : averageMarks.toFixed(1)}{averageMarks !== null && <small>%</small>}</strong><p>{averageMarks === null ? "Not available yet" : "Internal assessment"}</p><div className={styles.metricFoot}>View every assessment <ChevronRight size={13} /></div></Link>
              </div>
              {attendance !== null && <Link className={styles.attendanceNote} href="/attendance">{riskySubjectsCount > 0 ? <AlertCircle size={16} className={styles.warning} /> : <CheckCircle2 size={16} className={styles.success} />}<span>{riskySubjectsCount > 0 ? `${riskySubjectsCount} course${riskySubjectsCount === 1 ? "" : "s"} below 75% attendance` : `${safeSubjectsCount ?? 0} courses at or above 75%`}</span><ChevronRight size={15} /></Link>}
            </section>

            <section aria-labelledby="home-tools">
              <div className={styles.sectionHeading}><h2 id="home-tools">Quick access</h2><Link href="/tools">All tools <ChevronRight size={15} /></Link></div>
              <div className={styles.shortcuts}>{shortcuts.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon size={21} strokeWidth={1.7} /><span>{label}</span></Link>)}</div>
            </section>
          </div>

          <div className={styles.secondaryColumn}>
            <section aria-labelledby="home-updates">
              <div className={styles.sectionHeading}><h2 id="home-updates">Coming up</h2><Link href="/calendar">Calendar <ChevronRight size={15} /></Link></div>
              <div className={styles.panel}>{upcomingEvents.length ? upcomingEvents.map((event: AnyValue, index: number) => <Link href="/calendar" className={styles.event} key={`${event.dateNum}-${event.event}-${index}`}><div className={styles.eventDate}><strong>{event.dateNum}</strong><span>{String(event.monthLabel || "").split(" ")[0]}</span></div><div><h3>{event.event}</h3><p>{event.weekdayLabel}</p></div><ChevronRight size={15} /></Link>) : <div className={styles.empty}><CalendarDays size={20} /><div><h3>No upcoming events listed</h3><p>Your academic calendar is one tap away.</p></div></div>}</div>
            </section>

            <section aria-labelledby="home-account">
              <div className={styles.sectionHeading}><h2 id="home-account">Your workspace</h2></div>
              <div className={styles.panel}>
                <button className={styles.workspaceRow} onClick={onShowStudentInfo}><IdCard size={19} /><span><strong>Student details</strong><small>{data?.profile?.["Registration Number"] || "Profile, batch and advisors"}</small></span><ChevronRight size={16} /></button>
                <button className={styles.workspaceRow} onClick={onConnectPortal}><Link2 size={19} /><span><strong>{demo ? "Connect your student portal" : connected ? "Student Portal connected" : "Connect Student Portal"}</strong><small>{demo ? "Previewing sample academic information" : syncError || (connected ? "Manage your connection" : "Keep attendance and marks up to date")}</small></span><ChevronRight size={16} /></button>
                <details className={styles.planner}><summary>Attendance planner <span>{isPremium ? "Tomorrow" : "Premium"}</span></summary>{!isPremium ? <p>Explore attendance planning with <Link href="/premium">Nexus Premium</Link>.</p> : !canPlan ? <p>Connect your portal and refresh attendance to see tomorrow’s projections. <Link href="/attendance">Open attendance</Link></p> : tomorrowSkipStats?.isHoliday ? <p>No classes scheduled for tomorrow.</p> : tomorrowSkipStats?.classes?.length ? <><p>Day order {tomorrowSkipStats.dayOrder} · {tomorrowSkipStats.safe} safe to miss · {tomorrowSkipStats.risky} must attend</p>{tomorrowSkipStats.classes.map((course: AnyValue, index: number) => <div className={styles.plannerCourse} key={index}><strong>{subjectName(course)}</strong><span>Slot {course.slot} · {course.durationHours || 1} hour(s)</span><span>Current {course.currentAttendance}% → after absence {course.afterSkipAttendance}%</span><b className={course.isRisky ? styles.warning : styles.success}>{course.isRisky ? "Must attend" : "Safe to miss"}</b></div>)}<p>Projections include multi-hour labs and a 75% target.</p></> : <p>No schedule available to calculate tomorrow’s attendance.</p>}</details>
              </div>
            </section>

            {!prompted && !alertsEnabled && data && <section className={styles.alerts} aria-label="Academic alerts"><Bell size={19} /><div><h3>Stay up to date</h3><p>Get notified when your attendance or marks change.</p><div className={styles.alertActions}><button disabled={enablingAlerts} onClick={enableAlerts}>{enablingAlerts ? "Enabling…" : "Enable alerts"}</button><button onClick={() => { setPrompted(true); localStorage.setItem("academicAlertsPrompted", "true"); }}>Later</button></div></div></section>}
            <p className={styles.footer}>Nexus · A little less campus admin.</p>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </main>
  );
}
