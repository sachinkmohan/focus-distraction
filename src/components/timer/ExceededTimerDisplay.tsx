import { formatCountdown, formatDurationLabel } from '@/utils/duration';
import { format } from 'date-fns';

interface ExceededTimerDisplayProps {
  completedAt: Date;
  exceededSeconds: number;
  duration: number;
  onDismiss: () => void;
}

export function ExceededTimerDisplay({ completedAt, exceededSeconds, duration, onDismiss }: ExceededTimerDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="text-center">
        <p className="text-sm text-gray-600">{formatDurationLabel(duration)} break ended at</p>
        <p className="text-lg font-semibold text-gray-900">
          {format(completedAt, 'h:mm a')}
        </p>
      </div>

      <div className="text-center">
        <p className="text-sm text-red-600 font-medium">Time exceeded</p>
        <span className="text-5xl font-light tabular-nums tracking-tight text-red-600">
          +{formatCountdown(exceededSeconds)}
        </span>
      </div>

      <div role="alert" className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-xs text-red-700 text-center">
          <span aria-hidden="true">⚠️</span> Your break time is over
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="w-full min-h-[48px] rounded-xl bg-gray-600 px-6 py-3 text-lg font-semibold text-white hover:bg-gray-700 active:bg-gray-800"
      >
        Dismiss
      </button>
    </div>
  );
}
