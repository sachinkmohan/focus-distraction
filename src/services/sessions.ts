import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { subHours } from 'date-fns';
import { db } from '@/config/firebase';
import type { Session, CreateSessionInput } from '@/types';
import { CHECKIN_BASE_LIMIT } from '@/utils/constants';
import { getTodayRange } from '@/utils/date';
import { getUserSettings } from './settings';

function sessionsRef(userId: string) {
  return collection(db, `users/${userId}/sessions`);
}

function toSession(id: string, data: Record<string, unknown>): Session {
  return {
    id,
    startTime: (data.startTime as Timestamp).toDate(),
    duration: data.duration as number,
    type: data.type as Session['type'],
    completed: data.completed as boolean,
    interrupted: (data.interrupted as boolean) || false,
    dismissed: (data.dismissed as boolean) || false,
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export async function createSession(
  userId: string,
  input: CreateSessionInput,
): Promise<{ sessionId: string; startTime: Date }> {
  const sessionDoc = doc(sessionsRef(userId));
  const now = new Date();

  await setDoc(sessionDoc, {
    startTime: Timestamp.fromDate(now),
    duration: input.duration,
    type: input.type,
    completed: false,
    interrupted: false,
    dismissed: false,
    completedAt: null,
    createdAt: serverTimestamp(),
  });

  return { sessionId: sessionDoc.id, startTime: now };
}

export async function completeSession(userId: string, sessionId: string): Promise<void> {
  const sessionDoc = doc(db, `users/${userId}/sessions/${sessionId}`);
  await updateDoc(sessionDoc, {
    completed: true,
    completedAt: serverTimestamp(),
  });
}

export async function cancelSession(userId: string, sessionId: string): Promise<void> {
  const sessionDoc = doc(db, `users/${userId}/sessions/${sessionId}`);
  await deleteDoc(sessionDoc);
}

export async function savePartialSession(
  userId: string,
  sessionId: string,
  elapsedSeconds: number,
): Promise<void> {
  const sessionDoc = doc(db, `users/${userId}/sessions/${sessionId}`);
  await updateDoc(sessionDoc, {
    duration: elapsedSeconds,
    completed: true,
    interrupted: true,
    completedAt: serverTimestamp(),
  });
}

export async function dismissSession(userId: string, sessionId: string): Promise<void> {
  const sessionDoc = doc(db, `users/${userId}/sessions/${sessionId}`);
  await updateDoc(sessionDoc, {
    dismissed: true,
  });
}

export async function canCheckIn(
  userId: string,
  intervalMinutes?: number,
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  minutesToNextBonus: number;
}> {
  const { start, end } = getTodayRange();
  const sessions = await querySessionsInRange(userId, start, end);

  const focusSeconds = sessions
    .filter((s) => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);

  const used = sessions.filter((s) => s.type === 'checkin').length;

  // If interval not provided, get from user settings
  let bonusInterval = intervalMinutes;
  if (!bonusInterval) {
    const settings = await getUserSettings(userId);
    bonusInterval = settings.checkinBonusInterval;
  }

  // Validate bonusInterval to prevent division by zero or invalid calculations
  if (!Number.isFinite(bonusInterval) || bonusInterval <= 0) {
    console.warn(
      `Invalid bonus interval detected for user ${userId}: ${bonusInterval}. Falling back to 30 minutes.`
    );
    bonusInterval = 30; // Safe fallback
  }

  const bonusIntervalSeconds = bonusInterval * 60;
  const bonuses = Math.floor(focusSeconds / bonusIntervalSeconds);
  const limit = CHECKIN_BASE_LIMIT + bonuses;

  // Calculate progress toward next bonus
  const focusMinutes = Math.floor(focusSeconds / 60);
  const progressInCurrentBonus = focusMinutes % bonusInterval;
  const minutesToNextBonus = bonusInterval - progressInCurrentBonus;

  return { allowed: used < limit, used, limit, minutesToNextBonus };
}

export async function createCheckin(userId: string): Promise<{ sessionId: string }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lockDoc = doc(db, `users/${userId}/locks/checkin-${today}`);

  // Use transaction with distributed lock to prevent race conditions
  const sessionId = await runTransaction(db, async (transaction) => {
    // Acquire lock atomically using transaction.get()
    const lockSnap = await transaction.get(lockDoc);

    if (lockSnap.exists()) {
      const lockData = lockSnap.data();
      const lockAge = Date.now() - lockData.timestamp;

      // If lock is held and fresh (< 5 seconds), reject
      if (lockAge < 5000) {
        throw new Error('Another check-in is in progress, please try again');
      }
      // Otherwise lock is stale, we can proceed
    }

    // Set lock
    transaction.set(lockDoc, {
      timestamp: Date.now(),
      userId,
    });

    // Query current sessions to check limit
    const { start, end } = getTodayRange();
    const q = query(
      sessionsRef(userId),
      where('completed', '==', true),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end)),
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map((d) => toSession(d.id, d.data()));

    // Calculate current usage and limit
    const focusSeconds = sessions
      .filter((s) => s.type === 'focus')
      .reduce((sum, s) => sum + s.duration, 0);
    const used = sessions.filter((s) => s.type === 'checkin').length;

    // Get bonus interval from settings
    const settings = await getUserSettings(userId);
    const bonusInterval = settings.checkinBonusInterval;
    const bonusIntervalSeconds = bonusInterval * 60;
    const bonuses = Math.floor(focusSeconds / bonusIntervalSeconds);
    const limit = CHECKIN_BASE_LIMIT + bonuses;

    // Check if under limit
    if (used >= limit) {
      throw new Error('Check-in limit reached for today');
    }

    // Create check-in document
    const sessionDoc = doc(sessionsRef(userId));
    const now = new Date();

    transaction.set(sessionDoc, {
      startTime: Timestamp.fromDate(now),
      duration: 0,
      type: 'checkin',
      completed: true,
      interrupted: false,
      dismissed: false,
      completedAt: Timestamp.fromDate(now),
      createdAt: serverTimestamp(),
    });

    return sessionDoc.id;
  });

  // Release lock after transaction completes
  try {
    await deleteDoc(lockDoc);
  } catch (error) {
    // Lock deletion is best-effort, stale locks auto-expire after 5s
    console.warn('Failed to release check-in lock:', error);
  }

  return { sessionId };
}

export async function addManualTime(
  userId: string,
  type: 'focus' | 'break',
  durationSeconds: number,
): Promise<void> {
  // Validate duration is positive
  if (durationSeconds <= 0) {
    throw new Error('Duration must be greater than zero');
  }

  const sessionDoc = doc(sessionsRef(userId));
  const now = new Date();

  await setDoc(sessionDoc, {
    startTime: Timestamp.fromDate(now),
    duration: durationSeconds,
    type,
    completed: true,
    interrupted: false,
    dismissed: true,
    completedAt: Timestamp.fromDate(now),
    createdAt: serverTimestamp(),
  });
}

export async function checkIncompleteSession(userId: string): Promise<
  | { status: 'none' }
  | { status: 'completed'; session: Session }
  | { status: 'resume'; remaining: number; session: Session }
> {
  const q = query(
    sessionsRef(userId),
    where('completed', '==', false),
    orderBy('startTime', 'desc'),
    limit(1),
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return { status: 'none' };

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  const startTime = (data.startTime as Timestamp).toDate();
  const elapsed = (Date.now() - startTime.getTime()) / 1000;

  const session = toSession(docSnap.id, data);

  if (elapsed >= data.duration) {
    await completeSession(userId, docSnap.id);
    return { status: 'completed', session: { ...session, completed: true } };
  }

  const remaining = Math.ceil(data.duration - elapsed);
  return { status: 'resume', remaining, session };
}

export async function checkRecentExceededSession(userId: string): Promise<
  | { status: 'none' }
  | { status: 'exceeded'; session: Session; exceededSeconds: number }
> {
  // Check for focus/break sessions completed in the last 2 hours (not interrupted)
  const twoHoursAgo = subHours(new Date(), 2);

  const q = query(
    sessionsRef(userId),
    where('completed', '==', true),
    where('type', 'in', ['focus', 'break', 'cooloff']),
    where('interrupted', '==', false),
    where('dismissed', '==', false),
    where('completedAt', '>=', Timestamp.fromDate(twoHoursAgo)),
    orderBy('completedAt', 'desc'),
    limit(1),
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return { status: 'none' };

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  const session = toSession(docSnap.id, data);

  if (!session.completedAt) return { status: 'none' };

  // Calculate how long ago the session ended (prevent negative values from clock skew)
  const exceededSeconds = Math.max(
    0,
    Math.floor((Date.now() - session.completedAt.getTime()) / 1000),
  );

  return { status: 'exceeded', session, exceededSeconds };
}

export async function querySessionsInRange(
  userId: string,
  start: Date,
  end: Date,
): Promise<Session[]> {
  const q = query(
    sessionsRef(userId),
    where('completed', '==', true),
    where('createdAt', '>=', Timestamp.fromDate(start)),
    where('createdAt', '<=', Timestamp.fromDate(end)),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toSession(d.id, d.data()));
}
