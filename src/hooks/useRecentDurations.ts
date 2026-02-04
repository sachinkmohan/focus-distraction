import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getRecentDurations } from '@/services/templates';

export function useRecentDurations() {
  const { user } = useAuth();
  const [durations, setDurations] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDurations([]);
      setLoading(false);
      return;
    }
    getRecentDurations(user.uid)
      .then(setDurations)
      .finally(() => setLoading(false));
  }, [user]);

  return { durations, loading, setDurations };
}
