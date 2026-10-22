import type { ButtonHTMLAttributes } from "react";

import { cx } from "~/lib/cx";

import { Anchor } from "./Link";

const variants = {
  primary: "bg-accent text-accent-fg hover:bg-fg hover:text-surface",
  secondary:
    "border border-fg-muted text-fg hover:border-fg hover:bg-surface-raised",
  ghost: "text-accent hover:bg-surface-raised",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
} as const;

export interface ButtonStyleProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function buttonStyles({
  variant = "primary",
  size = "md",
}: ButtonStyleProps = {}): string {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-(--duration-fast) ease-standard disabled:pointer-events-none disabled:opacity-60",
    variants[variant],
    sizes[size],
  );
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleProps {}

export function Button({
  variant,
  size,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonStyles({ variant, size }), className)}
      {...props}
    />
  );
}

export interface ButtonLinkProps
  extends ButtonStyleProps, React.ComponentProps<typeof Anchor> {}

// A link that looks like a button: for navigation and downloads, never for
// actions on the page.
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Anchor
      className={cx(buttonStyles({ variant, size }), className)}
      {...props}
    />
  );
}
