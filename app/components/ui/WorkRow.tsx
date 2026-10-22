import { TagList } from "./Tag";
import { Anchor } from "./Link";

export interface WorkRowProps {
  href: string;
  title: string;
  sector: string;
  summary: string;
  metric: string;
  stack: readonly string[];
  linkLabel: string;
  headingLevel?: 2 | 3 | 4;
}

// One project in a list. The title link covers the whole card, so the card
// is a single tab stop and its focus ring is drawn on the card.
export function WorkRow({
  href,
  title,
  sector,
  summary,
  metric,
  stack,
  linkLabel,
  headingLevel = 3,
}: WorkRowProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="group relative grid gap-4 rounded-lg border border-line bg-surface-raised p-5 transition-colors duration-(--duration-fast) ease-standard hover:border-fg-muted has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-focus has-[a:focus-visible]:outline-solid sm:grid-cols-[1fr_auto] sm:p-6">
      <div>
        <p className="font-mono text-xs text-fg-muted">{sector}</p>
        <Heading className="mt-1 font-display text-xl">
          <Anchor
            href={href}
            className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
          >
            {title}
          </Anchor>
        </Heading>
        <p className="mt-2 text-sm text-fg-muted">{summary}</p>
        <TagList items={stack} className="mt-4" />
      </div>
      <div className="flex items-end justify-between gap-3 sm:flex-col">
        <p className="font-mono text-sm">{metric}</p>
        <span
          aria-hidden="true"
          className="text-sm font-medium text-accent underline underline-offset-4 group-hover:decoration-2"
        >
          {linkLabel} →
        </span>
      </div>
    </article>
  );
}
