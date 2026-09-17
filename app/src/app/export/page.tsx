"use client";

import { useRef, useState } from "react";
import { Toast, useToast } from "@/components/ui";
import { getAudio, importAll, listDumps, listLibrary, wipeAll } from "@/lib/db";
import {
  allAsOneMarkdown,
  dumpBasename,
  dumpFilename,
  dumpToMarkdown,
  indexMarkdown,
  libraryFilename,
  libraryToMarkdown,
} from "@/lib/markdown";
import type { BrainDump, LibraryItem } from "@/lib/types";
import { buildZip, downloadBlob, type ZipEntry } from "@/lib/zip";

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function audioExt(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

async function buildContentZip(): Promise<{ blob: Blob; dumps: number; library: number }> {
  const [dumps, library] = await Promise.all([listDumps(), listLibrary()]);
  const entries: ZipEntry[] = [{ name: "content/INDEX.md", data: indexMarkdown(dumps, library) }];

  for (const d of dumps) {
    let audioFile: string | undefined;
    if (d.audioId) {
      const clip = await getAudio(d.audioId);
      if (clip) {
        audioFile = `audio/${dumpBasename(d)}.${audioExt(clip.mimeType)}`;
        entries.push({ name: `content/brain-dumps/${audioFile}`, data: new Uint8Array(await clip.blob.arrayBuffer()) });
      }
    }
    entries.push({ name: `content/brain-dumps/${dumpFilename(d)}`, data: dumpToMarkdown(d, audioFile) });
  }
  for (const i of library) {
    entries.push({ name: `content/library/${libraryFilename(i)}`, data: libraryToMarkdown(i) });
  }
  return { blob: buildZip(entries), dumps: dumps.length, library: library.length };
}

export default function ExportPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (label: string, fn: () => Promise<string>) => {
    if (busy) return;
    setBusy(label);
    try {
      showToast(await fn());
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const downloadZip = () =>
    run("zip", async () => {
      const { blob, dumps, library } = await buildContentZip();
      downloadBlob(blob, `backbone-content-${stamp()}.zip`);
      return `${dumps} dumps, ${library} sources`;
    });

  const copyText = () =>
    run("copy", async () => {
      const [dumps, library] = await Promise.all([listDumps(), listLibrary()]);
      await navigator.clipboard.writeText(allAsOneMarkdown(dumps, library));
      return "Copied";
    });

  const downloadText = () =>
    run("text", async () => {
      const [dumps, library] = await Promise.all([listDumps(), listLibrary()]);
      downloadBlob(new Blob([allAsOneMarkdown(dumps, library)], { type: "text/markdown" }), `backbone-${stamp()}.md`);
      return "Downloaded";
    });

  const downloadJson = () =>
    run("json", async () => {
      const [dumps, library] = await Promise.all([listDumps(), listLibrary()]);
      const payload = { version: 1, exportedAt: new Date().toISOString(), dumps, library };
      downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `backbone-backup-${stamp()}.json`);
      return "Backup downloaded";
    });

  const restore = (file: File) =>
    run("restore", async () => {
      const parsed = JSON.parse(await file.text()) as { dumps?: BrainDump[]; library?: LibraryItem[] };
      const dumps = Array.isArray(parsed.dumps) ? parsed.dumps : [];
      const library = Array.isArray(parsed.library) ? parsed.library : [];
      await importAll({ dumps, library });
      return `Restored ${dumps.length} dumps, ${library.length} sources`;
    });

  const wipe = () =>
    run("wipe", async () => {
      if (!window.confirm("Delete everything on this device? Export first if you have not.")) return "Kept";
      await wipeAll();
      return "Wiped";
    });

  return (
    <>
      <h1 className="page-title">Export</h1>

      <section className="card card--pad accent-violet">
        <p className="eyebrow">Hand it to Claude</p>
        <p className="section-title mt-2">Markdown folder</p>
        <p className="muted mt-2" style={{ maxWidth: 640 }}>
          One file per dump, one per source, audio alongside, and an index — laid out exactly like <code>content/</code>{" "}
          in the repo. Unzip it into the repo and commit, or drop the zip into a chat and say “add this to my app”.
        </p>
        <div className="row mt-4">
          <button className="btn btn--primary" onClick={downloadZip} disabled={busy !== null}>
            {busy === "zip" ? "Building…" : "Download .zip"}
          </button>
        </div>
      </section>

      <section className="card card--pad">
        <p className="eyebrow">Quick</p>
        <p className="section-title mt-2">Everything as one text</p>
        <p className="muted mt-2">For pasting straight into a conversation. No audio.</p>
        <div className="row mt-4">
          <button className="btn btn--ghost" onClick={copyText} disabled={busy !== null}>
            Copy to clipboard
          </button>
          <button className="btn btn--ghost" onClick={downloadText} disabled={busy !== null}>
            Download .md
          </button>
        </div>
      </section>

      <section className="card card--pad">
        <p className="eyebrow">Safety</p>
        <p className="section-title mt-2">Backup and restore</p>
        <p className="muted mt-2">
          A JSON copy of every dump and source. Restoring merges by id, so it is safe to load the same file twice. Audio
          is only in the zip above.
        </p>
        <div className="row mt-4">
          <button className="btn btn--ghost" onClick={downloadJson} disabled={busy !== null}>
            Download backup
          </button>
          <button className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
            Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) restore(f);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="card card--pad">
        <p className="eyebrow">This device</p>
        <p className="section-title mt-2">Start over</p>
        <p className="muted mt-2">Removes every dump, source and recording stored in this browser. The repo is untouched.</p>
        <div className="row mt-4">
          <button className="btn btn--danger" onClick={wipe} disabled={busy !== null}>
            Wipe local data
          </button>
        </div>
      </section>

      <Toast msg={toast} />
    </>
  );
}
