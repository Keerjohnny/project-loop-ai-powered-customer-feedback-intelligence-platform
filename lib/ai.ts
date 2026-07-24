import { askGroq } from "@/lib/ai/provider";

export type FeedbackAnalysis = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  sentimentScore: number;
  theme: string;
  summary: string;
  recommendation: string;
};

export type InsightFeedbackInput = {
  customerLabel?: string | null;
  channel: string;
  content: string;
  sentiment?: string | null;
  theme?: string | null;
  summary?: string | null;
  recommendation?: string | null;
};

export type DashboardAIInsights = {
  summary: string;
  recommendations: string[];
};

export type ReportAIContent = {
  executiveSummary: string;
  keyFindings: string[];
  recommendedActions: string[];
};

const DEFAULT_ANALYSIS: FeedbackAnalysis = {
  sentiment: "NEUTRAL",
  sentimentScore: 0.5,
  theme: "General",
  summary: "No clear summary could be generated from this feedback.",
  recommendation: "Review the feedback manually before taking action.",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function extractJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Groq response did not contain a JSON object.");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return strings.length > 0 ? strings : fallback;
}

function normalizeSentiment(value: unknown): FeedbackAnalysis["sentiment"] {
  const sentiment = typeof value === "string" ? value.toUpperCase() : "";

  if (sentiment === "POSITIVE" || sentiment === "NEGATIVE" || sentiment === "NEUTRAL") {
    return sentiment;
  }

  return "NEUTRAL";
}

function normalizeScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);
  return Number.isFinite(score) ? clamp(score, 0, 1) : DEFAULT_ANALYSIS.sentimentScore;
}

function fallbackAnalyzeFeedback(content: string): FeedbackAnalysis {
  const text = content.trim();
  const lowerText = text.toLowerCase();

  const positiveSignals = [
    "excellent",
    "love",
    "great",
    "perfect",
    "useful",
    "informative",
    "recommend",
    "works perfectly",
    "works as expected",
    "easy to use",
    "clean",
    "happy",
    "good",
  ];
  const negativeSignals = [
    "never arrived",
    "delayed",
    "too long",
    "crashes",
    "unable",
    "slow",
    "very slowly",
    "does not work",
    "not working",
    "failed",
    "error",
    "problem",
    "issue",
    "bad",
  ];

  const positiveCount = positiveSignals.filter((signal) => lowerText.includes(signal)).length;
  const negativeCount = negativeSignals.filter((signal) => lowerText.includes(signal)).length;

  let sentiment: FeedbackAnalysis["sentiment"] = "NEUTRAL";
  let sentimentScore = 0.5;

  if (positiveCount > negativeCount) {
    sentiment = "POSITIVE";
    sentimentScore = positiveCount >= 2 ? 0.9 : 0.78;
  } else if (negativeCount > positiveCount) {
    sentiment = "NEGATIVE";
    sentimentScore = negativeCount >= 2 ? 0.12 : 0.22;
  }

  let theme = "General";
  if (lowerText.includes("password") || lowerText.includes("login") || lowerText.includes("sign in")) {
    theme = "Authentication";
  } else if (lowerText.includes("dashboard") || lowerText.includes("reports") || lowerText.includes("search")) {
    theme = "Product Experience";
  } else if (lowerText.includes("upload") || lowerText.includes("documents")) {
    theme = "File Upload";
  } else if (lowerText.includes("support") || lowerText.includes("respond")) {
    theme = "Customer Support";
  } else if (lowerText.includes("notification")) {
    theme = "Notifications";
  }

  const recommendation =
    sentiment === "NEGATIVE"
      ? `Investigate the ${theme.toLowerCase()} concern and prioritize a fix or follow-up.`
      : sentiment === "POSITIVE"
        ? `Continue strengthening the ${theme.toLowerCase()} experience customers are responding well to.`
        : "Review this feedback manually to decide whether action is needed.";

  return {
    sentiment,
    sentimentScore,
    theme,
    summary: text || DEFAULT_ANALYSIS.summary,
    recommendation,
  };
}

function formatFeedbackItems(feedback: InsightFeedbackInput[]) {
  if (feedback.length === 0) {
    return "No feedback records are available.";
  }

  return feedback
    .map(
      (item, index) => `Feedback ${index + 1}
Customer: ${item.customerLabel || "Not provided"}
Channel: ${item.channel || "Not provided"}
Content: ${item.content || "Not provided"}
Sentiment: ${item.sentiment || "Not analyzed"}
Theme: ${item.theme || "Not analyzed"}
Summary: ${item.summary || "Not analyzed"}
Recommendation: ${item.recommendation || "Not analyzed"}`
    )
    .join("\n\n");
}

export async function analyzeFeedbackContent(content: string): Promise<FeedbackAnalysis> {
  try {
    const prompt = `Analyze this customer feedback for Project LOOP.

Return ONLY valid JSON. Do not use markdown.
Use one of these exact sentiment values: POSITIVE, NEUTRAL, NEGATIVE.
Use sentimentScore from 0 to 1 where 0 is very negative, 0.5 is neutral, and 1 is very positive.

JSON shape:
{
  "sentiment": "POSITIVE",
  "sentimentScore": 0.92,
  "theme": "short theme name",
  "summary": "one sentence summary",
  "recommendation": "one actionable recommendation"
}

Feedback:
${content}`;

    const response = await askGroq(prompt);
    const parsed = extractJsonObject(response) as Partial<FeedbackAnalysis>;
    const fallback = fallbackAnalyzeFeedback(content);
    const sentiment = normalizeSentiment(parsed.sentiment);

    if (sentiment === "NEUTRAL" && fallback.sentiment !== "NEUTRAL") {
      return fallback;
    }

    return {
      sentiment,
      sentimentScore: normalizeScore(parsed.sentimentScore),
      theme: asString(parsed.theme, DEFAULT_ANALYSIS.theme),
      summary: asString(parsed.summary, DEFAULT_ANALYSIS.summary),
      recommendation: asString(parsed.recommendation, DEFAULT_ANALYSIS.recommendation),
    };
  } catch (error) {
    console.error("Groq feedback analysis failed:", error);

    return fallbackAnalyzeFeedback(content);
  }
}

export async function generateDashboardAIInsights(
  feedback: InsightFeedbackInput[]
): Promise<DashboardAIInsights> {
  if (feedback.length === 0) {
    return {
      summary: "No feedback has been captured yet. Add feedback to start seeing AI insights.",
      recommendations: ["Add feedback entries to unlock dashboard insights."],
    };
  }

  try {
    const prompt = `You are Project LOOP's dashboard insight assistant.

Using only the latest feedback below, return only valid JSON:
{
  "summary": "2 sentence executive dashboard insight",
  "recommendations": ["action 1", "action 2", "action 3"]
}

Do not invent facts outside the feedback.

Latest feedback:
${formatFeedbackItems(feedback)}`;

    const response = await askGroq(prompt);
    const parsed = extractJsonObject(response) as Partial<DashboardAIInsights>;

    return {
      summary: asString(parsed.summary, "The latest feedback is available, but Groq did not provide a summary."),
      recommendations: asStringArray(parsed.recommendations, [
        "Review recent feedback manually to identify next actions.",
      ]).slice(0, 3),
    };
  } catch (error) {
    console.error("Groq dashboard insights failed:", error);

    return {
      summary: "Recent feedback is available, but AI insights could not be generated right now.",
      recommendations: ["Review the latest feedback manually while AI insights are unavailable."],
    };
  }
}

export async function generateVoiceOfCustomerReport(
  feedback: InsightFeedbackInput[]
): Promise<ReportAIContent> {
  if (feedback.length === 0) {
    return {
      executiveSummary: "No feedback was captured in the selected period.",
      keyFindings: ["No customer feedback records were available for analysis."],
      recommendedActions: ["Collect more feedback before making customer experience decisions."],
    };
  }

  try {
    const prompt = `You are generating a Voice of Customer report for Project LOOP.

Using only the feedback below, return only valid JSON:
{
  "executiveSummary": "concise executive summary",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendedActions": ["action 1", "action 2", "action 3"]
}

Do not invent facts outside the feedback.

Feedback:
${formatFeedbackItems(feedback)}`;

    const response = await askGroq(prompt);
    const parsed = extractJsonObject(response) as Partial<ReportAIContent>;

    return {
      executiveSummary: asString(
        parsed.executiveSummary,
        "Groq could not generate an executive summary from the selected feedback."
      ),
      keyFindings: asStringArray(parsed.keyFindings, [
        "Review the selected feedback manually to identify key findings.",
      ]),
      recommendedActions: asStringArray(parsed.recommendedActions, [
        "Review the selected feedback manually before taking action.",
      ]),
    };
  } catch (error) {
    console.error("Groq Voice of Customer report failed:", error);

    return {
      executiveSummary: "AI report generation could not be completed right now.",
      keyFindings: ["Review the selected feedback manually to identify key findings."],
      recommendedActions: ["Retry report generation after confirming Groq is available."],
    };
  }
}
