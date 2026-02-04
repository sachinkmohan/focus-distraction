import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '@/hooks/useTimer';
import { useSession } from '@/hooks/useSession';
import { useRecentDurations } from '@/hooks/useRecentDurations';
import { FOCUS_PRESETS } from '@/utils/constants';
import { DurationInput } from './DurationInput';
import { QuickSelectButtons } from './QuickSelectButtons';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { SessionCompleteCard } from './SessionCompleteCard';
import { TreeAnimation } from '@/components/tree/TreeAnimation';

export function TimerPage() {
  const navigate = useNavigate();
  const timer = useTimer();
  const session = useSession();
  const { durations: recentDurations } = useRecentDurations();

  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [checkedIncomplete, setCheckedIncomplete] = useState(false);

  const handleComplete = useCallback(async () => {
    if (timer.state.sessionId) {
      await session.endSession(timer.state.sessionId);
    }
  }, [timer.state.sessionId, session]);

  // Check for incomplete sessions on mount
  useEffect(() => {
    if (checkedIncomplete) return;

    const check = async () => {
      const result = await session.checkIncomplete();
      if (result.status === 'resume') {
        timer.resume(
          result.remaining,
          result.session.duration,
          'focus',
          result.session.id,
          result.session.startTime,
          () => handleComplete(),
        );
        setSelectedDuration(result.session.duration);
      }
      setCheckedIncomplete(true);
    };

    check();
  }, [checkedIncomplete, session, timer, handleComplete]);

  const handleStart = async () => {
    if (!selectedDuration) return;

    const { sessionId, startTime } = await session.startSession(selectedDuration, 'focus');
    timer.start(selectedDuration, 'focus', sessionId, startTime, async () => {
      await session.endSession(sessionId);
    });
  };

  const handleStop = async () => {
    if (timer.state.sessionId) {
      await session.stopSession(timer.state.sessionId);
    }
    timer.stop();
    setSelectedDuration(null);
  };

  const handleNewSession = () => {
    timer.reset();
    setSelectedDuration(null);
  };

  const isIdle = timer.state.status === 'idle';
  const isRunning = timer.state.status === 'running';
  const isCompleted = timer.state.status === 'completed';

  return (
    <div className="flex flex-col gap-5">
      {/* Tree Animation */}
      <TreeAnimation
        elapsedSeconds={timer.elapsedSeconds}
        totalDuration={timer.state.totalDuration}
        status={timer.state.status}
      />

      {/* Timer Display - visible when running */}
      {isRunning && <TimerDisplay remainingSeconds={timer.state.remainingSeconds} mode="focus" />}

      {/* Completion card */}
      {isCompleted && selectedDuration && (
        <SessionCompleteCard
          duration={selectedDuration}
          mode="focus"
          onNewSession={handleNewSession}
        />
      )}

      {/* Duration selection - visible when idle */}
      {isIdle && (
        <>
          <QuickSelectButtons
            presets={FOCUS_PRESETS}
            recentDurations={recentDurations}
            onSelect={setSelectedDuration}
            disabled={false}
            variant="focus"
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

      {/* Controls */}
      {!isCompleted && (
        <TimerControls
          status={timer.state.status}
          onStart={handleStart}
          onStop={handleStop}
          canStart={isIdle && selectedDuration !== null}
          mode="focus"
        />
      )}

      {/* Break Timer Button - always visible */}
      <div className="border-t border-gray-200 pt-4 mt-2">
        <button
          onClick={() => navigate('/break')}
          className="w-full min-h-[44px] rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 active:bg-blue-200"
        >
          Take a Break
        </button>
      </div>
    </div>
  );
}
