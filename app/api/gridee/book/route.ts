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

    const payload = {
      parkingLotId: SRM_LOT_ID,
      parkingSpotId: parkingSpotId || undefined,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      slotId: slotId || "MORNING",
      bookingMode: "DAILY",
    };

    // Attempt lot-scoped create endpoint
    let res = await fetch(
      `${GRIDEE_API_BASE}/api/parking-lots/${SRM_LOT_ID}/bookings/${userId}/create`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // If 404, fallback to user-scoped create endpoint
    if (res.status === 404) {
      res = await fetch(`${GRIDEE_API_BASE}/api/bookings/${userId}/create`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

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
