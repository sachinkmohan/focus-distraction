import type { TimerStatus, TimerMode } from '@/types';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onStop: () => void;
  canStart: boolean;
  mode: TimerMode;
}

export function TimerControls({ status, onStart, onStop, canStart, mode }: TimerControlsProps) {
  if (status === 'running') {
    return (
      <button
        onClick={() => onStop()}
        className="w-full min-h-[48px] rounded-xl bg-red-500 px-6 py-3 text-lg font-semibold text-white hover:bg-red-600 active:bg-red-700"
      >
        Stop
      </button>
    );
  }

  const btnColor =
    mode === 'focus'
      ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
      : mode === 'cooloff'
        ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800';

  const btnLabel =
    mode === 'focus' ? 'Start Focus' : mode === 'cooloff' ? 'Start Cool Off' : 'Start Break';

  return (
    <button
      onClick={() => onStart()}
      disabled={!canStart}
      className={`w-full min-h-[48px] rounded-xl px-6 py-3 text-lg font-semibold text-white disabled:opacity-40 ${btnColor}`}
    >
      {btnLabel}
    </button>
  );
}
