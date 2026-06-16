import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGame } from "./useGame";
import { loadState } from "@/lib/storage";
import type { Puzzle } from "@/lib/types";

const puzzle: Puzzle = {
  id: 1,
  date: "2026-06-16",
  category: "History",
  difficulty: "easy",
  clues: ["c0", "c1", "c2", "c3", "c4"],
  answer: "Napoleon Bonaparte",
  accept: ["Napoleon"],
  prompt: ["Bonaparte"],
  reject: ["Napoleon III"],
};

describe("useGame mode behaviour", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists a daily win to storage and stats", () => {
    const { result } = renderHook(() => useGame(puzzle, "2026-06-16", "daily"));
    act(() => result.current.submit("Napoleon"));
    expect(result.current.status).toBe("won");

    const state = loadState();
    expect(state.results["2026-06-16"]?.score).toBe(100);
    expect(state.stats.gamesPlayed).toBe(1);
  });

  it("does NOT persist an endless round (no daily lock, no streak)", () => {
    const { result } = renderHook(() =>
      useGame(puzzle, "endless-1", "endless"),
    );
    act(() => result.current.submit("Napoleon"));
    expect(result.current.status).toBe("won");

    const state = loadState();
    expect(state.results).toEqual({});
    expect(state.stats.gamesPlayed).toBe(0);
  });

  it("restores a completed daily round but never locks endless", () => {
    // Record a daily result first.
    const daily = renderHook(() => useGame(puzzle, "2026-06-16", "daily"));
    act(() => daily.result.current.submit("Napoleon"));

    // A fresh daily hook for the same date should restore as completed.
    const restored = renderHook(() => useGame(puzzle, "2026-06-16", "daily"));
    expect(restored.result.current.status).toBe("already-completed");

    // Endless always starts fresh and playable.
    const endless = renderHook(() => useGame(puzzle, "endless-1", "endless"));
    expect(endless.result.current.status).toBe("revealing");
  });
});
