// AI-powered diagnostic and recovery resolver for SRM Gridee Parking issues
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

export interface GrideeIssueContext {
  operation: "BOOK" | "AUTH" | "SLOTS" | "WALLET" | "CANCEL";
  rawError: string;
  status?: number;
  details?: Record<string, unknown>;
  spotId?: string;
  zoneName?: string;
  shift?: string;
  date?: string;
  vehicleNumber?: string;
}

export interface GrideeAiDiagnosis {
  diagnosis: string;
  recommendedAction:
    | "RETRY"
    | "SWITCH_ZONE"
    | "TOP_UP"
    | "REAUTH"
    | "WAIT_TIME"
    | "MANUAL_CHECK";
  userAdvice: string;
  autoRetryRecommended: boolean;
  suggestedZone?: "TP" | "JAVA";
}

/**
 * Fast heuristic classifier in case AI network times out
 */
function heuristicFallback(ctx: GrideeIssueContext): GrideeAiDiagnosis {
  const err = (ctx.rawError || "").toLowerCase();
  const status = ctx.status || 500;

  if (err.includes("insufficient") || err.includes("wallet") || err.includes("coin") || err.includes("balance")) {
    return {
      diagnosis: "Gridee wallet balance is insufficient to finalize this reservation.",
      recommendedAction: "TOP_UP",
      userAdvice: "Top up at least 50 Gridee coins in your app or account to reserve this slot.",
      autoRetryRecommended: false,
    };
  }

  if (err.includes("already") || err.includes("concurrent") || err.includes("maxconcurrent") || err.includes("1 booking")) {
    return {
      diagnosis: "Gridee policy allows only 1 active booking per student per day.",
      recommendedAction: "MANUAL_CHECK",
      userAdvice: "You already have a confirmed slot. Check your Active Booking tab or cancel your existing pass first.",
      autoRetryRecommended: false,
    };
  }

  if (status === 401 || err.includes("unauthorized") || err.includes("token") || err.includes("expired") || err.includes("auth")) {
    return {
      diagnosis: "Your Gridee authentication session has expired or is invalid.",
      recommendedAction: "REAUTH",
      userAdvice: "Sign out and sign back in to refresh your Gridee bearer session.",
      autoRetryRecommended: false,
    };
  }

  if (err.includes("full") || err.includes("capacity") || err.includes("unavailable") || err.includes("no spot") || err.includes("ps5") || err.includes("ps6")) {
    const isTP = ctx.spotId === "ps5" || ctx.zoneName?.includes("TP");
    return {
      diagnosis: `${isTP ? "Tech Park (TP Avenue)" : "Java Ground"} has reached 100% full capacity.`,
      recommendedAction: "SWITCH_ZONE",
      suggestedZone: isTP ? "JAVA" : "TP",
      userAdvice: `Switching reservation target to ${isTP ? "Java Ground (ps6)" : "Tech Park (ps5)"}.`,
      autoRetryRecommended: true,
    };
  }

  if (err.includes("open") || err.includes("05:00") || err.includes("before") || err.includes("schedule") || status === 404 || status === 503) {
    return {
      diagnosis: "Gridee booking gateway is not yet accepting reservations for tomorrow's shift.",
      recommendedAction: "WAIT_TIME",
      userAdvice: "Booking gateway unlocks sharply at 05:00:00 AM. 5:00 AM Auto-Sniper is ready to fire on the drop.",
      autoRetryRecommended: true,
    };
  }

  return {
    diagnosis: ctx.rawError || "Gridee server rejected the reservation request.",
    recommendedAction: "RETRY",
    userAdvice: "Retrying booking with optimized parameters...",
    autoRetryRecommended: true,
  };
}

/**
 * Diagnose and resolve Gridee errors using OpenRouter AI
 */
export async function diagnoseGrideeIssueWithAI(
  ctx: GrideeIssueContext
): Promise<GrideeAiDiagnosis> {
  const fallback = heuristicFallback(ctx);

  if (!OPENROUTER_API_KEY) {
    return fallback;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const prompt = `You are an AI assistant diagnosing a student parking reservation failure on SRM University Kattankulathur Campus (Gridee parking system).
Issue Context:
- Operation: ${ctx.operation}
- HTTP Status: ${ctx.status || "N/A"}
- Raw Error: "${ctx.rawError}"
- Spot Requested: ${ctx.spotId || "N/A"} (${ctx.zoneName || "N/A"})
- Shift: ${ctx.shift || "N/A"}
- Date: ${ctx.date || "N/A"}

SRM Campus Rules:
- 2 parking areas: Tech Park TP Avenue (ps5) & Java Ground (ps6).
- 5:00 AM daily is the sharp opening time for morning class parking.
- Only 1 active reservation per student allowed.
- Requires 50 Gridee coins in wallet.

Respond in strict JSON with:
{
  "diagnosis": "1 concise sentence explaining what failed",
  "recommendedAction": "RETRY" | "SWITCH_ZONE" | "TOP_UP" | "REAUTH" | "WAIT_TIME" | "MANUAL_CHECK",
  "userAdvice": "1 concise sentence explaining what student or system should do",
  "autoRetryRecommended": true or false,
  "suggestedZone": "JAVA" | "TP" (optional)
}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const cleanJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      diagnosis: parsed.diagnosis || fallback.diagnosis,
      recommendedAction: parsed.recommendedAction || fallback.recommendedAction,
      userAdvice: parsed.userAdvice || fallback.userAdvice,
      autoRetryRecommended:
        typeof parsed.autoRetryRecommended === "boolean"
          ? parsed.autoRetryRecommended
          : fallback.autoRetryRecommended,
      suggestedZone: parsed.suggestedZone || fallback.suggestedZone,
    };
  } catch {
    // If AI network fails or times out, return the verified heuristic
    return fallback;
  }
}
