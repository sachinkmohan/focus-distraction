import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerState, TimerMode } from '@/types';
import { TIMER_TICK_INTERVAL } from '@/utils/constants';

const INITIAL_STATE: TimerState = {
  status: 'idle',
  mode: 'focus',
  totalDuration: 0,
  remainingSeconds: 0,
  sessionId: null,
  startTime: null,
  completedAt: null,
  exceededSeconds: 0,
};

export function useTimer() {
  const [state, setState] = useState<TimerState>(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<((completedAt: Date) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      if ((prev.status !== 'running' && prev.status !== 'exceeded') || !prev.startTime) return prev;

      const elapsed = (Date.now() - prev.startTime.getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(prev.totalDuration - elapsed));

      if (remaining <= 0 && prev.status === 'running') {
        // Use startTime + duration as the canonical end time.
        // This handles backgrounded/throttled intervals correctly: if the tick
        // fires late (e.g. user returns to app), we don't record "now" as the
        // completion time — we record when the timer was actually supposed to end.
        const completedAt = new Date(prev.startTime.getTime() + prev.totalDuration * 1000);
        const exceededSeconds = Math.max(0, Math.floor((Date.now() - completedAt.getTime()) / 1000));
        setTimeout(() => onCompleteRef.current?.(completedAt), 0);

        return {
          ...prev,
          remainingSeconds: 0,
          status: 'exceeded',
          completedAt,
          exceededSeconds,
        };
      }

      // If in exceeded state (timer completed, showing elapsed time since completion)
      if (prev.status === 'exceeded' && prev.completedAt) {
        const exceeded = Math.floor((Date.now() - prev.completedAt.getTime()) / 1000);
        return { ...prev, exceededSeconds: exceeded };
      }

      return { ...prev, remainingSeconds: remaining };
    });
  }, []);

  const start = useCallback(
    (duration: number, mode: TimerMode, sessionId: string, startTime: Date, onComplete: (completedAt: Date) => void) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onCompleteRef.current = onComplete;

      setState({
        status: 'running',
        mode,
        totalDuration: duration,
        remainingSeconds: duration,
        sessionId,
        startTime,
        completedAt: null,
        exceededSeconds: 0,
      });

      intervalRef.current = setInterval(tick, TIMER_TICK_INTERVAL);
    },
    [tick],
  );

  const resume = useCallback(
    (
      remaining: number,
      totalDuration: number,
      mode: TimerMode,
      sessionId: string,
      originalStartTime: Date,
      onComplete: (completedAt: Date) => void,
    ) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onCompleteRef.current = onComplete;

      setState({
        status: 'running',
        mode,
        totalDuration,
        remainingSeconds: remaining,
        sessionId,
        startTime: originalStartTime,
        completedAt: null,
        exceededSeconds: 0,
      });

      intervalRef.current = setInterval(tick, TIMER_TICK_INTERVAL);
    },
    [tick],
  );

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    onCompleteRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    onCompleteRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const setTimerState = useCallback((newState: TimerState) => {
    setState(newState);
    // If setting to exceeded state, start the interval
    if (newState.status === 'exceeded') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, TIMER_TICK_INTERVAL);
    }
  }, [tick]);

  const elapsedSeconds = state.totalDuration - state.remainingSeconds;
  const progress = state.totalDuration > 0 ? elapsedSeconds / state.totalDuration : 0;

  return { state, start, resume, stop, reset, setState: setTimerState, elapsedSeconds, progress };
}
