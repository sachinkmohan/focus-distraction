export type TimerStatus = 'idle' | 'running' | 'completed';
export type TimerMode = 'focus' | 'break';
export type AnimationPhase = 'seed' | 'sprouting' | 'growing' | 'complete';

export interface TimerState {
  status: TimerStatus;
  mode: TimerMode;
  totalDuration: number;
  remainingSeconds: number;
  sessionId: string | null;
  startTime: Date | null;
}
