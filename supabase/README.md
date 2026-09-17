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
[`migrations/0001_init.sql`](migrations/0001_init.sql) → **Run**.

That creates two tables (`brain_dumps`, `library_items`), a private `audio`
bucket, and row-level-security policies so only the signed-in user can see
their own data.

## 3. Get the two keys

Dashboard → **Project Settings** → **API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Put them in `app/.env.local` (copy `app/.env.example`). For a hosted build
(Netlify, Vercel) set the same two variables in the host's environment
settings — they are baked in at build time.

The anon key is safe to ship in the browser; row-level security is what
protects the data, not the key.

## 4. Make your account

Open the app → **Create account** with your email and a password. Then, in
the dashboard → **Authentication** → **Providers** → Email, turn off
**Allow new users to sign up** so nobody else can register. If "Confirm
email" is on, you will get one confirmation email first.

## 5. Move the old local data (if any)

If you already saved dumps in the v0.1 app on a device, open **Export** on
that device → **Move local data to Supabase**. It uploads everything,
recordings included, and leaves the local copy until you clear it.

## Files

| | |
|---|---|
| `migrations/0001_init.sql` | The schema. Idempotent — safe to run twice. |
| `../app/src/lib/supabase.ts` | Client factory. |
| `../app/src/lib/db.ts` | Every read and write the app makes. |
| `../app/src/lib/localdb.ts` | The old IndexedDB store, kept only for migration. |
