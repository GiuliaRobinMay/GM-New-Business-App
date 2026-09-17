"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { accentFor } from "@/lib/accent";
import { BookIcon, DownloadIcon, GridIcon, InboxIcon, MicIcon } from "./Icons";
import ServiceWorker from "./ServiceWorker";

const NAV = [
  { href: "/", label: "Capture", Icon: MicIcon },
  { href: "/dumps", label: "Brain dumps", Icon: InboxIcon },
  { href: "/library", label: "Library", Icon: BookIcon },
  { href: "/program", label: "Program", Icon: GridIcon },
  { href: "/export", label: "Export", Icon: DownloadIcon },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="shell">
      <aside className="sidebar">
        <div style={{ padding: 16 }}>
          <strong style={{ fontSize: 15, letterSpacing: "-0.01em" }}>Backbone</strong>
          <p className="muted" style={{ fontSize: 12 }}>
            New business · working notes
          </p>
        </div>
        <nav className="stack-sm" style={{ padding: "0 12px" }}>
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              className={`sidebar__item ${accentFor(i)} ${isActive(n.href) ? "sidebar__item--active" : ""}`}
            >
              <span className="icon-chip icon-chip--sm">
                <n.Icon />
              </span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: 16 }}>
          <p className="help">Saved on this device. Export to keep it.</p>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header className="topbar hide-desktop">
          <strong style={{ fontSize: 15, letterSpacing: "-0.01em" }}>Backbone</strong>
        </header>
        <main className="content stack">{children}</main>
      </div>

      <nav className="tabbar" aria-label="Primary">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`tabbar__item ${isActive(n.href) ? "tabbar__item--active" : ""}`}>
            <n.Icon />
            {n.label}
          </Link>
        ))}
      </nav>

      <ServiceWorker />
    </div>
  );
}
