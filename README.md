# Habit Tracker

A small habit-tracking app built with React, Vite, Tailwind CSS, and Supabase. The app lets each signed-in user manage their own habits safely with auth protection and row-level security.

## What this project does

- User sign-up and sign-in with Supabase Auth
- Protected routes so unauthenticated users are redirected to /login
- CRUD operations for habits using fetch instead of axios
- Simple black-and-white UI styling with Tailwind
- User-specific access patterns so one account cannot see another account's habits

## Project structure

```text
src/
  components/
    AuthPage.tsx
    HabitTracker.tsx
    ProtectedRoute.tsx
  lib/
    supabase.js
  types.ts
  App.tsx
  index.css
.env
.env.example
supabase-schema.sql
```

## Setup

1. Copy `.env.example` to `.env`
2. Add your Supabase values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the SQL from `supabase-schema.sql` inside your Supabase SQL editor
4. Start the app:

```bash
npm install
npm run dev
```

## Notes

This app is intentionally designed around per-user security. Every habit query and mutation should be scoped to the logged-in user, and the Supabase table policies should enforce that at database level.

## Screenshot

### Signed-in account → habit list

![userA](./src/assets/userA.png)

### Second account → empty habit list

![userB](./src/assets/userB.png)

### SQL Editor → both policies

![policy](./src/assets/policy.png)

### One Sentence

Without RLS, an attacker could potentially access, modify, or delete other users’ habits by bypassing the app’s frontend restrictions.
