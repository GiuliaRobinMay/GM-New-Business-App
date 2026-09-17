"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MicIcon, StopIcon } from "@/components/Icons";
import { ChapterSelect, DumpRow, TagInput, Toast, useToast } from "@/components/ui";
import { listDumps, putAudio, putDump } from "@/lib/db";
import { deriveTitle, isToday } from "@/lib/format";
import { newId, nowIso } from "@/lib/id";
import type { BrainDump } from "@/lib/types";
import { formatDuration, useVoiceCapture } from "@/lib/useVoiceCapture";

interface PendingAudio {
  blob: Blob;
  mimeType: string;
  durationSec: number;
}

export default function CapturePage() {
  const voice = useVoiceCapture();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [chapter, setChapter] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingAudio | null>(null);
  const [today, setToday] = useState<BrainDump[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  const refresh = useCallback(async () => {
    const all = await listDumps();
    setToday(all.filter((d) => isToday(d.createdAt)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const live = voice.state === "recording";
  const busy = voice.state === "requesting" || voice.state === "stopping";

  const toggleRecord = async () => {
    if (voice.state === "idle") {
      await voice.start();
      return;
    }
    if (voice.state === "recording") {
      const r = await voice.stop();
      if (r.transcript) setBody((b) => (b.trim() ? b.trimEnd() + "\n\n" : "") + r.transcript);
      if (r.blob) setPending({ blob: r.blob, mimeType: r.mimeType, durationSec: r.durationSec });
    }
  };

  const reset = () => {
    setBody("");
    setTitle("");
    setTags([]);
    setChapter(null);
    setPending(null);
  };

  const canSave = body.trim().length > 0 || pending !== null;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const id = newId();
      const ts = nowIso();
      let audioId: string | null = null;
      if (pending) {
        audioId = await putAudio({ id, blob: pending.blob, mimeType: pending.mimeType, durationSec: pending.durationSec });
      }
      const text = body.trim();
      await putDump({
        id,
        createdAt: ts,
        updatedAt: ts,
        title: title.trim() || deriveTitle(text) || "Voice note",
        body: text,
        tags,
        chapter,
        source: pending ? "voice" : "text",
        audioId,
        audioDurationSec: pending?.durationSec ?? null,
        status: "raw",
      });
      reset();
      showToast("Saved");
      await refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Capture</h1>

      <section className="card card--pad accent-violet">
        <p className="eyebrow">Brain dump</p>
        <div className="mt-4" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            className={`record ${live ? "record--live" : ""}`}
            onClick={toggleRecord}
            disabled={busy}
            aria-label={live ? "Stop recording" : "Start recording"}
          >
            {live ? <StopIcon /> : <MicIcon />}
          </button>
          <p className="muted">
            {live ? (
              <>
                <span className="live-dot" /> Recording · {formatDuration(voice.elapsedSec)}
              </>
            ) : voice.state === "requesting" ? (
              "Asking for the microphone…"
            ) : voice.state === "stopping" ? (
              "Finishing…"
            ) : (
              "Tap to talk. Tap again to stop."
            )}
          </p>
        </div>
        {(live || voice.liveText) && (
          <div className="transcript mt-4" data-placeholder="Listening…">
            {voice.liveText}
          </div>
        )}
        {!voice.supportsTranscript && (
          <p className="help mt-3">This browser records audio but cannot transcribe live. Chrome or Safari can.</p>
        )}
        {voice.error && (
          <p className="help mt-3" style={{ color: "var(--brand-red)" }}>
            {voice.error}
          </p>
        )}
      </section>

      <section className="card card--pad">
        <label className="label" htmlFor="body">
          Text
        </label>
        <textarea
          id="body"
          className="field"
          placeholder="Or just type. Anything. It does not need to make sense yet."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
        />
        {pending && (
          <p className="muted mt-2 row" style={{ gap: 8 }}>
            <MicIcon width={14} height={14} />
            Voice note attached · {formatDuration(pending.durationSec)}
            <button className="btn btn--quiet" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => setPending(null)}>
              Remove
            </button>
          </p>
        )}

        <div className="grid grid--2 mt-4">
          <div>
            <label className="label" htmlFor="title">
              Title <span className="muted">(optional)</span>
            </label>
            <input id="title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leave empty to use the first line" />
          </div>
          <div>
            <label className="label">Chapter</label>
            <ChapterSelect value={chapter} onChange={setChapter} />
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Tags</label>
          <TagInput value={tags} onChange={setTags} />
        </div>

        <div className="row mt-5" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn--quiet" onClick={reset} disabled={!canSave && !title && tags.length === 0}>
            Clear
          </button>
          <button className="btn btn--primary" onClick={save} disabled={!canSave || saving}>
            Save dump
          </button>
        </div>
      </section>

      <section>
        <div className="row">
          <h2 className="section-title grow">Today</h2>
          <Link className="link" href="/dumps">
            All dumps
          </Link>
        </div>
        {today.length === 0 ? (
          <div className="empty mt-3">Nothing yet today. Say one thing.</div>
        ) : (
          <div className="stack-sm mt-3">
            {today.map((d, i) => (
              <DumpRow key={d.id} dump={d} index={i} href={`/dumps#${d.id}`} />
            ))}
          </div>
        )}
      </section>

      <Toast msg={toast} />
    </>
  );
}
