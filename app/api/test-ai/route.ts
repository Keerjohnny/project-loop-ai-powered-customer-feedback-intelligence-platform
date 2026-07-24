
import { NextResponse } from "next/server";
import { askGroq } from "@/lib/ai/provider";

export async function GET() {
  try {
    const answer = await askGroq(
      "Say Hello from Groq!"
    );

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("Groq Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
