"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { normalizeAPIError, studentPortalAPI } from "@/lib/api";
import { useThemeStore } from "@/lib/themeStore";
import {
  STUDENT_PORTAL_PAGES,
  isStudentPortalRestrictedAction,
} from "@/lib/studentPortalConfig";

export default function StudentPortalServicePage() {
  const router = useRouter();
  const params = useParams<{ service: string }>();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const service = useMemo(
    () => STUDENT_PORTAL_PAGES.find((page) => page.key === params.service),
    [params.service]
  );
  const [payload, setPayload] = useState<AnyValue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const restricted = service ? isStudentPortalRestrictedAction(service) : false;
  const isShortcut = payload?.shortcut || service?.type === "shortcut";
  const isLocked = !!payload?.locked;
  const backendMessage = payload?.message || "";
  const pageBg = isLight
    ? "radial-gradient(circle at top right, rgba(191,90,242,0.10), transparent 34%), var(--app-bg, #f7f5ff)"
    : "radial-gradient(circle at top right, rgba(191,90,242,0.18), transparent 36%), #050508";

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      if (!params.service) return;
      setIsLoading(true);
      setError("");
      try {
        const response = await studentPortalAPI.getPage(params.service);
        if (!cancelled) setPayload(response);
      } catch (err) {
        const normalized = normalizeAPIError(err);
        if (!cancelled) setError(normalized.message || "Could not load this Student Portal page.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPage();
    return () => {
      cancelled = true;
    };
  }, [params.service]);

  if (!service) {
    return (
      <main style={mainStyle(isLight, pageBg)}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <button onClick={() => router.push("/student-portal")} style={backButtonStyle(isLight)}>
            <ArrowLeft size={19} />
          </button>
          <section style={cardStyle(isLight)}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 950 }}>Service not found</h1>
            <p style={mutedStyle(isLight)}>This Student Portal service is not available yet.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle(isLight, pageBg)}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
          <button onClick={() => router.push("/student-portal")} aria-label="Back to Student Portal" style={backButtonStyle(isLight)}>
            <ArrowLeft size={19} />
          </button>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 5px", color: isLight ? "rgba(124,58,237,0.78)" : "rgba(216,180,254,0.72)", fontSize: "10px", fontWeight: 950, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Student Portal
            </p>
            <h1 style={{ margin: 0, fontSize: "25px", lineHeight: 1.08, fontWeight: 950, letterSpacing: "-0.04em" }}>
              {service.label}
            </h1>
          </div>
        </header>

        <section style={{ ...cardStyle(isLight), borderColor: restricted || isLocked ? "rgba(245,158,11,0.24)" : isLight ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <span style={iconShellStyle(isLight, restricted || isLocked, service.color)}>
              {restricted || isLocked ? <LockKeyhole size={21} /> : <Eye size={21} />}
            </span>
            <span style={pillStyle(isLight, restricted || isLocked)}>
              {isLocked ? "Premium" : restricted ? "View Only" : isShortcut ? "Official Safety" : "Backend Connected"}
            </span>
          </div>

          <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 950, letterSpacing: "-0.02em" }}>
            {isLocked ? "Premium Student Portal Tool" : isShortcut ? "Official portal safety card" : restricted ? "Safe view inside SRM Nexus" : "Loaded through SRM Nexus backend"}
          </h2>
          <p style={mutedStyle(isLight)}>
            {isLoading
              ? "Loading Student Portal data through the SRM Nexus backend..."
              : isLocked
                ? backendMessage
                : isShortcut
                  ? backendMessage || "This is an official SRM Student Portal service. Continue in the official portal to complete this safely."
                  : restricted
                    ? "This service can involve payments, bookings, registrations, or official requests. SRM Nexus shows this as a view-only service and will not submit, book, pay, register, or change official portal records."
                    : service.description}
          </p>
        </section>

        {isLoading && <SkeletonCard isLight={isLight} />}

        {!isLoading && error && (
          <section style={{ ...cardStyle(isLight), marginTop: "14px", borderColor: "rgba(245,158,11,0.24)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 950 }}>Could not load portal data</h3>
            <p style={mutedStyle(isLight)}>{error}</p>
          </section>
        )}

        {!isLoading && payload?.showingLastSavedData && (
          <section style={{ ...cardStyle(isLight), marginTop: "14px", borderColor: "rgba(245,158,11,0.22)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 950 }}>Showing last saved data</h3>
            <p style={mutedStyle(isLight)}>Student Portal could not refresh right now, so Nexus is showing the latest saved result.</p>
          </section>
        )}

        {!isLoading && payload?.data && !isLocked && !isShortcut && (
          <section style={{ ...cardStyle(isLight), marginTop: "14px" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 950 }}>Connected data</h3>
            <DataPreview data={payload.data} isLight={isLight} />
          </section>
        )}

        <section style={{ ...cardStyle(isLight), marginTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={smallIconStyle(isLight, restricted || isShortcut || isLocked)}>
              {restricted || isShortcut || isLocked ? <ShieldCheck size={18} /> : <Sparkles size={18} />}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 950 }}>
                {isShortcut ? "Official action stays outside Nexus" : restricted ? "Protected from accidental changes" : "Secure connector boundary"}
              </h3>
              <p style={{ ...mutedStyle(isLight), marginTop: "5px" }}>
                {isShortcut
                  ? "SRM Nexus shows the safety card for this official service. It does not submit requests, payments, bookings, or registrations."
                  : restricted
                    ? "Actions like payment, booking, revaluation, summer term registration, transport booking, certificate requests, and service requests are blocked in this Nexus view."
                    : "This native view is loaded through the SRM Nexus backend connector. Cookies and portal session tokens are never exposed to the frontend."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DataPreview({ data, isLight }: { data: AnyValue; isLight: boolean }) {
  const tables = data?.tables || data?.attendance || data?.timetable;
  if (Array.isArray(tables) && tables.length > 0) {
    return (
      <div style={{ display: "grid", gap: "10px" }}>
        {tables.slice(0, 3).map((table: AnyValue, index: number) => (
          <div key={`${table.title || "table"}-${index}`} style={{ borderRadius: "16px", border: isLight ? "1px solid rgba(21,17,29,0.08)" : "1px solid rgba(255,255,255,0.08)", padding: "12px" }}>
            <h4 style={{ margin: "0 0 7px", fontSize: "13px", fontWeight: 900 }}>{table.title || `Table ${index + 1}`}</h4>
            <p style={mutedStyle(isLight)}>{table.rows?.length || 0} rows available</p>
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(data?.notices)) {
    return (
      <div style={{ display: "grid", gap: "9px" }}>
        {data.notices.slice(0, 5).map((notice: string, index: number) => (
          <p key={`${notice}-${index}`} style={mutedStyle(isLight)}>{notice}</p>
        ))}
      </div>
    );
  }

  if (data?.details && typeof data.details === "object") {
    return (
      <div style={{ display: "grid", gap: "8px" }}>
        {Object.entries(data.details).slice(0, 8).map(([key, value]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px" }}>
            <span style={{ color: isLight ? "rgba(21,17,29,0.58)" : "rgba(255,255,255,0.52)", fontWeight: 750 }}>{key}</span>
            <span style={{ fontWeight: 850, textAlign: "right" }}>{String(value)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <p style={mutedStyle(isLight)}>{data?.message || "Student Portal data is connected. Parser preview is not available yet."}</p>;
}

function SkeletonCard({ isLight }: { isLight: boolean }) {
  return (
    <section style={{ ...cardStyle(isLight), marginTop: "14px" }}>
      <div style={{ display: "grid", gap: "10px" }}>
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            style={{
              height: item === 0 ? "18px" : "46px",
              borderRadius: "14px",
              background: isLight ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>
    </section>
  );
}

function mainStyle(isLight: boolean, pageBg: string) {
  return {
    minHeight: "100dvh",
    background: pageBg,
    color: isLight ? "#15111d" : "#fff",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding: "24px 18px 118px",
  } as const;
}

function backButtonStyle(isLight: boolean) {
  return {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    border: isLight ? "1px solid rgba(124,58,237,0.12)" : "1px solid rgba(255,255,255,0.08)",
    background: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.045)",
    color: "inherit",
    display: "grid",
    placeItems: "center",
    backdropFilter: "blur(18px)",
    cursor: "pointer",
  } as const;
}

function cardStyle(isLight: boolean) {
  return {
    borderRadius: "24px",
    border: isLight ? "1px solid rgba(124,58,237,0.12)" : "1px solid rgba(255,255,255,0.08)",
    background: isLight ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.045)",
    backdropFilter: "blur(22px)",
    padding: "18px",
    boxShadow: isLight ? "0 16px 34px rgba(124,58,237,0.08)" : "0 18px 44px rgba(0,0,0,0.22)",
  } as const;
}

function iconShellStyle(isLight: boolean, warning: boolean, color: string) {
  return {
    width: "50px",
    height: "50px",
    borderRadius: "17px",
    display: "grid",
    placeItems: "center",
    color: warning ? "#F59E0B" : color,
    background: warning ? "rgba(245,158,11,0.12)" : `${color}18`,
    border: warning ? "1px solid rgba(245,158,11,0.22)" : `1px solid ${color}26`,
    flexShrink: 0,
  } as const;
}

function smallIconStyle(isLight: boolean, warning: boolean) {
  return {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    color: warning ? "#F59E0B" : "#34C759",
    background: warning ? "rgba(245,158,11,0.12)" : "rgba(52,199,89,0.12)",
    border: warning ? "1px solid rgba(245,158,11,0.22)" : "1px solid rgba(52,199,89,0.20)",
    flexShrink: 0,
  } as const;
}

function pillStyle(isLight: boolean, warning: boolean) {
  return {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "6px 9px",
    background: warning ? "rgba(245,158,11,0.12)" : "rgba(56,189,248,0.10)",
    border: warning ? "1px solid rgba(245,158,11,0.22)" : "1px solid rgba(56,189,248,0.20)",
    color: warning ? (isLight ? "#a16207" : "#fde68a") : (isLight ? "#0369a1" : "#bae6fd"),
    fontSize: "9px",
    fontWeight: 950,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
  } as const;
}

function mutedStyle(isLight: boolean) {
  return {
    margin: 0,
    color: isLight ? "rgba(21,17,29,0.62)" : "rgba(255,255,255,0.58)",
    fontSize: "13px",
    lineHeight: 1.55,
    fontWeight: 650,
  } as const;
}
