import type { ReactNode } from "react";

import { cx } from "~/lib/cx";

// Long-form text (case studies, About). Element styles live in the
// `prose-content` class in base.css.
export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("prose-content", className)}>{children}</div>;
}
