import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { MAX_RECENT_DURATIONS } from '@/utils/constants';

function recentDurationsRef(userId: string) {
  return doc(db, `users/${userId}/templates/recentDurations`);
}

export async function getRecentDurations(userId: string): Promise<number[]> {
  const snap = await getDoc(recentDurationsRef(userId));
  if (!snap.exists()) return [];
  return (snap.data().durations as number[]) ?? [];
}

export async function addRecentDuration(userId: string, duration: number): Promise<number[]> {
  const existing = await getRecentDurations(userId);
  const filtered = existing.filter((d) => d !== duration);
  const updated = [duration, ...filtered].slice(0, MAX_RECENT_DURATIONS);
  await setDoc(recentDurationsRef(userId), { durations: updated });
  return updated;
}
