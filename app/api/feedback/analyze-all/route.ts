import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeFeedbackContent } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace ID is required",
        },
        { status: 400 }
      );
    }

    const feedbacks = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No feedback records to analyze.",
        count: 0,
      });
    }

    const updatedRecords = [];

    for (const feedback of feedbacks) {
      const analysis = await analyzeFeedbackContent(feedback.content);

      const updatedFeedback = await prisma.feedback.update({
        where: { id: feedback.id },
        data: analysis,
      });

      updatedRecords.push(updatedFeedback);
    }

    return NextResponse.json({
      success: true,
      message: "All feedback items analyzed.",
      count: updatedRecords.length,
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
