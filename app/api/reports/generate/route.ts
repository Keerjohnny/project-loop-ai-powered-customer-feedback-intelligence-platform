import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVoiceOfCustomerReport } from "@/lib/ai";

type ReportType = "Weekly" | "Monthly" | "Custom";

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function eachDate(start: Date, end: Date) {
  const dates: string[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  const finalDate = new Date(end);
  finalDate.setHours(0, 0, 0, 0);

  while (cursor <= finalDate) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, generatedById, reportType, startDate, endDate } = body as {
      workspaceId?: string;
      generatedById?: string;
      reportType?: ReportType;
      startDate?: string;
      endDate?: string;
    };

    if (!workspaceId || !generatedById) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace ID and User ID are required",
        },
        { status: 400 }
      );
    }

    if (!reportType || !["Weekly", "Monthly", "Custom"].includes(reportType)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid report type is required",
        },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace not found",
        },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: generatedById },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const now = new Date();
    let periodStart = new Date(now);
    let periodEnd = new Date(now);

    if (reportType === "Weekly") {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    }

    if (reportType === "Monthly") {
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 1);
    }

    if (reportType === "Custom") {
      if (!startDate || !endDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Custom reports require a start and end date",
          },
          { status: 400 }
        );
      }

      periodStart = new Date(startDate);
      periodEnd = new Date(endDate);

      if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid custom date range",
          },
          { status: 400 }
        );
      }
    }

    const periodLengthMs = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(periodStart.getTime() - periodLengthMs);
    const previousPeriodEnd = new Date(periodStart);

    const [feedback, previousThemeStats] = await Promise.all([
      prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
      prisma.feedback.groupBy({
        by: ["theme"],
        where: {
          workspaceId,
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const totalFeedback = feedback.length;
    const positive = feedback.filter((item) => item.sentiment === "POSITIVE").length;
    const negative = feedback.filter((item) => item.sentiment === "NEGATIVE").length;
    const neutral = feedback.filter((item) => item.sentiment === "NEUTRAL").length;

    const channelCounts = feedback.reduce<Record<string, number>>((acc, item) => {
      acc[item.channel] = (acc[item.channel] || 0) + 1;
      return acc;
    }, {});

    const themeCounts = feedback.reduce<Record<string, number>>((acc, item) => {
      const theme = item.theme || "General";
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {});

    const themeEntries = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    const previousThemeCounts = previousThemeStats.reduce<Record<string, number>>((acc, item) => {
      const theme = item.theme || "General";
      acc[theme] = item._count._all;
      return acc;
    }, {});

    const themeTrends = themeEntries.map((item) => {
      const previousCount = previousThemeCounts[item.theme] || 0;
      const change = percentageChange(item.count, previousCount);

      return {
        theme: item.theme,
        previousPeriodCount: previousCount,
        currentPeriodCount: item.count,
        percentageChange: change,
        trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
      };
    });

    const volumeCounts = feedback.reduce<Record<string, number>>((acc, item) => {
      const date = toDateKey(item.createdAt);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const feedbackVolume = eachDate(periodStart, periodEnd).map((date) => ({
      date,
      count: volumeCounts[date] || 0,
    }));

    const customerQuotes = feedback
      .filter((item) => item.content.trim().length > 0)
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        customer: item.customerLabel,
        quote: item.content,
        sentiment: item.sentiment,
        theme: item.theme || "General",
        channel: item.channel,
      }));

    const positiveFeedback = feedback.filter((item) => item.sentiment === "POSITIVE").slice(0, 5);
    const complaints = feedback.filter((item) => item.sentiment === "NEGATIVE").slice(0, 5);

    const aiReport = await generateVoiceOfCustomerReport(
      feedback.map((item) => ({
        customerLabel: item.customerLabel,
        channel: item.channel,
        content: item.content,
        sentiment: item.sentiment,
        theme: item.theme,
        summary: item.summary,
        recommendation: item.recommendation,
      }))
    );

    const report = await prisma.report.create({
      data: {
        title: `${reportType} Voice of Customer Report - ${new Date().toLocaleDateString()}`,
        periodStart,
        periodEnd,
        workspaceId,
        generatedById,
        contentJson: {
          coverPage: {
            company: "Project LOOP",
            workspace: workspace.name,
            generatedBy: user.name,
            generatedByEmail: user.email,
            date: now.toISOString(),
            reportType,
          },
          totalFeedback,
          positive,
          negative,
          neutral,
          channels: Object.entries(channelCounts).map(([channel, count]) => ({ channel, count })),
          themes: themeEntries,
          topThemes: themeEntries.slice(0, 5),
          themeTrends,
          feedbackVolume,
          customerQuotes,
          positiveFeedback: positiveFeedback.map((item) => ({
            id: item.id,
            content: item.content,
            channel: item.channel,
            sentiment: item.sentiment,
          })),
          complaints: complaints.map((item) => ({
            id: item.id,
            content: item.content,
            channel: item.channel,
            sentiment: item.sentiment,
          })),
          executiveSummary: aiReport.executiveSummary,
          keyFindings: aiReport.keyFindings,
          recommendedActions: aiReport.recommendedActions,
          aiSummary: aiReport.executiveSummary,
          aiRecommendation: aiReport.recommendedActions.join("\n"),
          appendix: {
            feedbackTable: feedback.map((item) => ({
              id: item.id,
              customer: item.customerLabel,
              channel: item.channel,
              content: item.content,
              sentiment: item.sentiment,
              theme: item.theme || "General",
              summary: item.summary,
              recommendation: item.recommendation,
              createdAt: item.createdAt.toISOString(),
            })),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
