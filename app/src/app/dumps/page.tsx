"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchIcon } from "@/components/Icons";
import { AudioPlayer, ChapterSelect, Drawer, DumpRow, TagInput, Toast, useToast } from "@/components/ui";
import { deleteDump, listDumps, putDump } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { nowIso } from "@/lib/id";
import type { BrainDump, DumpStatus } from "@/lib/types";

type StatusFilter = "all" | DumpStatus;
type ChapterFilter = "all" | "none" | number;

const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "raw", label: "Raw" },
  { key: "reviewed", label: "Reviewed" },
  { key: "used", label: "Used" },
];

export default function DumpsPage() {
  const [dumps, setDumps] = useState<BrainDump[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [chapter, setChapter] = useState<ChapterFilter>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  const refresh = useCallback(async () => setDumps(await listDumps()), []);

  useEffect(() => {
    refresh();
    // /dumps#<id> opens a dump; /dumps#chapter-3 pre-filters (from the Program page).
    const h = window.location.hash.slice(1);
    if (h.startsWith("chapter-")) {
      const n = h.slice(8);
      setChapter(n === "none" ? "none" : Number(n));
    } else if (h) {
      setOpenId(h);
    }
  }, [refresh]);

  const needle = q.trim().toLowerCase();
  const filtered = dumps.filter((d) => {
    if (status !== "all" && d.status !== status) return false;
    if (chapter === "none" && d.chapter !== null) return false;
    if (typeof chapter === "number" && d.chapter !== chapter) return false;
    if (needle) {
      const hay = `${d.title}\n${d.body}\n${d.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const open = openId ? dumps.find((d) => d.id === openId) ?? null : null;

  return (
    <>
      <div className="row">
        <h1 className="page-title grow">Brain dumps</h1>
        <span className="badge">{dumps.length}</span>
      </div>

      <section className="stack-sm">
        <div className="row" style={{ position: "relative" }}>
          <SearchIcon width={16} height={16} style={{ position: "absolute", left: 12, color: "var(--faint)" }} />
          <input
            className="field"
            style={{ paddingLeft: 36 }}
            placeholder="Search dumps…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="filters">
          <div className="wrap grow">
            {STATUS_CHIPS.map((c) => (
              <button key={c.key} className={`chip ${status === c.key ? "chip--active" : ""}`} onClick={() => setStatus(c.key)}>
                {c.label}
              </button>
            ))}
          </div>
          <select
            className="field filters__select"
            value={chapter === "all" ? "all" : chapter === "none" ? "none" : String(chapter)}
            onChange={(e) => {
              const v = e.target.value;
              setChapter(v === "all" ? "all" : v === "none" ? "none" : Number(v));
            }}
          >
            <option value="all">All chapters</option>
            <option value="none">Unplaced</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Chapter {n}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        {filtered.length === 0 ? (
          <div className="empty">{dumps.length === 0 ? "No dumps yet. Go to Capture and say one thing." : "Nothing matches."}</div>
        ) : (
          <div className="stack-sm">
            {filtered.map((d, i) => (
              <DumpRow key={d.id} dump={d} index={i} onClick={() => setOpenId(d.id)} />
            ))}
          </div>
        )}
      </section>

      {open && (
        <DumpDrawer
          key={open.id}
          dump={open}
          onClose={() => setOpenId(null)}
          onSaved={async (msg) => {
            await refresh();
            showToast(msg);
          }}
        />
      )}

      <Toast msg={toast} />
    </>
  );
}

function DumpDrawer({ dump, onClose, onSaved }: { dump: BrainDump; onClose: () => void; onSaved: (msg: string) => void }) {
  const [draft, setDraft] = useState<BrainDump>(dump);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(dump);

  const save = async () => {
    setSaving(true);
    try {
      await putDump({ ...draft, updatedAt: nowIso() });
      onSaved("Saved");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this dump? The audio goes with it.")) return;
    await deleteDump(dump.id);
    onSaved("Deleted");
    onClose();
  };

  const statusChips: { key: DumpStatus; label: string }[] = [
    { key: "raw", label: "Raw" },
    { key: "reviewed", label: "Reviewed" },
    { key: "used", label: "Used" },
  ];

  return (
    <Drawer
      title={dump.title || "Untitled"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--danger" onClick={remove}>
            Delete
          </button>
          <span className="grow" />
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={!dirty || saving}>
            Save
          </button>
        </>
      }
    >
      <p className="muted">
        {formatWhen(dump.createdAt)} · {dump.source === "voice" ? "Spoken" : "Typed"}
      </p>

      {dump.audioId && (
        <div className="mt-3">
          <AudioPlayer audioId={dump.audioId} />
        </div>
      )}

      <div className="mt-4">
        <label className="label">Title</label>
        <input className="field" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </div>

      <div className="mt-4">
        <label className="label">Text</label>
        <textarea className="field" rows={12} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
      </div>

      <div className="mt-4">
        <label className="label">Status</label>
        <div className="wrap">
          {statusChips.map((c) => (
            <button
              key={c.key}
              className={`chip ${draft.status === c.key ? "chip--active" : ""}`}
              onClick={() => setDraft({ ...draft, status: c.key })}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="help mt-2">Raw is untouched. Reviewed means you have read it back. Used means it went into the book or a post.</p>
      </div>

      <div className="mt-4">
        <label className="label">Chapter</label>
        <ChapterSelect value={draft.chapter} onChange={(n) => setDraft({ ...draft, chapter: n })} />
      </div>

      <div className="mt-4">
        <label className="label">Tags</label>
        <TagInput value={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} />
      </div>
    </Drawer>
  );
}
