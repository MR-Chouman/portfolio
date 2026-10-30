import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useNavigation, useRevalidator, useSearchParams } from "react-router";

import { Button } from "~/components/ui";
import type { LabClient, LabTableData } from "~/lib/lab/client";
import {
  DEFAULT_QUERY,
  PAGE_SIZES,
  SORT_FIELDS,
  parseListQuery,
  toSearchParams,
  type ListQuery,
  type PageSize,
  type SortField,
} from "~/lib/lab/query";
import {
  ASSET_CATEGORIES,
  ASSET_SITES,
  ASSET_STATUSES,
  type Asset,
} from "~/lib/lab/records";
import {
  clearFilters,
  format,
  hasFilters,
  setPage,
  setPageSize,
  setSearch,
  toggleFilter,
  toggleSort,
  type FilterField,
} from "~/lib/lab/table";
import { cx } from "~/lib/cx";

import { lab } from "../../../content/lab";

// The lab's server-style data table (T-051): search, filters, sortable
// columns and pagination over the mock endpoint (D-044). The URL is the only
// state: every control writes a new query to it, React Router re-runs the
// route's clientLoader, and reload or back/forward bring the same view back.
// While a request runs, the controls already show the requested query and
// the previous rows stay, dimmed and marked busy.

const copy = lab.table;
const SEARCH_DELAY_MS = 300;

const valueFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// UTC, so the date does not depend on the visitor's time zone.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const numericColumns: readonly SortField[] = ["value"];

function cellText(asset: Asset, field: SortField): ReactNode {
  switch (field) {
    case "status":
      return <StatusLabel status={asset.status} />;
    case "category":
      return copy.values.category[asset.category];
    case "value":
      return valueFormat.format(asset.value);
    case "updatedAt":
      return (
        <time dateTime={asset.updatedAt}>
          {dateFormat.format(new Date(asset.updatedAt))}
        </time>
      );
    default:
      return asset[field];
  }
}

function StatusLabel({ status }: { status: Asset["status"] }) {
  // Shape and text carry the status, never color alone.
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={cx(
          "size-2 rounded-full border border-fg-muted",
          status === "active" && "border-accent bg-accent",
          status === "maintenance" && "bg-fg-muted",
          status === "reserved" && "border-dashed",
          status === "retired" && "rounded-none",
        )}
      />
      {copy.values.status[status]}
    </span>
  );
}

function SortIcon({ direction }: { direction: "asc" | "desc" | undefined }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cx("size-3", !direction && "opacity-40")}
    >
      {direction !== "desc" && (
        <path d="M6 2 9.5 5.5h-7z" fill="currentColor" />
      )}
      {direction !== "asc" && <path d="M6 10 2.5 6.5h7z" fill="currentColor" />}
    </svg>
  );
}

function ColumnHeader({
  field,
  query,
  disabled,
  onSort,
}: {
  field: SortField;
  query: ListQuery;
  disabled: boolean;
  onSort: (field: SortField) => void;
}) {
  const active = query.sort === field;
  const direction = active ? query.direction : undefined;
  return (
    <th
      scope="col"
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : undefined
      }
      className={cx(
        "border-b border-fg-muted px-3 py-2 font-medium whitespace-nowrap",
        numericColumns.includes(field) ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSort(field)}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-sm hover:text-accent",
          active && "text-accent",
        )}
      >
        {copy.columns[field]}
        <SortIcon direction={direction} />
      </button>
    </th>
  );
}

function FilterGroup<F extends FilterField>({
  field,
  legend,
  options,
  labels,
  selected,
  onToggle,
}: {
  field: F;
  legend: string;
  options: readonly ListQuery[F][number][];
  labels?: Record<string, string>;
  selected: readonly string[];
  onToggle: (field: F, value: ListQuery[F][number]) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="font-mono text-xs tracking-wider text-fg-muted uppercase">
        {legend}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-line px-2 py-1 text-sm has-checked:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          >
            <input
              type="checkbox"
              name={field}
              value={option}
              checked={selected.includes(option)}
              onChange={() => onToggle(field, option)}
              className="size-4 accent-accent focus-visible:outline-none"
            />
            {labels?.[option] ?? option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SearchField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (search: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);
  // Back/forward or "Clear filters" change the URL: show its search.
  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function commit(next: string) {
    clearTimeout(timer.current);
    if (next.trim() !== value.trim()) onCommit(next);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        commit(draft);
      }}
      className="min-w-0"
    >
      <label
        htmlFor={id}
        className="font-mono text-xs tracking-wider text-fg-muted uppercase"
      >
        {copy.filters.search}
      </label>
      <input
        id={id}
        type="search"
        value={draft}
        maxLength={100}
        autoComplete="off"
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => commit(next), SEARCH_DELAY_MS);
        }}
        className="mt-2 block h-10 w-full rounded-md border border-fg-muted bg-surface px-3 text-sm text-fg placeholder:text-fg-muted"
        placeholder={copy.filters.searchHint}
      />
    </form>
  );
}

function Pagination({
  query,
  data,
  onChange,
}: {
  query: ListQuery;
  data: LabTableData | undefined;
  onChange: (next: ListQuery) => void;
}) {
  const sizeId = useId();
  const result = data?.result;
  const pageCount = result?.pageCount ?? 1;
  const page = Math.min(query.page, pageCount);
  const from = result && result.total ? (page - 1) * query.pageSize + 1 : 0;
  const to = result ? Math.min(page * query.pageSize, result.total) : 0;
  const goTo = (target: number) => onChange(setPage(query, target));
  const pages = copy.pagination;

  return (
    <nav
      aria-label={pages.label}
      className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm"
    >
      <div className="flex items-center gap-2">
        <label htmlFor={sizeId} className="text-fg-muted">
          {pages.pageSize}
        </label>
        <select
          id={sizeId}
          disabled={!data}
          value={query.pageSize}
          onChange={(event) =>
            onChange(setPageSize(query, Number(event.target.value) as PageSize))
          }
          className="h-9 rounded-md border border-fg-muted bg-surface px-2 text-fg"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {result && (
        <p className="font-mono text-fg-muted">
          {format(pages.range, { from, to, total: result.total })}
        </p>
      )}

      <div className="flex items-center gap-1">
        <PageButton
          label={pages.first}
          disabled={!result || page <= 1}
          onClick={() => goTo(1)}
          path="M11 3 6 8l5 5M5 3v10"
        />
        <PageButton
          label={pages.previous}
          disabled={!result || page <= 1}
          onClick={() => goTo(page - 1)}
          path="M10 3 5 8l5 5"
        />
        <span className="px-2 font-mono whitespace-nowrap">
          {format(pages.page, { page, pageCount })}
        </span>
        <PageButton
          label={pages.next}
          disabled={!result || page >= pageCount}
          onClick={() => goTo(page + 1)}
          path="M6 3l5 5-5 5"
        />
        <PageButton
          label={pages.last}
          disabled={!result || page >= pageCount}
          onClick={() => goTo(pageCount)}
          path="M5 3l5 5-5 5M11 3v10"
        />
      </div>
    </nav>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  path,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  path: string;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="w-9 px-0"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </Button>
  );
}

export interface AssetTableProps {
  // The route's loader data; undefined before the first response.
  data: LabTableData | undefined;
  client: Pick<LabClient, "failNext">;
}

export function AssetTable({ data, client }: AssetTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  // A request in flight for this page: a URL change or a retry.
  const pending =
    navigation.state === "loading" && navigation.location.pathname === "/lab"
      ? navigation.location
      : undefined;
  const busy = !data || pending !== undefined || revalidator.state !== "idle";

  // The controls show the requested query at once, the rows follow. Before
  // the first response (the prerendered page, hydrated as is) they show the
  // defaults, disabled, so the markup does not depend on the URL.
  const query = !data
    ? DEFAULT_QUERY
    : parseListQuery(
        pending ? new URLSearchParams(pending.search) : searchParams,
      );

  function update(next: ListQuery) {
    setSearchParams(toSearchParams(next), { preventScrollReset: true });
  }

  function onFilter<F extends FilterField>(
    field: F,
    value: ListQuery[F][number],
  ) {
    update(toggleFilter(query, field, value));
  }

  const result = data?.result;
  const rows = result?.items ?? [];

  return (
    <div>
      <fieldset
        disabled={!data}
        className="grid min-w-0 gap-6 rounded-lg border border-line bg-surface-raised p-4 sm:p-6"
      >
        <legend className="sr-only">{copy.filters.label}</legend>
        <SearchField
          value={query.search}
          onCommit={(search) => update(setSearch(query, search))}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FilterGroup
            field="status"
            legend={copy.filters.status}
            options={ASSET_STATUSES}
            labels={copy.values.status}
            selected={query.status}
            onToggle={onFilter}
          />
          <FilterGroup
            field="category"
            legend={copy.filters.category}
            options={ASSET_CATEGORIES}
            labels={copy.values.category}
            selected={query.category}
            onToggle={onFilter}
          />
          <FilterGroup
            field="site"
            legend={copy.filters.site}
            options={ASSET_SITES}
            selected={query.site}
            onToggle={onFilter}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasFilters(query)}
            onClick={() => update(clearFilters(query))}
          >
            {copy.filters.clear}
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-fg-muted">{copy.simulate.hint}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                client.failNext();
                void revalidator.revalidate();
              }}
            >
              {copy.simulate.label}
            </Button>
          </div>
        </div>
      </fieldset>

      <p role="status" className="sr-only">
        {busy
          ? copy.loading
          : result
            ? result.total === 0
              ? copy.empty.title
              : format(copy.pagination.range, {
                  from: (result.page - 1) * result.pageSize + 1,
                  to: Math.min(result.page * result.pageSize, result.total),
                  total: result.total,
                })
            : copy.error.title}
      </p>

      {data?.error !== undefined && !busy ? (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-fg-muted p-6"
        >
          <h3 className="text-xl">{copy.error.title}</h3>
          <p className="mt-2 text-fg-muted">{copy.error.body}</p>
          <Button
            className="mt-4"
            onClick={() => void revalidator.revalidate()}
          >
            {copy.error.retry}
          </Button>
        </div>
      ) : (
        <>
          <div
            role="region"
            aria-label={copy.regionLabel}
            // Keyboard users can scroll the table sideways on small screens.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="mt-6 overflow-x-auto rounded-lg border border-line"
          >
            <table
              aria-busy={busy}
              className={cx(
                "w-full border-collapse text-sm transition-opacity duration-(--duration-base) ease-standard",
                busy && data !== undefined && "opacity-60",
              )}
            >
              <caption className="sr-only">{copy.caption}</caption>
              <thead className="bg-surface-raised">
                <tr>
                  {SORT_FIELDS.map((field) => (
                    <ColumnHeader
                      key={field}
                      field={field}
                      query={query}
                      disabled={!data}
                      onSort={(next) => update(toggleSort(query, next))}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {!data ? (
                  <tr>
                    <td
                      colSpan={SORT_FIELDS.length}
                      className="px-3 py-12 text-center text-fg-muted"
                    >
                      {copy.loading}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={SORT_FIELDS.length} className="px-3 py-12">
                      <p className="text-center font-medium">
                        {copy.empty.title}
                      </p>
                      <p className="mt-1 text-center text-fg-muted">
                        {copy.empty.body}
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-t border-line first:border-t-0"
                    >
                      {SORT_FIELDS.map((field) =>
                        field === "id" ? (
                          <th
                            key={field}
                            scope="row"
                            className="px-3 py-2 text-left font-mono font-normal whitespace-nowrap"
                          >
                            {asset.id}
                          </th>
                        ) : (
                          <td
                            key={field}
                            className={cx(
                              "px-3 py-2 whitespace-nowrap",
                              numericColumns.includes(field) &&
                                "text-right font-mono",
                            )}
                          >
                            {cellText(asset, field)}
                          </td>
                        ),
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination query={query} data={data} onChange={update} />
        </>
      )}
    </div>
  );
}
