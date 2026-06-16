/**
 * Puzzle data access. This module is the single seam between the app and the
 * puzzle source. Today it reads a validated static JSON file; later it could
 * become an API call without changing any caller.
 */

import rawPuzzles from "@/data/puzzles.json";
import { selectPuzzle } from "./daily";
import { validatePuzzles } from "./validate";
import type { Puzzle } from "./types";

/** Validated at module load; throws loudly in dev if the JSON is malformed. */
export const PUZZLES: Puzzle[] = validatePuzzles(rawPuzzles);

/** The puzzle for a given UTC "YYYY-MM-DD" date string. */
export function getPuzzleForDate(date: string): Puzzle {
  return selectPuzzle(PUZZLES, date);
}
