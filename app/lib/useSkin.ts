import { useSyncExternalStore } from "react";

import { currentSkin, subscribeSkin, type Skin } from "./skin";

// The skin on <html>, or null while prerendering and hydrating (the server
// cannot know it). Components render a neutral state until then.
export function useSkin(): Skin | null {
  return useSyncExternalStore(subscribeSkin, currentSkin, () => null);
}
