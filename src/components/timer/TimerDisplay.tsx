import { formatCountdown } from '@/utils/duration';
import { format, addSeconds } from 'date-fns';
import type { TimerMode } from '@/types';

interface TimerDisplayProps {
  remainingSeconds: number;
  mode: TimerMode;
  startTime?: Date | null;
  totalDuration?: number;
}

export function TimerDisplay({
  remainingSeconds,
  mode,
  startTime,
  totalDuration,
}: TimerDisplayProps) {
  const colorClass =
    mode === 'focus' ? 'text-green-700' : mode === 'cooloff' ? 'text-amber-700' : 'text-blue-700';

  const endTime = startTime && totalDuration ? addSeconds(startTime, totalDuration) : null;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <span className={`text-7xl font-light tabular-nums tracking-tight ${colorClass}`}>
        {formatCountdown(remainingSeconds)}
      </span>
      {startTime && endTime && (
        <div className="flex items-center gap-2 text-base text-gray-500 font-medium">
          <span>{format(startTime, 'h:mm a')}</span>
          <span>→</span>
          <span>{format(endTime, 'h:mm a')}</span>
        </div>
      )}
    </div>
  );
}
