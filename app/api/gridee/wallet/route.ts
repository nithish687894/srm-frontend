import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRIDEE_API_BASE = "https://gridee.onrender.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: "Missing Authorization header" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Missing userId parameter" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${GRIDEE_API_BASE}/api/users/${userId}/wallet`, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: errText || "Failed to fetch wallet" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      wallet: data,
      balance: data.balance ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to query wallet" },
      { status: 500 }
    );
  }
}
