"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { accentFor } from "@/lib/accent";
import { listDumps, listLibrary } from "@/lib/db";
import { CHAPTERS } from "@/lib/program";

interface Counts {
  dumps: Record<string, number>;
  library: Record<string, number>;
}

export default function ProgramPage() {
  const [counts, setCounts] = useState<Counts>({ dumps: {}, library: {} });

  useEffect(() => {
    (async () => {
      const [dumps, library] = await Promise.all([listDumps(), listLibrary()]);
      const c: Counts = { dumps: {}, library: {} };
      for (const d of dumps) {
        const k = String(d.chapter ?? "none");
        c.dumps[k] = (c.dumps[k] ?? 0) + 1;
      }
      for (const i of library) {
        const k = String(i.chapter ?? "none");
        c.library[k] = (c.library[k] ?? 0) + 1;
      }
      setCounts(c);
    })();
  }, []);

  const unplaced = (counts.dumps.none ?? 0) + (counts.library.none ?? 0);

  return (
    <>
      <h1 className="page-title">Program</h1>

      <section className="card card--pad">
        <p className="eyebrow">Working draft</p>
        <p className="section-title mt-2">Twelve chapters</p>
        <p className="muted mt-2" style={{ maxWidth: 640 }}>
          Course, program, book, twelve weeks or twelve months — the shape gets decided later. For now each chapter is a
          bucket. Put dumps and sources into them and see where the weight lands. Rename anything; the app only cares
          about the number.
        </p>
        {unplaced > 0 && (
          <p className="muted mt-3">
            <Link className="link" href="/dumps#chapter-none">
              {unplaced} unplaced {unplaced === 1 ? "item" : "items"}
            </Link>{" "}
            waiting for a chapter.
          </p>
        )}
      </section>

      <section className="grid grid--3">
        {CHAPTERS.map((c, i) => {
          const nd = counts.dumps[String(c.n)] ?? 0;
          const nl = counts.library[String(c.n)] ?? 0;
          return (
            <Link
              key={c.n}
              href={`/dumps#chapter-${c.n}`}
              className={`card card--hover ${accentFor(i)}`}
              style={{ overflow: "hidden", textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div className="cover row" style={{ height: 56, padding: "0 14px" }}>
                <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" }} className="grow">
                  {c.n}
                </span>
                {nd + nl > 0 && (
                  <span className="badge" style={{ background: "rgb(255 255 255 / 0.18)", color: "#fff" }}>
                    {nd} {nd === 1 ? "dump" : "dumps"}
                    {nl > 0 ? ` · ${nl} ${nl === 1 ? "source" : "sources"}` : ""}
                  </span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <p className="row-title">{c.title}</p>
                <p className="muted mt-1 clamp-2">{c.question}</p>
              </div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
