export type TimerStatus = 'idle' | 'running' | 'exceeded';
export type TimerMode = 'focus' | 'break' | 'checkin' | 'cooloff';
export type AnimationPhase = 'seed' | 'sprouting' | 'growing' | 'complete';

export interface TimerState {
  status: TimerStatus;
  mode: TimerMode;
  totalDuration: number;
  remainingSeconds: number;
  sessionId: string | null;
  startTime: Date | null;
  completedAt: Date | null; // When the timer reached 0
  exceededSeconds: number; // Seconds past the end time (for break timer)
}
