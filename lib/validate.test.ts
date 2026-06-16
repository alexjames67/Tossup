import { describe, it, expect } from "vitest";
import { validatePuzzles } from "./validate";
import rawPuzzles from "@/data/puzzles.json";

function valid() {
  return {
    id: 1,
    date: "2026-06-16",
    category: "History",
    difficulty: "easy",
    clues: ["a", "b", "c", "d", "e"],
    answer: "Answer",
    accept: [],
    prompt: [],
    reject: [],
  };
}

describe("validatePuzzles", () => {
  it("accepts the shipped seed data", () => {
    const puzzles = validatePuzzles(rawPuzzles);
    expect(puzzles.length).toBeGreaterThanOrEqual(5);
  });

  it("accepts a well-formed puzzle list", () => {
    expect(validatePuzzles([valid()])).toHaveLength(1);
  });

  it("throws on a non-array", () => {
    expect(() => validatePuzzles({})).toThrow();
  });

  it("throws on the wrong number of clues", () => {
    const bad = { ...valid(), clues: ["only", "three", "clues"] };
    expect(() => validatePuzzles([bad])).toThrow(/clues/);
  });

  it("throws on a missing answer", () => {
    const bad = { ...valid(), answer: "" };
    expect(() => validatePuzzles([bad])).toThrow(/answer/);
  });

  it("throws on a malformed date", () => {
    const bad = { ...valid(), date: "June 16" };
    expect(() => validatePuzzles([bad])).toThrow(/date/);
  });

  it("throws on duplicate ids", () => {
    expect(() => validatePuzzles([valid(), valid()])).toThrow(/unique/);
  });

  it("throws on an empty list", () => {
    expect(() => validatePuzzles([])).toThrow();
  });
});
