"use client";

import { useSyncExternalStore } from "react";
import { getTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

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

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark");

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-bg-inset p-0.5"
    >
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
            onClick={() => setTheme(opt.value)}
            className={`focus-ring flex h-7 w-7 items-center justify-center rounded-md transition ${
              active
                ? "bg-accent text-on-accent"
                : "text-fg-faint hover:text-fg"
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
