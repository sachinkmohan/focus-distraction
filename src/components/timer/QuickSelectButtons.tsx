import { formatDurationLabel } from '@/utils/duration';
import type { TimerMode } from '@/types';

interface QuickSelectButtonsProps {
  presets: number[];
  recentDurations: number[];
  onSelect: (seconds: number) => void;
  disabled: boolean;
  variant: TimerMode;
}

export function QuickSelectButtons({
  presets,
  recentDurations,
  onSelect,
  disabled,
  variant,
}: QuickSelectButtonsProps) {
  const isFocus = variant === 'focus';
  const btnClass = isFocus
    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-200'
    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200';

  const filteredRecent = recentDurations.filter((d) => !presets.includes(d));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((duration) => (
          <button
            key={duration}
            onClick={() => onSelect(duration)}
            disabled={disabled}
            className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${btnClass}`}
          >
            {formatDurationLabel(duration)}
          </button>
        ))}
      </div>
      {filteredRecent.length > 0 && (
        <>
          <p className="text-xs text-gray-400">Recent</p>
          <div className="flex flex-wrap gap-2">
            {filteredRecent.map((duration) => (
              <button
                key={duration}
                onClick={() => onSelect(duration)}
                disabled={disabled}
                className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${btnClass}`}
              >
                {formatDurationLabel(duration)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
