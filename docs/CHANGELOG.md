# Changelog

## 2026-02-05 - Update 6: Configurable Check-in Bonus Interval

### Features Added

**User-Configurable Check-in Interval**
- Added settings dropdown in Check-in mode
- Choose bonus interval: 10, 15, 20, 25, or 30 minutes
- Setting persisted per user in Firestore
- Real-time recalculation of bonuses and progress
- Default: 30 minutes (maintains current behavior for existing users)

### How It Works

**Customizing Your Bonus Interval:**
1. Navigate to Check-in mode
2. Find dropdown below "minutes to earn next bonus"
3. Select your preferred interval from 10-30 minutes
4. Progress and bonus calculations update immediately

**Example Impact:**
- **10 min interval**: 60 min focus → 6 bonuses → 9 total check-ins (3 base + 6)
- **15 min interval**: 60 min focus → 4 bonuses → 7 total check-ins (3 base + 4)
- **20 min interval**: 60 min focus → 3 bonuses → 6 total check-ins (3 base + 3)
- **25 min interval**: 60 min focus → 2 bonuses → 5 total check-ins (3 base + 2)
- **30 min interval**: 60 min focus → 2 bonuses → 5 total check-ins (3 base + 2)

**Why This Matters:**
- Shorter intervals = more frequent bonuses = better for rapid check-in cycles
- Longer intervals = fewer bonuses = works well with extended focus sessions
- Customize to match your personal work style

### Improvements

- **Fixed hardcoded bug**: `canCheckIn()` had `1800` hardcoded instead of using constant
- **Dynamic calculations**: All bonus and progress calculations now use user setting
- **Settings infrastructure**: Created reusable settings system for future preferences

### Technical

**New Infrastructure:**
- Created `UserSettings` type with `checkinBonusInterval` field
- Added `services/settings.ts` with `getUserSettings()` and `updateUserSettings()`
- Created `useSettings()` hook following existing patterns
- Firestore storage: `users/{userId}/settings/data`

**Service Updates:**
- `canCheckIn()` now accepts optional `intervalMinutes` parameter
- `getCheckinsAllowed()` loads interval from user settings
- Progress calculation uses dynamic modulo arithmetic

**Files Created:**
- `src/types/settings.ts` - Settings type definitions and constants
- `src/services/settings.ts` - Firestore settings service
- `src/hooks/useSettings.ts` - Settings React hook

**Files Modified:**
- `src/types/index.ts` - Added settings export
- `src/services/sessions.ts` - Dynamic interval in canCheckIn(), fixed hardcoded 1800
- `src/services/stats.ts` - Dynamic interval in getCheckinsAllowed()
- `src/components/timer/UnifiedTimerPage.tsx` - Added interval dropdown UI

### Migration Notes

- No database migration required
- Existing users automatically default to 30 minutes
- Settings document created only when user first changes interval
- Zero breaking changes to existing functionality

---

## 2026-02-05 - Update 5: Check-ins Feature & Stats Improvements

### Features Added

1. **Check-ins Mode**
   - Added third timer mode alongside Focus and Break
   - Instant action button (no timer countdown)
   - Base daily limit: 3 check-ins
   - Bonus system: +1 check-in per 30 minutes of focus time
   - Progress indicator showing minutes to next bonus check-in
   - Stats integration across all time periods

2. **Focus Timer Completion Display**
   - Focus timers now show completion time (like break timers)
   - Displays when the session ended (e.g., "Focus ended at 2:30 PM")
   - Shows time elapsed since completion
   - Green styling for celebration ("Great work! Time to take a break.")

3. **Manual Time Increment**
   - Added +5m buttons on Today's stats card
   - Quick way to add 5 minutes of focus or break time
   - Useful for sessions done outside the app
   - Automatically refreshes stats after adding time

4. **Yesterday Stats Card**
   - New stats card between Today and This Week
   - Easy day-to-day comparison
   - Shows all metrics: Sessions, Focus, Break, Check-ins

### Improvements

- **Fixed session count logic**: Only completed focus sessions count toward "Sessions" metric
  - Breaks and check-ins have their own separate metrics
  - More intuitive and semantically clear
- **Removed misleading denominators**: Weekly/historical check-in stats now show just count (e.g., "15 check-ins" instead of "15/21")
  - Today still shows "X/Y" format with actual daily allowance
- **Fixed infinite Firestore requests**: Resolved continuous polling on check-in page

### How It Works

**Check-ins:**
- Start with 3 check-ins per day
- Complete 30 minutes of focus → earn +1 bonus check-in
- Complete 60 minutes → +2 bonus check-ins (total: 5/5 available)
- Progress indicator: "15 more min to earn next bonus"

**Stats Display:**
- **Sessions**: Only completed focus sessions
- **Focus**: All focus time (including interrupted)
- **Break**: All break time (including interrupted)
- **Check-ins**: Count of instant check-in actions

### Technical

- Extended `TimerMode` and `SessionType` to include 'checkin'
- Added `canCheckIn()` and `createCheckin()` to sessions service
- Check-ins stored as sessions with `duration: 0`
- Added `getYesterdayStats()` for historical comparison
- Updated `ExceededTimerDisplay` with mode-specific styling
- Added `addManualTime()` service for manual time entry
- Fixed useEffect dependency array to prevent infinite loops

### Files Modified
- `src/types/timer.ts` - Extended TimerMode type
- `src/types/session.ts` - Extended SessionType type
- `src/utils/constants.ts` - Added check-in constants
- `src/services/sessions.ts` - Added check-in and manual time functions
- `src/services/stats.ts` - Added yesterday stats, updated session counting
- `src/hooks/useSession.ts` - Added check-in and manual time methods
- `src/hooks/useStats.ts` - Added yesterday to state and fetch
- `src/components/timer/UnifiedTimerPage.tsx` - Added check-in mode UI
- `src/components/timer/ExceededTimerDisplay.tsx` - Added mode-specific styling
- `src/components/stats/StatCard.tsx` - Added manual time buttons, removed denominators
- `src/components/stats/StatsPage.tsx` - Added yesterday card display

---

## 2026-02-04 - Update 4: Cross-Device Exceeded Time Tracking

### Features Added
- **Exceeded time now works across devices!**
- When a break timer ends, the completion time is saved to Firestore
- Any device checking within 2 hours will see the exceeded timer
- Switch from desktop to phone and see the same exceeded state

### How It Works:
1. Set 5-minute break on desktop at 3:00 PM
2. Timer ends at 3:05 PM (saved to database)
3. Switch to phone at 3:10 PM
4. Phone loads and sees: "Break ended at 3:05 PM" + "Time exceeded: +05:00"
5. Timer continues counting exceeded time on phone

### Technical:
- Added `checkRecentBreakSession()` to query completed breaks from last 2 hours
- Timer state can be restored from database on any device
- Added Firestore composite index: `completed + type + interrupted + completedAt`
- Exceeded timer continues ticking after being restored
- Works for up to 2 hours after break completion

### Important:
**Deploy the new Firestore index:**
```bash
npx firebase-tools deploy --only firestore:indexes
```
(Already deployed if you see this message)

---

## 2026-02-04 - Update 3: Duration Picker & Exceeded Time Tracking

### Features Added
1. **New Duration Picker**
   - Replaced text input with number-based picker
   - Three separate inputs: Hours, Minutes, Seconds
   - Direct number entry with constraints (hrs: 0-23, min/sec: 0-59)
   - Large, touch-friendly inputs for mobile
   - Auto-calculates total duration

2. **Break Timer Exceeded Tracking**
   - When break timer ends, shows completion time (e.g., "Break ended at 3:05 PM")
   - Continues counting UP after timer ends to show exceeded time
   - Exceeded time displays in RED to indicate you're over the break limit
   - Timer keeps running even if you close the tab and come back
   - Shows warning: "⚠️ Your break time is over"

### How It Works:

**Duration Picker:**
- Enter hours: 0-23
- Enter minutes: 0-59
- Enter seconds: 0-59
- Example: 1h 30m 0s = 90-minute timer

**Exceeded Timer (Break mode only):**
- Set 5-minute break at 3:00 PM
- Timer ends at 3:05 PM
- Close the app, come back at 3:08 PM
- See: "Break ended at 3:05 PM" + "Time exceeded: +03:00" (in red)

### Technical:
- Added `exceeded` status to TimerStatus type
- Added `completedAt` and `exceededSeconds` to TimerState
- Break timer continues ticking after completion
- Focus timer still stops normally at completion
- Created `ExceededTimerDisplay` component
- Created `DurationPicker` component

---

## 2026-02-04 - Update 2: Session Count Logic

### Changed
- **Session counting now only includes fully completed sessions**
- Interrupted/stopped sessions still save time for stats but don't increment session count
- Added `interrupted` field to Session type to track partial completions

### How it works:
- Complete a full session → Session count +1, time tracked ✅
- Stop early → Session count unchanged, elapsed time tracked ✅

### Technical:
- Added `interrupted: boolean` field to Session interface
- Updated `savePartialSession()` to mark sessions as interrupted
- Modified `summarize()` to filter out interrupted sessions from count
- Time tracking still includes all sessions (interrupted or not)

---

## 2026-02-04 - Unified Timer & Enhanced Stats

### Features Added
1. **Unified Timer with Toggle**
   - Focus Timer and Break Timer now on the same page
   - Side-by-side toggle buttons to switch modes
   - Toggle disabled when timer is running
   - Only one timer can run at a time

2. **Partial Session Tracking**
   - Stopped/quit sessions now save elapsed time to database
   - Users get credit for partial sessions in stats
   - New `savePartialSession()` function in sessions service

3. **Improved Stats Display**
   - Stats now show hours AND minutes (e.g., "2h 15m" instead of "2.3")
   - More human-readable format
   - Updated StatCard component with new formatting

4. **Navigation Improvements**
   - Stats link in header (toggles to "Timer" when on stats page)
   - Removed separate /break route
   - Simplified navigation structure

### Technical Changes
- Created `UnifiedTimerPage` component combining focus and break timers
- Added `savePartialSession()` to save incomplete sessions with elapsed time
- Updated `useSession` hook to accept `elapsedSeconds` parameter
- Changed stats storage from hours (float) to seconds (int) for accuracy
- Created `formatHoursMinutes()` utility for readable time display
- Removed BreakTimerPage and /break route

### Files Modified
- `src/App.tsx` - Updated routing to use UnifiedTimerPage
- `src/components/timer/UnifiedTimerPage.tsx` - New unified timer component
- `src/components/timer/SessionCompleteCard.tsx` - Removed break route references
- `src/components/stats/StatCard.tsx` - Updated to use hours/minutes format
- `src/components/layout/Header.tsx` - Added Stats navigation link
- `src/services/sessions.ts` - Added `savePartialSession()` function
- `src/services/stats.ts` - Changed from hours to seconds storage
- `src/hooks/useSession.ts` - Added elapsedSeconds parameter to stopSession
- `src/utils/format.ts` - New utility for time formatting
