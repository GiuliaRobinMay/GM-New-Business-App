/**
 * Data model for v0.1.
 *
 * Everything is designed so it can be written out as plain Markdown with a
 * small front-matter block and dropped into `content/` in the repo — the repo
 * is the long-term store that Claude reads and works with. IndexedDB in the
 * browser is only the capture buffer.
 */

export type DumpStatus = "raw" | "reviewed" | "used";
export type DumpSource = "voice" | "text";

export interface BrainDump {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  title: string; // short, often auto-derived from first line
  body: string; // transcript or typed text
  tags: string[];
  chapter: number | null; // 1–12, or null if not yet placed
  source: DumpSource;
  audioId: string | null; // key into the audio store
  audioDurationSec: number | null;
  status: DumpStatus;
}

export type LibraryKind =
  | "book"
  | "article"
  | "video"
  | "podcast"
  | "course"
  | "person"
  | "tool"
  | "other";

export type LibraryStatus = "to-read" | "reading" | "done";

export interface LibraryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  kind: LibraryKind;
  title: string;
  author: string;
  url: string;
  note: string; // why it matters / what I took from it
  tags: string[];
  chapter: number | null;
  status: LibraryStatus;
}

export interface AudioClip {
  id: string;
  blob: Blob;
  mimeType: string;
  durationSec: number;
}

export interface Chapter {
  n: number;
  title: string;
  question: string; // the question this chapter answers for the reader
}
