# Distraction Blocker App - Project Specification

## Overview
A mobile-optimized web app that helps users stay focused by tracking focus sessions and break times. Features a growing tree animation as a visual motivator and comprehensive statistics tracking.

---

## Tech Stack

### Frontend
- **React** (latest) - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (mobile-first approach)
- **Framer Motion** or **React Spring** - Tree animation
- **React Router** - Navigation (if multi-page)
- **date-fns** - Date/time manipulation

### Backend & Services
- **Firebase Authentication** - Google Sign-in only
- **Firebase Firestore** - Database for sessions and user data
- **Firebase Hosting** (optional) - Deployment

### Development Tools
- **Vite** - Build tool and dev server
- **ESLint + Prettier** - Code quality

---

## Features Breakdown

### 1. Authentication
**Requirements:**
- Google Sign-in only
- Persistent login (user stays logged in until manual logout)
- Redirect to main app after successful login
- Show logout button in header/settings

**Implementation:**
```javascript
// Firebase Auth setup
// Use Firebase Google Auth Provider
// Store user session in localStorage
// Check auth state on app load
```

---

### 2. Focus Timer

**Duration Input:**
- Custom input field: hh:mm:ss format
- Pre-set quick-select buttons:
  - 25 min
  - 45 min
  - 60 min
- Last 5 custom durations used (automatically saved)
  - Display as quick-select buttons
  - Format: "25:00", "1:30:00", etc.

**Timer Controls:**
- **Start Button**: Begins focus session
- **Stop Button**: Available during active session (ends session early)

**Timer Behavior:**
- On Start: Save session to Firebase with `{ startTime, duration, type: 'focus', completed: false }`
- Count down display showing remaining time
- When tab is closed during active session:
  - Session data remains in Firebase
  - On return: Calculate elapsed time
  - If `currentTime >= startTime + duration`: Mark as completed, update stats
  - If still in progress: Resume countdown from where it should be

**Tree Animation:**
- **Seed → Plant**: 0 to 2 minutes (always 2 min, regardless of total duration)
- **Plant → Tree**: 2 minutes to end of session
- Animation should be smooth and continuous
- Tree resets to seed for each new session

**Visual States:**
- Idle: Show seed, no timer
- Active (0-2 min): Seed growing into plant
- Active (2+ min): Plant growing into full tree
- Completed: Full tree with completion message

---

### 3. Break Timer

**When Available:**
- Automatically offered after focus session completes
- Can be started manually anytime from main screen

**Behavior:**
- Similar UI to focus timer
- Custom duration input in hh:mm:ss
- Pre-set buttons: 5 min, 10 min, 15 min
- Saves to Firebase as `{ startTime, duration, type: 'break', completed: false }`
- Counts down and tracks time
- No tree animation for breaks (different visual or simple timer)

**Visual Differentiation:**
- Different color scheme from focus timer (e.g., blue vs green)
- Label clearly as "Break Timer" or "Distraction Timer"

---

### 4. Statistics Dashboard

**Data to Display:**

**Today:**
- Sessions completed: X
- Focus hours: X.X hrs
- Break hours: X.X hrs

**This Week:**
- Sessions completed: X
- Focus hours: X.X hrs
- Break hours: X.X hrs

**Last 4 Weeks:**
- Week view (scrollable or grid)
- Each week shows:
  - Week label: "Week of Jan 1-7"
  - Sessions completed: X
  - Focus hours: X.X hrs
  - Break hours: X.X hrs

**Calculations:**
- Week starts on Monday
- Current week is "This Week"
- Last 4 weeks = previous 4 completed weeks (not including current)
- Total hours = sum of all completed session durations

**UI Layout:**
- Mobile-optimized cards or sections
- Clear headings
- Large, readable numbers
- Minimal scrolling required

---

### 5. UI/UX Design

**Mobile-First Design:**
- Primary target: Mobile screens (320px - 428px width)
- Large touch targets (min 44x44px)
- Simple, clean interface
- Minimal navigation

**Layout Structure:**
```
┌─────────────────────────┐
│   Header (Logo, Logout) │
├─────────────────────────┤
│                         │
│   Timer Input Section   │
│   [Quick select btns]   │
│   [Custom input]        │
│   [Start/Stop button]   │
│                         │
│   Tree Animation Area   │
│   [Countdown Display]   │
│                         │
├─────────────────────────┤
│   Stats Section         │
│   [Today | Week | 4wks] │
│   [Stats display]       │
│                         │
└─────────────────────────┘
```

**Color Scheme:**
- Focus mode: Green/nature tones
- Break mode: Blue/calm tones
- Background: Light, minimal
- Text: High contrast for readability

---

## Firebase Structure

### Firestore Database Schema

```javascript
// Collection: users
users/{userId}/
  profile: {
    email: string,
    displayName: string,
    createdAt: timestamp
  }

// Collection: sessions
users/{userId}/sessions/{sessionId}
  {
    id: string,
    startTime: timestamp,
    duration: number, // in seconds
    type: 'focus' | 'break',
    completed: boolean,
    completedAt: timestamp | null,
    createdAt: timestamp
  }

// Collection: templates
users/{userId}/templates/recentDurations
  {
    durations: [
      3000, // in seconds (50 min)
      1500, // 25 min
      2700, // 45 min
      ...
    ] // max 5 items
  }
```

### Firestore Queries Needed

1. **Get all sessions for today:**
   ```javascript
   where('createdAt', '>=', startOfDay)
   where('createdAt', '<=', endOfDay)
   where('completed', '==', true)
   ```

2. **Get all sessions for current week:**
   ```javascript
   where('createdAt', '>=', startOfWeek)
   where('createdAt', '<=', endOfWeek)
   where('completed', '==', true)
   ```

3. **Get last 4 weeks data:**
   ```javascript
   // Query sessions for last 4 weeks
   where('createdAt', '>=', fourWeeksAgo)
   where('createdAt', '<=', startOfThisWeek)
   where('completed', '==', true)
   // Group by week in frontend
   ```

4. **Check for incomplete sessions:**
   ```javascript
   where('completed', '==', false)
   orderBy('startTime', 'desc')
   limit(1)
   ```

---

## Core Flows

### Flow 1: User Login
1. User visits app
2. If not authenticated → Show Google Sign-in button
3. User clicks → Firebase Google Auth popup
4. On success → Store user in Firestore (if new), redirect to main app
5. Set persistent session

### Flow 2: Starting a Focus Session
1. User selects duration (quick-select or custom input)
2. User clicks "Start Focus"
3. App creates session document in Firestore:
   ```javascript
   {
     startTime: new Date(),
     duration: selectedDuration, // seconds
     type: 'focus',
     completed: false
   }
   ```
4. Start countdown timer
5. Begin tree animation (seed → plant → tree)
6. Show "Stop" button

### Flow 3: Session Auto-Completion (Tab Closed)
1. User closes tab during active session
2. Session remains in Firestore with `completed: false`
3. User returns to app later
4. App checks for incomplete sessions:
   ```javascript
   const elapsed = currentTime - session.startTime
   if (elapsed >= session.duration) {
     // Mark as completed
     updateDoc(sessionRef, {
       completed: true,
       completedAt: new Date()
     })
   } else {
     // Resume countdown from current position
     const remaining = session.duration - elapsed
     // Continue timer
   }
   ```
5. UI updates to reflect completed session
6. Stats automatically recalculate

### Flow 4: Break Timer
1. After focus session completes → Show "Start Break?" prompt
2. OR user manually clicks "Break Timer" button
3. User selects break duration
4. Same flow as focus timer but:
   - Type: 'break'
   - Different visual styling
   - No tree animation (simple timer display)

### Flow 5: Viewing Statistics
1. User scrolls to stats section (or separate tab)
2. App queries Firestore for sessions
3. Calculate totals:
   ```javascript
   // Today
   const todaySessions = sessions.filter(isToday)
   const focusHours = todaySessions
     .filter(s => s.type === 'focus')
     .reduce((sum, s) => sum + s.duration, 0) / 3600
   
   // Similar for breaks and other periods
   ```
4. Display in cards/sections

---

## Implementation Checklist

### Phase 1: Setup & Authentication
- [ ] Initialize React + TypeScript + Vite project
- [ ] Install and configure Tailwind CSS
- [ ] Set up Firebase project (Authentication + Firestore)
- [ ] Implement Google Sign-in
- [ ] Create protected route wrapper
- [ ] Build login page UI

### Phase 2: Timer Core Functionality
- [ ] Create timer component with countdown logic
- [ ] Implement custom duration input (hh:mm:ss)
- [ ] Add pre-set quick-select buttons (25, 45, 60 min)
- [ ] Create Firestore session creation logic
- [ ] Handle start/stop timer actions
- [ ] Implement session auto-completion on app reload

### Phase 3: Duration Templates
- [ ] Save last 5 custom durations to Firestore
- [ ] Display recent durations as quick-select buttons
- [ ] Update templates on each new custom duration

### Phase 4: Tree Animation
- [ ] Design/find tree animation assets (seed, plant, tree)
- [ ] Implement animation with Framer Motion or CSS
- [ ] Sync animation with timer (0-2min: seed→plant, 2min-end: plant→tree)
- [ ] Reset animation on new session

### Phase 5: Break Timer
- [ ] Create break timer component (similar to focus timer)
- [ ] Add pre-set buttons (5, 10, 15 min)
- [ ] Different visual styling from focus mode
- [ ] Save break sessions to Firestore

### Phase 6: Statistics
- [ ] Create stats component
- [ ] Implement Firestore queries for today/week/4-weeks
- [ ] Calculate totals (sessions, focus hours, break hours)
- [ ] Build responsive stats cards
- [ ] Add week-by-week view for last 4 weeks

### Phase 7: Polish & Optimization
- [ ] Mobile responsiveness testing
- [ ] Add loading states
- [ ] Error handling for Firebase operations
- [ ] Offline support (optional)
- [ ] Performance optimization
- [ ] User testing and feedback

### Phase 8: Deployment
- [ ] Build production bundle
- [ ] Deploy to Firebase Hosting or Vercel
- [ ] Test in production
- [ ] Monitor Firebase usage

---

## Key Technical Considerations

### Timer Accuracy
- Use `setInterval` with 1-second intervals
- Store remaining time in state
- On each tick, decrement and update UI
- When remaining reaches 0, mark session complete

### Session State Management
- Check for incomplete sessions on app load
- Calculate elapsed time: `currentTime - startTime`
- If elapsed >= duration: auto-complete
- If elapsed < duration: resume with remaining time

### Animation Performance
- Use CSS transforms for tree animation (better mobile performance)
- Consider using `will-change` property
- Optimize animation frame rate for mobile

### Data Persistence
- All session data in Firestore
- Real-time listeners for stats updates (optional)
- Handle offline scenarios gracefully

### Mobile Optimization
- Touch-friendly button sizes (min 44px)
- Prevent zoom on input focus: `user-scalable=no`
- Use viewport meta tag: `width=device-width, initial-scale=1`
- Test on various mobile devices

---

## Sample Code Snippets

### Timer Duration Input Component
```typescript
interface DurationInputProps {
  onDurationSelect: (seconds: number) => void;
  recentDurations: number[];
}

const DurationInput: React.FC<DurationInputProps> = ({ 
  onDurationSelect, 
  recentDurations 
}) => {
  const presets = [25 * 60, 45 * 60, 60 * 60]; // in seconds
  
  return (
    <div>
      {/* Pre-set buttons */}
      {presets.map(duration => (
        <button onClick={() => onDurationSelect(duration)}>
          {formatDuration(duration)}
        </button>
      ))}
      
      {/* Recent durations */}
      {recentDurations.map(duration => (
        <button onClick={() => onDurationSelect(duration)}>
          {formatDuration(duration)}
        </button>
      ))}
      
      {/* Custom input */}
      <input 
        type="text" 
        placeholder="hh:mm:ss"
        onChange={(e) => {
          const seconds = parseCustomDuration(e.target.value);
          onDurationSelect(seconds);
        }}
      />
    </div>
  );
};
```

### Session Creation
```typescript
const createSession = async (
  userId: string, 
  duration: number, 
  type: 'focus' | 'break'
) => {
  const sessionRef = doc(collection(db, `users/${userId}/sessions`));
  
  await setDoc(sessionRef, {
    startTime: serverTimestamp(),
    duration,
    type,
    completed: false,
    createdAt: serverTimestamp()
  });
  
  return sessionRef.id;
};
```

### Auto-Complete Check on App Load
```typescript
const checkIncompleteSession = async (userId: string) => {
  const sessionsRef = collection(db, `users/${userId}/sessions`);
  const q = query(
    sessionsRef, 
    where('completed', '==', false),
    orderBy('startTime', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const session = snapshot.docs[0];
    const data = session.data();
    const elapsed = Date.now() - data.startTime.toMillis();
    
    if (elapsed >= data.duration * 1000) {
      // Auto-complete
      await updateDoc(session.ref, {
        completed: true,
        completedAt: serverTimestamp()
      });
      return { status: 'completed', session: data };
    } else {
      // Resume
      const remaining = data.duration - (elapsed / 1000);
      return { status: 'resume', remaining, session: data };
    }
  }
  
  return { status: 'none' };
};
```

---

## Future Enhancements (Out of Scope for MVP)
- Dark mode
- Sound notifications when session completes
- Streak tracking
- Different tree types/themes
- Export statistics as CSV
- Social features (share progress)
- Desktop/tablet optimizations
- PWA with offline support
- Multiple focus modes (Pomodoro preset)

---

## Success Metrics
- User can complete a focus session end-to-end
- Sessions are accurately tracked even after closing tab
- Statistics display correctly for all time periods
- App is fully functional on mobile devices (responsive)
- Google sign-in works smoothly
- App loads in < 3 seconds on mobile 4G

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Ready for Implementation** ✅
