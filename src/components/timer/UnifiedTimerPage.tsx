import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useSession } from '@/hooks/useSession';
import { useRecentDurations } from '@/hooks/useRecentDurations';
import { FOCUS_PRESETS, BREAK_PRESETS } from '@/utils/constants';
import { DurationInput } from './DurationInput';
import { QuickSelectButtons } from './QuickSelectButtons';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { SessionCompleteCard } from './SessionCompleteCard';
import { TreeAnimation } from '@/components/tree/TreeAnimation';
import type { TimerMode } from '@/types';

export function UnifiedTimerPage() {
  const timer = useTimer();
  const session = useSession();
  const { durations: recentDurations } = useRecentDurations();

  const [activeMode, setActiveMode] = useState<TimerMode>('focus');
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
        setActiveMode(result.session.type);
        timer.resume(
          result.remaining,
          result.session.duration,
          result.session.type,
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

    const { sessionId, startTime } = await session.startSession(selectedDuration, activeMode);
    timer.start(selectedDuration, activeMode, sessionId, startTime, async () => {
      await session.endSession(sessionId);
    });
  };

  const handleStop = async () => {
    if (timer.state.sessionId) {
      await session.stopSession(timer.state.sessionId, timer.elapsedSeconds);
    }
    timer.stop();
    setSelectedDuration(null);
  };

  const handleNewSession = () => {
    timer.reset();
    setSelectedDuration(null);
  };

  const handleModeSwitch = (mode: TimerMode) => {
    if (timer.state.status === 'running') return; // Can't switch during active timer
    setActiveMode(mode);
    setSelectedDuration(null);
  };

  const isIdle = timer.state.status === 'idle';
  const isRunning = timer.state.status === 'running';
  const isCompleted = timer.state.status === 'completed';
  const isFocus = activeMode === 'focus';
  const presets = isFocus ? FOCUS_PRESETS : BREAK_PRESETS;

  return (
    <div className="flex flex-col gap-5">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
        <button
          onClick={() => handleModeSwitch('focus')}
          disabled={isRunning}
          className={`flex-1 min-h-[44px] rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            isFocus
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
          }`}
        >
          Focus Timer
        </button>
        <button
          onClick={() => handleModeSwitch('break')}
          disabled={isRunning}
          className={`flex-1 min-h-[44px] rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            !isFocus
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
          }`}
        >
          Break Timer
        </button>
      </div>

      {/* Visual Display */}
      {isFocus ? (
        <TreeAnimation
          elapsedSeconds={timer.elapsedSeconds}
          totalDuration={timer.state.totalDuration}
          status={timer.state.status}
        />
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-4xl">☕</span>
          </div>
        </div>
      )}

      {/* Timer Display - visible when running */}
      {isRunning && <TimerDisplay remainingSeconds={timer.state.remainingSeconds} mode={activeMode} />}

      {/* Completion card */}
      {isCompleted && selectedDuration && (
        <SessionCompleteCard
          duration={selectedDuration}
          mode={activeMode}
          onNewSession={handleNewSession}
        />
      )}

      {/* Duration selection - visible when idle */}
      {isIdle && (
        <>
          <QuickSelectButtons
            presets={presets}
            recentDurations={recentDurations}
            onSelect={setSelectedDuration}
            disabled={false}
            variant={activeMode}
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
          mode={activeMode}
        />
      )}
    </div>
  );
}
