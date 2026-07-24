export type DashboardCardData = {
  totalFeedback: number;
  positive: number;
  negative: number;
  neutral: number;
};

export type DashboardChannelStat = {
  channel: string;
  count: number;
};

export type DashboardThemeStat = {
  theme: string;
  count: number;
};

export type DashboardRecentFeedback = {
  id: string;
  content: string;
  channel: string;
  sentiment?: string | null;
  theme?: string | null;
  summary?: string | null;
  recommendation?: string | null;
  createdAt: string;
};

export type DashboardInsights = {
  summary: string;
  topTheme: string;
  topChannel: string;
  recentFeedbackCount: number;
  negativeFeedbackCount: number;
  recommendations: string[];
};

export async function buildDashboardInsights(
  cards: DashboardCardData,
  themes: DashboardThemeStat[],
  channels: DashboardChannelStat[],
  recentFeedback: DashboardRecentFeedback[]
): Promise<DashboardInsights> {
  const topTheme = themes[0]?.theme ?? "No themes yet";
  const topChannel = channels[0]?.channel ?? "No channels yet";
  const negativeFeedbackCount = recentFeedback.filter(
    (item) => item.sentiment === "NEGATIVE"
  ).length;
  const aiInsights = await generateDashboardAIInsights(recentFeedback);

  return {
    summary: aiInsights.summary,
    topTheme,
    topChannel,
    recentFeedbackCount: recentFeedback.length,
    negativeFeedbackCount,
    recommendations: aiInsights.recommendations,
  };
}
import { generateDashboardAIInsights } from "@/lib/ai";
