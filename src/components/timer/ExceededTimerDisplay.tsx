import { formatCountdown, formatDurationLabel } from '@/utils/duration';
import { format } from 'date-fns';
import type { TimerMode } from '@/types';

interface ExceededTimerDisplayProps {
  completedAt: Date;
  exceededSeconds: number;
  duration: number;
  onDismiss: () => void;
  mode: TimerMode;
}

export function ExceededTimerDisplay({
  completedAt,
  exceededSeconds,
  duration,
  onDismiss,
  mode,
}: ExceededTimerDisplayProps) {
  const isFocus = mode === 'focus';

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {formatDurationLabel(duration)} {isFocus ? 'focus session' : 'break'} ended at
        </p>
        <p className="text-lg font-semibold text-gray-900">{format(completedAt, 'h:mm a')}</p>
      </div>

      <div className="text-center">
        <p className={`text-sm font-medium ${isFocus ? 'text-green-600' : 'text-red-600'}`}>
          {isFocus ? 'Session complete' : 'Time exceeded'}
        </p>
        <span
          className={`text-5xl font-light tabular-nums tracking-tight ${isFocus ? 'text-green-600' : 'text-red-600'}`}
        >
          +{formatCountdown(exceededSeconds)}
        </span>
      </div>

      <div
        role="alert"
        className={`mt-2 px-4 py-2 rounded-lg ${
          isFocus ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}
      >
        <p className={`text-xs text-center ${isFocus ? 'text-green-700' : 'text-red-700'}`}>
          <span aria-hidden="true">{isFocus ? '🎉' : '⚠️'}</span>{' '}
          {isFocus ? 'Great work! Time to take a break.' : 'Your break time is over'}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className={`w-full min-h-[48px] rounded-xl px-6 py-3 text-lg font-semibold text-white ${
          isFocus
            ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800'
        }`}
      >
        {isFocus ? 'Done' : 'Dismiss'}
      </button>
    </div>
  );
}
