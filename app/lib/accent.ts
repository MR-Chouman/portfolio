// Accent colors (T-046, D-038, D-040). The pre-paint script sets
// `data-accent` on <html> before the first paint, from the `?accent=`
// parameter, then the stored choice, then green. A valid parameter is stored,
// so a shared link keeps its accent on the next pages and visits. The values
// of each accent live in tokens.css; components use the `accent` tokens only.

import { themeScript } from "./theme";

export const ACCENTS = [
  "green",
  "purple",
  "gold",
  "red",
  "blue",
  "orange",
] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "green";
export const ACCENT_STORAGE_KEY = "accent";
export const ACCENT_PARAM = "accent";

// Inlined in <head> by root.tsx, before the stylesheets. Kept as a string so
// the bundler cannot rewrite it. Storage can throw (blocked site data); the
// parameter and the default still apply.
export const accentScript = `(function(){var k=${JSON.stringify(
  ACCENT_STORAGE_KEY,
)},v=${JSON.stringify(ACCENTS)},a=null,p=null;try{p=new URLSearchParams(location.search).get(${JSON.stringify(
  ACCENT_PARAM,
)})}catch(e){}if(v.indexOf(p)!==-1){a=p;try{localStorage.setItem(k,a)}catch(e){}}else{try{a=localStorage.getItem(k)}catch(e){}if(v.indexOf(a)===-1)a=${JSON.stringify(
  DEFAULT_ACCENT,
)}}document.documentElement.dataset.accent=a})()`;

// The theme and accent scripts as one inline script, for root.tsx. The
// semicolon keeps the second IIFE from being read as a call on the first.
export const prePaintScript = `${themeScript};${accentScript}`;

export function isAccent(value: unknown): value is Accent {
  return ACCENTS.includes(value as Accent);
}

// The accent named by a `?accent=` query string, or null when it is missing
// or unknown.
export function readAccentParam(search: string): Accent | null {
  const value = new URLSearchParams(search).get(ACCENT_PARAM);
  return isAccent(value) ? value : null;
}

export function readStoredAccent(): Accent | null {
  try {
    const value = localStorage.getItem(ACCENT_STORAGE_KEY);
    return isAccent(value) ? value : null;
  } catch {
    return null;
  }
}

function storeAccent(accent: Accent): void {
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // Storage is blocked: the choice lasts until the page is reloaded.
  }
}

// The same order as the pre-paint script: parameter, stored choice, default.
export function resolveAccent(search: string): Accent {
  return readAccentParam(search) ?? readStoredAccent() ?? DEFAULT_ACCENT;
}

export function currentAccent(): Accent {
  const value = document.documentElement.dataset.accent;
  return isAccent(value) ? value : DEFAULT_ACCENT;
}

const listeners = new Set<() => void>();

// For useSyncExternalStore.
export function subscribeAccent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Stores the choice and applies it at once. Only color tokens change, so
// there is no transition to run.
export function setAccent(accent: Accent): void {
  storeAccent(accent);
  document.documentElement.dataset.accent = accent;
  listeners.forEach((listener) => listener());
}
