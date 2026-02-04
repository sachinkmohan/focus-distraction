# Changelog

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
