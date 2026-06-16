# Habit Tracker

Private habit tracking app built with Next.js App Router, NextAuth credentials auth, Prisma, PostgreSQL, and Tailwind CSS.

## Setup

1. Copy `.env.example` to `.env` and fill in your database URL and auth secret.
2. Install dependencies if needed:

```bash
npm install
```

3. Apply the database schema:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` and sign up for a local account.

## Checks

```bash
npm run lint
npm run build
```
