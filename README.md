# Backbone

The working backbone for a new business: a program, a book, a content
strategy — twelve chapters on rebuilding your life after trauma or losing
everything.

Two halves:

- **`app/`** — a small web app for capture. Talk or type a brain dump from
  your phone or laptop, add books and sources, sort things into the twelve
  chapters, export. Installable on a phone. Works offline.
- **`content/`** — the long-term store, in plain Markdown. Dumps, library,
  chapters, tone of voice, the brief. This is what Claude reads and works with.

`design/` holds the look and feel (Studiolo theme) and a preview page.

## Run it

```bash
cd app
npm install
npm run dev        # http://localhost:3000
```

`npm run build` writes a static site to `app/out/`. Host that folder anywhere
(Netlify, Vercel, GitHub Pages). No server, no database.

## Put it on your phone

1. Host `app/out/` somewhere with HTTPS (the microphone needs it).
2. Open the URL in Safari (iPhone) or Chrome (Android).
3. Share → **Add to Home Screen**. It opens full-screen like a native app.

Live transcription works in Safari and Chrome. Firefox records audio but does
not transcribe — you still get the text box.

## Where the data lives

v0.1 is **local-first**: everything you save stays in the browser you saved
it in (IndexedDB). The phone and the laptop do not sync yet. The bridge is
**Export**:

- **Download .zip** — a `content/` folder, one Markdown file per dump and
  source, audio alongside. Unzip at the repo root and commit, or hand the zip
  to Claude and say "add this to my app".
- **Copy as text** — everything in one paste.
- **Backup / restore** — JSON, for moving between devices.

Export often. That is the rule until sync exists.

## Working with Claude

Tell Claude things like:

- "Add this to my app: …" → it writes a file into `content/brain-dumps/`.
- "Add *Atomic Habits* to the library, chapter 4" → `content/library/`.
- "Rename chapter 5 to …" → updates `content/program/12-chapters.md` and
  `app/src/lib/program.ts`.
- "Read my dumps from this week and tell me what tone of voice you hear" →
  it proposes edits to `content/voice/tone-of-voice.md`.

## Roadmap (not decided, just visible)

- Sync between devices (a small backend, or a hosted DB).
- A share target so any text on the phone can be sent straight into a dump.
- Weekly digest: Claude reads the new dumps and drafts chapter notes.
- Program delivery — community platform, email course, or both.
