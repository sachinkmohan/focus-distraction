import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUserSettings, updateUserSettings } from '@/services/settings';
import type { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface UseSettingsReturn {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // Fall back to defaults on error
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error('Not authenticated');

      const updated = await updateUserSettings(user.uid, updates);
      setSettings(updated);
    },
    [user],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { settings, loading, updateSettings, refresh };
}
