// Valid interval options for the dropdown
export const CHECKIN_INTERVAL_OPTIONS = [10, 15, 20, 25, 30] as const;

// Derive the type from the valid options for compile-time type safety
export type CheckinBonusInterval = typeof CHECKIN_INTERVAL_OPTIONS[number];

// User-specific application settings
export interface UserSettings {
  // Check-in bonus interval in minutes (not seconds)
  // Valid values are enforced at compile time via CheckinBonusInterval type
  checkinBonusInterval: CheckinBonusInterval;
}

// Default settings applied for new users or missing settings
export const DEFAULT_SETTINGS: UserSettings = {
  checkinBonusInterval: 30,
};
