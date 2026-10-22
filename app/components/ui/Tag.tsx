import type { ReactNode } from "react";

import { cx } from "~/lib/cx";

const tones = {
  neutral: "border-line text-fg-muted",
  accent: "border-accent text-accent",
} as const;

type Tone = keyof typeof tones;

const tagStyles = (tone: Tone) =>
  cx(
    "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs",
    tones[tone],
  );

export function Tag({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={tagStyles(tone)}>{children}</span>;
}

// A list of labels, such as a project's stack.
export function TagList({
  items,
  tone = "neutral",
  className,
}: {
  items: readonly string[];
  tone?: Tone;
  className?: string;
}) {
  return (
    <ul className={cx("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item} className={tagStyles(tone)}>
          {item}
        </li>
      ))}
    </ul>
  );
}
