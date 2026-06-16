/**
 * Runtime validation for puzzle data. Static JSON can drift from the type
 * definitions, so we check the shape at load time and fail loudly in dev.
 */

import { CLUE_COUNT, DIFFICULTIES, type Puzzle } from "./types";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/** Validate one puzzle, collecting all problems into the returned list. */
function collectErrors(raw: unknown, position: number): string[] {
  const errors: string[] = [];
  const prefix = `puzzle[${position}]`;

  if (typeof raw !== "object" || raw === null) {
    return [`${prefix} is not an object`];
  }
  const p = raw as Record<string, unknown>;

  if (typeof p.id !== "number" || !Number.isInteger(p.id)) {
    errors.push(`${prefix}.id must be an integer`);
  }
  if (typeof p.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) {
    errors.push(`${prefix}.date must be a "YYYY-MM-DD" string`);
  }
  if (typeof p.category !== "string" || p.category.trim() === "") {
    errors.push(`${prefix}.category must be a non-empty string`);
  }
  if (
    typeof p.difficulty !== "string" ||
    !DIFFICULTIES.includes(p.difficulty as Puzzle["difficulty"])
  ) {
    errors.push(
      `${prefix}.difficulty must be one of ${DIFFICULTIES.join(", ")}`,
    );
  }
  if (
    !Array.isArray(p.clues) ||
    p.clues.length !== CLUE_COUNT ||
    !p.clues.every((c) => typeof c === "string" && c.trim() !== "")
  ) {
    errors.push(
      `${prefix}.clues must be exactly ${CLUE_COUNT} non-empty strings`,
    );
  }
  if (typeof p.answer !== "string" || p.answer.trim() === "") {
    errors.push(`${prefix}.answer must be a non-empty string`);
  }
  if (!isStringArray(p.accept)) {
    errors.push(`${prefix}.accept must be an array of strings`);
  }
  if (!isStringArray(p.prompt)) {
    errors.push(`${prefix}.prompt must be an array of strings`);
  }
  if (!isStringArray(p.reject)) {
    errors.push(`${prefix}.reject must be an array of strings`);
  }
  return errors;
}

/**
 * Validate and return the puzzle list, or throw an Error listing every
 * problem found. Also enforces unique ids.
 */
export function validatePuzzles(data: unknown): Puzzle[] {
  if (!Array.isArray(data)) {
    throw new Error("puzzles data must be an array");
  }
  if (data.length === 0) {
    throw new Error("puzzles data must contain at least one puzzle");
  }

  const errors: string[] = [];
  data.forEach((raw, i) => errors.push(...collectErrors(raw, i)));

  const ids = data
    .map((p) => (p as { id?: unknown }).id)
    .filter((id): id is number => typeof id === "number");
  if (new Set(ids).size !== ids.length) {
    errors.push("puzzle ids must be unique");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid puzzle data:\n - ${errors.join("\n - ")}`);
  }
  return data as Puzzle[];
}
