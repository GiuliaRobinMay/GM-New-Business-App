/**
 * Turns records into the Markdown files that live under `content/` in the
 * repo. One file per brain dump, one per library item, plus an index.
 *
 * Keep this boring: YAML front matter, then the text. Claude reads these.
 */
import type { BrainDump, LibraryItem } from "./types";
import { chapterTitle } from "./program";

function yamlStr(s: string): string {
  return JSON.stringify(s ?? "");
}

function slug(s: string, max = 48): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return base || "untitled";
}

function datePart(iso: string): string {
  return iso.slice(0, 10);
}

function timePart(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}${d.getMinutes().toString().padStart(2, "0")}`;
}

export function dumpBasename(d: BrainDump): string {
  return `${datePart(d.createdAt)}-${timePart(d.createdAt)}-${slug(d.title || d.body.slice(0, 40))}`;
}

export function dumpFilename(d: BrainDump): string {
  return `${dumpBasename(d)}.md`;
}

export function dumpToMarkdown(d: BrainDump, audioFile?: string): string {
  const lines = [
    "---",
    `id: ${d.id}`,
    `type: brain-dump`,
    `created: ${d.createdAt}`,
    `source: ${d.source}`,
    `status: ${d.status}`,
    `chapter: ${d.chapter ?? "null"}`,
    `tags: [${d.tags.map(yamlStr).join(", ")}]`,
    d.audioDurationSec != null ? `audio_seconds: ${d.audioDurationSec}` : null,
    audioFile ? `audio: ${audioFile}` : null,
    "---",
    "",
    `# ${d.title || "Untitled"}`,
    "",
    d.body.trim(),
    "",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export function libraryFilename(i: LibraryItem): string {
  return `${i.kind}-${slug(i.title)}.md`;
}

export function libraryToMarkdown(i: LibraryItem): string {
  const lines = [
    "---",
    `id: ${i.id}`,
    `type: library`,
    `kind: ${i.kind}`,
    `title: ${yamlStr(i.title)}`,
    `author: ${yamlStr(i.author)}`,
    `url: ${yamlStr(i.url)}`,
    `status: ${i.status}`,
    `chapter: ${i.chapter ?? "null"}`,
    `tags: [${i.tags.map(yamlStr).join(", ")}]`,
    `added: ${i.createdAt}`,
    "---",
    "",
    `# ${i.title}`,
    i.author ? `*${i.author}*` : null,
    "",
    i.note.trim(),
    "",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export function indexMarkdown(dumps: BrainDump[], library: LibraryItem[]): string {
  const byChapter = new Map<number | null, BrainDump[]>();
  for (const d of dumps) {
    const list = byChapter.get(d.chapter) ?? [];
    list.push(d);
    byChapter.set(d.chapter, list);
  }
  const keys = [...byChapter.keys()].sort((a, b) => (a ?? 99) - (b ?? 99));
  const out: string[] = [
    `# Export — ${new Date().toISOString().slice(0, 10)}`,
    "",
    `${dumps.length} brain dumps · ${library.length} library items`,
    "",
    "## Brain dumps by chapter",
    "",
  ];
  for (const k of keys) {
    out.push(`### ${chapterTitle(k)}`, "");
    for (const d of byChapter.get(k) ?? []) {
      out.push(`- [${d.title || "Untitled"}](brain-dumps/${dumpFilename(d)}) — ${datePart(d.createdAt)} · ${d.status}`);
    }
    out.push("");
  }
  out.push("## Library", "");
  for (const i of library) {
    out.push(`- [${i.title}](library/${libraryFilename(i)})${i.author ? ` — ${i.author}` : ""} · ${i.status}`);
  }
  out.push("");
  return out.join("\n");
}

/** Everything in one text blob — handy for pasting straight into a chat. */
export function allAsOneMarkdown(dumps: BrainDump[], library: LibraryItem[]): string {
  const parts = [indexMarkdown(dumps, library)];
  for (const d of dumps) parts.push("\n\n---\n\n" + dumpToMarkdown(d));
  for (const i of library) parts.push("\n\n---\n\n" + libraryToMarkdown(i));
  return parts.join("");
}
