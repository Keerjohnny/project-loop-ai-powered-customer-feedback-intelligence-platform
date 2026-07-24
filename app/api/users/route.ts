import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    const actingUserId = session?.userId;

    if (!actingUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
      },
    });

    if (!actingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        workspaceId: actingUser.workspaceId,
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        workspaceId: true,
      },
    });

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch users", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
