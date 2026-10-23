// Joins class names, skipping falsy values. Classes are appended, not merged:
// a `className` passed to a primitive adds to its defaults.
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
