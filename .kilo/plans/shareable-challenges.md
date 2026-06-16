# Shareable Challenge Templates Plan

## Goal

Turn user-created challenges into portable, shareable assets that can be published, previewed publicly, shared via unique links/QR/social card, and imported into another user's account as a personalized challenge with copied habits and goals.

## Assumptions

- Build on the existing Next.js App Router + Prisma + PostgreSQL app.
- Existing private challenges live in `Challenge` and `ChallengeHabit`; habits live in `Habit` and `Log`.
- Public previews should be accessible without login.
- Importing a shared challenge requires login.
- Importing copies the template into the recipient's account; it does not link the recipient's habits to the creator's habits.
- Published templates should snapshot the creator's challenge structure so later edits to the original private challenge do not change the shared template.
- Social proof metrics should be derived from imports and imported challenge completion data where practical.
- First implementation should cover publish/share/preview/import and basic discovery; advanced remix/community moderation can follow after the core viral loop works.

## Existing project findings

- `prisma/schema.prisma` currently has `User`, `Habit`, `Log`, `Challenge`, and `ChallengeHabit`.
- `lib/challenges.ts` already contains private challenge DAL functions and DTOs.
- `app/(app)/challenges/page.tsx` is the authenticated challenge management page.
- `components/challenge-card.tsx` manages private challenge cards, including adding/removing habits.
- `app/actions/challenges.ts` contains private challenge server actions.
- `lib/session.ts` and `lib/auth.ts` provide NextAuth session helpers.
- Tailwind dark-mode classes are controlled by the `.dark` class on `html`.

## Data model changes

1. **Add `ChallengeTemplate`**
   - Fields:
     - `id String @id @default(cuid())`
     - `challengeId String` source private challenge
     - `creatorId String`
     - `title String`
     - `description String? @db.Text`
     - `durationDays Int`
     - `shareToken String @unique`
     - `slug String? @unique`
     - `status ChallengeTemplateStatus @default("draft")` enum: `draft`, `published`, `archived`
     - `publishedAt DateTime?`
     - `totalImports Int @default(0)`
     - `activeParticipants Int @default(0)`
     - `averageCompletionRate Int @default(0)`
     - `createdAt DateTime @default(now())`
     - `updatedAt DateTime @updatedAt`
   - Relations:
     - `creator User @relation(fields: [creatorId], references: [id], onDelete: Cascade)`
     - `sourceChallenge Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)`
     - `habits ChallengeTemplateHabit[]`
     - `imports ChallengeImport[]`
   - Indexes:
     - `@@index([creatorId, status])`
     - `@@index([shareToken])`
     - `@@index([slug])`

2. **Add `ChallengeTemplateHabit`**
   - Snapshot fields from the creator's habits:
     - `id String @id @default(cuid())`
     - `templateId String`
     - `name String`
     - `description String?`
     - `goalType String @default("daily")`
     - `goalCount Int @default(1)`
     - `goalUnit String @default("day")`
     - `color String @default("#2A9D8F")`
     - `sortOrder Int @default(0)`
   - Relations:
     - `template ChallengeTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)`
   - Index:
     - `@@index([templateId, sortOrder])`

3. **Add `ChallengeImport`**
   - Fields:
     - `id String @id @default(cuid())`
     - `templateId String`
     - `userId String`
     - `importedChallengeId String`
     - `startDate DateTime`
     - `endDate DateTime`
     - `status ChallengeImportStatus @default("active")` enum: `active`, `completed`, `abandoned`
     - `createdAt DateTime @default(now())`
     - `updatedAt DateTime @updatedAt`
   - Relations:
     - `template ChallengeTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)`
     - `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
     - `importedChallenge Challenge @relation(fields: [importedChallengeId], references: [id], onDelete: Cascade)`
   - Unique constraint:
     - One import per user per template: `@@unique([templateId, userId])`
   - Indexes:
     - `@@index([userId])`
     - `@@index([templateId, status])`

4. **Update `User`**
   - Add `createdTemplates ChallengeTemplate[]`
   - Add `imports ChallengeImport[]`

5. **Update `Challenge`**
   - Add `sourceTemplates ChallengeTemplate[]`
   - Add `imports ChallengeImport[]`

## Server data layer

Create or extend `lib/challenge-templates.ts` with server-only functions:

1. **Template creation/publishing**
   - `publishChallengeTemplate(userId, challengeId, input)`
     - Verify user owns the challenge.
     - Validate title, description, optional slug.
     - Snapshot every associated habit into `ChallengeTemplateHabit`.
     - Create/update a `ChallengeTemplate`.
     - Generate or preserve `shareToken`.
     - Set `status = "published"` and `publishedAt`.
     - Return template DTO.

2. **Template preview**
   - `getPublicChallengeTemplateByToken(shareToken)`
     - Only return `published` templates.
     - Include creator identity fields: name, email, image.
     - Include snapshot habits.
     - Include social proof metrics.

3. **Template discovery**
   - `getPublishedTemplates({ search, limit, cursor })`
     - Return published templates ordered by active participants and completion rate.
     - Support simple search by title/description.

4. **Import**
   - `importChallengeTemplate(userId, shareToken, startDate)`
     - Require authenticated user.
     - Fetch published template.
     - Prevent duplicate import per user/template.
     - Create new habits in recipient account from template habit snapshots.
     - Create new private `Challenge` with personalized start/end dates.
     - Link habits to the new private challenge.
     - Create `ChallengeImport`.
     - Revalidate dashboard/challenges pages.
     - Return imported private challenge DTO.

5. **Template management**
   - `getCreatorTemplates(userId)`
   - `unpublishChallengeTemplate(userId, templateId)`
   - `deleteChallengeTemplate(userId, templateId)`
   - `refreshTemplateMetrics(templateId)` optional helper for active participant/completion metrics.

## Server actions

Create `app/actions/challenge-templates.ts`:

- `publishChallengeTemplateAction(challengeId, previousState, formData)`
- `unpublishChallengeTemplateAction(previousState, formData)`
- `deleteChallengeTemplateAction(previousState, formData)`
- `importChallengeTemplateAction(previousState, formData)`
- `copyShareLinkAction(shareToken)` optional if using clipboard on server; otherwise handle in client with Web Share API.

Each action must:
- Call `requireCurrentUser()` where authentication is required.
- Validate with `zod`.
- Enforce ownership for creator-only mutations.
- Return structured `{ success?, error?, fieldErrors?, data? }`.
- Revalidate relevant paths.

## Routes and pages

1. **Authenticated challenge publish UI**
   - Extend `app/(app)/challenges/page.tsx` or add `components/challenge-publish-panel.tsx`.
   - Each private challenge card gets:
     - Publish button.
     - Share link copy button after publishing.
     - Optional QR/social card preview.
     - Unpublish/delete template controls for owner.

2. **Public preview page**
   - Add `app/(public)/share/[token]/page.tsx` or `app/share/[token]/page.tsx`.
   - Public, no auth required.
   - Displays:
     - Challenge title/description/duration.
     - Creator identity.
     - Social proof metrics:
       - active participants
       - imports
       - average completion rate
     - Full challenge structure with each habit goal.
     - Import form/button.
     - Share actions:
       - Copy link.
       - Native Web Share when available.
       - QR code if dependency is added.
   - If logged out:
     - Show "Sign in to import" CTA.
   - If logged in and not imported:
     - Show one-click import with personalized start date input.
   - If already imported:
     - Show "Already imported" and link to private challenges.

3. **Community library/discovery**
   - Add `app/(public)/challenges/discover/page.tsx` or `app/(app)/discover/page.tsx`.
   - Lists published templates ordered by social proof.
   - Optional search input.
   - Cards link to public preview pages.

4. **Creator template management**
   - Optional route `app/(app)/creator/page.tsx` for published templates, metrics, and unpublish/delete controls.
   - Can be folded into `/challenges` initially to reduce scope.

## Components

Add reusable components:

- `components/challenge-publish-panel.tsx`
  - Publish form, copy/share buttons, QR/social card preview.
- `components/challenge-share-card.tsx`
  - Visual social card for preview/share UI.
- `components/qr-code.tsx` or `components/challenge-qr.tsx`
  - Render QR if `qrcode` dependency is added.
- `components/challenge-template-card.tsx`
  - Discovery/library card.
- `components/import-challenge-form.tsx`
  - Personalized start date and import button for public preview.
- `components/social-proof-stats.tsx`
  - Active participants, imports, completion metrics.

## Sharing implementation

1. **Unique link**
   - Use `shareToken` in URL: `/share/${shareToken}`.
   - Optionally include slug for readability: `/share/${slug}-${shareToken}` if route parsing supports it.

2. **Copy link**
   - Client component uses `navigator.clipboard.writeText(window.location.origin + shareUrl)`.
   - Fallback to selectable input if clipboard unavailable.

3. **Native share**
   - Use `navigator.share()` when available.
   - Fallback to copy link.

4. **QR code**
   - Recommended dependency: `qrcode`.
   - Render QR for the share URL on the private publish panel and public preview.

5. **Social card**
   - Public preview page should include Open Graph metadata:
     - title
     - description
     - creator
     - duration
     - habit count
   - Visual social card component can be screenshotted/shared; full dynamic OG image generation can be a later enhancement.

## Import behavior

When a recipient imports:

1. Validate authenticated user.
2. Fetch published template by `shareToken`.
3. Create new habits in recipient account from `ChallengeTemplateHabit` snapshots.
   - Preserve name, description, goalType, goalCount, goalUnit, color.
4. Create a new private `Challenge`.
   - `name = template.title`
   - `description = template.description`
   - `startDate = selected personalized start date or today`
   - `endDate = startDate + durationDays - 1`
   - `active = true`
5. Create `ChallengeHabit` links in the same order.
6. Create `ChallengeImport`.
7. Increment template import counters or recompute metrics.
8. Redirect to `/challenges` or the imported challenge card.

## Metrics and social proof

- `totalImports`: count `ChallengeImport` rows.
- `activeParticipants`: count `ChallengeImport` rows with `status = "active"`.
- `averageCompletionRate`:
  - Preferred: compute from imported challenges' habits and logs.
  - Simpler first version: store/update aggregate after import and after completion toggles.
- Metrics should be public on preview/discovery pages.
- Completion toggles in `lib/habits.ts` should optionally refresh affected template metrics when the habit belongs to an imported challenge.

## Security and privacy

- Public preview only exposes published templates.
- Draft/archived templates return 404 publicly.
- Only template creator can unpublish/delete.
- Import action checks template is published.
- Import creates independent copies; recipients cannot affect creator's original challenge.
- Creator identity should show `User.name` first, with `User.email` fallback.
- Do not expose private challenge IDs in public URLs; use `shareToken`.
- Handle deleted source challenges by keeping template snapshots intact.

## Validation

- Zod schemas for:
  - publish template title/description/slug
  - import start date
  - template management IDs
- Prisma ownership checks for all creator-only mutations.
- Auth checks for all private mutations and imports.
- Public preview must not require auth.

## Migration and generation

- Add Prisma enums/models/relations.
- Run:
  - `npx prisma format`
  - `npx prisma migrate dev --name add_shareable_challenge_templates`
  - `npx prisma generate`
- If QR support is added, update `package.json` and lockfile via `npm install qrcode` and `npm install -D @types/qrcode` if needed.

## Verification

Run:

```bash
npm run lint
npm run build
git diff --check
```

Manual checks:

- Create a private challenge with multiple habits.
- Publish it as a template.
- Copy/share the unique link.
- Open the link while logged out and confirm public preview renders.
- Confirm social proof metrics render.
- Log in as a different user and import the template.
- Confirm imported habits and challenge appear in `/challenges`.
- Confirm imported challenge has personalized start/end dates.
- Confirm recipient edits do not affect creator's original challenge.
- Confirm unpublish/delete only works for creator.
- Confirm copy-link, native share, and social card actions work where supported.

## Acceptance criteria

- Creators can publish a private challenge as a persistent shareable template.
- Published templates expose title, description, duration, creator identity, social proof, and all habit goals on a public preview page.
- Recipients can import a published template into their own account with one click.
- Importing creates independent habits and a personalized private challenge.
- Unique share links work without authentication.
- Link copy, native share, and a visual social card are available from the publish/preview UI.
- All mutations are authenticated, authorized, and validated.
- Project passes lint, build, and whitespace checks.

## Decisions confirmed by user

1. Creator identity shows `User.name` first, with `User.email` fallback.
2. First version includes direct sharing/import only; no community discovery library yet.
3. First version implements link copy, native share, and a visual social card before QR code support.
4. Imported challenges use a personalized start date selected by the recipient or defaulted to today.
