/**
 * localStorage persistence, schema-versioned and crash-safe.
 *
 * Everything lives under a single namespaced key. Reads are wrapped in
 * try/catch and a version mismatch resets gracefully rather than throwing.
 * Pure state transitions (`recordResult`, `applyResultToStats`) are exported
 * separately so they can be unit-tested without a DOM.
 */

import { daysSince } from "./daily";
import type { ClueIndex, DayResult, Stats } from "./types";

export const STORAGE_KEY = "pyramidal-buzz:v1";
export const SCHEMA_VERSION = 1;

// --- tiny pub/sub so React can subscribe to writes via useSyncExternalStore --
let storageVersion = 0;
const listeners = new Set<() => void>();

export function subscribeStorage(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getStorageVersion(): number {
  return storageVersion;
}

// Cached stats snapshot so useSyncExternalStore gets a stable reference between
// writes (required to avoid an infinite render loop).
let cachedStats: Stats | null = null;
const SERVER_STATS = Object.freeze(emptyStats());

function emitStorageChange(): void {
  storageVersion += 1;
  cachedStats = null;
  listeners.forEach((l) => l());
}

/** Stable stats snapshot for useSyncExternalStore (recomputed only on change). */
export function getStatsSnapshot(): Stats {
  if (cachedStats === null) cachedStats = loadState().stats;
  return cachedStats;
}

/** Stable empty snapshot used during SSR. */
export function getStatsServerSnapshot(): Stats {
  return SERVER_STATS;
}

export interface PersistedState {
  version: number;
  /** Day results keyed by UTC "YYYY-MM-DD" date string. */
  results: Record<string, DayResult>;
  stats: Stats;
}

export function emptyStats(): Stats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    buzzPositionSum: 0,
    buzzPositionCount: 0,
    tierDistribution: [0, 0, 0, 0, 0],
    lastResultDate: null,
  };
}

export function emptyState(): PersistedState {
  return { version: SCHEMA_VERSION, results: {}, stats: emptyStats() };
}

/**
 * Fold a single day's result into a stats object, returning a new Stats.
 * Pure — no storage, no clock.
 */
export function applyResultToStats(stats: Stats, result: DayResult): Stats {
  const next: Stats = {
    ...stats,
    tierDistribution: [...stats.tierDistribution] as Stats["tierDistribution"],
  };

  next.gamesPlayed += 1;

  const consecutive =
    stats.lastResultDate !== null &&
    daysSince(stats.lastResultDate, result.date) === 1;

  if (result.won) {
    next.gamesWon += 1;
    next.currentStreak = consecutive ? stats.currentStreak + 1 : 1;
    if (result.buzzedOn !== null) {
      next.buzzPositionSum += result.buzzedOn;
      next.buzzPositionCount += 1;
      next.tierDistribution[result.buzzedOn] += 1;
    }
  } else {
    next.currentStreak = 0;
  }

  next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
  next.lastResultDate = result.date;
  return next;
}

/** Mean clue index of correct buzzes, or null if no wins yet. */
export function averageBuzzPosition(stats: Stats): number | null {
  if (stats.buzzPositionCount === 0) return null;
  return stats.buzzPositionSum / stats.buzzPositionCount;
}

/** Win rate in [0, 1], or 0 if nothing played. */
export function winRate(stats: Stats): number {
  return stats.gamesPlayed === 0 ? 0 : stats.gamesWon / stats.gamesPlayed;
}

// --- DOM-bound helpers (guard for SSR / static export build) -------------

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Load persisted state, resetting on any corruption or version mismatch. */
export function loadState(): PersistedState {
  if (!hasStorage()) return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed.version !== SCHEMA_VERSION) {
      // Unknown schema: start fresh rather than risk crashing on stale shapes.
      return emptyState();
    }
    return {
      version: SCHEMA_VERSION,
      results: parsed.results ?? {},
      stats: { ...emptyStats(), ...parsed.stats },
    };
  } catch {
    return emptyState();
  }
}

function saveState(state: PersistedState): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private-mode failures are non-fatal for gameplay.
  }
}

/** Result already stored for a given date, if any. */
export function getResultForDate(date: string): DayResult | null {
  return loadState().results[date] ?? null;
}

// --- Endless practice records (separate from daily stats) ----------------

export const ENDLESS_KEY = "pyramidal-buzz:endless:v1";

export interface EndlessRecords {
  /** Longest run of consecutive correct answers, ever, in practice. */
  bestStreak: number;
  /** Best single-round score, ever, in practice. */
  highScore: number;
}

export function emptyEndlessRecords(): EndlessRecords {
  return { bestStreak: 0, highScore: 0 };
}

/** Fold a finished practice round into the persisted records (pure). */
export function applyEndlessRound(
  records: EndlessRecords,
  currentStreak: number,
  score: number,
): EndlessRecords {
  return {
    bestStreak: Math.max(records.bestStreak, currentStreak),
    highScore: Math.max(records.highScore, score),
  };
}

export function loadEndlessRecords(): EndlessRecords {
  if (!hasStorage()) return emptyEndlessRecords();
  try {
    const raw = window.localStorage.getItem(ENDLESS_KEY);
    if (!raw) return emptyEndlessRecords();
    const parsed = JSON.parse(raw) as Partial<EndlessRecords>;
    return {
      bestStreak: Number(parsed.bestStreak) || 0,
      highScore: Number(parsed.highScore) || 0,
    };
  } catch {
    return emptyEndlessRecords();
  }
}

export function saveEndlessRecords(records: EndlessRecords): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(ENDLESS_KEY, JSON.stringify(records));
  } catch {
    // Non-fatal.
  }
}

export function getStats(): Stats {
  return loadState().stats;
}

/**
 * Persist a completed day's result, updating aggregate stats. Idempotent:
 * a date already recorded is returned unchanged (no double counting).
 */
export function recordResult(input: {
  date: string;
  puzzleId: number;
  won: boolean;
  buzzedOn: ClueIndex | null;
  negs: number;
  score: number;
}): PersistedState {
  const state = loadState();
  if (state.results[input.date]) {
    return state; // already recorded; don't double-count
  }

  const result: DayResult = {
    puzzleId: input.puzzleId,
    date: input.date,
    score: input.score,
    buzzedOn: input.buzzedOn,
    negs: input.negs,
    won: input.won,
    completed: true,
  };

  const next: PersistedState = {
    version: SCHEMA_VERSION,
    results: { ...state.results, [input.date]: result },
    stats: applyResultToStats(state.stats, result),
  };
  saveState(next);
  emitStorageChange();
  return next;
}
