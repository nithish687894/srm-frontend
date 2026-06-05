/**
 * lib/pulseEngine.ts
 * Nexus Pulse — Dynamic Template Bank Resolver & Engine
 */

export interface NotificationTemplate {
  id: string;
  category: string;
  tone: "funny_friend" | "helpful_friendly" | "strict_caring";
  severity: "low" | "medium" | "high";
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[];
  whenToUse?: string;
}

export interface TemplateVariables {
  subject?: string;
  attendance?: number | string;
  attendanceChange?: number | string;
  classTime?: string;
  classesToday?: number;
  deadline?: string;
  duration?: string;
  examDate?: string;
  examName?: string;
  firstClassTime?: string;
  location?: string;
  marks?: number | string;
  maxMarks?: number | string;
  newClass?: string;
  oldClass?: string;
  overallAttendance?: number | string;
  requiredAttendance?: number | string;
  riskySubject?: string;
  safeSkips?: number;
  studentName?: string;
  topic?: string;
  [key: string]: any; // fallback for custom/extra fields
}

const TEMPLATES_CACHE_KEY = "nexus_pulse_cached_templates";
const CACHE_TS_KEY = "nexus_pulse_cached_templates_ts";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Default fallback templates if the API is offline
const FALLBACK_TEMPLATES: NotificationTemplate[] = [
  {
    id: "NPT-FALLBACK-001",
    category: "attendance_low",
    tone: "funny_friend",
    severity: "medium",
    titleTemplate: "{subject} acting sus 👀",
    bodyTemplate: "{subject} is at {attendance}%. Attend next class before it becomes a full episode.",
    variables: ["subject", "attendance"]
  },
  {
    id: "NPT-FALLBACK-002",
    category: "attendance_danger",
    tone: "strict_caring",
    severity: "high",
    titleTemplate: "Do not skip {subject} ⚠️",
    bodyTemplate: "{subject} is {attendance}%, below the safe level of {requiredAttendance}%. Attend the next class.",
    variables: ["subject", "attendance", "requiredAttendance"]
  },
  {
    id: "NPT-FALLBACK-003",
    category: "marks_update",
    tone: "funny_friend",
    severity: "medium",
    titleTemplate: "📊 Marks updated",
    bodyTemplate: "New marks have been posted. Check your scores in the Marks section.",
    variables: []
  }
];

/**
 * Fetch templates from the backend and cache them.
 */
export async function syncPulseTemplates(force = false): Promise<NotificationTemplate[]> {
  if (typeof window === "undefined") return FALLBACK_TEMPLATES;

  try {
    const cached = localStorage.getItem(TEMPLATES_CACHE_KEY);
    const cachedTs = localStorage.getItem(CACHE_TS_KEY);
    const now = Date.now();

    if (!force && cached && cachedTs && now - parseInt(cachedTs, 10) < CACHE_EXPIRY_MS) {
      return JSON.parse(cached) as NotificationTemplate[];
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "";
    // Note: in dev, NEXT_PUBLIC_API_URL is empty if rewrites are used
    const url = `${backendUrl}/api/notifications/templates`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch templates");

    const data = await res.json();
    if (data && Array.isArray(data.templates)) {
      localStorage.setItem(TEMPLATES_CACHE_KEY, JSON.stringify(data.templates));
      localStorage.setItem(CACHE_TS_KEY, String(now));
      console.log(`[PulseEngine] Synced ${data.templates.length} templates from database.`);
      return data.templates as NotificationTemplate[];
    }

    return cached ? JSON.parse(cached) : FALLBACK_TEMPLATES;
  } catch (err) {
    console.warn("[PulseEngine] Failed to sync templates, using cache/fallback:", err);
    try {
      const cached = localStorage.getItem(TEMPLATES_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return FALLBACK_TEMPLATES;
  }
}

/**
 * Get cached templates or fetch them synchronously.
 */
export function getCachedTemplates(): NotificationTemplate[] {
  if (typeof window === "undefined") return FALLBACK_TEMPLATES;
  try {
    const cached = localStorage.getItem(TEMPLATES_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return FALLBACK_TEMPLATES;
}

/**
 * Select a template based on category and desired tone.
 */
export function selectTemplate(
  category: string,
  preferredTone: "funny_friend" | "helpful_friendly" | "strict_caring" = "funny_friend"
): NotificationTemplate {
  const templates = getCachedTemplates();
  
  // 1. Filter by category
  let pool = templates.filter((t) => t.category === category);
  if (pool.length === 0) {
    // Fallback if category not found (e.g. attendance_danger fallback to low)
    if (category === "attendance_danger") pool = templates.filter((t) => t.category === "attendance_low");
    else pool = FALLBACK_TEMPLATES;
  }

  // 2. Filter by tone
  let tonePool = pool.filter((t) => t.tone === preferredTone);
  if (tonePool.length === 0) {
    // If preferred tone is missing, fall back to whatever tone is available
    tonePool = pool;
  }

  // 3. Pick a random template from the pool
  const randomIndex = Math.floor(Math.random() * tonePool.length);
  return tonePool[randomIndex] || FALLBACK_TEMPLATES[0];
}

/**
 * Render templates replacing placeholder variables with actual student data.
 */
export function renderTemplate(
  titleTemplate: string,
  bodyTemplate: string,
  vars: TemplateVariables
): { title: string; body: string } {
  let title = titleTemplate;
  let body = bodyTemplate;

  Object.entries(vars).forEach(([key, val]) => {
    const placeholder = `{${key}}`;
    const safeVal = val !== undefined && val !== null ? String(val) : "";
    title = title.replaceAll(placeholder, safeVal);
    body = body.replaceAll(placeholder, safeVal);
  });

  return { title, body };
}
