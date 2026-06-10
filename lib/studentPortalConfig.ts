export type StudentPortalAccess = "free" | "premium";
export type StudentPortalPageType = "native" | "shortcut";
export type StudentPortalCategory =
  | "Overview"
  | "Academics"
  | "Exams"
  | "Campus Services"
  | "Certificates & Requests"
  | "Other";
export type StudentPortalPageAction = "open" | "unlock_premium";

export type StudentPortalPremiumStatus = {
  isPremiumActive: boolean;
};

export type StudentPortalPageConfig = {
  key: string;
  label: string;
  access: StudentPortalAccess;
  type: StudentPortalPageType;
  category: StudentPortalCategory;
  description: string;
  href?: string;
  officialUrl?: string;
  color: string;
};

export const STUDENT_PORTAL_CATEGORIES: StudentPortalCategory[] = [
  "Overview",
  "Academics",
  "Exams",
  "Campus Services",
  "Certificates & Requests",
  "Other",
];

export const STUDENT_PORTAL_PAGES: StudentPortalPageConfig[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    access: "free",
    type: "native",
    category: "Overview",
    description: "Your SRM Nexus academic home and daily overview.",
    href: "/dashboard",
    color: "#BF5AF2",
  },
  {
    key: "personal-details",
    label: "Personal Details",
    access: "free",
    type: "native",
    category: "Overview",
    description: "Student profile and academic identity details.",
    href: "/portal/personal-details",
    color: "#8F92FF",
  },
  {
    key: "notice-board",
    label: "Notice Board",
    access: "free",
    type: "shortcut",
    category: "Overview",
    description: "Official notices and student announcements.",
    color: "#00E5FF",
  },
  {
    key: "course-status",
    label: "Course Status",
    access: "free",
    type: "shortcut",
    category: "Academics",
    description: "Official course registration and course status service.",
    color: "#A78BFA",
  },
  {
    key: "attendance-details",
    label: "Attendance Details",
    access: "free",
    type: "native",
    category: "Academics",
    description: "Subject-wise attendance and academic safety status.",
    href: "/attendance",
    color: "#34C759",
  },
  {
    key: "academic-calendar-planner",
    label: "Academic Calender / Planner",
    access: "free",
    type: "native",
    category: "Academics",
    description: "Academic calendar, planner, and key schedule dates.",
    href: "/calendar",
    color: "#FFCC00",
  },
  {
    key: "timetable",
    label: "Timetable",
    access: "free",
    type: "native",
    category: "Academics",
    description: "Class timetable and daily slot schedule.",
    href: "/timetable",
    color: "#FFCC00",
  },
  {
    key: "summer-term-registration",
    label: "Summer Term / Compensatory Registration",
    access: "free",
    type: "shortcut",
    category: "Academics",
    description: "Official summer term and compensatory registration service.",
    color: "#BF5AF2",
  },
  {
    key: "grade-mark-credit",
    label: "Grade / Mark & Credit",
    access: "premium",
    type: "native",
    category: "Exams",
    description: "Semester marks, grade points, and credit ledger.",
    href: "/portal/grade-mark-credit",
    color: "#00E5FF",
  },
  {
    key: "exam-provisional-results",
    label: "Exam Provisional Results",
    access: "free",
    type: "shortcut",
    category: "Exams",
    description: "Official provisional result service.",
    color: "#38BDF8",
  },
  {
    key: "exam-revaluation-results",
    label: "Exam Revaluation Results",
    access: "free",
    type: "shortcut",
    category: "Exams",
    description: "Official revaluation result service.",
    color: "#38BDF8",
  },
  {
    key: "internal-mark-details",
    label: "Internal Mark Details",
    access: "premium",
    type: "native",
    category: "Exams",
    description: "Internal marks view and academic performance tools.",
    href: "/marks",
    color: "#FF75C3",
  },
  {
    key: "exam-hallticket",
    label: "Exam HallTicket",
    access: "free",
    type: "shortcut",
    category: "Exams",
    description: "Official hall ticket service for exams.",
    color: "#FF9500",
  },
  {
    key: "review-revaluation-retotaling",
    label: "Review/Revaluation/Retotaling Registration",
    access: "free",
    type: "shortcut",
    category: "Exams",
    description: "Official exam review, revaluation, and retotaling registration.",
    color: "#FF75C3",
  },
  {
    key: "exam-time-table",
    label: "Exam Time Table",
    access: "free",
    type: "shortcut",
    category: "Exams",
    description: "Official exam timetable service.",
    color: "#00E5FF",
  },
  {
    key: "fee-payment",
    label: "Fee Payment",
    access: "free",
    type: "shortcut",
    category: "Campus Services",
    description: "Official fee payment and receipt service.",
    color: "#FF9500",
  },
  {
    key: "hostel-booking",
    label: "Hostel Booking",
    access: "free",
    type: "shortcut",
    category: "Campus Services",
    description: "Official hostel booking service.",
    color: "#FF2D55",
  },
  {
    key: "hostel-details",
    label: "Hostel Details",
    access: "free",
    type: "shortcut",
    category: "Campus Services",
    description: "Hostel room and stay details.",
    color: "#FF2D55",
  },
  {
    key: "transport-details",
    label: "Transport Details",
    access: "free",
    type: "shortcut",
    category: "Campus Services",
    description: "Bus route and transport details.",
    color: "#34C759",
  },
  {
    key: "transport-booking",
    label: "Transport Booking",
    access: "free",
    type: "shortcut",
    category: "Campus Services",
    description: "Official transport booking service.",
    color: "#34C759",
  },
  {
    key: "abc-id-generation",
    label: "ABC ID Generation",
    access: "free",
    type: "shortcut",
    category: "Campus Services",
    description: "Official Academic Bank of Credits ID service.",
    color: "#8F92FF",
  },
  {
    key: "photo-degree-certificate",
    label: "Photo for Degree certificate",
    access: "free",
    type: "shortcut",
    category: "Campus Services",
    description: "Photo submission for degree certificate processing.",
    color: "#BF5AF2",
  },
  {
    key: "finance-details",
    label: "Finance Details",
    access: "free",
    type: "shortcut",
    category: "Other",
    description: "Official finance details and student account records.",
    color: "#FF9500",
  },
  {
    key: "srmist-policies",
    label: "SRMIST Policies",
    access: "free",
    type: "shortcut",
    category: "Other",
    description: "Official SRMIST policy documents and student guidelines.",
    color: "#8F92FF",
  },
  {
    key: "scholarship-renewal",
    label: "Scholarship Renewal Process",
    access: "free",
    type: "shortcut",
    category: "Other",
    description: "Scholarship renewal process and official instructions.",
    color: "#34C759",
  },
  {
    key: "service-request",
    label: "Service Request",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official student service request portal.",
    color: "#00E5FF",
  },
  {
    key: "scribe-request",
    label: "Scribe Request",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official scribe request service.",
    color: "#38BDF8",
  },
  {
    key: "transcript",
    label: "Transcript",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official transcript request service.",
    color: "#BF5AF2",
  },
  {
    key: "name-change-gazette",
    label: "Name Change - Gazette",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official name change and gazette service.",
    color: "#FF75C3",
  },
  {
    key: "certificate-correction",
    label: "Certificate Correction",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official certificate correction service.",
    color: "#38BDF8",
  },
  {
    key: "migration-certificate",
    label: "Migration Certificate",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official migration certificate request.",
    color: "#FF9500",
  },
  {
    key: "duplicate-certificate",
    label: "Duplicate Certificate",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official duplicate certificate request.",
    color: "#FF9500",
  },
  {
    key: "attestation",
    label: "Attestation",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official document attestation service.",
    color: "#A78BFA",
  },
  {
    key: "community-certificate",
    label: "Community Certificate",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official community certificate service.",
    color: "#34C759",
  },
  {
    key: "student-review-feedback",
    label: "Student Review Feedback",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official student review and feedback service.",
    color: "#00E5FF",
  },
  {
    key: "stipend-request",
    label: "Stipend Request",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official stipend request service.",
    color: "#34C759",
  },
  {
    key: "grade-sheet-collection",
    label: "Grade Sheet Collection",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official grade sheet collection service.",
    color: "#FFCC00",
  },
  {
    key: "esanad-registration",
    label: "e-Sanad (SRMIST) Registration",
    access: "free",
    type: "shortcut",
    category: "Certificates & Requests",
    description: "Official e-Sanad registration service.",
    color: "#8F92FF",
  },
];

export const STUDENT_PORTAL_RESTRICTED_ACTION_KEYS = new Set([
  "summer-term-registration",
  "review-revaluation-retotaling",
  "fee-payment",
  "hostel-booking",
  "transport-booking",
  "photo-degree-certificate",
  "service-request",
  "scribe-request",
  "transcript",
  "name-change-gazette",
  "certificate-correction",
  "migration-certificate",
  "duplicate-certificate",
  "attestation",
  "community-certificate",
  "student-review-feedback",
  "stipend-request",
  "grade-sheet-collection",
  "esanad-registration",
]);

export function getStudentPortalInternalHref(page: StudentPortalPageConfig) {
  return `/student-portal/${page.key}`;
}

export function isStudentPortalRestrictedAction(page: StudentPortalPageConfig) {
  return STUDENT_PORTAL_RESTRICTED_ACTION_KEYS.has(page.key);
}

export function canAccessStudentPortalPage(
  page: StudentPortalPageConfig,
  premiumStatus: StudentPortalPremiumStatus
) {
  if (page.access === "free" && page.type === "native") return true;
  if (page.access === "premium" && page.type === "native") return premiumStatus.isPremiumActive === true;
  if (page.access === "free" && page.type === "shortcut") return true;
  return false;
}

export function getStudentPortalPageAction(
  page: StudentPortalPageConfig,
  premiumStatus: StudentPortalPremiumStatus
): StudentPortalPageAction {
  if (canAccessStudentPortalPage(page, premiumStatus)) return "open";
  return "unlock_premium";
}
