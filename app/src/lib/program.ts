import type { Chapter } from "./types";

/**
 * The 12 chapters — a working draft, not a decision.
 *
 * Mirrored in `content/program/12-chapters.md`. Rename freely; the app only
 * cares about the number 1–12.
 */
export const CHAPTERS: Chapter[] = [
  { n: 1, title: "Ground zero", question: "What does starting over actually look like, and why is it not the end?" },
  { n: 2, title: "The story you tell yourself", question: "How do I notice, and then change, the thoughts that run my life?" },
  { n: 3, title: "Clear head", question: "Why a sober lifestyle, and how do I make it the default rather than the fight?" },
  { n: 4, title: "One day at a time", question: "How do I build discipline that survives bad days?" },
  { n: 5, title: "Order", question: "How do I organise my life when everything feels like chaos?" },
  { n: 6, title: "The money problem", question: "How do I face the finances I have been avoiding?" },
  { n: 7, title: "Deciding", question: "How do I make decisions I will not have to undo?" },
  { n: 8, title: "Planning without fantasy", question: "How do I plan in a way that respects reality?" },
  { n: 9, title: "Getting rid of problems", question: "How do I actually close things instead of carrying them?" },
  { n: 10, title: "People", question: "Who stays, who goes, and how do I ask for help?" },
  { n: 11, title: "Self-mastery", question: "What does it mean to be in charge of myself?" },
  { n: 12, title: "Building again", question: "How do I build something new on the ground I have cleared?" },
];

export function chapterTitle(n: number | null): string {
  if (n == null) return "Unplaced";
  const c = CHAPTERS.find((x) => x.n === n);
  return c ? `${n}. ${c.title}` : `Chapter ${n}`;
}
