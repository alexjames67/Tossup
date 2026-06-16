import { PyramidMark } from "./PyramidMark";

interface GameHeaderProps {
  /** Small line under the title, e.g. "#1 · Literature" or "Endless · Science". */
  subtitle: string;
  onHome: () => void;
  onHelp: () => void;
  onStats: () => void;
}

/**
 * Shared top bar. The logo + title act as a button back to the home page.
 */
export function GameHeader({
  subtitle,
  onHome,
  onHelp,
  onStats,
}: GameHeaderProps) {
  return (
    <header className="flex items-center justify-between py-4">
      <button
        type="button"
        onClick={onHome}
        aria-label="Back to home"
        className="focus-ring group flex items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:opacity-90"
      >
        <PyramidMark />
        <span>
          <span className="block font-display text-lg font-bold leading-none text-fg transition-colors group-hover:text-accent-strong">
            Pyramidal Buzz
          </span>
          <span className="mt-0.5 block text-xs text-fg-faint">{subtitle}</span>
        </span>
      </button>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onHelp}
          aria-label="How to play"
          className="focus-ring rounded-md p-2 text-fg-muted transition hover:text-fg"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M7.5 7.5a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.8.6-.8 1.1v.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onStats}
          aria-label="Statistics"
          className="focus-ring rounded-md p-2 text-fg-muted transition hover:text-fg"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M4 16V9M10 16V4M16 16v-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
