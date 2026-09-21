import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NEXUS_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://srm-nexus.onrender.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ success: false, error: "Missing Authorization" }, { status: 401 });
  }

  try {
    const res = await fetch(`${NEXUS_URL}/api/gridee/sniper/status`, {
      headers: {
        Authorization: authHeader,
        Origin: "http://localhost:3000",
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
