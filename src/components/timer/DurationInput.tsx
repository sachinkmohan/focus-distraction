import { useState } from 'react';
import { parseDuration } from '@/utils/duration';

interface DurationInputProps {
  onDurationSelect: (seconds: number) => void;
  disabled: boolean;
}

export function DurationInput({ onDurationSelect, disabled }: DurationInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const seconds = parseDuration(value);
    if (!seconds) {
      setError('Enter a valid duration (e.g. 25:00 or 1:30:00)');
      return;
    }
    setError(null);
    onDurationSelect(seconds);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="mm:ss or hh:mm:ss"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-3 text-center text-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
        >
          Set
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
