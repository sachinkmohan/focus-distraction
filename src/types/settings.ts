// Valid interval options for the dropdown (restricted to enforce discipline)
export const CHECKIN_INTERVAL_OPTIONS = [30, 45] as const;

// Derive the type from the valid options for compile-time type safety
export type CheckinBonusInterval = (typeof CHECKIN_INTERVAL_OPTIONS)[number];

// Passphrase required to unlock settings (self-discipline barrier, not security)
export const UNLOCK_PASSPHRASE = 'iamweakandcantfocuswithoutchangingthis';

// User-specific application settings
export interface UserSettings {
  // Check-in bonus interval in minutes (not seconds)
  // Valid values are enforced at compile time via CheckinBonusInterval type
  checkinBonusInterval: CheckinBonusInterval;
  // Whether the check-in settings dropdown is locked
  settingsLocked: boolean;
}

// Default settings applied for new users or missing settings
export const DEFAULT_SETTINGS: UserSettings = {
  checkinBonusInterval: 30,
  settingsLocked: true,
};
