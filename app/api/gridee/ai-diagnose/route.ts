import { NextRequest, NextResponse } from "next/server";
import { diagnoseGrideeIssueWithAI, GrideeIssueContext } from "@/lib/grideeAiResolver";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GrideeIssueContext;
    if (!body || !body.rawError) {
      return NextResponse.json(
        { success: false, error: "rawError is required for AI diagnosis" },
        { status: 400 }
      );
    }

    const diagnosis = await diagnoseGrideeIssueWithAI(body);
    return NextResponse.json({
      success: true,
      diagnosis,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute AI diagnosis",
      },
      { status: 500 }
    );
  }
}
