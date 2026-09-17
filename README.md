# Backbone

The working backbone for a new business: a program, a book, a content
strategy — twelve chapters on rebuilding your life after trauma or losing
everything.

Two halves:

- **`app/`** — a small web app for capture. Talk or type a brain dump from
  your phone or laptop, add books and sources, sort things into the twelve
  chapters, export. Installable on a phone. Everything is saved to one
  Supabase project, so phone and laptop see the same thing.
- **`content/`** — the long-term store, in plain Markdown. Dumps, library,
  chapters, tone of voice, the brief. This is what Claude reads and works with.

`design/` holds the look and feel (Studiolo theme) and a preview page.
`supabase/` holds the database schema and setup steps.

## Run it

```bash
cd app
npm install
cp .env.example .env.local   # then paste your Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

First time: follow `supabase/README.md` (create project, run the two SQL
files, paste the keys). Ten minutes, once.

`npm run build` writes a static site to `app/out/`. Host that folder anywhere
(it lives on Vercel: root directory `app`, framework Next.js) with the same
two `NEXT_PUBLIC_SUPABASE_*` variables in the host's environment settings.
No server of your own.

## Put it on your phone

1. Host `app/out/` somewhere with HTTPS (the microphone needs it).
2. Open the URL in Safari (iPhone) or Chrome (Android).
3. Share → **Add to Home Screen**. It opens full-screen like a native app.

Live transcription works in Safari and Chrome. Firefox records audio but does
not transcribe — you still get the text box.

## Where the data lives

In **Supabase**: two tables (`brain_dumps`, `library_items`) and an `audio`
bucket for recordings. There is no sign-in — open the link on any device
and it is all there. That also means anyone with the link can read and
write; fine for a private tool, something to revisit before sharing it.

**Export** is how it gets into the repo, where Claude works with it:

- **Download .zip** — a `content/` folder, one Markdown file per dump and
  source, audio alongside. Unzip at the repo root and commit, or hand the zip
  to Claude and say "add this to my app".
- **Copy as text** — everything in one paste.
- **Backup / restore** — JSON, belt and braces.

If a device still holds dumps from the v0.1 local-only app, Export shows a
**Move local data to Supabase** button.

## Working with Claude

Tell Claude things like:

- "Add this to my app: …" → it writes a file into `content/brain-dumps/`.
- "Add *Atomic Habits* to the library, chapter 4" → `content/library/`.
- "Rename chapter 5 to …" → updates `content/program/12-chapters.md` and
  `app/src/lib/program.ts`.
- "Read my dumps from this week and tell me what tone of voice you hear" →
  it proposes edits to `content/voice/tone-of-voice.md`.

## Roadmap (not decided, just visible)

- Offline capture with a sync queue (right now saving needs a connection).
- A share target so any text on the phone can be sent straight into a dump.
- Weekly digest: Claude reads the new dumps and drafts chapter notes.
- Program delivery — community platform, email course, or both.
