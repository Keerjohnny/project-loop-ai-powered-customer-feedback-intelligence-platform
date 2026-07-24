import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const workspaceId = searchParams.get("workspaceId");
    const search = searchParams.get("search")?.trim() || "";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "8");

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace ID is required",
        },
        { status: 400 }
      );
    }

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 8 : Math.min(limit, 20);

    const where = {
      workspaceId,
      ...(search
        ? {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          generatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      count: reports.length,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / safeLimit)),
      currentPage: safePage,
      reports,
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