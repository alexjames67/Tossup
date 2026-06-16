/**
 * Deterministic, offline answer matching for Pyramidal Buzz.
 *
 * `judgeAnswer` is a pure function. No LLM, no network, no clock. Both the
 * player's input and the stored strings are run through `normalize` before any
 * comparison.
 */

import type { Puzzle, Judgment } from "./types";

/** Leading articles stripped during normalization. */
const ARTICLES = new Set(["a", "an", "the"]);

/** Fuzzy match acceptance threshold (similarity ratio in [0, 1]). */
export const FUZZY_THRESHOLD = 0.85;

/**
 * Fuzzy matching only applies to inputs LONGER than this many characters, to
 * avoid short-string false positives (e.g. "bile" ~ "nile").
 */
export const FUZZY_MIN_LENGTH = 4;

/**
 * Normalize a string for comparison:
 * - strip diacritics (é -> e)
 * - lowercase
 * - replace punctuation with spaces
 * - collapse internal whitespace and trim
 * - drop a single leading article (a / an / the)
 */
export function normalize(input: string): string {
  const words = input
    .normalize("NFD") // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "") // remove combining diacritics
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // punctuation -> space
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length > 1 && ARTICLES.has(words[0])) {
    words.shift();
  }
  return words.join(" ");
}

/** Classic Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single rolling row for O(n) space.
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;

  for (let i = 1; i <= m; i++) {
    let prevDiag = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        row[j] + 1, // deletion
        row[j - 1] + 1, // insertion
        prevDiag + cost, // substitution
      );
      prevDiag = temp;
    }
  }
  return row[n];
}

/** Similarity ratio in [0, 1]: 1 - editDistance / maxLength. */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Judge a raw typed answer against a puzzle.
 *
 * Check order is significant: reject → exact/accept → prompt → fuzzy → none.
 */
export function judgeAnswer(rawInput: string, puzzle: Puzzle): Judgment {
  const input = normalize(rawInput);
  if (input.length === 0) return "incorrect";

  // 1. Explicit near-misses are rejected outright.
  const rejects = puzzle.reject.map(normalize);
  if (rejects.includes(input)) return "incorrect";

  // 2. Exact match against the canonical answer or accepted alternates.
  const accepts = [puzzle.answer, ...puzzle.accept].map(normalize);
  if (accepts.includes(input)) return "correct";

  // 3. Underspecified-but-on-the-right-track answers prompt (no penalty).
  const prompts = puzzle.prompt.map(normalize);
  if (prompts.includes(input)) return "prompt";

  // 4. Typo tolerance, only for sufficiently long inputs.
  if (input.length > FUZZY_MIN_LENGTH) {
    for (const target of accepts) {
      if (
        target.length > FUZZY_MIN_LENGTH &&
        similarity(input, target) >= FUZZY_THRESHOLD
      ) {
        return "correct";
      }
    }
  }

  // 5. Nothing matched.
  return "incorrect";
}
