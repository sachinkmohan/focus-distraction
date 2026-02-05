import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useSession } from '@/hooks/useSession';
import { useRecentDurations } from '@/hooks/useRecentDurations';
import { useSettings } from '@/hooks/useSettings';
import { FOCUS_PRESETS, BREAK_PRESETS } from '@/utils/constants';
import { CHECKIN_INTERVAL_OPTIONS } from '@/types/settings';
import { DurationPicker } from './DurationPicker';
import { QuickSelectButtons } from './QuickSelectButtons';
import { TimerDisplay } from './TimerDisplay';
import { ExceededTimerDisplay } from './ExceededTimerDisplay';
import { TimerControls } from './TimerControls';
import { SessionCompleteCard } from './SessionCompleteCard';
import { TreeAnimation } from '@/components/tree/TreeAnimation';
import type { TimerMode } from '@/types';

export function UnifiedTimerPage() {
  const timer = useTimer();
  const session = useSession();
  const { durations: recentDurations } = useRecentDurations();
  const { settings, updateSettings } = useSettings();

  const [activeMode, setActiveMode] = useState<TimerMode>('focus');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [checkedIncomplete, setCheckedIncomplete] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<{
    used: number;
    limit: number;
    minutesToNextBonus: number;
  } | null>(null);

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
  };

  const handleComplete = useCallback(async () => {
    if (timer.state.sessionId) {
      await session.endSession(timer.state.sessionId);
    }
  }, [timer.state.sessionId, session]);

  // Check for incomplete sessions and recent break sessions on mount
  useEffect(() => {
    if (checkedIncomplete) return;

    const check = async () => {
      // First check for incomplete sessions
      const incompleteResult = await session.checkIncomplete();
      if (incompleteResult.status === 'resume') {
        setActiveMode(incompleteResult.session.type);
        timer.resume(
          incompleteResult.remaining,
          incompleteResult.session.duration,
          incompleteResult.session.type,
          incompleteResult.session.id,
          incompleteResult.session.startTime,
          () => handleComplete(),
        );
        setSelectedDuration(incompleteResult.session.duration);
        setCheckedIncomplete(true);
        return;
      }

      // If no incomplete, check for recent break sessions that exceeded
      const breakResult = await session.checkRecentBreak();
      if (breakResult.status === 'exceeded') {
        setActiveMode('break');
        setSelectedDuration(breakResult.session.duration);

        // Set timer to exceeded state
        timer.setState({
          status: 'exceeded',
          mode: 'break',
          totalDuration: breakResult.session.duration,
          remainingSeconds: 0,
          sessionId: breakResult.session.id,
          startTime: breakResult.session.startTime,
          completedAt: breakResult.session.completedAt,
          exceededSeconds: breakResult.exceededSeconds,
        });
      }

      setCheckedIncomplete(true);
    };

    check();
  }, [checkedIncomplete, session, timer, handleComplete]);

  // Load check-in status when mode is 'checkin'
  useEffect(() => {
    if (activeMode !== 'checkin') return;

    let cancelled = false;

    const loadStatus = async () => {
      const status = await session.getCheckInStatus();
      if (!cancelled && status) {
        setCheckinStatus({
          used: status.used,
          limit: status.limit,
          minutesToNextBonus: status.minutesToNextBonus,
        });
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  const handleStart = async (duration?: number) => {
    const durationToUse = duration || selectedDuration;
    if (!durationToUse || typeof durationToUse !== 'number') return;

    // Clear exceeded state if present
    if (timer.state.status === 'exceeded') {
      timer.reset();
    }

    const { sessionId, startTime } = await session.startSession(durationToUse, activeMode);
    timer.start(durationToUse, activeMode, sessionId, startTime, async () => {
      await session.endSession(sessionId);
    });
  };

  const handleQuickStart = async (duration: number) => {
    if (typeof duration !== 'number') return;
    setSelectedDuration(duration);
    await handleStart(duration);
  };

  const handleStop = async () => {
    if (timer.state.sessionId) {
      await session.stopSession(timer.state.sessionId, timer.elapsedSeconds);
    }
    timer.stop();
    setSelectedDuration(null);
  };

  const [pickerKey, setPickerKey] = useState(0);

  const handleNewSession = () => {
    timer.reset();
    setSelectedDuration(null);
    setPickerKey(prev => prev + 1); // Force DurationPicker to reset
  };

  const handleDismissExceeded = async () => {
    if (timer.state.sessionId) {
      await session.dismissExceededSession(timer.state.sessionId);
    }
    handleNewSession();
  };

  const handleCheckIn = async () => {
    try {
      await session.checkIn();
      const status = await session.getCheckInStatus();
      if (status) {
        setCheckinStatus({
          used: status.used,
          limit: status.limit,
          minutesToNextBonus: status.minutesToNextBonus,
        });
      }
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleIntervalChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(event.target.value, 10);
    await updateSettings({ checkinBonusInterval: newInterval });

    // Refresh check-in status to show updated calculations
    const status = await session.getCheckInStatus();
    if (status) {
      setCheckinStatus({
        used: status.used,
        limit: status.limit,
        minutesToNextBonus: status.minutesToNextBonus,
      });
    }
  };

  const handleModeSwitch = (mode: TimerMode) => {
    if (timer.state.status === 'running') return; // Can't switch during active timer
    setActiveMode(mode);
    setSelectedDuration(null);
  };

  const isIdle = timer.state.status === 'idle';
  const isRunning = timer.state.status === 'running';
  const isCompleted = timer.state.status === 'completed';
  const isExceeded = timer.state.status === 'exceeded';
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
            activeMode === 'focus'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => handleModeSwitch('checkin')}
          disabled={isRunning}
          className={`flex-1 min-h-[44px] rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeMode === 'checkin'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
          }`}
        >
          Check-in
        </button>
        <button
          onClick={() => handleModeSwitch('break')}
          disabled={isRunning}
          className={`flex-1 min-h-[44px] rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeMode === 'break'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 disabled:opacity-50'
          }`}
        >
          Break
        </button>
      </div>

      {/* Visual Display */}
      {activeMode === 'focus' ? (
        <TreeAnimation
          elapsedSeconds={timer.elapsedSeconds}
          totalDuration={timer.state.totalDuration}
          status={timer.state.status}
        />
      ) : activeMode === 'break' ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-4xl">☕</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-32 w-32 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
          {checkinStatus && (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {checkinStatus.used}/{checkinStatus.limit}
              </p>
              <p className="text-sm text-gray-500">Check-ins Today</p>
              <p className="text-sm text-indigo-600 mt-2">
                {checkinStatus.minutesToNextBonus} more min to earn next bonus
              </p>

              {/* Bonus Interval Dropdown */}
              <div className="mt-4 w-full max-w-xs">
                <label htmlFor="bonus-interval" className="block text-xs text-gray-600 mb-1">
                  Earn bonus check-in every:
                </label>
                <select
                  id="bonus-interval"
                  value={settings.checkinBonusInterval}
                  onChange={handleIntervalChange}
                  className="w-full min-h-[44px] px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {CHECKIN_INTERVAL_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Timer Display - visible when running */}
      {isRunning && <TimerDisplay remainingSeconds={timer.state.remainingSeconds} mode={activeMode} />}

      {/* Exceeded Display - for timer after completion */}
      {isExceeded && timer.state.completedAt && (
        <ExceededTimerDisplay
          completedAt={timer.state.completedAt}
          exceededSeconds={timer.state.exceededSeconds}
          duration={timer.state.totalDuration}
          onDismiss={handleDismissExceeded}
          mode={timer.state.mode}
        />
      )}

      {/* Completion card */}
      {isCompleted && selectedDuration && (
        <SessionCompleteCard
          duration={selectedDuration}
          mode={activeMode}
          onNewSession={handleNewSession}
        />
      )}

      {/* Duration selection - visible when idle and NOT check-in mode */}
      {isIdle && activeMode !== 'checkin' && (
        <>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600 text-center">Quick Start</p>
            <QuickSelectButtons
              presets={presets}
              recentDurations={recentDurations}
              onSelect={handleQuickStart}
              disabled={false}
              variant={activeMode}
            />
          </div>
          <div className="border-t border-gray-200 pt-4">
            <DurationPicker key={pickerKey} onDurationSelect={handleDurationSelect} disabled={false} />
          </div>
          {selectedDuration && selectedDuration > 0 && (
            <p className="text-center text-sm text-gray-500">
              Selected: {Math.floor(selectedDuration / 60)} min
              {selectedDuration % 60 > 0 ? ` ${selectedDuration % 60}s` : ''}
            </p>
          )}
        </>
      )}

      {/* Controls */}
      {!isCompleted && !isExceeded && (
        activeMode === 'checkin' ? (
          <button
            onClick={handleCheckIn}
            disabled={!!(checkinStatus && checkinStatus.used >= checkinStatus.limit)}
            className="w-full min-h-[48px] rounded-xl px-6 py-3 text-lg font-semibold text-white disabled:opacity-40 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed"
          >
            {checkinStatus && checkinStatus.used >= checkinStatus.limit
              ? 'Daily Limit Reached'
              : 'Check In'}
          </button>
        ) : (
          <TimerControls
            status={timer.state.status}
            onStart={handleStart}
            onStop={handleStop}
            canStart={isIdle && selectedDuration !== null && selectedDuration > 0}
            mode={activeMode}
          />
        )
      )}
    </div>
  );
}
