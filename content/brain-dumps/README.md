# Brain dumps

One file per dump. Filename: `YYYY-MM-DD-HHMM-first-words.md`.

```markdown
---
id: 5f1c…                 # from the app, or any unique string
type: brain-dump
created: 2026-09-17T08:12:00.000Z
source: voice             # voice | text
status: raw               # raw | reviewed | used
chapter: 3                # 1–12, or null
tags: ["sober", "mornings"]
audio: audio/2026-09-17-0812-first-words.webm   # optional
---

# First words as a title

The dump itself. Do not clean it up on the way in. Clean-up is a separate
step, and the raw version stays.
```

`status` moves forward only: raw → reviewed → used. "Used" means it went into
a chapter, a post, or an email.

Recordings live in `audio/` next to the Markdown. They are big; keep them if
the transcript is doubtful, drop them once the text is trusted.
