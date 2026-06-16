"use client";

import { useSyncExternalStore } from "react";
import { getTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";
import { playThemeSound } from "@/lib/sound";

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
        <circle
          cx="10"
          cy="10"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.6 4.4l-1.4 1.4M5.8 14.2l-1.4 1.4M15.6 15.6l-1.4-1.4M5.8 5.8 4.4 4.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M16 11.5A6.5 6.5 0 0 1 8.5 4a6.5 6.5 0 1 0 7.5 7.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    value: "funky",
    label: "Funky",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M10 1.5l1.9 4.8 4.8 1.9-4.8 1.9L10 15l-1.9-4.9L3.3 8.2l4.8-1.9z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

interface ThemeSwitcherProps {
  /** Show the active theme's name beneath the control. */
  showLabel?: boolean;
}

export function ThemeSwitcher({ showLabel = true }: ThemeSwitcherProps) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark");
  const index = Math.max(
    0,
    OPTIONS.findIndex((o) => o.value === theme),
  );
  const activeLabel = OPTIONS[index]?.label ?? "";

  function choose(next: Theme) {
    setTheme(next);
    // Each theme has its own signature sound, played on selection.
    playThemeSound(next);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        role="radiogroup"
        aria-label="Color theme"
        className="relative inline-grid grid-cols-3 rounded-lg border border-border bg-bg-inset p-0.5"
      >
        {/* Sliding highlight that glides between options. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-9 rounded-md bg-accent transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => choose(opt.value)}
              className={`focus-ring relative z-10 flex h-7 w-9 items-center justify-center rounded-md transition-colors ${
                active ? "text-on-accent" : "text-fg-faint hover:text-fg"
              }`}
            >
              {opt.icon}
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span
          className="text-[11px] tracking-wide text-fg-faint/60"
          aria-live="polite"
        >
          {activeLabel}
        </span>
      )}
    </div>
  );
}
