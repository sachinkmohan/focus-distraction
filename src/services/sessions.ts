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
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Session, CreateSessionInput } from '@/types';
import { CHECKIN_BASE_LIMIT } from '@/utils/constants';
import { getTodayRange } from '@/utils/date';

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

export async function canCheckIn(userId: string): Promise<{
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
  const bonuses = Math.floor(focusSeconds / 1800); // 1800 = 30 min in seconds
  const limit = CHECKIN_BASE_LIMIT + bonuses;

  // Calculate progress toward next bonus
  const focusMinutes = Math.floor(focusSeconds / 60);
  const progressInCurrentBonus = focusMinutes % 30; // 0-29 minutes
  const minutesToNextBonus = 30 - progressInCurrentBonus;

  return { allowed: used < limit, used, limit, minutesToNextBonus };
}

export async function createCheckin(userId: string): Promise<{ sessionId: string }> {
  const { allowed } = await canCheckIn(userId);
  if (!allowed) {
    throw new Error('Check-in limit reached for today');
  }

  const sessionDoc = doc(sessionsRef(userId));
  const now = new Date();

  await setDoc(sessionDoc, {
    startTime: Timestamp.fromDate(now),
    duration: 0,
    type: 'checkin',
    completed: true,
    interrupted: false,
    dismissed: false,
    completedAt: Timestamp.fromDate(now),
    createdAt: serverTimestamp(),
  });

  return { sessionId: sessionDoc.id };
}

export async function addManualTime(
  userId: string,
  type: 'focus' | 'break',
  durationSeconds: number,
): Promise<void> {
  const sessionDoc = doc(sessionsRef(userId));
  const now = new Date();

  await setDoc(sessionDoc, {
    startTime: Timestamp.fromDate(now),
    duration: durationSeconds,
    type,
    completed: true,
    interrupted: false,
    dismissed: false,
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

export async function checkRecentBreakSession(userId: string): Promise<
  | { status: 'none' }
  | { status: 'exceeded'; session: Session; exceededSeconds: number }
> {
  // Check for break sessions completed in the last 2 hours (not interrupted)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const q = query(
    sessionsRef(userId),
    where('completed', '==', true),
    where('type', '==', 'break'),
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

  // Calculate how long ago the break ended (prevent negative values from clock skew)
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
