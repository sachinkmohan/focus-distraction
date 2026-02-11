import { formatTimeAgo } from '@/utils/duration';

interface LastSessionActivityProps {
  lastFocus: Date | null;
  lastCooloff: Date | null;
  lastCheckin: Date | null;
  lastBreak: Date | null;
}

export function LastSessionActivity({
  lastFocus,
  lastCooloff,
  lastCheckin,
  lastBreak,
}: LastSessionActivityProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return <span className="text-gray-400">Not yet</span>;
    return <span className="text-gray-700">{formatTimeAgo(date)}</span>;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Last Session Activity
      </h3>
      <div className="text-sm leading-relaxed">
        <span className="text-green-600 font-medium">Focus:</span> {formatTime(lastFocus)}
        <span className="text-gray-300 mx-2">|</span>
        <span className="text-amber-600 font-medium">Cool-off:</span> {formatTime(lastCooloff)}
        <span className="text-gray-300 mx-2">|</span>
        <span className="text-indigo-600 font-medium">Check-in:</span> {formatTime(lastCheckin)}
        <span className="text-gray-300 mx-2">|</span>
        <span className="text-blue-600 font-medium">Break:</span> {formatTime(lastBreak)}
      </div>
    </div>
  );
}
