// User-specific application settings
export interface UserSettings {
  // Check-in bonus interval in minutes (not seconds)
  // Valid values: 10, 15, 20, 25, 30
  checkinBonusInterval: number;
}

// Default settings applied for new users or missing settings
export const DEFAULT_SETTINGS: UserSettings = {
  checkinBonusInterval: 30,
};

// Valid interval options for the dropdown
export const CHECKIN_INTERVAL_OPTIONS = [10, 15, 20, 25, 30] as const;
