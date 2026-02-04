import { useState, useEffect } from 'react';

interface DurationPickerProps {
  onDurationSelect: (seconds: number) => void;
  disabled: boolean;
}

export function DurationPicker({ onDurationSelect, disabled }: DurationPickerProps) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  useEffect(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const total = h * 3600 + m * 60 + s;

    if (total > 0) {
      onDurationSelect(total);
    }
  }, [hours, minutes, seconds, onDurationSelect]);

  const handleNumberInput = (
    value: string,
    setter: (val: string) => void,
    max: number
  ) => {
    const num = value.replace(/[^0-9]/g, '');
    if (num === '') {
      setter('');
      return;
    }
    const parsed = parseInt(num);
    if (parsed > max) {
      setter(max.toString());
    } else {
      setter(parsed.toString());
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-600 text-center">Set Duration</label>
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <input
            type="text"
            inputMode="numeric"
            placeholder="00"
            value={hours}
            onChange={(e) => handleNumberInput(e.target.value, setHours, 23)}
            disabled={disabled}
            className="w-16 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:bg-gray-100 disabled:opacity-50"
          />
          <span className="text-xs text-gray-500 mt-1">hrs</span>
        </div>
        <span className="text-2xl font-bold text-gray-400 mb-5">:</span>
        <div className="flex flex-col items-center">
          <input
            type="text"
            inputMode="numeric"
            placeholder="00"
            value={minutes}
            onChange={(e) => handleNumberInput(e.target.value, setMinutes, 59)}
            disabled={disabled}
            className="w-16 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:bg-gray-100 disabled:opacity-50"
          />
          <span className="text-xs text-gray-500 mt-1">min</span>
        </div>
        <span className="text-2xl font-bold text-gray-400 mb-5">:</span>
        <div className="flex flex-col items-center">
          <input
            type="text"
            inputMode="numeric"
            placeholder="00"
            value={seconds}
            onChange={(e) => handleNumberInput(e.target.value, setSeconds, 59)}
            disabled={disabled}
            className="w-16 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:bg-gray-100 disabled:opacity-50"
          />
          <span className="text-xs text-gray-500 mt-1">sec</span>
        </div>
      </div>
    </div>
  );
}
