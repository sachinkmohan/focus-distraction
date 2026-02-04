import { formatCountdown } from '@/utils/duration';

interface TimerDisplayProps {
  remainingSeconds: number;
  mode: 'focus' | 'break';
}

export function TimerDisplay({ remainingSeconds, mode }: TimerDisplayProps) {
  const colorClass = mode === 'focus' ? 'text-green-700' : 'text-blue-700';

  return (
    <div className="flex items-center justify-center py-4">
      <span className={`text-6xl font-light tabular-nums tracking-tight ${colorClass}`}>
        {formatCountdown(remainingSeconds)}
      </span>
    </div>
  );
}
