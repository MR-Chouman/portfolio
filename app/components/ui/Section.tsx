import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cx } from "~/lib/cx";

const headingStyles = {
  2: "text-3xl",
  3: "text-2xl",
} as const;

export interface SectionProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  title: ReactNode;
  eyebrow?: ReactNode;
  intro?: ReactNode;
  headingLevel?: keyof typeof headingStyles;
}

// A titled region of a page; the heading labels the landmark. Vertical
// spacing between sections belongs to the page.
export function Section({
  title,
  eyebrow,
  intro,
  headingLevel = 2,
  className,
  children,
  ...props
}: SectionProps) {
  const headingId = useId();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={headingId} className={className} {...props}>
      <header className="max-w-reading">
        {eyebrow && (
          <p className="font-mono text-xs tracking-wider text-accent uppercase">
            {eyebrow}
          </p>
        )}
        <Heading
          id={headingId}
          className={cx(
            headingStyles[headingLevel],
            eyebrow ? "mt-2" : undefined,
          )}
        >
          {title}
        </Heading>
        {intro && <p className="mt-3 text-lg text-fg-muted">{intro}</p>}
      </header>
      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}
