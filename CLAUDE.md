# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-optimized focus timer web app with Google authentication, Firebase backend, and tree growth animation. Tracks focus sessions and break times with comprehensive statistics.

**Tech Stack:** React 19 + TypeScript + Vite + TailwindCSS 4 + Firebase (Auth + Firestore)

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase (builds first)
npm run deploy
```

## Firebase Setup

Environment variables are required in `.env` (see `.env.example`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Firebase config is in `src/config/firebase.ts`.

## Architecture

### Core State Management Pattern

The app uses a **services + hooks** pattern for data and state management:

1. **Services** (`src/services/`): Firebase operations (sessions, auth, stats)
   - `sessions.ts`: CRUD operations for timer sessions
   - `auth.ts`: Google authentication
   - `stats.ts`: Statistics queries
   - `templates.ts`: Recent duration templates

2. **Hooks** (`src/hooks/`): React state management layer
   - `useTimer`: Client-side timer logic (countdown, status, completion)
   - `useSession`: Bridge between timer and Firebase sessions service
   - `useStats`: Statistics data fetching
   - `useRecentDurations`: Recent duration templates

3. **Contexts** (`src/contexts/`): Global app state
   - `AuthContext`: Firebase authentication state

### Timer Flow

The timer system has two independent layers that work together:

1. **Client Timer** (`useTimer` hook):
   - Manages countdown display and local state
   - Statuses: `idle`, `running`, `completed`, `exceeded`
   - Modes: `focus` (with tree animation), `break` (coffee icon)
   - Does NOT directly interact with Firebase

2. **Session Management** (`useSession` hook):
   - Handles Firebase session CRUD operations
   - Creates session on start, updates on complete/stop
   - Checks for incomplete sessions on mount (auto-resume logic)
   - Checks for exceeded break sessions (user came back late)

3. **UnifiedTimerPage**: Coordinates both layers
   - Calls `session.startSession()` → creates Firebase record
   - Then calls `timer.start()` → starts countdown
   - On completion: `timer` triggers callback → `session.endSession()` updates Firebase

### Session States

Sessions in Firestore have three key boolean flags:
- `completed`: Session finished (normally or interrupted)
- `interrupted`: Session stopped early by user
- `dismissed`: Break session exceeded warning was dismissed

**Break Timer Special Behavior:**
- When break timer reaches 0, it enters `exceeded` state
- Shows warning banner with "time since break ended" counter
- User can dismiss the warning (sets `dismissed: true`)
- On app reload, checks for recent completed breaks that weren't dismissed

### Routing & Navigation

- Single-page app with React Router
- Routes: `/` (timer), `/stats`, `/login`
- `ProtectedRoute` component wraps authenticated pages
- `AppShell` provides header with logout button

## Key Files

- `src/App.tsx`: Main routing setup
- `src/components/timer/UnifiedTimerPage.tsx`: Main timer page (focus + break modes)
- `src/hooks/useTimer.ts`: Core timer logic with interval management
- `src/hooks/useSession.ts`: Firebase session lifecycle
- `src/services/sessions.ts`: All Firestore session operations
- `src/types/session.ts`, `src/types/timer.ts`: Type definitions
- `firestore.rules`: Security rules (user data scoped to userId)

## Firestore Structure

```
users/{userId}/sessions/{sessionId}
  {
    startTime: Timestamp,
    duration: number, // seconds
    type: 'focus' | 'break',
    completed: boolean,
    interrupted: boolean,
    dismissed: boolean,
    completedAt: Timestamp | null,
    createdAt: Timestamp
  }

users/{userId}/templates/recentDurations
  {
    durations: number[] // last 5 custom durations in seconds
  }
```

## Tree Animation

Located in `src/components/tree/TreeAnimation.tsx`:
- SVG-based tree paths grow progressively during focus sessions
- Animation phases: seed → sprouting (0-2min) → growing (2min-end) → complete
- Uses Framer Motion for smooth transitions
- Only shown in focus mode (not break mode)

## Important Patterns

1. **Path alias**: Use `@/` for imports (configured in `vite.config.ts`)
   ```typescript
   import { useAuth } from '@/hooks/useAuth';
   ```

2. **Date handling**: Use `date-fns` for date operations
   ```typescript
   import { startOfDay, endOfDay } from 'date-fns';
   ```

3. **Firebase timestamps**: Always convert to JS Date objects
   ```typescript
   startTime: (data.startTime as Timestamp).toDate()
   ```

4. **Session resumption logic** (`checkIncompleteSession` in `sessions.ts`):
   - Queries for incomplete sessions on app load
   - Calculates elapsed time vs. duration
   - Auto-completes if time expired
   - Returns remaining time if still in progress

## Styling

- TailwindCSS 4 with Vite plugin
- Mobile-first responsive design (target: 320px-428px)
- Color scheme: Green for focus mode, blue for break mode
- Touch targets: minimum 44x44px

## Testing Notes

No test framework configured yet. When adding tests:
- Test timer countdown accuracy
- Test session auto-completion logic
- Test Firebase operations with emulators
- Mock Firebase in component tests

## Deployment

Firebase Hosting is configured (`firebase.json`):
- Deploys `dist/` directory
- SPA rewrites to `/index.html`
- Cache headers for static assets

Run `npm run deploy` to build and deploy in one command.
