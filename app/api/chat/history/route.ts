import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const history = await prisma.chatHistory.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      history,
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

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, question, answer } = await req.json();

    if (!workspaceId || !question || !answer) {
      return NextResponse.json({ success: false, message: "workspaceId, question and answer are required" }, { status: 400 });
    }

    const created = await prisma.chatHistory.create({ data: { workspaceId, question, answer } });

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
    }

    await prisma.chatHistory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}