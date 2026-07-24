import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json(
        {
          success: false,
          message: "Report ID is required",
        },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
      include: {
        generatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 }
      );
    }

    const payload = {
      ...report,
      contentJson: report.contentJson,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=report-${report.id}.json`,
      },
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