"use client";

import { useState, useSyncExternalStore } from "react";
import { Home } from "@/components/Home";
import { DailyScreen } from "@/components/DailyScreen";
import { EndlessScreen } from "@/components/EndlessScreen";
import { StatsModal } from "@/components/StatsModal";
import { HowToPlay } from "@/components/HowToPlay";
import { getPuzzleForDate } from "@/lib/puzzles";
import { todayUtc } from "@/lib/daily";
import {
  getStatsServerSnapshot,
  getStatsSnapshot,
  subscribeStorage,
} from "@/lib/storage";

type View = "home" | "daily" | "endless";

// Resolve "today" on the client only (server snapshot null → no hydration
// mismatch, no setState-in-effect).
const dateSubscribe = () => () => {};
const getClientDate = () => todayUtc();
const getServerDate = () => null;

// First-visit how-to-play, tracked in localStorage via an external store.
const HELP_SEEN_KEY = "pyramidal-buzz:seen-help";
const noopSubscribe = () => () => {};
const getHasSeenHelpClient = () => {
  try {
    return !!window.localStorage.getItem(HELP_SEEN_KEY);
  } catch {
    return true;
  }
};
const getHasSeenHelpServer = () => true;

export default function Page() {
  const date = useSyncExternalStore(
    dateSubscribe,
    getClientDate,
    getServerDate,
  );
  const [view, setView] = useState<View>("home");

  const stats = useSyncExternalStore(
    subscribeStorage,
    getStatsSnapshot,
    getStatsServerSnapshot,
  );
  const [statsOpen, setStatsOpen] = useState(false);

  const hasSeenHelp = useSyncExternalStore(
    noopSubscribe,
    getHasSeenHelpClient,
    getHasSeenHelpServer,
  );
  const [helpOverride, setHelpOverride] = useState<boolean | null>(null);
  const helpOpen = helpOverride ?? !hasSeenHelp;

  function openHelp() {
    setHelpOverride(true);
  }
  function closeHelp() {
    setHelpOverride(false);
    try {
      window.localStorage.setItem(HELP_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  const nav = {
    goHome: () => setView("home"),
    openHelp,
    openStats: () => setStatsOpen(true),
  };

  return (
    <>
      {view === "home" && (
        <Home
          onPlayDaily={() => setView("daily")}
          onPlayEndless={() => setView("endless")}
          onHelp={openHelp}
          onStats={() => setStatsOpen(true)}
          stats={stats}
        />
      )}

      {view === "daily" &&
        (date ? (
          <DailyScreen puzzle={getPuzzleForDate(date)} date={date} nav={nav} />
        ) : (
          <div
            className="flex flex-1 items-center justify-center"
            aria-busy="true"
            aria-label="Loading today's puzzle"
          >
            <span className="animate-pulse font-display text-xl text-fg-faint">
              Pyramidal Buzz
            </span>
          </div>
        ))}

      {view === "endless" && <EndlessScreen nav={nav} />}

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
      />
      <HowToPlay open={helpOpen} onClose={closeHelp} />
    </>
  );
}
