import { prisma } from "@/lib/prisma";

export type ThemeTrendPeriod = 7 | 30 | 90;

export type ThemeTrendPoint = {
  date: string;
  count: number;
};

export type ThemeTrend = {
  theme: string;
  totalFeedback: number;
  previousPeriodCount: number;
  currentPeriodCount: number;
  percentageChange: number;
  trend: "up" | "down" | "flat";
  lineChart: ThemeTrendPoint[];
};

export type ThemeTrendFeedback = {
  id: string;
  customerLabel: string;
  channel: string;
  content: string;
  sentiment: string | null;
  theme: string | null;
  summary: string | null;
  recommendation: string | null;
  createdAt: string;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateKeys(start: Date, days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateKey(date);
  });
}

function normalizeTheme(theme: string | null) {
  return theme?.trim() || "Unknown";
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export function normalizeThemeTrendPeriod(value: string | null): ThemeTrendPeriod {
  const period = Number(value);

  if (period === 7 || period === 30 || period === 90) {
    return period;
  }

  return 30;
}

export async function getThemeTrends(
  workspaceId: string,
  periodDays: ThemeTrendPeriod,
  selectedTheme?: string | null
) {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - periodDays);

  const previousStart = new Date(currentStart);
  previousStart.setDate(currentStart.getDate() - periodDays);

  const [totalGroups, currentGroups, previousGroups, currentFeedback] =
    await Promise.all([
      prisma.feedback.groupBy({
        by: ["theme"],
        where: {
          workspaceId,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.feedback.groupBy({
        by: ["theme"],
        where: {
          workspaceId,
          createdAt: {
            gte: currentStart,
            lte: now,
          },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.feedback.groupBy({
        by: ["theme"],
        where: {
          workspaceId,
          createdAt: {
            gte: previousStart,
            lt: currentStart,
          },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.feedback.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: currentStart,
            lte: now,
          },
        },
        select: {
          theme: true,
          createdAt: true,
        },
      }),
    ]);

  const allThemes = new Set<string>();
  const totalCounts = new Map<string, number>();
  const currentCounts = new Map<string, number>();
  const previousCounts = new Map<string, number>();

  totalGroups.forEach((item) => {
    const theme = normalizeTheme(item.theme);
    allThemes.add(theme);
    totalCounts.set(theme, item._count._all);
  });

  currentGroups.forEach((item) => {
    const theme = normalizeTheme(item.theme);
    allThemes.add(theme);
    currentCounts.set(theme, item._count._all);
  });

  previousGroups.forEach((item) => {
    const theme = normalizeTheme(item.theme);
    allThemes.add(theme);
    previousCounts.set(theme, item._count._all);
  });

  const dateKeys = buildDateKeys(currentStart, periodDays);
  const dailyCountsByTheme = new Map<string, Map<string, number>>();

  currentFeedback.forEach((item) => {
    const theme = normalizeTheme(item.theme);
    const dateKey = toDateKey(item.createdAt);
    const counts = dailyCountsByTheme.get(theme) ?? new Map<string, number>();

    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
    dailyCountsByTheme.set(theme, counts);
  });

  const trends = Array.from(allThemes)
    .map<ThemeTrend>((theme) => {
      const currentPeriodCount = currentCounts.get(theme) ?? 0;
      const previousPeriodCount = previousCounts.get(theme) ?? 0;
      const change = percentageChange(currentPeriodCount, previousPeriodCount);

      return {
        theme,
        totalFeedback: totalCounts.get(theme) ?? 0,
        previousPeriodCount,
        currentPeriodCount,
        percentageChange: change,
        trend: change > 0 ? "up" : change < 0 ? "down" : "flat",
        lineChart: dateKeys.map((date) => ({
          date,
          count: dailyCountsByTheme.get(theme)?.get(date) ?? 0,
        })),
      };
    })
    .sort((a, b) => b.currentPeriodCount - a.currentPeriodCount || a.theme.localeCompare(b.theme));

  const selectedFeedback = selectedTheme
    ? await prisma.feedback.findMany({
        where: {
          workspaceId,
          ...(selectedTheme === "Unknown"
            ? {
                OR: [{ theme: null }, { theme: "" }],
              }
            : {
                theme: selectedTheme,
              }),
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          customerLabel: true,
          channel: true,
          content: true,
          sentiment: true,
          theme: true,
          summary: true,
          recommendation: true,
          createdAt: true,
        },
      })
    : [];

  return {
    periodDays,
    currentPeriod: {
      start: currentStart.toISOString(),
      end: now.toISOString(),
    },
    previousPeriod: {
      start: previousStart.toISOString(),
      end: currentStart.toISOString(),
    },
    trends,
    selectedFeedback: selectedFeedback.map((item): ThemeTrendFeedback => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
