import type { StatsSummary } from '@/services/stats';
import { formatHoursMinutes } from '@/utils/format';

interface StatCardProps {
  title: string;
  stats: StatsSummary;
  onAddFocusTime?: () => void;
  onAddBreakTime?: () => void;
}

export function StatCard({ title, stats, onAddFocusTime, onAddBreakTime }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{stats.sessionsCompleted}</p>
          <p className="text-xs text-gray-500">Sessions</p>
        </div>
        <div>
          <p className="text-xl font-bold text-green-700">{formatHoursMinutes(stats.focusSeconds)}</p>
          <p className="text-xs text-gray-500">Focus</p>
          {onAddFocusTime && (
            <button
              onClick={onAddFocusTime}
              className="mt-1 min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
            >
              +5m
            </button>
          )}
        </div>
        <div>
          <p className="text-xl font-bold text-blue-700">{formatHoursMinutes(stats.breakSeconds)}</p>
          <p className="text-xs text-gray-500">Break</p>
          {onAddBreakTime && (
            <button
              onClick={onAddBreakTime}
              className="mt-1 min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            >
              +5m
            </button>
          )}
        </div>
      </div>
      {/* Cool Off & Check-in stats */}
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-xl font-bold text-amber-700">{formatHoursMinutes(stats.cooloffSeconds)}</p>
          <p className="text-xs text-gray-500">Cool Off</p>
          {stats.daysInPeriod > 1 && stats.cooloffSeconds > 0 && (
            <p className="text-xs text-amber-600">
              ~{formatHoursMinutes(Math.round(stats.cooloffSeconds / stats.daysInPeriod))} / day
            </p>
          )}
        </div>
        <div>
          <p className="text-xl font-bold text-indigo-700">
            {stats.checkinsUsed}
            {stats.checkinsAllowed !== undefined && `/${stats.checkinsAllowed}`}
          </p>
          <p className="text-xs text-gray-500">Check-ins</p>
        </div>
      </div>
    </div>
  );
}
