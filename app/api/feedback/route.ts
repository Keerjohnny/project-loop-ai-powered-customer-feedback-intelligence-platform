import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerLabel,
      channel,
      content,
      workspaceId,
    } = body;

    if (!customerLabel || !channel || !content || !workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    // Check whether the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
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

    const feedback = await prisma.feedback.create({
      data: {
        customerLabel,
        channel,
        content,
        workspaceId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feedback added successfully",
        feedback,
      },
      { status: 201 }
    );
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

    const search = searchParams.get("search") || undefined;
    const sentiment = searchParams.get("sentiment") || undefined;
    const channel = searchParams.get("channel") || undefined;
    const theme = searchParams.get("theme") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: any = {
      workspaceId,
    };

    if (sentiment && sentiment !== "ALL") {
      where.sentiment = sentiment.toUpperCase();
    }

    if (channel && channel !== "ALL") {
      where.channel = channel;
    }

    if (theme && theme !== "ALL") {
      where.theme = theme;
    }

    if (status && status !== "ALL") {
      where.status = status.toUpperCase();
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      const searchConditions: any[] = [
        { customerLabel: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { theme: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];

      // Try to parse search string as a date to search across dates
      const parsedDate = Date.parse(search);
      if (!isNaN(parsedDate)) {
        const dateObj = new Date(parsedDate);
        if (dateObj.getFullYear() >= 1970) {
          const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
          const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
          searchConditions.push({
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            }
          });
        }
      }

      where.OR = searchConditions;
    }

    // Execute queries
    const [feedback, uniqueThemesResult] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.feedback.findMany({
        where: {
          workspaceId,
          theme: { not: null },
        },
        distinct: ["theme"],
        select: {
          theme: true,
        },
      }),
    ]);

    const themes = uniqueThemesResult
      .map((t) => t.theme)
      .filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      feedback,
      themes,
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