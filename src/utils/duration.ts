import { differenceInSeconds } from 'date-fns';

export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(':').map(Number);
  if (parts.some(isNaN) || parts.length === 0 || parts.length > 3) return null;

  let totalSeconds: number;
  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  } else {
    totalSeconds = parts[0];
  }

  return totalSeconds > 0 ? totalSeconds : null;
}

export function formatDurationLabel(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * Returns null if date is null
 * Uses date-fns for safe date arithmetic and clamps negative values (future dates) to zero
 */
export function formatTimeAgo(date: Date | null): string | null {
  if (!date) return null;

  // Use date-fns for safe date arithmetic
  const diff = Math.max(0, differenceInSeconds(new Date(), date)); // Clamp negative to 0

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
