"use client";
import { FileText, ClipboardList, AlertCircle, Target, Zap, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

const AURA = {
  bg: "#050508",
  cyan: "#00E5FF",
  pink: "#FF2D55",
  amber: "#FF9500",
  emerald: "#34C759",
  purple: "#BF5AF2",
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
  subBright: "rgba(255, 255, 255, 0.6)",
};

export function ActionWidgets({ data }: AnyValue) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Row 1: Tasks Due & Lecture Notes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Tasks Due Tomorrow */}
        <div
          onClick={() => router.push("/marks")}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "28px",
            padding: "24px",
            cursor: "pointer",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "14px",
                background: "rgba(255, 149, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClipboardList size={20} color={AURA.amber} />
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: AURA.subBright,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Due Tomorrow
            </span>
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 900,
              color: AURA.text,
              margin: "0 0 8px",
            }}
          >
            2 Assignments
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: AURA.sub,
              margin: 0,
              fontWeight: 500,
            }}
          >
            Physics Lab Report & Calculus Problem Set
          </p>
        </div>

        {/* Recent Lecture Notes */}
        <div
          onClick={() => router.push("/materials")}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "28px",
            padding: "24px",
            cursor: "pointer",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "14px",
                background: "rgba(0, 229, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={20} color={AURA.cyan} />
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: AURA.subBright,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Lecture Materials
            </span>
          </div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 900,
              color: AURA.text,
              margin: "0 0 8px",
            }}
          >
            3 New Files
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: AURA.sub,
              margin: 0,
              fontWeight: 500,
            }}
          >
            From today&apos;s 1PM & 3PM classes
          </p>
        </div>
      </div>

      {/* Row 2: Performance Tips & Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Performance Tip */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(192, 132, 252, 0.06) 0%, rgba(255, 117, 195, 0.03) 100%)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(192, 132, 252, 0.15)",
            borderRadius: "28px",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={24} color={AURA.purple} />
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 900,
                color: AURA.text,
                marginBottom: "4px",
              }}
            >
              Pro Tip
            </div>
            <p
              style={{
                fontSize: "11px",
                color: AURA.sub,
                margin: 0,
                fontWeight: 500,
              }}
            >
              Your attendance is strong. Focus on weak subjects to boost GPA.
            </p>
          </div>
        </div>

        {/* Quick Downloads */}
        <div
          onClick={() => router.push("/transcript")}
          style={{
            background: "linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(0, 229, 255, 0.05) 100%)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(52, 199, 89, 0.2)",
            borderRadius: "28px",
            padding: "24px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "rgba(52, 199, 89, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(52, 199, 89, 0.2)";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={24} color={AURA.emerald} />
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 900,
                color: AURA.text,
                marginBottom: "4px",
              }}
            >
              Download Transcript
            </div>
            <p
              style={{
                fontSize: "11px",
                color: AURA.sub,
                margin: 0,
                fontWeight: 500,
              }}
            >
              Get your latest academic transcript
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
