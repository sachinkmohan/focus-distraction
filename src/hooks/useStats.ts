import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getTodayStats,
  getYesterdayStats,
  getThisWeekStats,
  getLast4WeeksStats,
} from '@/services/stats';
import type { StatsSummary } from '@/services/stats';

interface StatsState {
  today: StatsSummary | null;
  yesterday: StatsSummary | null;
  thisWeek: StatsSummary | null;
  last4Weeks: Array<{ label: string } & StatsSummary> | null;
  loading: boolean;
}

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsState>({
    today: null,
    yesterday: null,
    thisWeek: null,
    last4Weeks: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    setStats((prev) => ({ ...prev, loading: true }));

    const [today, yesterday, thisWeek, last4Weeks] = await Promise.all([
      getTodayStats(user.uid),
      getYesterdayStats(user.uid),
      getThisWeekStats(user.uid),
      getLast4WeeksStats(user.uid),
    ]);

    setStats({ today, yesterday, thisWeek, last4Weeks, loading: false });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...stats, refresh };
}
