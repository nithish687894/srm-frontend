import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRIDEE_API_BASE = "https://gridee.onrender.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!authHeader || !userId) {
    return NextResponse.json(
      { success: false, error: "Missing authorization or userId" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${GRIDEE_API_BASE}/api/bookings/${userId}/all`, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const bookings = Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
      ? data.content
      : [];

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
