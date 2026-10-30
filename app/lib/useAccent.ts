import { useSyncExternalStore } from "react";

import { type Accent, currentAccent, subscribeAccent } from "./accent";

// The accent on <html>, or null while prerendering and hydrating (the server
// cannot know it). Components render a neutral state until then.
export function useAccent(): Accent | null {
  return useSyncExternalStore(subscribeAccent, currentAccent, () => null);
}
