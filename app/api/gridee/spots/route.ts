import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRIDEE_API_BASE = "https://gridee.onrender.com";
const SRM_LOT_ID = "69341521c05d1b8f5d85332c";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${GRIDEE_API_BASE}/api/parking-lots/${SRM_LOT_ID}/spots/available`, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: errText || "Failed to fetch available spots" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      spots: data,
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to query Gridee spots" },
      { status: 500 }
    );
  }
}
