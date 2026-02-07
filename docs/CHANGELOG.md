# Changelog

## 2026-02-06 - Update 8: Settings Lock & CodeRabbit Fixes

### Features Added

**Settings Lock/Unlock Modal**
- Added passphrase-protected lock for check-in bonus interval setting
- Lock/unlock toggle button next to the interval dropdown
- Passphrase: "I give up on discipline"
- Modal with confirmation message and unlock flow
- Prevents impulsive changes to check-in settings
- Settings remain locked until user consciously unlocks

**Async Error Handling & Loading States**
- Modal shows loading state ("Unlocking...") during Firestore write
- Error handling with retry capability if unlock fails
- Only closes modal after successful Firestore update
- Prevents race condition where modal closes before settings save

**Accessibility Improvements**
- Added ARIA attributes: `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`
- Enter key support in passphrase input field
- Disabled state for all modal controls during unlock operation
- Screen reader friendly with proper semantic HTML

### Bug Fixes

**Fixed Check-in Race Condition**
- Implemented distributed locking for check-in operations
- Prevents double check-ins from rapid clicks or concurrent requests
- Lock expires after 5 seconds (stale lock protection)
- Uses Firestore transactions for atomic lock acquisition
- Lock document: `users/{userId}/locks/checkin-{date}`

**Fixed Settings Migration Logic**
- Settings migration now persists corrected values back to Firestore
- Previously, invalid intervals were normalized in-memory but never saved
- Eliminated perpetual re-migration on every settings read
- One-time auto-fix for users with stale interval values

### How It Works

**Settings Lock Flow:**
1. Check-in interval dropdown is locked by default (gray lock icon)
2. Click lock icon → UnlockSettingsModal appears
3. Type passphrase: "I give up on discipline"
4. Click "Unlock" or press Enter
5. Modal shows "Unlocking..." while saving to Firestore
6. On success → modal closes, dropdown becomes editable (open lock icon)
7. On error → error message shown, modal stays open for retry
8. Click open lock icon → settings locked again

**Race Condition Prevention:**
1. User clicks "Check In" button
2. Firestore transaction checks for lock document
3. If lock exists and fresh (<5s) → reject with error message
4. If no lock or stale → acquire lock, create check-in, release lock
5. Concurrent requests see the lock and back off

### Technical

**UnlockSettingsModal Component:**
- Created new modal component with passphrase validation
- Async/await handling for Firestore updates
- Loading state management with button feedback
- Error state display and recovery
- Keyboard accessibility (Enter key submit)
- ARIA attributes for screen readers

**Distributed Locking:**
- Lock document format: `users/{userId}/locks/checkin-{YYYY-MM-DD}`
- Lock contains: `{ timestamp: number, userId: string }`
- Stale lock threshold: 5000ms
- Transaction-based lock acquisition
- Best-effort lock cleanup after operation

**Settings Migration:**
- `getUserSettings()` now checks if migration occurred
- If stored interval ≠ normalized interval → writes back corrected value
- Uses `updateDoc()` to persist the fix
- Idempotent: safe to run multiple times

### Files Created
- `src/components/settings/UnlockSettingsModal.tsx` - Passphrase modal component

### Files Modified
- `src/components/timer/UnifiedTimerPage.tsx` - Added lock/unlock button, modal integration
- `src/services/settings.ts` - Added persistent migration write-back logic
- `src/types/settings.ts` - Added unlock passphrase constant, expanded interval options
- `src/services/sessions.ts` - Implemented distributed locking for check-ins

---

## 2026-02-06 - Update 7: Cross-Device Sync & UX Improvements

### Features Added

**Cross-Device Exceeded State Sync**
- Focus timer exceeded state now syncs across devices (previously only break timers)
- When a focus session completes on device A, device B will show the completion screen
- Works for both focus and break sessions completed within the last 2 hours
- Dismissed sessions won't reappear on other devices

**Manual Time Toast Notifications**
- Added 1-second toast notifications when clicking +5m buttons
- Green "success" toast for focus time
- Blue "info" toast for break time
- Toast positioned at bottom-center for mobile-friendly placement
- Error handling with 2-second error toasts if Firestore write fails
- Proper async/await for both `addManualTime()` and `refresh()` calls

### Improvements

**Fixed Manual Time Exceeded Banners**
- Manual +5m time entries no longer trigger exceeded timer banners
- Previously, adding manual time would show completion screens on timer page
- Manual entries are now pre-dismissed (`dismissed: true`)

**Eliminated Stats Page Flash**
- Removed loading spinner flash when clicking +5m buttons
- Stats cards now update smoothly in-place
- Only shows loading spinner on initial page load
- Much better UX during manual time increments

### How It Works

**Cross-Device Focus Completion:**
1. Start 5-minute focus session on desktop at 3:00 PM
2. Timer completes at 3:05 PM
3. Open app on phone at 3:08 PM
4. Phone shows: "Session complete" + "Great work! Time to take a break."
5. Dismiss on phone → won't reappear on desktop

**Manual Time Entry:**
1. Click +5m focus button on stats page
2. See green toast: "+5m focus added" (1 second)
3. Stats update smoothly without page flash
4. No exceeded banner appears on timer page

### Technical

**Cross-Device Sync:**
- Renamed `checkRecentBreakSession()` → `checkRecentExceededSession()`
- Changed Firestore query from `type == 'break'` → `type in ['focus', 'break']`
- Updated `UnifiedTimerPage.tsx` to set mode dynamically from session type
- No new Firestore indexes needed (reuses existing composite index)

**Manual Time Fix:**
- `addManualTime()` now sets `dismissed: true` (was `false`)
- Prevents manual entries from appearing in exceeded session query

**Stats Page UX:**
- Changed `useStats.refresh()` loading logic from `loading: true` to `loading: prev.today === null`
- Only shows spinner when no data exists yet
- Background refreshes keep UI stable

**Toast Implementation:**
- Installed `react-toastify` package
- Added `ToastContainer` to `App.tsx` root
- Configured with `autoClose: 1000, position: 'bottom-center'`

**Code Quality (CodeRabbit Fixes):**
- Replaced raw date math with `date-fns` library: `subHours(new Date(), 2)`
- Updated comment: "break ended" → "session ended" (generalized)
- Added try/catch error handling to manual time handlers
- Consistent with project standards for date operations

### Files Modified
- `src/services/sessions.ts` - Renamed function, changed query filter, fixed manual time dismissed flag
- `src/hooks/useSession.ts` - Updated function name
- `src/components/timer/UnifiedTimerPage.tsx` - Dynamic mode handling for exceeded sessions
- `src/hooks/useStats.ts` - Conditional loading state logic
- `src/components/stats/StatsPage.tsx` - Added toast notifications
- `src/App.tsx` - Added ToastContainer

### Dependencies Added
- `react-toastify` - Toast notification library

---

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
