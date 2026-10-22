import type { ReactNode } from "react";

import { cx } from "~/lib/cx";

// A strip of figures. Columns fit the available width.
export function MetricList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl
      className={cx(
        "grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-6",
        className,
      )}
    >
      {children}
    </dl>
  );
}

// Label first in the DOM (read as "Admin screens: 260+"), value first on
// screen.
export function Metric({
  value,
  label,
}: {
  value: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse gap-1 border-t border-line pt-4">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="font-display text-4xl">{value}</dd>
    </div>
  );
}
