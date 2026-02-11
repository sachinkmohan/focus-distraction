import { useState, useEffect, useRef } from 'react';
import { useStats } from '@/hooks/useStats';
import { useSession } from '@/hooks/useSession';
import { StatCard } from './StatCard';
import { LastSessionActivity } from './LastSessionActivity';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export function StatsPage() {
  const { today, yesterday, thisWeek, last4Weeks, loading, refresh } = useStats();
  const session = useSession();
  const navigate = useNavigate();

  // State for last session times
  const [lastSessions, setLastSessions] = useState<{
    focus: Date | null;
    cooloff: Date | null;
    checkin: Date | null;
    break: Date | null;
  } | null>(null);

  // Track if we've already fetched last sessions (to prevent re-fetching on every render)
  const hasFetchedLastSessions = useRef(false);

  const handleAddFocusTime = async () => {
    try {
      const result = await session.addManualTime('focus', 300); // 5 minutes
      await refresh();

      // Immediately update last session time without fetching
      setLastSessions((prev) => ({
        ...prev,
        focus: result.createdAt,
      }));

      toast.success('+5m focus added', { autoClose: 1000, position: 'top-center' });
    } catch (error) {
      console.error('Failed to add focus time:', error);
      toast.error('Failed to add focus time', { autoClose: 2000, position: 'top-center' });
    }
  };

  const handleAddBreakTime = async () => {
    try {
      const result = await session.addManualTime('break', 300); // 5 minutes
      await refresh();

      // Immediately update last session time without fetching
      setLastSessions((prev) => ({
        ...prev,
        break: result.createdAt,
      }));

      toast.info('+5m break added', { autoClose: 1000, position: 'top-center' });
    } catch (error) {
      console.error('Failed to add break time:', error);
      toast.error('Failed to add break time', { autoClose: 2000, position: 'top-center' });
    }
  };

  const handleAddCooloffTime = async () => {
    try {
      const result = await session.addManualTime('cooloff', 300); // 5 minutes
      await refresh();

      // Immediately update last session time without fetching
      setLastSessions((prev) => ({
        ...prev,
        cooloff: result.createdAt,
      }));

      toast.info('+5m cool-off added', { autoClose: 1000, position: 'top-center' });
    } catch (error) {
      console.error('Failed to add cool-off time:', error);
      toast.error('Failed to add cool-off time', { autoClose: 2000, position: 'top-center' });
    }
  };

  // Fetch last sessions on initial load (only once)
  useEffect(() => {
    const fetchLastSessions = async () => {
      if (loading || hasFetchedLastSessions.current) return;

      try {
        const all = await session.getAllLastSessions();
        if (all) {
          setLastSessions(all);
          hasFetchedLastSessions.current = true;
        }
      } catch (error) {
        console.error('Failed to fetch last sessions:', error);
      }
    };

    fetchLastSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // Only run when loading changes (intentionally not including session)

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

      {/* Last Session Activity - shows when you last did each session type */}
      {lastSessions && (
        <LastSessionActivity
          lastFocus={lastSessions.focus}
          lastCooloff={lastSessions.cooloff}
          lastCheckin={lastSessions.checkin}
          lastBreak={lastSessions.break}
        />
      )}

      {/* Today stats card with +5m buttons */}
      {today && (
        <StatCard
          title="Today"
          stats={today}
          onAddFocusTime={handleAddFocusTime}
          onAddBreakTime={handleAddBreakTime}
          onAddCooloffTime={handleAddCooloffTime}
        />
      )}
      {yesterday && <StatCard title="Yesterday" stats={yesterday} />}
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
