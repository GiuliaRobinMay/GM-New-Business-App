"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusIcon } from "@/components/Icons";
import { ChapterSelect, Drawer, LibraryRow, TagInput, Toast, useToast } from "@/components/ui";
import { deleteLibraryItem, listLibrary, putLibraryItem } from "@/lib/db";
import { newId, nowIso } from "@/lib/id";
import type { LibraryItem, LibraryKind, LibraryStatus } from "@/lib/types";

type StatusFilter = "all" | LibraryStatus;

const KINDS: { key: LibraryKind; label: string }[] = [
  { key: "book", label: "Book" },
  { key: "article", label: "Article" },
  { key: "video", label: "Video" },
  { key: "podcast", label: "Podcast" },
  { key: "course", label: "Course" },
  { key: "person", label: "Person" },
  { key: "tool", label: "Tool" },
  { key: "other", label: "Other" },
];

function blank(): LibraryItem {
  const ts = nowIso();
  return {
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
    kind: "book",
    title: "",
    author: "",
    url: "",
    note: "",
    tags: [],
    chapter: null,
    status: "to-read",
  };
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toast, showToast] = useToast();

  const refresh = useCallback(async () => setItems(await listLibrary()), []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = items.filter((i) => status === "all" || i.status === status);

  const chips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "to-read", label: "To read" },
    { key: "reading", label: "Reading" },
    { key: "done", label: "Done" },
  ];

  return (
    <>
      <div className="row">
        <h1 className="page-title grow">Library</h1>
        <button
          className="btn btn--primary"
          onClick={() => {
            setEditing(blank());
            setIsNew(true);
          }}
        >
          <PlusIcon width={16} height={16} /> Add
        </button>
      </div>

      <section className="wrap">
        {chips.map((c) => (
          <button key={c.key} className={`chip ${status === c.key ? "chip--active" : ""}`} onClick={() => setStatus(c.key)}>
            {c.label}
          </button>
        ))}
      </section>

      <section>
        {filtered.length === 0 ? (
          <div className="empty">
            {items.length === 0 ? "Nothing here yet. Books, people, articles — anything that shaped how you think." : "Nothing matches."}
          </div>
        ) : (
          <div className="stack-sm">
            {filtered.map((it, i) => (
              <LibraryRow
                key={it.id}
                item={it}
                index={i}
                onClick={() => {
                  setEditing(it);
                  setIsNew(false);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {editing && (
        <LibraryDrawer
          key={editing.id}
          item={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
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

function LibraryDrawer({
  item,
  isNew,
  onClose,
  onSaved,
}: {
  item: LibraryItem;
  isNew: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<LibraryItem>(item);
  const [saving, setSaving] = useState(false);
  const canSave = draft.title.trim().length > 0 && (isNew || JSON.stringify(draft) !== JSON.stringify(item));

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await putLibraryItem({ ...draft, title: draft.title.trim(), updatedAt: nowIso() });
      onSaved(isNew ? "Added" : "Saved");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove this from the library?")) return;
    await deleteLibraryItem(item.id);
    onSaved("Removed");
    onClose();
  };

  const statusChips: { key: LibraryStatus; label: string }[] = [
    { key: "to-read", label: "To read" },
    { key: "reading", label: "Reading" },
    { key: "done", label: "Done" },
  ];

  return (
    <Drawer
      title={isNew ? "Add to library" : item.title}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button className="btn btn--danger" onClick={remove}>
              Remove
            </button>
          )}
          <span className="grow" />
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={!canSave || saving}>
            {isNew ? "Add" : "Save"}
          </button>
        </>
      }
    >
      <div className="grid grid--2">
        <div>
          <label className="label">Kind</label>
          <select className="field" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as LibraryKind })}>
            {KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <div className="wrap" style={{ paddingTop: 4 }}>
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
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Title</label>
        <input className="field" value={draft.title} autoFocus={isNew} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </div>

      <div className="grid grid--2 mt-4">
        <div>
          <label className="label">Author / who</label>
          <input className="field" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
        </div>
        <div>
          <label className="label">Link</label>
          <input className="field" value={draft.url} inputMode="url" placeholder="https://" onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Why it matters</label>
        <textarea
          className="field"
          rows={6}
          placeholder="What you took from it. What it changed. The one sentence you still remember."
          value={draft.note}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        />
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
