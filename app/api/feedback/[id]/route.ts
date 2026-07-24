import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET one feedback
export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: {
        id,
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

    return NextResponse.json({
      success: true,
      feedback,
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

// UPDATE feedback
export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const {
      customerLabel,
      channel,
      content,
    } = body;

    const feedback = await prisma.feedback.update({
      where: {
        id,
      },
      data: {
        customerLabel,
        channel,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Update failed",
      },
      { status: 500 }
    );
  }
}

// DELETE feedback
export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    await prisma.feedback.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Delete failed",
      },
      { status: 500 }
    );
  }
}