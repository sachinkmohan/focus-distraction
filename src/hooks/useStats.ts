import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getTodayStats,
  getThisWeekStats,
  getLast4WeeksStats,
} from '@/services/stats';
import type { StatsSummary } from '@/services/stats';

interface StatsState {
  today: StatsSummary | null;
  thisWeek: StatsSummary | null;
  last4Weeks: Array<{ label: string } & StatsSummary> | null;
  loading: boolean;
}

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsState>({
    today: null,
    thisWeek: null,
    last4Weeks: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    setStats((prev) => ({ ...prev, loading: true }));

    const [today, thisWeek, last4Weeks] = await Promise.all([
      getTodayStats(user.uid),
      getThisWeekStats(user.uid),
      getLast4WeeksStats(user.uid),
    ]);

    setStats({ today, thisWeek, last4Weeks, loading: false });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...stats, refresh };
}
