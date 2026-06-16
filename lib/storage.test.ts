import { describe, it, expect, beforeEach } from "vitest";
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  emptyStats,
  emptyState,
  applyResultToStats,
  averageBuzzPosition,
  winRate,
  loadState,
  getResultForDate,
  recordResult,
  emptyEndlessRecords,
  applyEndlessRound,
  loadEndlessRecords,
  saveEndlessRecords,
} from "./storage";
import type { DayResult } from "./types";

function result(over: Partial<DayResult> = {}): DayResult {
  return {
    puzzleId: 1,
    date: "2026-06-16",
    score: 80,
    buzzedOn: 1,
    negs: 0,
    won: true,
    completed: true,
    ...over,
  };
}

describe("applyResultToStats (pure)", () => {
  it("records a win and updates the histogram", () => {
    const s = applyResultToStats(emptyStats(), result({ buzzedOn: 2 }));
    expect(s.gamesPlayed).toBe(1);
    expect(s.gamesWon).toBe(1);
    expect(s.currentStreak).toBe(1);
    expect(s.maxStreak).toBe(1);
    expect(s.tierDistribution[2]).toBe(1);
    expect(s.buzzPositionCount).toBe(1);
  });

  it("extends a streak on consecutive days", () => {
    let s = applyResultToStats(emptyStats(), result({ date: "2026-06-16" }));
    s = applyResultToStats(s, result({ date: "2026-06-17" }));
    expect(s.currentStreak).toBe(2);
    expect(s.maxStreak).toBe(2);
  });

  it("resets the current streak after a gap, keeping the max", () => {
    let s = applyResultToStats(emptyStats(), result({ date: "2026-06-16" }));
    s = applyResultToStats(s, result({ date: "2026-06-17" }));
    // skip the 18th; play the 19th
    s = applyResultToStats(s, result({ date: "2026-06-19" }));
    expect(s.currentStreak).toBe(1);
    expect(s.maxStreak).toBe(2);
  });

  it("breaks the streak on a loss", () => {
    let s = applyResultToStats(emptyStats(), result({ date: "2026-06-16" }));
    s = applyResultToStats(
      s,
      result({ date: "2026-06-17", won: false, buzzedOn: null, score: 0 }),
    );
    expect(s.currentStreak).toBe(0);
    expect(s.gamesWon).toBe(1);
    expect(s.gamesPlayed).toBe(2);
  });
});

describe("derived stats", () => {
  it("computes average buzz position", () => {
    let s = applyResultToStats(emptyStats(), result({ buzzedOn: 0 }));
    s = applyResultToStats(s, result({ date: "2026-06-17", buzzedOn: 2 }));
    expect(averageBuzzPosition(s)).toBe(1);
  });

  it("returns null average with no wins", () => {
    expect(averageBuzzPosition(emptyStats())).toBeNull();
  });

  it("computes win rate", () => {
    let s = applyResultToStats(emptyStats(), result());
    s = applyResultToStats(
      s,
      result({ date: "2026-06-17", won: false, buzzedOn: null }),
    );
    expect(winRate(s)).toBe(0.5);
    expect(winRate(emptyStats())).toBe(0);
  });
});

describe("persistence (localStorage)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty", () => {
    expect(loadState()).toEqual(emptyState());
  });

  it("records and reloads a result", () => {
    recordResult({
      date: "2026-06-16",
      puzzleId: 1,
      won: true,
      buzzedOn: 1,
      negs: 0,
      score: 80,
    });
    const stored = getResultForDate("2026-06-16");
    expect(stored?.score).toBe(80);
    expect(stored?.won).toBe(true);
    expect(loadState().stats.gamesPlayed).toBe(1);
  });

  it("does not double-count a day already recorded", () => {
    const args = {
      date: "2026-06-16",
      puzzleId: 1,
      won: true,
      buzzedOn: 1 as const,
      negs: 0,
      score: 80,
    };
    recordResult(args);
    recordResult(args);
    expect(loadState().stats.gamesPlayed).toBe(1);
  });

  it("resets gracefully on a version mismatch", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION + 99, results: { x: 1 } }),
    );
    expect(loadState()).toEqual(emptyState());
  });

  it("resets gracefully on corrupt JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadState()).toEqual(emptyState());
  });
});

describe("endless practice records", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts at zero", () => {
    expect(loadEndlessRecords()).toEqual(emptyEndlessRecords());
  });

  it("keeps the best streak and high score (pure)", () => {
    let r = emptyEndlessRecords();
    r = applyEndlessRound(r, 3, 80); // streak 3, score 80
    expect(r).toEqual({ bestStreak: 3, highScore: 80 });
    r = applyEndlessRound(r, 1, 100); // streak dropped, but higher score
    expect(r).toEqual({ bestStreak: 3, highScore: 100 });
    r = applyEndlessRound(r, 5, 40); // longer streak, lower score
    expect(r).toEqual({ bestStreak: 5, highScore: 100 });
  });

  it("persists and reloads records", () => {
    saveEndlessRecords({ bestStreak: 7, highScore: 100 });
    expect(loadEndlessRecords()).toEqual({ bestStreak: 7, highScore: 100 });
  });

  it("survives corrupt records", () => {
    window.localStorage.setItem("pyramidal-buzz:endless:v1", "nope");
    expect(loadEndlessRecords()).toEqual(emptyEndlessRecords());
  });
});
