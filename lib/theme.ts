/**
 * Theme state. The active theme lives as `data-theme` on <html> (set before
 * paint by a script in the layout). This module reads/writes it and notifies
 * subscribers, so React can mirror it via useSyncExternalStore.
 */

export type Theme = "light" | "dark" | "funky";

export const THEMES: Theme[] = ["light", "dark", "funky"];

const KEY = "pyramidal-buzz:theme";
const listeners = new Set<() => void>();

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "funky";
}

export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const t = document.documentElement.dataset.theme;
  return isTheme(t) ? t : "dark";
}

export function setTheme(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

export function subscribeTheme(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
