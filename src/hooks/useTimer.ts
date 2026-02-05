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
  const onCompleteRef = useRef<(() => void) | null>(null);

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
        const now = new Date();
        setTimeout(() => onCompleteRef.current?.(), 0);

        // For both focus and break modes, continue ticking to show completion time
        return {
          ...prev,
          remainingSeconds: 0,
          status: 'exceeded',
          completedAt: now,
          exceededSeconds: 0,
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
    (duration: number, mode: TimerMode, sessionId: string, startTime: Date, onComplete: () => void) => {
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
      onComplete: () => void,
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
