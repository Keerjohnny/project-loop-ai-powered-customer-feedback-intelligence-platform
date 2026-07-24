import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, workspace } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if workspace already exists
    let existingWorkspace = await prisma.workspace.findFirst({
      where: {
        name: workspace,
      },
    });

    // Default role
    let userRole: "ADMIN" | "VIEWER" = "VIEWER";

    // Create workspace if it doesn't exist
    if (!existingWorkspace) {
      existingWorkspace = await prisma.workspace.create({
        data: {
          name: workspace,
        },
      });

      // First user becomes ADMIN
      userRole = "ADMIN";
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: userRole,
        workspaceId: existingWorkspace.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          workspace: existingWorkspace.name,
        },
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