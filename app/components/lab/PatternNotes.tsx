import { useId } from "react";

import { Link } from "~/components/ui";
import { cx } from "~/lib/cx";

export interface PatternNotesCopy {
  title: string;
  points: readonly string[];
  sourceTitle: string;
  source: readonly { label: string; href: string }[];
}

// How one lab pattern works, with links to its files in the site's public
// repository (T-054). A titled region, so the notes can be reached from the
// landmark list; the copy comes from content/lab.ts.
export function PatternNotes({
  notes,
  className,
}: {
  notes: PatternNotesCopy;
  className?: string;
}) {
  const headingId = useId();
  const sourceId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cx(
        "rounded-lg border border-line bg-surface-raised p-5",
        className,
      )}
    >
      <h3 id={headingId} className="text-lg">
        {notes.title}
      </h3>
      <ul className="mt-3 grid list-disc gap-2 pl-5 text-fg-muted marker:text-accent">
        {notes.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p
        id={sourceId}
        className="mt-5 font-mono text-xs tracking-wider text-fg-muted uppercase"
      >
        {notes.sourceTitle}
      </p>
      <ul
        aria-labelledby={sourceId}
        className="mt-2 flex flex-wrap gap-x-5 gap-y-2"
      >
        {notes.source.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="font-mono text-sm">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
