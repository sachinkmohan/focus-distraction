import type { Session } from '@/types';
import { querySessionsInRange } from './sessions';
import { getTodayRange, getThisWeekRange, getLast4WeeksRanges } from '@/utils/date';

export interface StatsSummary {
  sessionsCompleted: number;
  focusSeconds: number;
  breakSeconds: number;
}

function summarize(sessions: Session[]): StatsSummary {
  // Only count sessions that were completed fully (not interrupted)
  const completedSessions = sessions.filter((s) => !s.interrupted);

  // But include ALL sessions (interrupted or not) for time tracking
  const focusSeconds = sessions
    .filter((s) => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);
  const breakSeconds = sessions
    .filter((s) => s.type === 'break')
    .reduce((sum, s) => sum + s.duration, 0);

  return {
    sessionsCompleted: completedSessions.length,
    focusSeconds,
    breakSeconds,
  };
}

export async function getTodayStats(userId: string): Promise<StatsSummary> {
  const { start, end } = getTodayRange();
  return summarize(await querySessionsInRange(userId, start, end));
}

export async function getThisWeekStats(userId: string): Promise<StatsSummary> {
  const { start, end } = getThisWeekRange();
  return summarize(await querySessionsInRange(userId, start, end));
}

export async function getLast4WeeksStats(
  userId: string,
): Promise<Array<{ label: string } & StatsSummary>> {
  const ranges = getLast4WeeksRanges();
  return Promise.all(
    ranges.map(async (range) => ({
      label: range.label,
      ...summarize(await querySessionsInRange(userId, range.start, range.end)),
    })),
  );
}
