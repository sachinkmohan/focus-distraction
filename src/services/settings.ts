import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { DEFAULT_SETTINGS, CHECKIN_INTERVAL_OPTIONS } from '@/types/settings';
import type { UserSettings } from '@/types/settings';

function settingsRef(userId: string) {
  return doc(db, `users/${userId}/settings/data`);
}

/**
 * Get user settings. Returns default settings if none exist.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const snap = await getDoc(settingsRef(userId));
  if (!snap.exists()) {
    return DEFAULT_SETTINGS;
  }

  const data = snap.data();
  // Migrate stale intervals (e.g. 5, 10, 15) that are no longer valid options
  const storedInterval = data.checkinBonusInterval ?? DEFAULT_SETTINGS.checkinBonusInterval;
  const validInterval = (CHECKIN_INTERVAL_OPTIONS as readonly number[]).includes(storedInterval)
    ? storedInterval
    : DEFAULT_SETTINGS.checkinBonusInterval;

  // Persist corrected value if migration occurred
  const needsMigration = storedInterval !== validInterval;
  if (needsMigration) {
    await updateDoc(settingsRef(userId), {
      checkinBonusInterval: validInterval,
    });
  }

  return {
    checkinBonusInterval: validInterval as UserSettings['checkinBonusInterval'],
    settingsLocked: data.settingsLocked ?? DEFAULT_SETTINGS.settingsLocked,
  };
}

/**
 * Update specific settings fields. Merges with existing settings.
 */
export async function updateUserSettings(
  userId: string,
  updates: Partial<UserSettings>,
): Promise<UserSettings> {
  const settingsDocRef = settingsRef(userId);
  const snap = await getDoc(settingsDocRef);

  if (!snap.exists()) {
    // First time setting - use setDoc
    const newSettings = { ...DEFAULT_SETTINGS, ...updates };
    await setDoc(settingsDocRef, newSettings);
    return newSettings;
  } else {
    // Update existing - use updateDoc
    await updateDoc(settingsDocRef, updates);
    const updated = await getUserSettings(userId);
    return updated;
  }
}
