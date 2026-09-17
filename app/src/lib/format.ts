export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday(iso)) return `Today ${time}`;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

/** First line, cut at a sentence end if one comes early enough. */
export function deriveTitle(body: string): string {
  const first = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!first) return "";
  const m = first.match(/^(.{12,70}?[.!?])(\s|$)/);
  if (m) return m[1];
  return first.length > 64 ? first.slice(0, 61).trimEnd() + "…" : first;
}
