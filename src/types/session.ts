export type SessionType = 'focus' | 'break';

export interface Session {
  id: string;
  startTime: Date;
  duration: number; // in seconds
  type: SessionType;
  completed: boolean;
  interrupted: boolean; // true if user stopped early
  dismissed: boolean; // true if exceeded warning was dismissed
  completedAt: Date | null;
  createdAt: Date;
}

export interface CreateSessionInput {
  duration: number;
  type: SessionType;
}
