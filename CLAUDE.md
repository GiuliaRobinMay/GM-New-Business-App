# CLAUDE.md

Working notes for Claude on this repo. Read before doing anything.

## What this is

Giulia's backbone for a new business: a 12-chapter program / book / content
strategy about rebuilding your life after trauma or losing everything. See
`content/business/brief.md` for the brief in her words.

Two halves: `app/` (Next.js capture app, static export, data in Supabase)
and `content/` (Markdown store — what Claude reads and works with).
`design/` is the theme. `supabase/` is the schema.

## When Giulia says "add this to my app"

She means `content/`, not the code.

- A thought, a story, a rant → `content/brain-dumps/YYYY-MM-DD-HHMM-first-words.md`
  using the front matter in `content/brain-dumps/README.md`. Keep her words.
  `status: raw`. Guess the chapter if it is obvious, otherwise `chapter: null`.
- A book, article, person, tool → `content/library/<kind>-<slug>.md` per
  `content/library/README.md`.
- Something about how she talks → `content/voice/tone-of-voice.md`.
- A decision about the business → `content/business/`.
- A change to the twelve chapters → edit **both** `content/program/12-chapters.md`
  and `app/src/lib/program.ts`. They must match.

Commit each addition. Do not rewrite her dumps into polished prose unless
asked; the raw version is the asset.

## App

```bash
cd app && npm install
npm run dev          # local
npm run typecheck    # tsc --noEmit
npm run build        # static export → app/out/
node scripts/make-icons.mjs   # only after changing the brand colour
```

- Next.js 15, App Router, TypeScript, React 19. `output: "export"` — no
  server code, no API routes. Every page is `"use client"` and talks to
  Supabase via `src/lib/db.ts` (the only file that knows the row shapes).
  `src/lib/localdb.ts` is the old IndexedDB store, kept solely for the
  one-time migration on the Export page — do not add new callers.
- Needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (`app/.env.local`, never committed). Without them the app renders a
  setup card instead of crashing.
- **No sign-in** (Giulia's decision, 2026-09-17). `0002_open_access.sql`
  lets the publishable key read and write everything; `AuthGate.tsx` only
  checks that Supabase is configured. Do not add auth back unless asked;
  when asked, the email + password LoginCard is in git history (commit
  a2d292a).
- Schema changes: add a new numbered file under `supabase/migrations/`,
  never edit `0001_init.sql` after it has run somewhere.
- No Tailwind. Plain CSS. `app/src/app/globals.css` imports
  `design/studiolo-theme.css` and adds only layout (phone shell, record
  button, drawer). Do not restyle in component files beyond inline spacing.
- Voice capture is `src/lib/useVoiceCapture.ts`: MediaRecorder for audio,
  Web Speech API for the live transcript. Transcript is a draft, always
  editable.
- Export formats are in `src/lib/markdown.ts` and must stay in step with the
  READMEs in `content/`.

## Design rules (from design/studiolo-theme.css — do not drift)

- Four colours only: violet `#543ff8`, red `#ed1748`, green `#20a375`,
  orange `#e47d17`. Everything else is grey.
- Colour is decoration, not meaning. Accents rotate down a list
  (`accentFor(i)`) so neighbours differ. Exceptions the theme allows: green =
  done, orange = in progress, red = destructive / high priority, violet =
  primary action.
- Borders are 1px `--hairline` and visible. No shadows for structure.
- A list row is: icon chip → 15px semibold title → one 13px grey line. Never
  a third line.
- Type scale 26 / 19 / 15 / 14 / 13 / 12 / 11. Radius 16 / 12 / 10 / pill.

## Git

Branch: whatever the session says. Commit small, describe what changed for
Giulia, not for the compiler.
