// Light/dark theme (T-014). The pre-paint script sets `data-theme` on <html>
// before the first paint; the toggle changes it and stores an explicit
// choice. Without JavaScript, the tokens follow the system preference.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Inlined in <head> by root.tsx, before the stylesheets. Kept as a string so
// the bundler cannot rewrite it. Storage can throw (blocked site data), so it
// falls back to the system preference.
export const themeScript = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches?"dark":"light"}document.documentElement.dataset.theme=t})()`;

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage is blocked: the choice lasts until the page is reloaded.
  }
}

export function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const listeners = new Set<() => void>();

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((listener) => listener());
}

// For useSyncExternalStore. While no choice is stored, the page follows
// changes to the system preference.
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia(DARK_QUERY);
  const onSystemChange = () => {
    if (!readStoredTheme()) applyTheme(systemTheme());
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

// Stores the choice and applies it with a View Transitions cross-fade
// (duration in base.css), or instantly when the API is missing or the
// visitor prefers reduced motion.
export function setTheme(theme: Theme): void {
  storeTheme(theme);
  const update = () => applyTheme(theme);
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  if (reducedMotion || typeof document.startViewTransition !== "function") {
    update();
    return;
  }
  document.startViewTransition(update);
}
