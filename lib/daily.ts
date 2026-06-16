/**
 * Daily puzzle selection — deterministic and UTC-based so every player
 * worldwide gets the same puzzle, and it rolls over at the same instant.
 *
 * The selection function is pure: the current date is injected, never read
 * from the clock inside it. Impure clock helpers are clearly marked.
 */

import type { Puzzle } from "./types";

/** Launch date. Used as the anchor for the index-based fallback. */
export const EPOCH_DATE = "2026-06-16";

const MS_PER_DAY = 86_400_000;

/** Format a Date as a UTC "YYYY-MM-DD" string. */
export function toUtcDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole UTC days between two "YYYY-MM-DD" strings (can be negative). */
export function daysSince(epoch: string, dateStr: string): number {
  const e = Date.parse(`${epoch}T00:00:00Z`);
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  return Math.floor((t - e) / MS_PER_DAY);
}

/**
 * Pick the puzzle for a given UTC date string.
 *
 * 1. Prefer an exact `date` match.
 * 2. Otherwise fall back to indexing by days-since-epoch, modulo the puzzle
 *    count, so the game keeps working before a full dated calendar exists.
 *
 * Pure: pass the date in; never reads the clock.
 */
export function selectPuzzle(puzzles: Puzzle[], dateStr: string): Puzzle {
  if (puzzles.length === 0) {
    throw new Error("selectPuzzle: no puzzles available");
  }
  const exact = puzzles.find((p) => p.date === dateStr);
  if (exact) return exact;

  const diff = daysSince(EPOCH_DATE, dateStr);
  const len = puzzles.length;
  // Positive modulo even for dates before the epoch.
  const index = ((diff % len) + len) % len;
  return puzzles[index];
}

/** Milliseconds remaining until the next UTC midnight. Impure (reads clock). */
export function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return next - now.getTime();
}

/** Today's UTC date string. Impure (reads clock). */
export function todayUtc(now: Date = new Date()): string {
  return toUtcDateString(now);
}
