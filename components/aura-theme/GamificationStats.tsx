"use client";
import { Flame, Award, Star, Target, TrendingUp } from "lucide-react";

const AURA = {
  cyan: "#00E5FF",
  pink: "#FF2D55",
  amber: "#FF9500",
  emerald: "#34C759",
  purple: "#C084FC",
  text: "#ffffff",
  sub: "rgba(255, 255, 255, 0.4)",
  subBright: "rgba(255, 255, 255, 0.6)",
};

export function GamificationStats({ attendance, marks }: any) {
  // Calculate attendance streak (consecutive days with attendance)
  const attendanceStreak = 7; // Mock: would be calculated from actual data
  
  // Calculate badges earned
  const badges = [];
  
  // Badge: Strong Attendance (>90%)
  if (attendance >= 90) {
    badges.push({
      id: "strong_att",
      name: "Perfect Attendance",
      icon: "🎯",
      color: AURA.emerald,
      description: "Maintain 90%+ attendance",
    });
  }
  
  // Badge: Excellent Academic (>85%)
  if (marks >= 85) {
    badges.push({
      id: "excellent_marks",
      name: "Academic Excellence",
      icon: "⭐",
      color: AURA.pink,
      description: "Achieved 85%+ average",
    });
  }
  
  // Badge: Improvement (improving trend)
  badges.push({
    id: "momentum",
    name: "Building Momentum",
    icon: "📈",
    color: AURA.cyan,
    description: "On an upward trend",
  });

  // Calculate level based on combined score
  const combinedScore = (attendance * 0.5 + marks * 0.5);
  let level = 1;
  if (combinedScore >= 70) level = 2;
  if (combinedScore >= 80) level = 3;
  if (combinedScore >= 90) level = 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Attendance Streak */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 107, 107, 0.1) 100%)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255, 149, 0, 0.2)",
          borderRadius: "28px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            background: "rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Flame size={28} color={AURA.amber} />
          <div
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: AURA.amber,
              color: "#050508",
              fontSize: "10px",
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: "8px",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            {attendanceStreak}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 900,
              color: AURA.text,
              margin: "0 0 4px",
            }}
          >
            Attendance Streak
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: AURA.sub,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {attendanceStreak} consecutive days attended!
          </p>
        </div>
        <div
          style={{
            textAlign: "right",
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 149, 0, 0.2)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: AURA.sub,
              margin: "0 0 2px",
              fontWeight: 600,
            }}
          >
            +15 XP
          </p>
          <p
            style={{
              fontSize: "10px",
              color: AURA.subBright,
              margin: 0,
              fontWeight: 700,
            }}
          >
            Daily Bonus
          </p>
        </div>
      </div>

      {/* Level & Progress */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(192, 132, 252, 0.08) 0%, rgba(0, 229, 255, 0.05) 100%)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(192, 132, 252, 0.15)",
          borderRadius: "28px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 900,
              color: AURA.text,
              margin: 0,
            }}
          >
            Academic Level
          </h3>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: AURA.purple,
            }}
          >
            {level}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: "8px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "100px",
            overflow: "hidden",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${AURA.purple}, ${AURA.cyan})`,
              width: `${combinedScore}%`,
              transition: "width 0.6s ease",
              borderRadius: "100px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: AURA.sub,
            fontWeight: 600,
          }}
        >
          <span>Progress: {combinedScore.toFixed(1)}%</span>
          <span>Next Level at 75%</span>
        </div>

        {/* Level Benefits */}
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: AURA.subBright,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 12px",
            }}
          >
            Level {level} Benefits
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {level >= 1 && (
              <li
                style={{
                  fontSize: "11px",
                  color: AURA.subBright,
                  fontWeight: 500,
                }}
              >
                ✓ Dashboard access
              </li>
            )}
            {level >= 2 && (
              <li
                style={{
                  fontSize: "11px",
                  color: AURA.cyan,
                  fontWeight: 600,
                }}
              >
                ✓ Grade predictor unlocked
              </li>
            )}
            {level >= 3 && (
              <li
                style={{
                  fontSize: "11px",
                  color: AURA.emerald,
                  fontWeight: 600,
                }}
              >
                ✓ Study analytics enabled
              </li>
            )}
            {level >= 4 && (
              <li
                style={{
                  fontSize: "11px",
                  color: AURA.pink,
                  fontWeight: 600,
                }}
              >
                ✓ Premium features unlocked
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "28px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 900,
              color: AURA.text,
              margin: "0 0 16px",
            }}
          >
            Achievements
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {badges.map((badge) => (
              <div
                key={badge.id}
                style={{
                  background: `${badge.color}15`,
                  border: `1px solid ${badge.color}30`,
                  borderRadius: "16px",
                  padding: "16px",
                  textAlign: "center",
                  transition: "all 0.35s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    marginBottom: "8px",
                  }}
                >
                  {badge.icon}
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: badge.color,
                    margin: "0 0 4px",
                  }}
                >
                  {badge.name}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: AURA.sub,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
