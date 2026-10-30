// Skins (T-041, D-005, D-034). The pre-paint script sets `data-skin` on
// <html> before the first paint, from the `?skin=` parameter, then the stored
// choice, then the default. A valid parameter is stored, so a shared link
// keeps its skin on the next pages and visits. The theme keeps its own
// default (the system preference, see theme.ts); `prePaintScript` runs both
// in <head>.

import { themeScript } from "./theme";

export const SKINS = ["editorial", "systems"] as const;

export type Skin = (typeof SKINS)[number];

export const DEFAULT_SKIN: Skin = "editorial";
export const SKIN_STORAGE_KEY = "skin";
export const SKIN_PARAM = "skin";

// Inlined in <head> by root.tsx, before the stylesheets. Kept as a string so
// the bundler cannot rewrite it. Storage can throw (blocked site data); the
// parameter and the default still apply.
export const skinScript = `(function(){var k=${JSON.stringify(
  SKIN_STORAGE_KEY,
)},v=${JSON.stringify(SKINS)},s=null,p=null;try{p=new URLSearchParams(location.search).get(${JSON.stringify(
  SKIN_PARAM,
)})}catch(e){}if(v.indexOf(p)!==-1){s=p;try{localStorage.setItem(k,s)}catch(e){}}else{try{s=localStorage.getItem(k)}catch(e){}if(v.indexOf(s)===-1)s=${JSON.stringify(
  DEFAULT_SKIN,
)}}document.documentElement.dataset.skin=s})()`;

// The theme and skin scripts as one inline script, for root.tsx. The
// semicolon keeps the second IIFE from being read as a call on the first.
export const prePaintScript = `${themeScript};${skinScript}`;

export function isSkin(value: unknown): value is Skin {
  return SKINS.includes(value as Skin);
}

// The skin named by a `?skin=` query string, or null when it is missing or
// unknown.
export function readSkinParam(search: string): Skin | null {
  const value = new URLSearchParams(search).get(SKIN_PARAM);
  return isSkin(value) ? value : null;
}

export function readStoredSkin(): Skin | null {
  try {
    const value = localStorage.getItem(SKIN_STORAGE_KEY);
    return isSkin(value) ? value : null;
  } catch {
    return null;
  }
}

function storeSkin(skin: Skin): void {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, skin);
  } catch {
    // Storage is blocked: the choice lasts until the page is reloaded.
  }
}

// The same order as the pre-paint script: parameter, stored choice, default.
export function resolveSkin(search: string): Skin {
  return readSkinParam(search) ?? readStoredSkin() ?? DEFAULT_SKIN;
}

export function currentSkin(): Skin {
  const value = document.documentElement.dataset.skin;
  return isSkin(value) ? value : DEFAULT_SKIN;
}

const listeners = new Set<() => void>();

// For useSyncExternalStore.
export function subscribeSkin(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Stores the choice and applies it at once. The switcher (T-042) wraps this
// in its transition.
export function setSkin(skin: Skin): void {
  storeSkin(skin);
  document.documentElement.dataset.skin = skin;
  listeners.forEach((listener) => listener());
}
