import { useSyncExternalStore } from "react";

import { currentTheme, subscribeTheme, type Theme } from "./theme";

// The theme on <html>, or null while prerendering and hydrating (the server
// cannot know it). Components render a neutral state until then.
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => null);
}
