import { useState, useCallback } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useSession } from '@/hooks/useSession';
import { useRecentDurations } from '@/hooks/useRecentDurations';
import { BREAK_PRESETS } from '@/utils/constants';
import { DurationInput } from '@/components/timer/DurationInput';
import { QuickSelectButtons } from '@/components/timer/QuickSelectButtons';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControls } from '@/components/timer/TimerControls';

export function BreakTimerPage() {
  const timer = useTimer();
  const session = useSession();
  const { durations: recentDurations } = useRecentDurations();

  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const handleComplete = useCallback(
    async (sessionId: string) => {
      await session.endSession(sessionId);
    },
    [session],
  );

  const handleStart = async () => {
    if (!selectedDuration) return;

    const { sessionId, startTime } = await session.startSession(selectedDuration, 'break');
    timer.start(selectedDuration, 'break', sessionId, startTime, () =>
      handleComplete(sessionId),
    );
  };

  const handleStop = async () => {
    if (timer.state.sessionId) {
      await session.stopSession(timer.state.sessionId);
    }
    timer.stop();
    setSelectedDuration(null);
  };

  const isIdle = timer.state.status === 'idle';
  const isRunning = timer.state.status === 'running';

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-center text-lg font-semibold text-blue-700">Break Timer</h2>

      {/* Simple visual for break mode */}
      {isRunning && (
        <div className="flex items-center justify-center py-8">
          <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-4xl">☕</span>
          </div>
        </div>
      )}

      {isRunning && (
        <TimerDisplay
          remainingSeconds={timer.state.remainingSeconds}
          mode="break"
          startTime={timer.state.startTime}
          totalDuration={timer.state.totalDuration}
        />
      )}

      {isIdle && (
        <>
          <QuickSelectButtons
            presets={BREAK_PRESETS}
            recentDurations={recentDurations}
            onSelect={setSelectedDuration}
            disabled={false}
            variant="break"
          />
          <DurationInput onDurationSelect={setSelectedDuration} disabled={false} />
          {selectedDuration && (
            <p className="text-center text-sm text-gray-500">
              Selected: {Math.floor(selectedDuration / 60)} min
              {selectedDuration % 60 > 0 ? ` ${selectedDuration % 60}s` : ''}
            </p>
          )}
        </>
      )}

      <TimerControls
        status={timer.state.status}
        onStart={handleStart}
        onStop={handleStop}
        canStart={isIdle && selectedDuration !== null}
        mode="break"
      />
    </div>
  );
}
