import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

const allowedRoles = ["ANALYST", "VIEWER"] as const;

type UserRole = (typeof allowedRoles)[number];

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && allowedRoles.includes(value as UserRole);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const body = await req.json().catch(() => ({}));
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

    if (!body.role || !isValidRole(body.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role. Expected one of: ANALYST, VIEWER",
        },
        { status: 400 }
      );
    }

    const actingUser = await prisma.user.findUnique({
      where: { id: actingUserId },
      select: {
        id: true,
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

    if (actingUser.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: only admins can update roles",
        },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        role: true,
        workspaceId: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (targetUser.id === actingUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Admins cannot change their own role",
        },
        { status: 403 }
      );
    }

    if (targetUser.workspaceId !== actingUser.workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: user does not belong to your workspace",
        },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role: body.role as Role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update user role", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
