/**
 * Every read and write the app makes, against Supabase.
 *
 * Rows are snake_case in Postgres and camelCase in the app; the two mapping
 * functions below are the only place that knows both. Audio lives in the
 * `audio` bucket under shared/<id>.<ext>; `audioId` on a dump is that path.
 *
 * No sign-in for now (see supabase/migrations/0002_open_access.sql): the
 * publishable key alone reads and writes everything.
 */
import { getSupabase } from "./supabase";
import type { AudioClip, BrainDump, DumpSource, DumpStatus, LibraryItem, LibraryKind, LibraryStatus } from "./types";

function client() {
  const s = getSupabase();
  if (!s) throw new Error("Supabase is not configured. See supabase/README.md.");
  return s;
}

/** Folder inside the audio bucket. One folder while there is no sign-in. */
const AUDIO_FOLDER = "shared";

// ---- Row shapes -----------------------------------------------------------

interface DumpRow {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  body: string;
  tags: string[];
  chapter: number | null;
  source: DumpSource;
  audio_path: string | null;
  audio_duration_sec: number | null;
  status: DumpStatus;
}

interface LibraryRow {
  id: string;
  created_at: string;
  updated_at: string;
  kind: LibraryKind;
  title: string;
  author: string;
  url: string;
  note: string;
  tags: string[];
  chapter: number | null;
  status: LibraryStatus;
}

const fromDumpRow = (r: DumpRow): BrainDump => ({
  id: r.id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  title: r.title,
  body: r.body,
  tags: r.tags ?? [],
  chapter: r.chapter,
  source: r.source,
  audioId: r.audio_path,
  audioDurationSec: r.audio_duration_sec,
  status: r.status,
});

const toDumpRow = (d: BrainDump): DumpRow => ({
  id: d.id,
  created_at: d.createdAt,
  updated_at: d.updatedAt,
  title: d.title,
  body: d.body,
  tags: d.tags,
  chapter: d.chapter,
  source: d.source,
  audio_path: d.audioId,
  audio_duration_sec: d.audioDurationSec,
  status: d.status,
});

const fromLibraryRow = (r: LibraryRow): LibraryItem => ({
  id: r.id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  kind: r.kind,
  title: r.title,
  author: r.author,
  url: r.url,
  note: r.note,
  tags: r.tags ?? [],
  chapter: r.chapter,
  status: r.status,
});

const toLibraryRow = (i: LibraryItem): LibraryRow => ({
  id: i.id,
  created_at: i.createdAt,
  updated_at: i.updatedAt,
  kind: i.kind,
  title: i.title,
  author: i.author,
  url: i.url,
  note: i.note,
  tags: i.tags,
  chapter: i.chapter,
  status: i.status,
});

// ---- Brain dumps ----------------------------------------------------------

export async function listDumps(): Promise<BrainDump[]> {
  const { data, error } = await client().from("brain_dumps").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DumpRow[]).map(fromDumpRow);
}

export async function getDump(id: string): Promise<BrainDump | undefined> {
  const { data, error } = await client().from("brain_dumps").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromDumpRow(data as DumpRow) : undefined;
}

export async function putDump(d: BrainDump): Promise<void> {
  const { error } = await client().from("brain_dumps").upsert(toDumpRow(d));
  if (error) throw error;
}

export async function deleteDump(id: string): Promise<void> {
  const d = await getDump(id);
  const { error } = await client().from("brain_dumps").delete().eq("id", id);
  if (error) throw error;
  if (d?.audioId) await deleteAudio(d.audioId);
}

// ---- Library --------------------------------------------------------------

export async function listLibrary(): Promise<LibraryItem[]> {
  const { data, error } = await client().from("library_items").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as LibraryRow[]).map(fromLibraryRow);
}

export async function putLibraryItem(i: LibraryItem): Promise<void> {
  const { error } = await client().from("library_items").upsert(toLibraryRow(i));
  if (error) throw error;
}

export async function deleteLibraryItem(id: string): Promise<void> {
  const { error } = await client().from("library_items").delete().eq("id", id);
  if (error) throw error;
}

// ---- Audio ----------------------------------------------------------------

function extFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

/** Uploads a recording and returns its storage path (store that as audioId). */
export async function putAudio(clip: AudioClip): Promise<string> {
  const path = `${AUDIO_FOLDER}/${clip.id}.${extFor(clip.mimeType)}`;
  const { error } = await client().storage.from("audio").upload(path, clip.blob, {
    contentType: clip.mimeType || "application/octet-stream",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function getAudio(path: string): Promise<AudioClip | undefined> {
  const { data, error } = await client().storage.from("audio").download(path);
  if (error || !data) return undefined;
  return { id: path, blob: data, mimeType: data.type, durationSec: 0 };
}

/** A short-lived URL for the <audio> element. */
export async function getAudioUrl(path: string): Promise<string | null> {
  const { data, error } = await client().storage.from("audio").createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteAudio(path: string): Promise<void> {
  await client().storage.from("audio").remove([path]);
}

// ---- Bulk (restore / wipe) -----------------------------------------------

export async function importAll(data: { dumps?: BrainDump[]; library?: LibraryItem[] }): Promise<void> {
  if (data.dumps?.length) {
    const { error } = await client().from("brain_dumps").upsert(data.dumps.map(toDumpRow));
    if (error) throw error;
  }
  if (data.library?.length) {
    const { error } = await client().from("library_items").upsert(data.library.map(toLibraryRow));
    if (error) throw error;
  }
}

export async function wipeAll(): Promise<void> {
  const s = client();
  const { data: files } = await s.storage.from("audio").list(AUDIO_FOLDER, { limit: 1000 });
  if (files?.length) await s.storage.from("audio").remove(files.map((f) => `${AUDIO_FOLDER}/${f.name}`));
  const a = await s.from("brain_dumps").delete().not("id", "is", null);
  if (a.error) throw a.error;
  const b = await s.from("library_items").delete().not("id", "is", null);
  if (b.error) throw b.error;
}
