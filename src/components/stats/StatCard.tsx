import type { StatsSummary } from '@/services/stats';
import { formatHoursMinutes } from '@/utils/format';

interface StatCardProps {
  title: string;
  stats: StatsSummary;
}

export function StatCard({ title, stats }: StatCardProps) {
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
        </div>
        <div>
          <p className="text-xl font-bold text-blue-700">{formatHoursMinutes(stats.breakSeconds)}</p>
          <p className="text-xs text-gray-500">Break</p>
        </div>
      </div>
    </div>
  );
}
