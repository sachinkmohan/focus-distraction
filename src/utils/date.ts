import { startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export function getTodayRange() {
  const now = new Date();
  return { start: startOfDay(now), end: endOfDay(now) };
}

export function getThisWeekRange() {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function getLast4WeeksRanges() {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  return Array.from({ length: 4 }, (_, i) => {
    const weekStart = subWeeks(thisWeekStart, i + 1);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return {
      start: weekStart,
      end: weekEnd,
      label: `Week of ${format(weekStart, 'MMM d')}-${format(weekEnd, 'MMM d')}`,
    };
  });
}
