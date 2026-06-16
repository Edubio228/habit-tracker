# Habit Tracker Web App MVP Plan

## Goal

Build a private habit tracking web app in the existing Next.js + Prisma + PostgreSQL project.

## Assumptions

- Use the existing Next.js App Router project in `app/`.
- Use PostgreSQL via the existing Prisma setup.
- Use email/password authentication with NextAuth v4 and the existing Prisma adapter.
- Use Tailwind CSS for styling.
- MVP scope is single-user tracking: create/edit/delete habits, mark daily completions, view current progress and streaks.

## Existing project findings

- `package.json` already includes `next`, `next-auth`, `@next-auth/prisma-adapter`, `bcryptjs`, `@prisma/client`, Prisma, TypeScript, Tailwind, and ESLint.
- `prisma/schema.prisma` already defines `User`, `Habit`, and `Log` models.
- `lib/prisma.js` configures a Prisma PostgreSQL adapter.
- `app/page.tsx`, `app/layout.tsx`, and `app/globals.css` are still default scaffold files.
- Next.js 16 documentation confirms Server Actions are enabled by default and should be used for mutations; each action must verify authentication/authorization.

## Implementation plan

1. **Complete authentication schema and configuration**
   - Extend `User` in `prisma/schema.prisma` to match the Prisma adapter requirements:
     - `emailVerified DateTime?`
     - `accounts Account[]`
     - `sessions Session[]`
   - Add `Account`, `Session`, and `VerificationToken` models.
   - Add `zod` as a direct dependency for server-side validation.
   - Add `.env.example` with required variables:
     - `DATABASE_URL`
     - `AUTH_SECRET`
     - Optional `NEXTAUTH_URL`
   - Add `lib/auth.ts` with NextAuth credentials provider, Prisma adapter, bcrypt password hashing/verification, and session callbacks.
   - Add `app/api/auth/[...nextauth]/route.ts`.
   - Add `lib/session.ts` or equivalent helper to read the current user safely.

2. **Add server-only data access layer**
   - Create `lib/habits.ts` or `data/habits.ts` with server-only functions:
     - `getDashboardData(userId)`
     - `createHabit(userId, input)`
     - `updateHabit(userId, habitId, input)`
     - `deleteHabit(userId, habitId)`
     - `toggleLogForDate(userId, habitId, date)`
     - `updateLogNote(userId, habitId, date, note)`
   - Keep Prisma access behind the DAL.
   - Return minimal DTOs instead of raw Prisma objects.
   - Enforce ownership checks for every habit/log mutation.

3. **Add Server Actions**
   - Create `app/actions/habits.ts` or `app/actions.ts` with `"use server"` actions:
     - `createHabitAction(formData)`
     - `updateHabitAction(habitId, formData)`
     - `deleteHabitAction(formData)`
     - `toggleCompletionAction(formData)`
     - `updateNoteAction(formData)`
   - Each action must:
     - Call the auth helper.
     - Validate input with `zod`.
     - Return structured `{ errors?, success?, data? }` results.
     - Revalidate dashboard data after successful mutations.

4. **Build authenticated app routes**
   - `app/(auth)/login/page.tsx`
     - Login form with email/password.
     - Link to signup.
   - `app/(auth)/signup/page.tsx`
     - Signup form with email/password/name.
     - Create user through Prisma.
   - `app/(app)/dashboard/page.tsx`
     - Main habit tracker dashboard.
     - Shows today's habits, completion status, streaks, and progress summary.
   - Optional but recommended:
     - `app/(app)/habits/page.tsx` for habit management.
     - `app/(app)/habits/new/page.tsx` for a dedicated create-habit page.

5. **Build reusable UI components**
   - `components/ui/button.tsx`
   - `components/ui/input.tsx`
   - `components/ui/label.tsx`
   - `components/ui/card.tsx`
   - `components/auth-form-message.tsx`
   - `components/habit-card.tsx`
   - `components/habit-form.tsx`
   - `components/completion-toggle.tsx`
   - `components/navbar.tsx`
   - `components/logout-button.tsx`

6. **Dashboard behavior**
   - Display habits grouped or listed for the current day.
   - Each habit card shows:
     - Name
     - Description
     - Goal type/count/unit
     - Color accent
     - Current completion status
     - Current streak
     - Optional note editor
   - Actions:
     - Mark complete/incomplete for today.
     - Add/edit note.
     - Create new habit.
     - Edit existing habit.
     - Delete habit.
   - Show empty state when no habits exist.

7. **Streak and progress calculations**
   - Add helper functions for:
     - `calculateStreak(habitId, endDate)`
     - `calculateCompletionRate(habitId, start, end)`
     - `getTodayKey()`
   - Treat `Log.completed === true` as completion.
   - Keep streak calculation deterministic and timezone-safe using local date strings stored as UTC midnight or ISO date strings.

8. **Styling and layout**
   - Replace default landing page with a useful authenticated landing/dashboard experience.
   - Use Tailwind classes from the existing `app/globals.css`.
   - Add a simple responsive layout with header/nav.
   - Add logout action using NextAuth `signOut`.

9. **Validation and error handling**
   - Validate:
     - Email format.
     - Password length.
     - Habit name length.
     - Optional description length.
     - Goal type/count/unit.
   - Return friendly form errors.
   - Prevent users from modifying another user's habits.
   - Avoid exposing passwords or internal errors to the client.

10. **Database migration and generation**
    - Run `npx prisma generate`.
    - Run `npx prisma migrate dev --name init_habit_tracker` after schema changes.
    - Confirm generated Prisma Client matches the updated schema.

11. **Verification**
    - Run `npm run lint`.
    - Run `npm run build`.
    - Manually verify:
      - Signup creates a user.
      - Login/logout works.
      - Habits can be created, edited, and deleted.
      - Today's completion toggles persist.
      - Notes persist.
      - Streak/progress calculations update correctly.
      - Unauthenticated users cannot access dashboard.
      - Users cannot modify/delete another user's habits.

## Acceptance criteria

- The app has email/password auth.
- Authenticated users can manage their own habits.
- Users can mark habits complete or incomplete for the current day.
- Users can add notes to habit logs.
- The dashboard shows progress and streaks.
- All mutations are protected by authentication and ownership checks.
- The project passes lint and build checks.
