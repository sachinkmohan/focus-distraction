# Changelog

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
