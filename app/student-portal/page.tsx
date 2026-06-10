"use client";

import type { ElementType } from "react";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Bed,
  BookOpen,
  Bus,
  BusFront,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileBadge,
  FileCheck2,
  FileSearch,
  FileText,
  GraduationCap,
  IdCard,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  Newspaper,
  ReceiptText,
  ScrollText,
  Search,
  ShieldCheck,
  TicketCheck,
  UserPen,
  UserSquare,
  WalletCards,
} from "lucide-react";
import { useThemeStore } from "@/lib/themeStore";
import { useAuthStore } from "@/lib/store";
import {
  STUDENT_PORTAL_CATEGORIES,
  STUDENT_PORTAL_PAGES,
  getStudentPortalInternalHref,
  getStudentPortalPageAction,
  isStudentPortalRestrictedAction,
  type StudentPortalPageConfig,
} from "@/lib/studentPortalConfig";
import PortalSyncModal from "@/components/PortalSyncModal";

const ICONS: Record<string, ElementType> = {
  dashboard: BookOpen,
  "personal-details": UserSquare,
  "notice-board": Newspaper,
  "course-status": ClipboardList,
  "attendance-details": CalendarClock,
  "academic-calendar-planner": CalendarClock,
  timetable: CalendarClock,
  "summer-term-registration": GraduationCap,
  "grade-mark-credit": Award,
  "exam-provisional-results": FileCheck2,
  "exam-revaluation-results": FileSearch,
  "internal-mark-details": ReceiptText,
  "exam-hallticket": TicketCheck,
  "review-revaluation-retotaling": ClipboardCheck,
  "exam-time-table": CalendarClock,
  "fee-payment": CreditCard,
  "hostel-booking": Bed,
  "hostel-details": Bed,
  "transport-details": Bus,
  "transport-booking": BusFront,
  "abc-id-generation": IdCard,
  "photo-degree-certificate": UserPen,
  "finance-details": WalletCards,
  "srmist-policies": ShieldCheck,
  "scholarship-renewal": BadgeCheck,
  "service-request": MessageSquareText,
  "scribe-request": UserPen,
  transcript: ScrollText,
  "name-change-gazette": FileText,
  "certificate-correction": FileBadge,
  "migration-certificate": FileCheck2,
  "duplicate-certificate": FileCheck2,
  attestation: Landmark,
  "community-certificate": IdCard,
  "student-review-feedback": MessageSquareText,
  "stipend-request": WalletCards,
  "grade-sheet-collection": Award,
  "esanad-registration": FileText,
};

function getBadgeLabel(page: StudentPortalPageConfig) {
  if (isStudentPortalRestrictedAction(page)) return "View Only";
  if (page.type === "shortcut") return "Nexus View";
  if (page.access === "premium") return "Premium";
  return "Free";
}

import LoadingSkeleton from "@/components/aura-theme/LoadingSkeleton";

export default function StudentPortalPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme } = useThemeStore();
  const profile = useAuthStore((state) => state.profile);
  const email = useAuthStore((state) => state.email);
  const studentPortalConnected = useAuthStore((state) => state.studentPortalConnected);
  const isPremium = useAuthStore((state) => state.isPremium);
  const [query, setQuery] = useState("");
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = theme === "light";
  const loginUserId = (email || profile?.Email || profile?.email || "").split("@")[0].trim();
  const premiumStatus = { isPremiumActive: isPremium };
  const totalServices = STUDENT_PORTAL_PAGES.length;

  if (!mounted) return <LoadingSkeleton />;

  const filteredGroups = useMemo(() => {
    const search = query.trim().toLowerCase();

    return STUDENT_PORTAL_CATEGORIES.map((category) => {
      const services = STUDENT_PORTAL_PAGES.filter((page) => {
        if (page.category !== category) return false;
        if (!search) return true;
        return `${page.label} ${page.description} ${page.category} ${page.access} ${page.type}`
          .toLowerCase()
          .includes(search);
      });

      return { title: category, services };
    }).filter((group) => group.services.length > 0);
  }, [query]);

  const handlePageAction = (page: StudentPortalPageConfig) => {
    const action = getStudentPortalPageAction(page, premiumStatus);

    if (action === "unlock_premium") {
      router.push("/premium");
      return;
    }

    router.push(getStudentPortalInternalHref(page));
  };

  const pageBg = isLight
    ? "radial-gradient(circle at top right, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)"
    : "radial-gradient(circle at top right, rgba(191,90,242,0.18), transparent 36%), #050508";

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: pageBg,
        color: isLight ? "#15111d" : "#fff",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: "24px 18px 118px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "760px", margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "15px",
              border: isLight ? "1px solid rgba(124,58,237,0.12)" : "1px solid rgba(255,255,255,0.08)",
              background: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.045)",
              color: "inherit",
              display: "grid",
              placeItems: "center",
              backdropFilter: "blur(18px)",
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 5px", color: isLight ? "rgba(124,58,237,0.78)" : "rgba(216,180,254,0.72)", fontSize: "10px", fontWeight: 950, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              SRM Logo
            </p>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 950, letterSpacing: "-0.04em" }}>Student Portal</h1>
            <p style={{ margin: "4px 0 0", color: isLight ? "rgba(21,17,29,0.62)" : "rgba(255,255,255,0.58)", fontSize: "13px", fontWeight: 650, lineHeight: 1.35 }}>
              Faculty of Engineering and Technology, Kattankulathur
            </p>
          </div>
        </header>

        <section
          style={{
            borderRadius: "24px",
            border: isLight ? "1px solid rgba(124,58,237,0.14)" : "1px solid rgba(255,255,255,0.08)",
            background: isLight
              ? "linear-gradient(135deg, rgba(255,255,255,0.86), rgba(245,240,255,0.74))"
              : "linear-gradient(135deg, rgba(191,90,242,0.12), rgba(255,255,255,0.045))",
            backdropFilter: "blur(24px)",
            padding: "16px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            boxShadow: isLight ? "0 16px 34px rgba(124,58,237,0.10)" : "0 18px 44px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "13px", minWidth: 0 }}>
            <span
              aria-hidden
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "18px",
                display: "grid",
                placeItems: "center",
                color: isLight ? "#3730a3" : "#fff",
                background: isLight
                  ? "linear-gradient(135deg, rgba(55,48,163,0.12), rgba(191,90,242,0.10))"
                  : "linear-gradient(135deg, rgba(191,90,242,0.30), rgba(0,229,255,0.10))",
                border: isLight ? "1px solid rgba(55,48,163,0.14)" : "1px solid rgba(255,255,255,0.10)",
                fontSize: "16px",
                fontWeight: 950,
                letterSpacing: "-0.04em",
                flexShrink: 0,
              }}
            >
              SRM
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 950, letterSpacing: "-0.02em" }}>
                Official portal service map
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "11px", lineHeight: 1.45, fontWeight: 650, color: isLight ? "rgba(21,17,29,0.58)" : "rgba(255,255,255,0.56)" }}>
                {totalServices} SRM services arranged for quick access.
              </p>
            </div>
          </div>
          <span
            style={{
              borderRadius: "999px",
              padding: "7px 10px",
              color: isLight ? "#6d28d9" : "#d8b4fe",
              background: isLight ? "rgba(124,58,237,0.09)" : "rgba(191,90,242,0.12)",
              border: isLight ? "1px solid rgba(124,58,237,0.12)" : "1px solid rgba(191,90,242,0.20)",
              fontSize: "9px",
              fontWeight: 950,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Nexus UI
          </span>
        </section>

        <label
          style={{
            height: "52px",
            borderRadius: "18px",
            border: isLight ? "1px solid rgba(124,58,237,0.12)" : "1px solid rgba(255,255,255,0.08)",
            background: isLight ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.045)",
            backdropFilter: "blur(22px)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 16px",
            marginBottom: "22px",
          }}
        >
          <Search size={18} color={isLight ? "rgba(124,58,237,0.70)" : "rgba(191,90,242,0.82)"} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search portal services..."
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "inherit",
              fontSize: "14px",
              fontWeight: 650,
            }}
          />
        </label>

        <section
          style={{
            borderRadius: "22px",
            border: isLight ? "1px solid rgba(124,58,237,0.12)" : "1px solid rgba(255,255,255,0.08)",
            background: isLight ? "rgba(255,255,255,0.76)" : "rgba(255,255,255,0.045)",
            backdropFilter: "blur(22px)",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <span
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "15px",
                display: "grid",
                placeItems: "center",
                color: studentPortalConnected ? "#34C759" : "#BF5AF2",
                background: studentPortalConnected ? "rgba(52,199,89,0.12)" : "rgba(191,90,242,0.14)",
                border: studentPortalConnected ? "1px solid rgba(52,199,89,0.22)" : "1px solid rgba(191,90,242,0.22)",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={19} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 900, letterSpacing: "-0.01em" }}>
                {studentPortalConnected ? "Portal Connected" : "Connect Official Portal"}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "11px", lineHeight: 1.45, fontWeight: 620, color: isLight ? "rgba(21,17,29,0.58)" : "rgba(255,255,255,0.55)" }}>
                Use your Student Portal NetID, password, and captcha to sync official records.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            style={{
              height: "38px",
              border: "none",
              borderRadius: "999px",
              padding: "0 14px",
              background: studentPortalConnected
                ? "rgba(52,199,89,0.14)"
                : "linear-gradient(135deg, rgba(191,90,242,0.95), rgba(167,139,250,0.92))",
              color: studentPortalConnected ? (isLight ? "#15803d" : "#bbf7d0") : "#fff",
              fontSize: "10px",
              fontWeight: 950,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              cursor: "pointer",
              boxShadow: studentPortalConnected ? "none" : "0 10px 24px rgba(124,58,237,0.18)",
            }}
          >
            {studentPortalConnected ? "Resync" : "Connect"}
          </button>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {filteredGroups.map((group) => (
            <section key={group.title}>
              <h2 style={{ margin: "0 0 10px", fontSize: "10px", fontWeight: 950, letterSpacing: "0.22em", textTransform: "uppercase", color: isLight ? "rgba(124,58,237,0.72)" : "rgba(216,180,254,0.72)" }}>
                {group.title}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                {group.services.map((service) => {
                  const Icon = ICONS[service.key] || ShieldCheck;
                  const action = getStudentPortalPageAction(service, premiumStatus);
                  const isLocked = action === "unlock_premium";
                  const isShortcut = service.type === "shortcut";
                  const isRestricted = isStudentPortalRestrictedAction(service);
                  const badge = getBadgeLabel(service);
                  const title = service.label;
                  const message = isLocked
                    ? "Premium Student Portal Tool. Unlock marks, exams, hall tickets, and smart academic tools with SRM Nexus Premium from ₹10."
                    : isRestricted
                      ? "View details inside SRM Nexus only. Payments, bookings, registrations, and requests cannot be submitted here."
                    : isShortcut
                      ? "Open a Nexus view for this official portal service without leaving the app."
                      : service.description;
                  const cta = isLocked ? "View Premium Plans" : isRestricted ? "View Only" : "Open";

                  return (
                    <button
                      key={service.key}
                      type="button"
                      onClick={() => handlePageAction(service)}
                      style={{
                        minHeight: "124px",
                        textAlign: "left",
                        borderRadius: "22px",
                        border: isLocked
                          ? isLight ? "1px solid rgba(251,191,36,0.32)" : "1px solid rgba(251,191,36,0.20)"
                          : `1px solid ${service.color}30`,
                        background: isLight
                          ? isLocked ? "rgba(255,251,235,0.68)" : "rgba(255,255,255,0.76)"
                          : isLocked ? "rgba(251,191,36,0.055)" : "rgba(255,255,255,0.04)",
                        backdropFilter: "blur(22px)",
                        padding: "15px",
                        color: "inherit",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                        <span
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "15px",
                            display: "grid",
                            placeItems: "center",
                            color: isLocked ? "#F59E0B" : service.color,
                            background: isLocked ? "rgba(245,158,11,0.14)" : `${service.color}17`,
                            border: isLocked ? "1px solid rgba(245,158,11,0.24)" : `1px solid ${service.color}24`,
                          }}
                        >
                          {isLocked ? <LockKeyhole size={18} /> : <Icon size={19} />}
                        </span>
                        <span
                          style={{
                            border: isRestricted
                              ? "1px solid rgba(245,158,11,0.24)"
                              : isShortcut
                              ? "1px solid rgba(56,189,248,0.22)"
                              : isLocked
                                ? "1px solid rgba(245,158,11,0.24)"
                                : "1px solid rgba(191,90,242,0.22)",
                            background: isRestricted
                              ? "rgba(245,158,11,0.12)"
                              : isShortcut
                              ? "rgba(56,189,248,0.10)"
                              : isLocked
                                ? "rgba(245,158,11,0.12)"
                                : "rgba(191,90,242,0.10)",
                            color: isRestricted
                              ? isLight ? "#a16207" : "#fde68a"
                              : isShortcut
                              ? isLight ? "#0369a1" : "#bae6fd"
                              : isLocked
                                ? isLight ? "#a16207" : "#fde68a"
                                : isLight ? "#7c3aed" : "#d8b4fe",
                            borderRadius: "999px",
                            padding: "5px 8px",
                            fontSize: "8px",
                            fontWeight: 950,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            maxWidth: "128px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {badge}
                        </span>
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 6px", fontSize: "14px", lineHeight: 1.18, fontWeight: 900, letterSpacing: "-0.01em" }}>{title}</h3>
                        <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.45, fontWeight: 620, color: isLight ? "rgba(21,17,29,0.58)" : "rgba(255,255,255,0.55)" }}>
                          {message}
                        </p>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: 950, letterSpacing: "0.10em", textTransform: "uppercase", color: isLocked || isRestricted ? "#F59E0B" : isShortcut ? "#38BDF8" : service.color }}>
                        {cta}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {!filteredGroups.length && (
            <section
              style={{
                borderRadius: "22px",
                border: isLight ? "1px solid rgba(124,58,237,0.12)" : "1px solid rgba(255,255,255,0.08)",
                background: isLight ? "rgba(255,255,255,0.74)" : "rgba(255,255,255,0.045)",
                backdropFilter: "blur(22px)",
                padding: "18px",
                color: isLight ? "rgba(21,17,29,0.62)" : "rgba(255,255,255,0.58)",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              No portal services match your search.
            </section>
          )}
        </div>
      </div>
      <PortalSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccess={() => router.refresh()}
        netId={loginUserId}
      />
    </main>
  );
}
