# Distraction Blocker App - Implementation Plan

## Summary
Build a mobile-optimized focus timer web app with tree growth animation, break timer, and statistics dashboard. React + TypeScript + Vite + Firebase + Tailwind CSS + Framer Motion.

## Project State
Greenfield project — only `focus-distraction-spec.md` exists. Everything needs to be created from scratch.

## Build Order (incremental, core-first)

### Step 0: Organize Docs
- Create `docs/` folder in project root
- Save this implementation plan as `docs/implementation-plan.md`
- Move `focus-distraction-spec.md` into `docs/`

### Step 1: Project Scaffolding
- `npm create vite@latest . -- --template react-swc-ts`
- Install deps: `firebase react-router-dom framer-motion date-fns`
- Install dev deps: `tailwindcss @tailwindcss/vite prettier eslint-config-prettier`
- Configure: `vite.config.ts` (with `@/` alias + tailwind plugin), `tsconfig.json` (path alias), `.env.example`, `.gitignore`, `.prettierrc`
- Update `index.html` viewport meta for mobile (`user-scalable=no`)
- Set `src/index.css` to `@import "tailwindcss"`

### Step 2: TypeScript Types
Create `src/types/`:
- `user.ts` — `UserProfile`
- `session.ts` — `Session`, `SessionType`, `CreateSessionInput`
- `timer.ts` — `TimerStatus`, `TimerMode`, `AnimationPhase`, `TimerState`
- `index.ts` — barrel export

### Step 3: Firebase Config + Auth Service
- `src/config/firebase.ts` — init app, export `auth` and `db` using env vars
- `src/services/auth.ts` — `signInWithGoogle()`, `logOut()`, `subscribeToAuthState()`
- Use `browserLocalPersistence` for persistent login
- Create user profile doc on first sign-in

### Step 4: Auth Context + Hook
- `src/contexts/AuthContext.tsx` — wraps `onAuthStateChanged`, provides `{ user, loading }`
- `src/hooks/useAuth.ts` — re-exports `useAuthContext`

### Step 5: Utility Functions
- `src/utils/constants.ts` — presets (25/45/60 min focus, 5/10/15 min break), max recent durations, seed-to-plant duration (2 min)
- `src/utils/duration.ts` — `parseDuration("hh:mm:ss")`, `formatDurationLabel(seconds)`, `formatCountdown(seconds)`
- `src/utils/date.ts` — `getTodayRange()`, `getThisWeekRange()`, `getLast4WeeksRanges()` using date-fns, week starts Monday

### Step 6: Firebase Services
- `src/services/sessions.ts` — `createSession()`, `completeSession()`, `cancelSession()`, `checkIncompleteSession()`, `querySessionsInRange()`
- `src/services/templates.ts` — `getRecentDurations()`, `addRecentDuration()`
- `src/services/stats.ts` — `getTodayStats()`, `getThisWeekStats()`, `getLast4WeeksStats()`

Key design: `checkIncompleteSession()` handles tab-close recovery by comparing wall clock to startTime+duration.

### Step 7: Core Hooks
- `src/hooks/useTimer.ts` — countdown using `setInterval` + wall-clock recalculation (not decrementing). Exposes `start()`, `resume()`, `stop()`, `reset()`, `elapsedSeconds`, `progress`
- `src/hooks/useSession.ts` — wraps session service, auto-saves custom durations to recent list
- `src/hooks/useRecentDurations.ts` — fetches recent durations from Firestore
- `src/hooks/useStats.ts` — fetches today/week/4-weeks stats

### Step 8: Layout + Routing
- `src/components/layout/ProtectedRoute.tsx` — redirects to `/login` if unauthenticated
- `src/components/layout/Header.tsx` — app name + logout button
- `src/components/layout/AppShell.tsx` — max-w-[428px] centered, Header + `<Outlet />`
- `src/App.tsx` — BrowserRouter with routes: `/login`, `/` (timer), `/break`, `/stats`

### Step 9: Login Page
- `src/components/auth/LoginPage.tsx` — centered card with "Sign in with Google" button, redirects to `/` if already authenticated

### Step 10: Timer Page (main orchestrator)
- `src/components/timer/TimerPage.tsx`
- State machine: idle -> running -> completed
- On mount: calls `checkIncomplete()` to handle tab-close recovery
- idle: shows duration input + quick select + seed
- running: shows countdown + tree animation + stop button
- completed: shows full tree + "Start Break?" + "New Focus"
- On stop: cancels session in Firestore (not marked complete)

### Step 11: Timer Sub-Components
- `DurationInput.tsx` — controlled `hh:mm:ss` input, `inputMode="numeric"`
- `QuickSelectButtons.tsx` — preset buttons + recent duration buttons, configurable for focus/break
- `TimerDisplay.tsx` — large monospace countdown, green (focus) / blue (break)
- `TimerControls.tsx` — Start/Stop buttons, 44px+ touch targets
- `SessionCompleteCard.tsx` — completion message + break/new-focus/stats links

### Step 12: Tree Animation
- `src/components/tree/treePaths.ts` — SVG path data for seed, plant, full tree (viewBox 200x300)
- `src/components/tree/TreeAnimation.tsx` — progress-driven rendering:
  - Seed (idle): small oval
  - Sprouting (0-2 min): stem + small leaves via `motion.path` pathLength
  - Growing (2 min-end): trunk + branches + canopy via pathLength + scale
  - Complete: full tree
- Animation synced to timer progress, works correctly after resume

### Step 13: Break Timer
- `src/components/break/BreakTimerPage.tsx` — same structure as TimerPage but:
  - Blue color scheme
  - No tree animation (simple timer display)
  - 5/10/15 min presets
  - On complete: "Start Focus Session" button

### Step 14: Statistics Dashboard
- `src/components/stats/StatsPage.tsx` — uses `useStats` hook
- `src/components/stats/StatCard.tsx` — reusable card showing sessions/focus hrs/break hrs
- Today, This Week, Last 4 Weeks sections with labeled cards

### Step 15: Firebase Hosting + Firestore Config
- `firebase.json` — hosting (public: dist, SPA rewrites), firestore rules/indexes paths
- `.firebaserc` — placeholder project ID
- `firestore.rules` — users can only read/write own data
- `firestore.indexes.json` — composite indexes for `completed` + `createdAt` and `completed` + `startTime`
- Add `"deploy": "npm run build && firebase deploy"` script

## File Structure
```
src/
├── main.tsx
├── App.tsx
├── index.css
├── config/firebase.ts
├── types/{user,session,timer,index}.ts
├── services/{auth,sessions,templates,stats}.ts
├── hooks/{useAuth,useTimer,useSession,useRecentDurations,useStats}.ts
├── contexts/AuthContext.tsx
├── utils/{constants,duration,date}.ts
├── components/
│   ├── layout/{Header,ProtectedRoute,AppShell}.tsx
│   ├── auth/LoginPage.tsx
│   ├── timer/{TimerPage,DurationInput,QuickSelectButtons,TimerDisplay,TimerControls,SessionCompleteCard}.tsx
│   ├── tree/{TreeAnimation,treePaths}.ts(x)
│   ├── break/{BreakTimerPage}.tsx
│   └── stats/{StatsPage,StatCard}.tsx
```

## Key Architecture Decisions
1. **No global state library** — AuthContext for auth, local state + hooks for everything else
2. **Wall-clock timer** — `useTimer` calculates remaining from `Date.now() - startTime`, not by decrementing. Handles browser throttling correctly
3. **Firestore as source of truth** — sessions persist across tab closes. `checkIncompleteSession()` on mount handles recovery
4. **Progress-driven animation** — tree animation receives `progress` (0-1) from timer, works after resume
5. **Services layer** — pure async functions, no React deps, independently testable
6. **Cancel vs complete** — stopping early cancels/deletes the session; only finished sessions are marked complete

## Firebase Setup (user needs to do)
1. Create Firebase project at console.firebase.google.com
2. Enable Authentication -> Google provider
3. Create Firestore database
4. Copy config values to `.env` (from `.env.example`)
5. Install `firebase-tools` globally, run `firebase login`
6. Update `.firebaserc` with project ID
7. Deploy: `npm run build && firebase deploy`

Firebase Hosting free tier: 10 GB storage, 360 MB/day transfer — more than enough.

## Verification
1. Run `npm run dev` — app loads at localhost:5173
2. Visit `/login` — Google sign-in button visible
3. Sign in -> redirected to `/` (timer page)
4. Select 25 min -> click Start -> countdown runs, tree animates from seed
5. Click Stop -> timer resets, session cancelled
6. Start a short session (1 min) -> let it complete -> completion card shows with break prompt
7. Click "Start Break" -> break timer page with blue theme
8. Navigate to `/stats` -> today's stats show completed session
9. Close tab during active session -> reopen -> session resumes or auto-completes
10. `npm run build` succeeds without errors
