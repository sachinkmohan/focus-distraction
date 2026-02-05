export type TimerStatus = 'idle' | 'running' | 'completed' | 'exceeded';
export type TimerMode = 'focus' | 'break' | 'checkin';
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
