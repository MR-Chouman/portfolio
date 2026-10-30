// Skins (T-041, D-005, D-034). The pre-paint script sets `data-skin` on
// <html> before the first paint, from the `?skin=` parameter, then the stored
// choice, then the default. A valid parameter is stored, so a shared link
// keeps its skin on the next pages and visits. The theme keeps its own
// default (the system preference, see theme.ts); `prePaintScript` runs both
// in <head>.
//
// The switcher (T-042) calls `switchSkin`: it loads the target skin's fonts
// first, so the new skin never paints with fallback fonts and reflows, then
// reveals it with a View Transitions circle growing from the control.

import frauncesLatin from "@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url";

import { REDUCED_MOTION_QUERY, themeScript } from "./theme";

export const SKINS = ["editorial", "systems"] as const;

export type Skin = (typeof SKINS)[number];

export const DEFAULT_SKIN: Skin = "editorial";
export const SKIN_STORAGE_KEY = "skin";
export const SKIN_PARAM = "skin";

// Fonts only one skin uses, preloaded by the pre-paint script for that skin
// (the shared Geist file is preloaded by root.tsx for every skin).
export const SKIN_PRELOADS: Record<Skin, readonly string[]> = {
  editorial: [frauncesLatin],
  systems: [],
};

// Every family a skin uses, as `document.fonts.load` descriptors. The faces
// are variable, so one weight loads the whole file.
export const SKIN_FONTS: Record<Skin, readonly string[]> = {
  editorial: [
    '1em "Fraunces Variable"',
    '1em "Geist Variable"',
    '1em "Geist Mono Variable"',
  ],
  systems: ['1em "Geist Variable"', '1em "Geist Mono Variable"'],
};

// How long a switch waits for fonts before it goes ahead with fallbacks.
export const FONT_TIMEOUT_MS = 1000;

// Inlined in <head> by root.tsx, before the stylesheets. Kept as a string so
// the bundler cannot rewrite it. Storage can throw (blocked site data); the
// parameter and the default still apply.
export const skinScript = `(function(){var k=${JSON.stringify(
  SKIN_STORAGE_KEY,
)},v=${JSON.stringify(SKINS)},s=null,p=null;try{p=new URLSearchParams(location.search).get(${JSON.stringify(
  SKIN_PARAM,
)})}catch(e){}if(v.indexOf(p)!==-1){s=p;try{localStorage.setItem(k,s)}catch(e){}}else{try{s=localStorage.getItem(k)}catch(e){}if(v.indexOf(s)===-1)s=${JSON.stringify(
  DEFAULT_SKIN,
)}}document.documentElement.dataset.skin=s;var f=${JSON.stringify(
  SKIN_PRELOADS,
)}[s];for(var i=0;i<f.length;i++){var l=document.createElement("link");l.rel="preload";l.setAttribute("as","font");l.type="font/woff2";l.crossOrigin="anonymous";l.href=f[i];document.head.appendChild(l)}})()`;

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

// Stores the choice and applies it at once, without a transition.
export function setSkin(skin: Skin): void {
  storeSkin(skin);
  document.documentElement.dataset.skin = skin;
  listeners.forEach((listener) => listener());
}

// The skin after this one, for the two-state switcher.
export function nextSkin(skin: Skin): Skin {
  return SKINS[(SKINS.indexOf(skin) + 1) % SKINS.length] ?? DEFAULT_SKIN;
}

// Resolves once the skin's fonts are ready, or after `timeoutMs`; never
// rejects. A no-op where the Font Loading API is missing.
export function loadSkinFonts(
  skin: Skin,
  timeoutMs: number = FONT_TIMEOUT_MS,
): Promise<void> {
  if (!("fonts" in document) || typeof document.fonts.load !== "function") {
    return Promise.resolve();
  }
  const loaded = Promise.all(
    SKIN_FONTS[skin].map((font) => document.fonts.load(font)),
  ).then(
    () => undefined,
    () => undefined,
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  return Promise.race([loaded, timeout]).finally(() => clearTimeout(timer));
}

export type RevealOrigin = { x: number; y: number };

// Set on <html> while a skin transition runs, so base.css can replace the
// default cross-fade with the circular reveal.
export const SKIN_TRANSITION_ATTRIBUTE = "data-skin-transition";

function cssMilliseconds(value: string, fallback: number): number {
  const match = /^(-?[\d.]+)(ms|s)$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  return match[2] === "s" ? amount * 1000 : amount;
}

// A circle growing from `origin` until it covers the viewport, on the new
// snapshot. Duration and easing come from the motion tokens.
function revealFrom(origin: RevealOrigin): void {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const { x, y } = origin;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  root.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: cssMilliseconds(style.getPropertyValue("--duration-slow"), 400),
      easing: style.getPropertyValue("--easing-standard").trim() || "ease-out",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}

let latestSwitch = 0;

// Loads the target skin's fonts, then applies the skin with a circular
// reveal from `origin` (default: the top centre). Instant when the visitor
// prefers reduced motion or View Transitions are missing. If another switch
// starts while fonts load, only the latest one applies.
export async function switchSkin(
  skin: Skin,
  origin?: RevealOrigin,
): Promise<void> {
  const request = ++latestSwitch;
  await loadSkinFonts(skin);
  if (request !== latestSwitch) return;

  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  if (reducedMotion || typeof document.startViewTransition !== "function") {
    setSkin(skin);
    return;
  }

  const root = document.documentElement;
  root.setAttribute(SKIN_TRANSITION_ATTRIBUTE, "");
  const transition = document.startViewTransition(() => setSkin(skin));
  transition.ready
    .then(() => revealFrom(origin ?? { x: window.innerWidth / 2, y: 0 }))
    .catch(() => {
      // Skipped (for example by another transition): the skin still applies.
    });
  try {
    await transition.finished;
  } finally {
    if (request === latestSwitch) {
      root.removeAttribute(SKIN_TRANSITION_ATTRIBUTE);
    }
  }
}
