import { NextRequest, NextResponse } from "next/server";
import { diagnoseGrideeIssueWithAI } from "@/lib/grideeAiResolver";

export const dynamic = "force-dynamic";

const GRIDEE_API_BASE = "https://gridee.onrender.com";
const SRM_LOT_ID = "69341521c05d1b8f5d85332c";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { userId, vehicleNumber } = body;

    if (!userId || !vehicleNumber) {
      return NextResponse.json(
        { success: false, error: "userId and vehicleNumber are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const bookingDate = body.bookingDate || now.toISOString().split("T")[0];

    // Compute checkInTime & checkOutTime based on shift or custom inputs
    let checkInTime = body.checkInTime;
    let checkOutTime = body.checkOutTime;
    const shift = (body.slotId || body.shift || "MORNING").toUpperCase();

    if (!checkInTime || !checkOutTime) {
      const baseDate = bookingDate; // YYYY-MM-DD
      if (shift === "MORNING") {
        checkInTime = new Date(`${baseDate}T08:00:00.000+05:30`).toISOString();
        checkOutTime = new Date(`${baseDate}T12:30:00.000+05:30`).toISOString();
      } else if (shift === "AFTERNOON") {
        checkInTime = new Date(`${baseDate}T12:30:00.000+05:30`).toISOString();
        checkOutTime = new Date(`${baseDate}T17:30:00.000+05:30`).toISOString();
      } else {
        // FULL_DAY
        checkInTime = new Date(`${baseDate}T08:00:00.000+05:30`).toISOString();
        checkOutTime = new Date(`${baseDate}T17:30:00.000+05:30`).toISOString();
      }
    }

    // Resolve spotId: "TP" maps to "ps5", "JAVA" maps to "ps6"
    let spotId = body.spotId || body.parkingSpotId || "ps5";
    if (spotId.startsWith("TP") || spotId === "TP") {
      spotId = "ps5";
    } else if (spotId.startsWith("JAVA") || spotId === "JAVA") {
      spotId = "ps6";
    }

    const payload = {
      bookingDate,
      checkInTime,
      checkOutTime,
      parkingLotId: SRM_LOT_ID,
      spotId,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
    };

    // Call verified user-scoped booking create endpoint
    let res = await fetch(`${GRIDEE_API_BASE}/api/bookings/${userId}/create`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let resData = await res.json();
    let autoPivoted = false;
    let autoPivotedZone = "";

    // ⚡ Intelligent Auto-Pivot: If TP (ps5) fails due to capacity/full, automatically attempt Java (ps6)
    if (!res.ok && spotId === "ps5") {
      const rawErrMsg = (resData?.message || resData?.error || "").toLowerCase();
      const isCapacityIssue =
        rawErrMsg.includes("full") ||
        rawErrMsg.includes("unavailable") ||
        rawErrMsg.includes("capacity") ||
        rawErrMsg.includes("occupied") ||
        rawErrMsg.includes("spot") ||
        rawErrMsg.includes("rejected");

      if (isCapacityIssue) {
        console.log("[Gridee Book] TP Avenue full/rejected, auto-pivoting to Java Ground (ps6)...");
        const fallbackPayload = { ...payload, spotId: "ps6" };
        const fallbackRes = await fetch(`${GRIDEE_API_BASE}/api/bookings/${userId}/create`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(fallbackPayload),
        });

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          res = fallbackRes;
          resData = fallbackData;
          autoPivoted = true;
          autoPivotedZone = "JAVA";
        }
      }
    }

    if (!res.ok) {
      const rawError = resData?.message || resData?.error || "Booking request rejected by Gridee";

      // 🤖 AI Diagnostic and Recovery Resolution
      const aiDiagnosis = await diagnoseGrideeIssueWithAI({
        operation: "BOOK",
        rawError,
        status: res.status,
        details: resData,
        spotId,
        zoneName: spotId === "ps5" ? "Tech Park (TP Avenue)" : "Java Ground",
        shift,
        date: bookingDate,
        vehicleNumber,
      });

      return NextResponse.json(
        {
          success: false,
          error: aiDiagnosis.diagnosis || rawError,
          rawError,
          aiDiagnosis,
          details: resData,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      booking: resData,
      autoPivoted,
      autoPivotedZone,
      aiResolution: autoPivoted
        ? "TP Avenue was at capacity. AI Auto-Resolver successfully booked your spot in Java Ground (ps6)."
        : undefined,
    });
  } catch (err: any) {
    console.error("[Gridee Book Error]", err);

    // Fallback AI diagnosis for unexpected network or execution errors
    const aiDiagnosis = await diagnoseGrideeIssueWithAI({
      operation: "BOOK",
      rawError: err.message || "Unknown error during booking request",
      status: 500,
    });

    return NextResponse.json(
      {
        success: false,
        error: aiDiagnosis.diagnosis || err.message || "Failed to create booking",
        aiDiagnosis,
      },
      { status: 500 }
    );
  }
}
