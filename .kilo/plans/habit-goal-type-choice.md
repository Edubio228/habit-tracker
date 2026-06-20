# Habit Goal Type Selection Plan

## Goal

Allow users to choose a habit goal type of `daily`, `weekly`, or `monthly` when creating a habit, instead of the current hard-coded daily-only input.

## Scope

- Update the habit creation form to replace the read-only `goalType` input with a selectable control.
- Preserve existing create/edit behavior for the rest of the habit form.
- Validate the selected goal type on the server.

## Files to change

1. `components/habit-form.tsx`
   - Replace the read-only `goalType` input with a `<select>` containing:
     - `daily`
     - `weekly`
     - `monthly`
   - Use `initialData?.goalType ?? "daily"` so the same form keeps working for edit mode.
   - Update the tooltip text to remove the MVP daily-only limitation.

2. `lib/habits.ts`
   - Define a reusable `goalTypeSchema` enum for `daily`, `weekly`, and `monthly`.
   - Update `habitSchema.goalType` to use `goalTypeSchema.default("daily")`.
   - Update `updateHabitSchema.goalType` to use `goalTypeSchema.optional()`.

3. Optional validation-only database consideration
   - `prisma/schema.prisma` currently stores `goalType` as `String @default("daily")`, so no Prisma migration is required if the app accepts only the three values through validation.
   - Do not add a Prisma enum unless the user wants database-level enforcement too.

## Implementation notes

- Use a native `<select>` to match the existing UI style already used elsewhere in the app.
- Keep the label and field name as `goalType` so `FormData` parsing remains unchanged.
- Server-side Zod validation is required because the current schema only accepts `"daily"`.

## Verification

After implementation:
- Run `npm run lint`.
- Run `npm run build`.
- Manually verify the create form can choose `daily`, `weekly`, and `monthly`.
- Manually verify the selected value saves and displays on the dashboard.
