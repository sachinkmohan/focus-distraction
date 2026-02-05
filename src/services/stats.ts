import type { Session } from '@/types';
import { querySessionsInRange } from './sessions';
import { getTodayRange, getThisWeekRange, getLast4WeeksRanges } from '@/utils/date';
import { CHECKIN_BASE_LIMIT } from '@/utils/constants';
import { getUserSettings } from './settings';

export interface StatsSummary {
  sessionsCompleted: number;
  focusSeconds: number;
  breakSeconds: number;
  checkinsUsed: number;
  checkinsAllowed?: number;
}

function summarize(sessions: Session[]): StatsSummary {
  // Only count focus sessions that were completed fully (not interrupted)
  const completedFocusSessions = sessions.filter(
    (s) => s.type === 'focus' && !s.interrupted
  );

  // But include ALL sessions (interrupted or not) for time tracking
  const focusSeconds = sessions
    .filter((s) => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);
  const breakSeconds = sessions
    .filter((s) => s.type === 'break')
    .reduce((sum, s) => sum + s.duration, 0);
  const checkinsUsed = sessions.filter((s) => s.type === 'checkin').length;

  return {
    sessionsCompleted: completedFocusSessions.length,
    focusSeconds,
    breakSeconds,
    checkinsUsed,
  };
}

export async function getCheckinsAllowed(
  userId: string,
  intervalMinutes?: number,
): Promise<number> {
  const { start, end } = getTodayRange();
  const sessions = await querySessionsInRange(userId, start, end);

  const focusSeconds = sessions
    .filter((s) => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);

  // If interval not provided, get from user settings
  let bonusInterval = intervalMinutes;
  if (!bonusInterval) {
    const settings = await getUserSettings(userId);
    bonusInterval = settings.checkinBonusInterval;
  }

  const bonusIntervalSeconds = bonusInterval * 60;
  const bonuses = Math.floor(focusSeconds / bonusIntervalSeconds);
  return CHECKIN_BASE_LIMIT + bonuses;
}

export async function getTodayStats(userId: string): Promise<StatsSummary> {
  const { start, end } = getTodayRange();
  const sessions = await querySessionsInRange(userId, start, end);
  const summary = summarize(sessions);
  summary.checkinsAllowed = await getCheckinsAllowed(userId);
  return summary;
}

export async function getYesterdayStats(userId: string): Promise<StatsSummary> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { start, end } = getTodayRange();
  const yesterdayStart = new Date(start);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(end);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

  const sessions = await querySessionsInRange(userId, yesterdayStart, yesterdayEnd);
  return summarize(sessions);
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
