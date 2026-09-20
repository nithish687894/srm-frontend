import { NextRequest, NextResponse } from "next/server";

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
    const { userId, vehicleNumber, parkingSpotId, slotId } = body;

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

    if (!checkInTime || !checkOutTime) {
      const shift = (body.slotId || body.shift || "MORNING").toUpperCase();
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
    const res = await fetch(`${GRIDEE_API_BASE}/api/bookings/${userId}/create`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resData = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resData?.message || resData?.error || "Booking request rejected by Gridee",
          details: resData,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      booking: resData,
    });
  } catch (err: any) {
    console.error("[Gridee Book Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}
