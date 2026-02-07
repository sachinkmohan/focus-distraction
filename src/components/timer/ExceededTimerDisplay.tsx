import { formatCountdown, formatDurationLabel } from '@/utils/duration';
import { format } from 'date-fns';
import type { TimerMode } from '@/types';

interface ExceededTimerDisplayProps {
  startTime: Date;
  completedAt: Date;
  exceededSeconds: number;
  duration: number;
  onDismiss: () => void;
  mode: TimerMode;
}

export function ExceededTimerDisplay({
  startTime,
  completedAt,
  exceededSeconds,
  duration,
  onDismiss,
  mode,
}: ExceededTimerDisplayProps) {
  const config =
    mode === 'focus'
      ? {
          label: 'focus session',
          statusText: 'Session complete',
          statusColor: 'text-green-600',
          alertBg: 'bg-green-50 border border-green-200',
          alertText: 'text-green-700',
          emoji: '🎉',
          message: 'Great work! Time to take a break.',
          buttonBg: 'bg-green-600 hover:bg-green-700 active:bg-green-800',
          buttonText: 'Done',
        }
      : mode === 'cooloff'
        ? {
            label: 'cool off',
            statusText: 'Cool off complete',
            statusColor: 'text-amber-600',
            alertBg: 'bg-amber-50 border border-amber-200',
            alertText: 'text-amber-700',
            emoji: '❄️',
            message: 'Cool off period is over. Ready to refocus?',
            buttonBg: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
            buttonText: 'Dismiss',
          }
        : {
            label: 'break',
            statusText: 'Time exceeded',
            statusColor: 'text-red-600',
            alertBg: 'bg-red-50 border border-red-200',
            alertText: 'text-red-700',
            emoji: '⚠️',
            message: 'Your break time is over',
            buttonBg: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800',
            buttonText: 'Dismiss',
          };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {formatDurationLabel(duration)} {config.label}
        </p>
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-900">
          <span>{format(startTime, 'h:mm a')}</span>
          <span className="text-gray-400 font-normal">→</span>
          <span>{format(completedAt, 'h:mm a')}</span>
        </div>
      </div>

      <div className="text-center">
        <p className={`text-sm font-medium ${config.statusColor}`}>
          {config.statusText}
        </p>
        <span
          className={`text-5xl font-light tabular-nums tracking-tight ${config.statusColor}`}
        >
          +{formatCountdown(exceededSeconds)}
        </span>
      </div>

      <div
        role="alert"
        className={`mt-2 px-4 py-2 rounded-lg ${config.alertBg}`}
      >
        <p className={`text-xs text-center ${config.alertText}`}>
          <span aria-hidden="true">{config.emoji}</span>{' '}
          {config.message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className={`w-full min-h-[48px] rounded-xl px-6 py-3 text-lg font-semibold text-white ${config.buttonBg}`}
      >
        {config.buttonText}
      </button>
    </div>
  );
}
