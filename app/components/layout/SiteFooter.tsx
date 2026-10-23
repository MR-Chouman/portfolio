import { site } from "../../../content/site";
import { formatDate } from "~/lib/date";

export function SiteFooter({
  lastUpdated = __LAST_UPDATED__,
}: {
  lastUpdated?: string;
}) {
  return (
    <footer className="mt-section border-t border-line">
      <div className="page-container flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-8 text-sm text-fg-muted">
        <p>
          {site.footer.lastUpdated}{" "}
          <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
        </p>
        <a
          href={site.footer.source.href}
          className="rounded-sm underline underline-offset-4 hover:text-fg"
        >
          {site.footer.source.label}
        </a>
      </div>
    </footer>
  );
}
