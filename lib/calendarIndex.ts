export type Semester = "ODD" | "EVEN";

export type CalendarDayInfo = {
  isoDate: string;        // YYYY-MM-DD
  semester: Semester;
  monthLabel: string;
  dateNum: number;
  weekdayLabel: string;
  dayOrder: number | null; // 1..5, or null if holiday
  event: string;
  isHoliday: boolean;
};

// ─── Month name → 0-based month index ────────────────────────────────────────
const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const MONTHS_FULL: Record<number, string> = {
  0: "January", 1: "February", 2: "March", 3: "April",
  4: "May", 5: "June", 6: "July", 7: "August",
  8: "September", 9: "October", 10: "November", 11: "December",
};

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }

/**
 * Parse a month label like:
 *   "January '26"  → { month: 0, year: 2026 }
 *   "Feb '25"      → { month: 1, year: 2025 }
 *   "MARCH 2026"   → { month: 2, year: 2026 }
 */
function parseMonthLabel(label: string): { month: number; year: number } | null {
  if (!label) return null;
  // Split on spaces, apostrophes, commas
  const parts = label.trim().split(/[\s',]+/);
  let month = -1;
  let year = -1;

  for (const p of parts) {
    const lower = p.toLowerCase().replace(/[^a-z]/g, "");
    if (lower && MONTHS[lower] !== undefined) month = MONTHS[lower];

    const num = parseInt(p.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num) && p.replace(/[^0-9]/g, "").length > 0) {
      if (num >= 2000) year = num;
      else if (num >= 0 && num <= 99) year = num > 50 ? 1900 + num : 2000 + num;
    }
  }

  if (month === -1 || year === -1) return null;
  return { month, year };
}

function isHolidayLike(dayOrder: string, day: string): boolean {
  const o = (dayOrder || "").trim();
  const d = (day || "").toLowerCase().trim();
  return (
    o === "" || o === "-" ||
    /^(h|hd|gh|fh|sh|nh|oh|holiday)/i.test(o) ||
    d === "sun" || d === "sunday"
  );
}

function parseDayOrder(value: string): number | null {
  const normalized = value.trim();
  const numeric = normalized.match(/(?:day\s*order|do)?\s*(10|[1-9])\b/i);
  if (numeric) return parseInt(numeric[1], 10);
  const roman: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5,
    VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
  };
  return roman[normalized.toUpperCase()] ?? null;
}

/**
 * Build a calendar index from the raw backend response.
 *
 * Backend shape:
 *   { success: true, data: { EVEN: [...], ODD: [...] } }
 *
 * Each entry: { date, day, dayOrder, event, month, isHoliday, isWorkingDay }
 * The `month` field is the parsed month label, e.g. "January '26".
 */
export function buildCalendarIndex(raw: AnyValue): {
  byDate: Map<string, CalendarDayInfo>;
  months: Record<Semester, { name: string; days: CalendarDayInfo[] }[]>;
} {
  const byDate = new Map<string, CalendarDayInfo>();
  const monthsOut: Record<Semester, { name: string; days: CalendarDayInfo[] }[]> = {
    ODD: [],
    EVEN: [],
  };

  if (!raw) return { byDate, months: monthsOut };

  // Unwrap: { success, data: { EVEN, ODD } } or { EVEN, ODD } or { data: { EVEN, ODD } }
  const maybeData = raw?.data ?? raw;
  if (!maybeData || typeof maybeData !== "object") return { byDate, months: monthsOut };

  // Dynamically extract all available arrays (EVEN, ODD, EVEN_OLD, ODD_OLD, etc.)
  const semData: Record<string, AnyValue[]> = {};
  Object.keys(maybeData).forEach((key) => {
    if (Array.isArray(maybeData[key])) {
      semData[key] = maybeData[key];
    }
  });

  const monthGroupsRecord: Record<Semester, Map<string, { name: string; days: CalendarDayInfo[] }>> = {
    EVEN: new Map(),
    ODD: new Map(),
  };
  const sourcePriorityByDate = new Map<string, number>();

  Object.keys(semData).forEach((key) => {
    // Map key to either EVEN or ODD semester category
    const sem: Semester = key.toUpperCase().includes("EVEN") ? "EVEN" : "ODD";
    const entries = semData[key];
    const monthGroups = monthGroupsRecord[sem];
    const sourcePriority = /(?:^|_)(?:OLD|ARCHIVE|PREVIOUS)(?:_|$)/i.test(key) ? 0 : 1;

    entries.forEach((entry: AnyValue) => {
      if (!entry || typeof entry !== "object") return;

      const dateNum = parseInt(String(entry.date ?? ""), 10);
      if (!dateNum || dateNum < 1 || dateNum > 31) return;

      const day = String(entry.day ?? "").trim();
      const dayOrder = String(entry.dayOrder ?? entry.do ?? "").trim();
      let event = String(entry.event ?? "").trim();
      const monthLabel = String(entry.month ?? "").trim();

      // Trust backend's isHoliday if present, else derive it
      const holiday =
        typeof entry.isHoliday === "boolean"
          ? entry.isHoliday
          : isHolidayLike(dayOrder, day);

      const dayOrderNum = !holiday ? parseDayOrder(dayOrder) : null;

      // If event is empty, check if dayOrder contains the holiday name (common in some exports)
      if (!event && dayOrder && parseDayOrder(dayOrder) === null && !/^(h|hd|gh|fh|sh|nh|oh|holiday)/i.test(dayOrder)) {
        event = dayOrder;
      }

      // If event is still empty, and it is a holiday, and day contains a descriptive holiday name
      if (!event && holiday && day) {
        const isStandardWeekday = /^(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(day);
        if (!isStandardWeekday) {
          event = day;
        }
      }

      const parsed = parseMonthLabel(monthLabel);
      if (!parsed) return;

      const { month, year } = parsed;

      const maxDay = new Date(year, month + 1, 0).getDate();
      if (dateNum > maxDay) return;

      const isoDate = `${year}-${pad2(month + 1)}-${pad2(dateNum)}`;

      const info: CalendarDayInfo = {
        isoDate,
        semester: sem,
        monthLabel,
        dateNum,
        weekdayLabel: day,
        dayOrder: dayOrderNum,
        event: event,
        isHoliday: holiday,
      };

      // Planner responses can include current and archived semesters together.
      // Never allow an archived overlap to replace the current planner's day order.
      if (byDate.has(isoDate)) {
        const existing = byDate.get(isoDate)!;
        const existingPriority = sourcePriorityByDate.get(isoDate) ?? 0;
        if (existingPriority > sourcePriority) return;
        // If existing has a descriptive event, keep it
        if (existingPriority === sourcePriority && existing.event && !info.event) {
          return;
        }
      }

      byDate.set(isoDate, info);
      sourcePriorityByDate.set(isoDate, sourcePriority);

      const monthKey = `${year}-${pad2(month + 1)}`;
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, {
          name: `${MONTHS_FULL[month]} ${year}`,
          days: [],
        });
      }

      const daysArr = monthGroups.get(monthKey)!.days;
      const existingDayIndex = daysArr.findIndex((d) => d.dateNum === dateNum);
      if (existingDayIndex !== -1) {
        const existing = daysArr[existingDayIndex];
        if (existing.event && !info.event) {
          // Keep existing
          return;
        } else {
          // Overwrite with newer/more descriptive event
          daysArr[existingDayIndex] = info;
        }
      } else {
        daysArr.push(info);
      }
    });
  });

  // Sort months chronologically, days within each month numerically
  (Object.keys(monthGroupsRecord) as Semester[]).forEach((sem) => {
    monthsOut[sem] = [...monthGroupsRecord[sem].entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => {
        v.days.sort((a, b) => a.dateNum - b.dateNum);
        return v;
      });
  });

  return { byDate, months: monthsOut };
}
