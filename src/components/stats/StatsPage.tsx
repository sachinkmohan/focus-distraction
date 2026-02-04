import { useStats } from '@/hooks/useStats';
import { StatCard } from './StatCard';
import { useNavigate } from 'react-router-dom';

export function StatsPage() {
  const { today, thisWeek, last4Weeks, loading } = useStats();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-3 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Statistics</h2>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-green-600 hover:text-green-700"
        >
          Back to Timer
        </button>
      </div>

      {today && <StatCard title="Today" stats={today} />}
      {thisWeek && <StatCard title="This Week" stats={thisWeek} />}

      {last4Weeks && last4Weeks.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Previous Weeks
          </h3>
          {last4Weeks.map((week) => (
            <StatCard key={week.label} title={week.label} stats={week} />
          ))}
        </div>
      )}
    </div>
  );
}
