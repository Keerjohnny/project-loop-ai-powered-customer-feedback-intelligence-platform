import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askGroq } from "@/lib/ai/provider";
import { buildChatPrompt } from "@/lib/ai/prompt";

const NO_FEEDBACK_MESSAGE = "No feedback available in this workspace.";

type ChatRequestBody = {
  message?: unknown;
  workspaceId?: unknown;
};

type FeedbackForChat = {
  customerLabel: string;
  channel: string;
  content: string;
  sentiment: string | null;
  theme: string | null;
  summary: string | null;
  recommendation: string | null;
  createdAt: Date;
};

function asText(value: string | null | undefined) {
  return value?.trim() || "Not provided";
}

function buildFeedbackContext(feedback: FeedbackForChat[]) {
  const positive = feedback.filter((item) => item.sentiment === "POSITIVE").length;
  const negative = feedback.filter((item) => item.sentiment === "NEGATIVE").length;
  const neutral = feedback.filter((item) => item.sentiment === "NEUTRAL").length;
  const themeCounts: Record<string, number> = {};
  const channelCounts: Record<string, number> = {};

  feedback.forEach((item) => {
    const theme = item.theme || "Unknown";
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;

    const channel = item.channel || "Unknown";
    channelCounts[channel] = (channelCounts[channel] || 0) + 1;
  });

  const topThemes =
    Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => `${theme} (${count})`)
      .join(", ") || "No themes available";

  const topChannels =
    Object.entries(channelCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => `${channel} (${count})`)
      .join(", ") || "No channels available";

  const complaints = feedback
    .filter((item) => item.sentiment === "NEGATIVE")
    .map((item) => `• ${item.content}`)
    .join("\n");

  const compliments = feedback
    .filter((item) => item.sentiment === "POSITIVE")
    .map((item) => `• ${item.content}`)
    .join("\n");

  const feedbackRows = feedback
    .map(
      (item, index) => `Feedback ${index + 1}
Customer: ${asText(item.customerLabel)}
Channel: ${asText(item.channel)}
Content: ${asText(item.content)}
Sentiment: ${asText(item.sentiment)}
Theme: ${asText(item.theme)}
Summary: ${asText(item.summary)}
Recommendation: ${asText(item.recommendation)}
Created At: ${item.createdAt.toISOString()}`
    )
    .join("\n\n");

  return `Workspace Feedback Statistics:
Total Feedback: ${feedback.length}
Positive Feedback: ${positive}
Negative Feedback: ${negative}
Neutral Feedback: ${neutral}

==============================
TOP THEMES
==============================

${topThemes}

==============================
CHANNELS
==============================

${topChannels}

==============================
COMMON COMPLAINTS
==============================

${complaints || "No complaints available."}

==============================
POSITIVE HIGHLIGHTS
==============================

${compliments || "No positive feedback available."}
==============================
ALL FEEDBACK RECORDS
==============================

${feedbackRows}`;
}

function buildSuccessResponse(answer: string) {
  return NextResponse.json({
    success: true,
    answer,
    result: {
      type: "summary",
      summary: answer,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const question = typeof body.message === "string" ? body.message.trim() : "";
    const workspaceId =
      typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";

    console.log("[Ask LOOP Chat] Received request", {
      workspaceId,
      question,
    });

    if (!question || !workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Message and workspaceId are required",
        },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        customerLabel: true,
        channel: true,
        content: true,
        sentiment: true,
        theme: true,
        summary: true,
        recommendation: true,
        createdAt: true,
      },
    });

    console.log("[Ask LOOP Chat] Feedback items retrieved", {
      workspaceId,
      count: feedback.length,
    });

    if (feedback.length === 0) {
      return buildSuccessResponse(NO_FEEDBACK_MESSAGE);
    }

    const feedbackContext = buildFeedbackContext(feedback);
    const prompt = buildChatPrompt(question, feedbackContext);

    console.log("[Ask LOOP Chat] Final Groq prompt");
    console.log(prompt);

    const rawAnswer = await askGroq(prompt);
    const answer = rawAnswer.trim();

    console.log("[Ask LOOP Chat] Groq raw response");
    console.log(rawAnswer);

    return buildSuccessResponse(answer || "Groq returned an empty response.");
  } catch (error) {
    console.error("[Ask LOOP Chat] Error", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to generate an answer right now.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Ask LOOP chat API is available. Send a POST request with message and workspaceId.",
  });
}
