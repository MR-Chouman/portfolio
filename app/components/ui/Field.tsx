import type { ComponentProps, ReactNode } from "react";

import { cx } from "~/lib/cx";

// Text inputs and selects (T-052, T-053). An invalid control gets a thicker
// border in the text color, so the state never relies on hue; a disabled one
// is dimmed like a disabled button.
export const controlStyles =
  "mt-2 block h-10 w-full rounded-md border border-fg-muted bg-surface px-3 text-sm text-fg placeholder:text-fg-muted aria-invalid:border-2 aria-invalid:border-fg disabled:cursor-not-allowed disabled:opacity-60";

// aria-describedby for a control inside a Field: its hint, then its error.
export function fieldDescribedBy(
  id: string,
  hint: boolean,
  error: boolean,
): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

// A labelled form control with an optional hint and error. The control
// itself is the child: give it `id`, `controlStyles`, `aria-invalid` when
// there is an error, and `aria-describedby` from `fieldDescribedBy`.
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 flex items-start gap-1.5 text-sm font-medium"
        >
          {/* A mark beside the text, so the error never relies on color. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="mt-0.5 size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.75v4M8 11.25v.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export interface CheckChipProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
}

// A checkbox in a bordered chip, for filters (T-051). The border turns accent
// when checked, and the focus ring goes around the whole chip.
export function CheckChip({ label, className, ...props }: CheckChipProps) {
  return (
    <label
      className={cx(
        "inline-flex cursor-pointer items-center gap-2 rounded-sm border border-line px-2 py-1 text-sm has-checked:border-accent has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
        className,
      )}
    >
      <input
        type="checkbox"
        className="size-4 accent-accent focus-visible:outline-none"
        {...props}
      />
      {label}
    </label>
  );
}
