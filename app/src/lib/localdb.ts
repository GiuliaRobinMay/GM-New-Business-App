/**
 * The v0.1 store: IndexedDB in the browser. Kept only so the Export page can
 * move anything saved on a device up to Supabase (see db.ts). Nothing else
 * should import from here.
 */
import type { AudioClip, BrainDump, LibraryItem } from "./types";

const DB_NAME = "gm-new-business";
const DB_VERSION = 1;

type StoreName = "dumps" | "library" | "audio";

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("dumps")) {
        db.createObjectStore("dumps", { keyPath: "id" }).createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("library")) {
        db.createObjectStore("library", { keyPath: "id" }).createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T> | IDBRequest<T[]> | IDBRequest<undefined>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ---- Brain dumps --------------------------------------------------------

export async function listDumps(): Promise<BrainDump[]> {
  const all = await tx<BrainDump[]>("dumps", "readonly", (s) => s.getAll());
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getDump(id: string): Promise<BrainDump | undefined> {
  return tx<BrainDump | undefined>("dumps", "readonly", (s) => s.get(id));
}

export function putDump(d: BrainDump): Promise<unknown> {
  return tx("dumps", "readwrite", (s) => s.put(d));
}

export async function deleteDump(id: string): Promise<void> {
  const d = await getDump(id);
  await tx("dumps", "readwrite", (s) => s.delete(id));
  if (d?.audioId) await deleteAudio(d.audioId);
}

// ---- Library ------------------------------------------------------------

export async function listLibrary(): Promise<LibraryItem[]> {
  const all = await tx<LibraryItem[]>("library", "readonly", (s) => s.getAll());
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function putLibraryItem(i: LibraryItem): Promise<unknown> {
  return tx("library", "readwrite", (s) => s.put(i));
}

export function deleteLibraryItem(id: string): Promise<unknown> {
  return tx("library", "readwrite", (s) => s.delete(id));
}

// ---- Audio --------------------------------------------------------------

export function putAudio(clip: AudioClip): Promise<unknown> {
  return tx("audio", "readwrite", (s) => s.put(clip));
}

export function getAudio(id: string): Promise<AudioClip | undefined> {
  return tx<AudioClip | undefined>("audio", "readonly", (s) => s.get(id));
}

export function deleteAudio(id: string): Promise<unknown> {
  return tx("audio", "readwrite", (s) => s.delete(id));
}

// ---- Bulk (import / wipe) ----------------------------------------------

export async function importAll(data: { dumps?: BrainDump[]; library?: LibraryItem[] }): Promise<void> {
  for (const d of data.dumps ?? []) await putDump(d);
  for (const i of data.library ?? []) await putLibraryItem(i);
}

export async function wipeAll(): Promise<void> {
  await tx("dumps", "readwrite", (s) => s.clear());
  await tx("library", "readwrite", (s) => s.clear());
  await tx("audio", "readwrite", (s) => s.clear());
}
