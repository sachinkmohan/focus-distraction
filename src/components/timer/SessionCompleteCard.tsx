import { useNavigate } from 'react-router-dom';
import { formatDurationLabel } from '@/utils/duration';
import type { TimerMode } from '@/types';

interface SessionCompleteCardProps {
  duration: number;
  mode: TimerMode;
  onNewSession: () => void;
}

export function SessionCompleteCard({ duration, mode, onNewSession }: SessionCompleteCardProps) {
  const navigate = useNavigate();
  const isFocus = mode === 'focus';

  return (
    <div className={`rounded-2xl p-6 text-center ${isFocus ? 'bg-green-50' : 'bg-blue-50'}`}>
      <h2 className={`text-xl font-bold ${isFocus ? 'text-green-700' : 'text-blue-700'}`}>
        Session Complete!
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {isFocus ? 'You focused for' : 'You took a break for'} {formatDurationLabel(duration)}.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={onNewSession}
          className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          New Session
        </button>
        <button
          onClick={() => navigate('/stats')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          View Stats
        </button>
      </div>
    </div>
  );
}
