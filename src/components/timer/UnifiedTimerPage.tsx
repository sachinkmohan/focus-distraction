import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useSession } from '@/hooks/useSession';
import { useRecentDurations } from '@/hooks/useRecentDurations';
import { useSettings } from '@/hooks/useSettings';
import { FOCUS_PRESETS, BREAK_PRESETS, COOLOFF_PRESETS } from '@/utils/constants';
import { CHECKIN_INTERVAL_OPTIONS, type CheckinBonusInterval } from '@/types/settings';
import { DurationPicker } from './DurationPicker';
import { QuickSelectButtons } from './QuickSelectButtons';
import { TimerDisplay } from './TimerDisplay';
import { ExceededTimerDisplay } from './ExceededTimerDisplay';
import { TimerControls } from './TimerControls';
import { TreeAnimation } from '@/components/tree/TreeAnimation';
import { UnlockSettingsModal } from '@/components/settings/UnlockSettingsModal';
import type { TimerMode } from '@/types';

export function UnifiedTimerPage() {
  const timer = useTimer();
  const session = useSession();
  const { durations: recentDurations } = useRecentDurations();
  const { settings, updateSettings } = useSettings();

  const [activeMode, setActiveMode] = useState<TimerMode>('focus');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [checkedIncomplete, setCheckedIncomplete] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
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

      // If no incomplete, check for recent focus/break sessions that exceeded
      const exceededResult = await session.checkRecentExceeded();
      if (exceededResult.status === 'exceeded') {
        const sessionType = exceededResult.session.type;
        setActiveMode(sessionType);
        setSelectedDuration(exceededResult.session.duration);

        // Set timer to exceeded state
        timer.setState({
          status: 'exceeded',
          mode: sessionType,
          totalDuration: exceededResult.session.duration,
          remainingSeconds: 0,
          sessionId: exceededResult.session.id,
          startTime: exceededResult.session.startTime,
          completedAt: exceededResult.session.completedAt,
          exceededSeconds: exceededResult.exceededSeconds,
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
      try {
        const status = await session.getCheckInStatus();
        if (!cancelled && status) {
          setCheckinStatus({
            used: status.used,
            limit: status.limit,
            minutesToNextBonus: status.minutesToNextBonus,
          });
        }
      } catch (error) {
        console.error('Failed to load check-in status:', error);
        // Reset to null on error to show a clean state
        if (!cancelled) {
          setCheckinStatus(null);
        }
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

  const handleCooloffQuickStart = async (duration: number) => {
    if (typeof duration !== 'number') return;
    setActiveMode('cooloff');
    setSelectedDuration(duration);

    const { sessionId, startTime } = await session.startSession(duration, 'cooloff');
    timer.start(duration, 'cooloff', sessionId, startTime, async () => {
      await session.endSession(sessionId);
    });
  };

  const handleStop = async () => {
    const wasCooloff = activeMode === 'cooloff';
    if (timer.state.sessionId) {
      await session.stopSession(timer.state.sessionId, timer.elapsedSeconds);
    }
    timer.stop();
    setSelectedDuration(null);
    if (wasCooloff) {
      setActiveMode('checkin');
    }
  };

  const [pickerKey, setPickerKey] = useState(0);

  const handleNewSession = () => {
    const wasCooloff = activeMode === 'cooloff';
    timer.reset();
    setSelectedDuration(null);
    setPickerKey(prev => prev + 1); // Force DurationPicker to reset
    if (wasCooloff) {
      setActiveMode('checkin');
    }
  };

  const handleDismissExceeded = async () => {
    if (timer.state.sessionId) {
      await session.dismissExceededSession(timer.state.sessionId);
    }
    handleNewSession();
  };

  const handleCheckIn = async () => {
    if (isCheckingIn) return; // Prevent double-clicks

    setIsCheckingIn(true);
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
      // TODO: Show user-friendly error message
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleIntervalChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newInterval = parseInt(event.target.value, 10) as CheckinBonusInterval;

    try {
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
    } catch (error) {
      console.error('Failed to update interval setting:', error);
      // TODO: Show user-friendly error message and revert dropdown
    }
  };

  const handleUnlockSettings = async () => {
    try {
      await updateSettings({ settingsLocked: false });
    } catch (error) {
      console.error('Failed to unlock settings:', error);
      throw error; // Re-throw so modal can display error
    }
  };

  const handleLockSettings = async () => {
    try {
      await updateSettings({ settingsLocked: true });
    } catch (error) {
      console.error('Failed to lock settings:', error);
    }
  };

  const handleModeSwitch = (mode: TimerMode) => {
    if (timer.state.status === 'running') return; // Can't switch during active timer
    setActiveMode(mode);
    setSelectedDuration(null);
  };

  const isIdle = timer.state.status === 'idle';
  const isRunning = timer.state.status === 'running';
  const isExceeded = timer.state.status === 'exceeded';
  const isFocus = activeMode === 'focus';
  const isCheckinTab = activeMode === 'checkin' || activeMode === 'cooloff';
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
            isCheckinTab
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
      ) : activeMode === 'cooloff' ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-32 w-32 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-4xl">❄️</span>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 py-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            {checkinStatus ? (
              <>
                <p className="text-lg font-bold text-gray-900">
                  {checkinStatus.used}/{checkinStatus.limit} <span className="text-sm font-normal text-gray-500">Check-ins Today</span>
                </p>
                <p className="text-xs text-indigo-600">
                  {checkinStatus.minutesToNextBonus} more min to earn next bonus
                </p>
                {/* Bonus Interval Dropdown with Lock */}
                <div className="mt-1">
                  <div className="relative">
                    <select
                      id="bonus-interval"
                      value={settings.checkinBonusInterval}
                      onChange={handleIntervalChange}
                      disabled={settings.settingsLocked}
                      className={`w-full min-h-[44px] px-3 py-2 pr-12 border border-gray-300 rounded-lg text-sm font-medium ${
                        settings.settingsLocked
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-70'
                          : 'bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    >
                      {CHECKIN_INTERVAL_OPTIONS.map((minutes) => (
                        <option key={minutes} value={minutes}>
                          Every {minutes} min
                        </option>
                      ))}
                    </select>
                    {/* Lock/Unlock toggle button */}
                    <button
                      onClick={settings.settingsLocked ? () => setShowUnlockModal(true) : handleLockSettings}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        settings.settingsLocked
                          ? 'text-gray-400 hover:text-gray-600'
                          : 'text-indigo-400 hover:text-indigo-600'
                      }`}
                      aria-label={settings.settingsLocked ? 'Unlock settings' : 'Lock settings'}
                    >
                      {settings.settingsLocked ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Loading check-in status...</p>
            )}
          </div>
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

      {/* Duration selection - visible when idle and NOT check-in/cooloff mode */}
      {isIdle && !isCheckinTab && (
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
      {!isExceeded && (
        activeMode === 'checkin' ? (
          <>
            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !!(checkinStatus && checkinStatus.used >= checkinStatus.limit)}
              className="w-full min-h-[48px] rounded-xl px-6 py-3 text-lg font-semibold text-white disabled:opacity-40 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed"
            >
              {isCheckingIn
                ? 'Checking In...'
                : checkinStatus && checkinStatus.used >= checkinStatus.limit
                  ? 'Daily Limit Reached'
                  : 'Check In'}
            </button>

            {/* Cool Off Timer Presets */}
            <div className="pt-2 mt-1">
              <p className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wide">Cool Off Timer</p>
              <QuickSelectButtons
                presets={COOLOFF_PRESETS}
                recentDurations={[]}
                onSelect={handleCooloffQuickStart}
                disabled={false}
                variant={'cooloff'}
              />
            </div>
          </>
        ) : activeMode === 'cooloff' ? (
          <TimerControls
            status={timer.state.status}
            onStart={handleStart}
            onStop={handleStop}
            canStart={false}
            mode={activeMode}
          />
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
      <UnlockSettingsModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={handleUnlockSettings}
      />
    </div>
  );
}
