import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRIDEE_API_BASE = "https://gridee.onrender.com";

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
    const { userId, bookingId } = body;

    if (!userId || !bookingId) {
      return NextResponse.json(
        { success: false, error: "userId and bookingId are required to cancel a booking" },
        { status: 400 }
      );
    }

    const res = await fetch(`${GRIDEE_API_BASE}/api/bookings/${userId}/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedError = "Failed to cancel booking";
      try {
        const jsonErr = JSON.parse(errText);
        parsedError = jsonErr.message || jsonErr.error || parsedError;
      } catch {
        parsedError = errText || parsedError;
      }
      return NextResponse.json(
        { success: false, error: parsedError },
        { status: res.status }
      );
    }

    let resData: any = {};
    const text = await res.text();
    if (text) {
      try {
        resData = JSON.parse(text);
      } catch {
        resData = { message: text };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: resData,
    });
  } catch (err: any) {
    console.error("[Gridee Cancel Booking Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
