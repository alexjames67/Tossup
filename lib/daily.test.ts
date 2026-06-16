import { describe, it, expect } from "vitest";
import {
  EPOCH_DATE,
  toUtcDateString,
  daysSince,
  selectPuzzle,
  msUntilNextUtcMidnight,
} from "./daily";
import type { Puzzle } from "./types";

function makePuzzle(id: number, date: string): Puzzle {
  return {
    id,
    date,
    category: "Test",
    difficulty: "easy",
    clues: ["0", "1", "2", "3", "4"],
    answer: `answer-${id}`,
    accept: [],
    prompt: [],
    reject: [],
  };
}

const puzzles: Puzzle[] = [
  makePuzzle(1, "2026-06-16"),
  makePuzzle(2, "2026-06-17"),
  makePuzzle(3, "2026-06-18"),
];

describe("toUtcDateString", () => {
  it("formats in UTC regardless of local components", () => {
    // 2026-06-16T23:30:00Z is still the 16th in UTC
    expect(toUtcDateString(new Date("2026-06-16T23:30:00Z"))).toBe(
      "2026-06-16",
    );
  });

  it("zero-pads month and day", () => {
    expect(toUtcDateString(new Date("2026-01-05T00:00:00Z"))).toBe(
      "2026-01-05",
    );
  });
});

describe("daysSince", () => {
  it("counts whole UTC days", () => {
    expect(daysSince("2026-06-16", "2026-06-16")).toBe(0);
    expect(daysSince("2026-06-16", "2026-06-19")).toBe(3);
  });

  it("is negative before the epoch", () => {
    expect(daysSince("2026-06-16", "2026-06-15")).toBe(-1);
  });
});

describe("selectPuzzle", () => {
  it("prefers an exact date match", () => {
    expect(selectPuzzle(puzzles, "2026-06-17").id).toBe(2);
  });

  it("is identical for the same date (deterministic)", () => {
    const a = selectPuzzle(puzzles, "2026-06-18");
    const b = selectPuzzle(puzzles, "2026-06-18");
    expect(a.id).toBe(b.id);
  });

  it("falls back to index-by-epoch when no date matches", () => {
    // 3 days after epoch, length 3 -> index 0 -> id 1
    expect(selectPuzzle(puzzles, "2026-06-19").id).toBe(1);
    // 4 days after -> index 1 -> id 2
    expect(selectPuzzle(puzzles, "2026-06-20").id).toBe(2);
  });

  it("handles dates before the epoch with a positive modulo", () => {
    const p = selectPuzzle(puzzles, "2026-06-13"); // -3 days -> index 0
    expect(p.id).toBe(1);
  });

  it("throws when there are no puzzles", () => {
    expect(() => selectPuzzle([], "2026-06-16")).toThrow();
  });

  it("uses the documented epoch", () => {
    expect(EPOCH_DATE).toBe("2026-06-16");
  });
});

describe("msUntilNextUtcMidnight", () => {
  it("returns time to the next UTC midnight", () => {
    const now = new Date("2026-06-16T23:00:00Z");
    expect(msUntilNextUtcMidnight(now)).toBe(60 * 60 * 1000);
  });

  it("is a full day at exactly UTC midnight", () => {
    const now = new Date("2026-06-16T00:00:00Z");
    expect(msUntilNextUtcMidnight(now)).toBe(24 * 60 * 60 * 1000);
  });
});
