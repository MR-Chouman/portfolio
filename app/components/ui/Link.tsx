import type { AnchorHTMLAttributes } from "react";
import { Link as RouterLink } from "react-router";

import { cx } from "~/lib/cx";

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

// Site paths navigate client-side. External URLs, mailto:, #hash links and
// files such as /cv.pdf are plain anchors.
export function isInternalHref(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  const lastSegment = href.split(/[?#]/)[0].split("/").pop() ?? "";
  return !lastSegment.includes(".");
}

export function Anchor({ href, children, ...props }: AnchorProps) {
  return isInternalHref(href) ? (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  ) : (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

const linkVariants = {
  accent: "text-accent decoration-1 hover:decoration-2",
  muted: "text-fg-muted hover:text-fg",
} as const;

export interface LinkProps extends AnchorProps {
  variant?: keyof typeof linkVariants;
}

export function Link({ variant = "accent", className, ...props }: LinkProps) {
  return (
    <Anchor
      className={cx(
        "rounded-sm underline underline-offset-4 transition-colors duration-(--duration-fast) ease-standard",
        linkVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
