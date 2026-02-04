import type { TimerStatus } from '@/types';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onStop: () => void;
  canStart: boolean;
  mode: 'focus' | 'break';
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

  const isFocus = mode === 'focus';

  return (
    <button
      onClick={() => onStart()}
      disabled={!canStart}
      className={`w-full min-h-[48px] rounded-xl px-6 py-3 text-lg font-semibold text-white disabled:opacity-40 ${
        isFocus
          ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
      }`}
    >
      {isFocus ? 'Start Focus' : 'Start Break'}
    </button>
  );
}
