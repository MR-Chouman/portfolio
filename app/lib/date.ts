// Formats the calendar date as written in an ISO string (for a commit date,
// the author's local day), ignoring the time and offset. The result does not
// depend on the visitor's time zone, so prerender and hydration agree.
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}
