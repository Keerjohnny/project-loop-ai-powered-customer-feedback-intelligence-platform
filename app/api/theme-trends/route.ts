import { NextRequest, NextResponse } from "next/server";
import { getThemeTrends, normalizeThemeTrendPeriod } from "@/lib/theme-trends";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const periodDays = normalizeThemeTrendPeriod(searchParams.get("period"));
    const selectedTheme = searchParams.get("theme");

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace ID is required",
        },
        { status: 400 }
      );
    }

    const trends = await getThemeTrends(workspaceId, periodDays, selectedTheme);

    return NextResponse.json({
      success: true,
      ...trends,
    });
  } catch (error) {
    console.error("Theme trends error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
