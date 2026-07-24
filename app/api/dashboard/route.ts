import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDashboardInsights } from "@/lib/dashboard";
import { getThemeTrends } from "@/lib/theme-trends";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace ID is required",
        },
        { status: 400 }
      );
    }

    // Total Feedback
    const totalFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
      },
    });

    // Positive
    const positive = await prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "POSITIVE",
      },
    });

    // Negative
    const negative = await prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEGATIVE",
      },
    });

    // Neutral
    const neutral = await prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEUTRAL",
      },
    });

    // Channel Statistics
    const channelStats = await prisma.feedback.groupBy({
      by: ["channel"],
      where: {
        workspaceId,
      },
      _count: {
        channel: true,
      },
    });

    // Theme Statistics
    const themeStats = await prisma.feedback.groupBy({
      by: ["theme"],
      where: {
        workspaceId,
      },
      _count: {
        theme: true,
      },
    });

    const recentFeedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        content: true,
        channel: true,
        sentiment: true,
        theme: true,
        summary: true,
        recommendation: true,
        createdAt: true,
      },
    });

    const cards = {
      totalFeedback,
      positive,
      negative,
      neutral,
    };

    const [insights, themeTrends] = await Promise.all([
      buildDashboardInsights(
      cards,
      themeStats.map((item) => ({
        theme: item.theme ?? "Unknown",
        count: item._count.theme,
      })),
      channelStats.map((item) => ({
        channel: item.channel,
        count: item._count.channel,
      })),
      recentFeedback.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))
      ),
      getThemeTrends(workspaceId, 30),
    ]);

    return NextResponse.json({
      success: true,
      cards,
      channels: channelStats.map((item) => ({
        channel: item.channel,
        count: item._count.channel,
      })),
      themes: themeStats.map((item) => ({
        theme: item.theme ?? "Unknown",
        count: item._count.theme,
      })),
      recentFeedback: recentFeedback.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      insights,
      themeTrends: themeTrends.trends.slice(0, 6),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
