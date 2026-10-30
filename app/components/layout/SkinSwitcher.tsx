import { useId, useState } from "react";

import { nextSkin, switchSkin, type Skin } from "~/lib/skin";
import { useSkin } from "~/lib/useSkin";

import { site } from "../../../content/site";

const copy = site.skinSwitcher;

function withDesign(template: string, skin: Skin): string {
  return template.replace("{design}", copy.names[skin]);
}

// Switches between the two designs (skins). The name says what it does; the
// description gives the current design, and a polite status message
// announces the new one after a switch. Disabled until hydration, when the
// skin on <html> becomes known.
export function SkinSwitcher() {
  const skin = useSkin();
  const descriptionId = useId();
  const [announcement, setAnnouncement] = useState("");

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (skin === null) return;
    const target = nextSkin(skin);
    // The reveal grows from the control's centre, also for keyboard
    // activation.
    const rect = event.currentTarget.getBoundingClientRect();
    void switchSkin(target, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }).then(() => setAnnouncement(withDesign(copy.switched, target)));
  }

  return (
    <>
      <button
        type="button"
        aria-label={copy.label}
        aria-describedby={descriptionId}
        title={copy.label}
        disabled={skin === null}
        onClick={handleClick}
        className="inline-flex size-9 items-center justify-center rounded-md border border-line text-fg-muted transition-colors duration-(--duration-fast) ease-standard hover:border-fg-muted hover:text-fg disabled:cursor-default"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="11" height="11" rx="3" />
          <path d="M10 10h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2Z" />
        </svg>
      </button>
      <span id={descriptionId} hidden>
        {skin === null ? "" : withDesign(copy.current, skin)}
      </span>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
