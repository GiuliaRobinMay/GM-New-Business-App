"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { accentFor } from "@/lib/accent";
import { getAudioUrl } from "@/lib/db";
import { formatWhen } from "@/lib/format";
import { CHAPTERS, chapterTitle } from "@/lib/program";
import type { BrainDump, DumpStatus, LibraryItem, LibraryKind, LibraryStatus } from "@/lib/types";
import { formatDuration } from "@/lib/useVoiceCapture";
import { BookIcon, LinkIcon, MicIcon, PenIcon, SparkIcon, XIcon } from "./Icons";

// ---- Tag input ----------------------------------------------------------

export function TagInput({
  value,
  onChange,
  placeholder = "Add a tag, press Enter",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const t = raw.trim().replace(/^#/, "").toLowerCase();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
  };

  return (
    <div className="tags" onClick={() => inputRef.current?.focus()}>
      {value.map((t) => (
        <span key={t} className="badge">
          #{t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
            setDraft("");
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => {
          if (draft.trim()) {
            add(draft);
            setDraft("");
          }
        }}
      />
    </div>
  );
}

// ---- Chapter select -----------------------------------------------------

export function ChapterSelect({
  value,
  onChange,
  blankLabel = "Unplaced",
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  blankLabel?: string;
}) {
  return (
    <select className="field" value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">{blankLabel}</option>
      {CHAPTERS.map((c) => (
        <option key={c.n} value={c.n}>
          {c.n}. {c.title}
        </option>
      ))}
    </select>
  );
}

// ---- Badges -------------------------------------------------------------
// Green means done. Orange means in progress. Grey is everything else.

export function DumpStatusBadge({ status }: { status: DumpStatus }) {
  const cls = status === "used" ? "badge badge--green" : status === "reviewed" ? "badge badge--orange" : "badge";
  const label = status === "used" ? "Used" : status === "reviewed" ? "Reviewed" : "Raw";
  return <span className={cls}>{label}</span>;
}

export function LibraryStatusBadge({ status }: { status: LibraryStatus }) {
  const cls = status === "done" ? "badge badge--green" : status === "reading" ? "badge badge--orange" : "badge";
  const label = status === "done" ? "Done" : status === "reading" ? "Reading" : "To read";
  return <span className={cls}>{label}</span>;
}

// ---- Rows ---------------------------------------------------------------
// Icon chip → 15px title → one grey line. Nothing else.

export function DumpRow({
  dump,
  index,
  href,
  onClick,
}: {
  dump: BrainDump;
  index: number;
  href?: string;
  onClick?: () => void;
}) {
  const meta = [
    formatWhen(dump.createdAt),
    dump.audioDurationSec != null ? formatDuration(dump.audioDurationSec) : null,
    chapterTitle(dump.chapter),
    dump.tags.length ? dump.tags.map((t) => `#${t}`).join(" ") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const inner = (
    <>
      <span className="icon-chip">{dump.source === "voice" ? <MicIcon /> : <PenIcon />}</span>
      <div className="grow">
        <p className="row-title truncate">{dump.title || "Untitled"}</p>
        <p className="muted truncate" style={{ fontSize: 12, marginTop: 4 }}>
          {meta}
        </p>
      </div>
      <DumpStatusBadge status={dump.status} />
    </>
  );

  const cls = `card card--hover list-row ${accentFor(index)}`;
  if (href) {
    return (
      <Link href={href} className={cls} style={{ textDecoration: "none", color: "inherit" }}>
        {inner}
      </Link>
    );
  }
  return (
    <div
      className={cls}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {inner}
    </div>
  );
}

const KIND_LABEL: Record<LibraryKind, string> = {
  book: "Book",
  article: "Article",
  video: "Video",
  podcast: "Podcast",
  course: "Course",
  person: "Person",
  tool: "Tool",
  other: "Other",
};

export function kindLabel(k: LibraryKind): string {
  return KIND_LABEL[k];
}

export function KindIcon({ kind }: { kind: LibraryKind }) {
  if (kind === "book" || kind === "course") return <BookIcon />;
  if (kind === "person" || kind === "other") return <SparkIcon />;
  return <LinkIcon />;
}

export function LibraryRow({ item, index, onClick }: { item: LibraryItem; index: number; onClick: () => void }) {
  const meta = [item.author || null, kindLabel(item.kind), chapterTitle(item.chapter)].filter(Boolean).join(" · ");
  return (
    <div
      className={`card card--hover list-row ${accentFor(index)}`}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span className="icon-chip">
        <KindIcon kind={item.kind} />
      </span>
      <div className="grow">
        <p className="row-title truncate">{item.title}</p>
        <p className="muted truncate" style={{ fontSize: 12, marginTop: 4 }}>
          {meta}
        </p>
      </div>
      <LibraryStatusBadge status={item.status} />
    </div>
  );
}

// ---- Drawer -------------------------------------------------------------

export function Drawer({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head">
          <p className="section-title grow truncate">{title}</p>
          <button className="btn btn--quiet" onClick={onClose} aria-label="Close" style={{ padding: 6 }}>
            <XIcon width={18} height={18} />
          </button>
        </div>
        <div className="drawer__body stack-sm">{children}</div>
        {footer && <div className="drawer__foot">{footer}</div>}
      </aside>
    </>
  );
}

// ---- Audio --------------------------------------------------------------

export function AudioPlayer({ audioId }: { audioId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAudioUrl(audioId).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [audioId]);
  if (!url) return null;
  return <audio controls src={url} style={{ width: "100%" }} />;
}

// ---- Toast --------------------------------------------------------------

export function useToast(): [string | null, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2200);
  };
  return [msg, show];
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="toast" role="status">
      {msg}
    </div>
  );
}
