# Supabase — one place for everything

The app stores dumps, library items and recordings in a Supabase project.
Setting one up takes about ten minutes, once.

## 1. Create the project

1. [supabase.com](https://supabase.com) → **New project**. Any name, any
   region near you. Write down the database password somewhere safe (you
   will rarely need it).
2. Wait for it to finish provisioning.

## 2. Run the schema

Dashboard → **SQL Editor** → **New query** → paste the whole of
[`migrations/0001_init.sql`](migrations/0001_init.sql) → **Run**. Then the
same with [`migrations/0002_open_access.sql`](migrations/0002_open_access.sql).

`0001` creates two tables (`brain_dumps`, `library_items`) and an `audio`
bucket. `0002` opens them up so the app works **without sign-in** — anyone
with the app link can read and write. Deliberate for now (personal tool,
one person); revisit before sharing the link with anyone.

## 3. Get the two keys

Dashboard → **Project Settings** → **API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Put them in `app/.env.local` (copy `app/.env.example`). For a hosted build
(Netlify, Vercel) set the same two variables in the host's environment
settings — they are baked in at build time.

## 4. Move the old local data (if any)

If you already saved dumps in the v0.1 app on a device, open **Export** on
that device → **Move local data to Supabase**. It uploads everything,
recordings included, and leaves the local copy until you clear it.

## Files

| | |
|---|---|
| `migrations/0001_init.sql` | The schema. Idempotent — safe to run twice. |
| `migrations/0002_open_access.sql` | Opens everything to the publishable key (no sign-in). |
| `../app/src/lib/supabase.ts` | Client factory. |
| `../app/src/lib/db.ts` | Every read and write the app makes. |
| `../app/src/lib/localdb.ts` | The old IndexedDB store, kept only for migration. |
