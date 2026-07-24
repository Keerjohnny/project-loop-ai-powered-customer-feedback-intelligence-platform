import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeFeedbackContent } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { feedbackId } = await req.json();

    if (!feedbackId) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback ID is required",
        },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findUnique({
      where: {
        id: feedbackId,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback not found",
        },
        { status: 404 }
      );
    }

    const analysis = await analyzeFeedbackContent(feedback.content);

    const updatedFeedback = await prisma.feedback.update({
      where: {
        id: feedback.id,
      },
      data: analysis,
    });

    return NextResponse.json({
      success: true,
      feedback: updatedFeedback,
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
