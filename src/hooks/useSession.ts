import { useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createSession,
  completeSession,
  cancelSession,
  savePartialSession,
  checkIncompleteSession,
  checkRecentBreakSession,
} from '@/services/sessions';
import { addRecentDuration } from '@/services/templates';
import type { SessionType } from '@/types';
import { FOCUS_PRESETS, BREAK_PRESETS } from '@/utils/constants';

export function useSession() {
  const { user } = useAuth();

  const startSession = useCallback(
    async (duration: number, type: SessionType) => {
      if (!user) throw new Error('Not authenticated');
      const result = await createSession(user.uid, { duration, type });

      const presets = type === 'focus' ? FOCUS_PRESETS : BREAK_PRESETS;
      if (!presets.includes(duration)) {
        await addRecentDuration(user.uid, duration);
      }

      return result;
    },
    [user],
  );

  const endSession = useCallback(
    async (sessionId: string) => {
      if (!user) throw new Error('Not authenticated');
      await completeSession(user.uid, sessionId);
    },
    [user],
  );

  const stopSession = useCallback(
    async (sessionId: string, elapsedSeconds?: number) => {
      if (!user) throw new Error('Not authenticated');
      if (elapsedSeconds && elapsedSeconds > 0) {
        await savePartialSession(user.uid, sessionId, elapsedSeconds);
      } else {
        await cancelSession(user.uid, sessionId);
      }
    },
    [user],
  );

  const checkIncomplete = useCallback(async () => {
    if (!user) return { status: 'none' as const };
    return checkIncompleteSession(user.uid);
  }, [user]);

  const checkRecentBreak = useCallback(async () => {
    if (!user) return { status: 'none' as const };
    return checkRecentBreakSession(user.uid);
  }, [user]);

  return { startSession, endSession, stopSession, checkIncomplete, checkRecentBreak };
}
