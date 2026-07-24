"use client";

import { useEffect, useState } from "react";


import StatCard from "@/components/dashboard/StatCard";
import SentimentChart from "@/components/dashboard/SentimentChart";
import ChannelChart from "@/components/dashboard/ChannelChart";
import ThemeChart from "@/components/dashboard/ThemeChart";
import ThemeTrendsChart from "@/components/dashboard/ThemeTrendsChart";
import AIInsights from "@/components/dashboard/AIInsights";
import RecentFeedback from "@/components/dashboard/RecentFeedback";
import QuickActions from "@/components/dashboard/QuickActions";


type DashboardCards = {
  totalFeedback: number;
  positive: number;
  negative: number;
  neutral: number;
};

type DashboardChannelStat = {
  channel: string;
  count: number;
};

type DashboardThemeStat = {
  theme: string;
  count: number;
};

type DashboardRecentFeedback = {
  id: string;
  content: string;
  channel: string;
  sentiment?: string | null;
  theme?: string | null;
  summary?: string | null;
  recommendation?: string | null;
  createdAt: string;
};

type DashboardInsights = {
  summary: string;
  topTheme: string;
  topChannel: string;
  recentFeedbackCount: number;
  negativeFeedbackCount: number;
  recommendations: string[];
};

type ThemeTrend = {
  theme: string;
  totalFeedback: number;
  previousPeriodCount: number;
  currentPeriodCount: number;
  percentageChange: number;
  trend: "up" | "down" | "flat";
};

export default function DashboardPage() {
  const [cards, setCards] = useState<DashboardCards>({
    totalFeedback: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
  });
  const [channels, setChannels] = useState<DashboardChannelStat[]>([]);
  const [themes, setThemes] = useState<DashboardThemeStat[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<DashboardRecentFeedback[]>([]);
  const [themeTrends, setThemeTrends] = useState<ThemeTrend[]>([]);
  const [insights, setInsights] = useState<DashboardInsights>({
    summary: "Loading dashboard data...",
    topTheme: "No themes yet",
    topChannel: "No channels yet",
    recentFeedbackCount: 0,
    negativeFeedbackCount: 0,
    recommendations: [],
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const workspaceId = parsedUser?.workspaceId || parsedUser?.workspace?.id;

    if (!workspaceId) return;

    async function loadDashboard() {
      try {
        const res = await fetch(`/api/dashboard?workspaceId=${workspaceId}`);
        const data = await res.json();

        if (data.success) {
          setCards(data.cards || {
            totalFeedback: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
          });
          setChannels(data.channels || []);
          setThemes(data.themes || []);
          setRecentFeedback(data.recentFeedback || []);
          setThemeTrends(data.themeTrends || []);
          setInsights(data.insights || {
            summary: "No feedback has been captured yet.",
            topTheme: "No themes yet",
            topChannel: "No channels yet",
            recentFeedbackCount: 0,
            negativeFeedbackCount: 0,
            recommendations: ["Add feedback to unlock dashboard insights."],
          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadDashboard();
    const interval = window.setInterval(loadDashboard, 10000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Feedback" value={cards.totalFeedback} />
        <StatCard title="Positive" value={cards.positive} />
        <StatCard title="Negative" value={cards.negative} />
        <StatCard title="Neutral" value={cards.neutral} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SentimentChart positive={cards.positive} negative={cards.negative} neutral={cards.neutral} />
        </div>
        <AIInsights insights={insights} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChannelChart data={channels} />
        <ThemeChart data={themes} />
      </div>

      <div className="mt-6">
        <ThemeTrendsChart data={themeTrends} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <RecentFeedback items={recentFeedback} />
        <QuickActions />
      </div>
    </div>
  );
}
