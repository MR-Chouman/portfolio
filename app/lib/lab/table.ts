// State changes of the lab data table (T-051). Each one takes the current
// query and returns the next, so the table only ever writes a whole query to
// the URL (`toSearchParams`) and reads it back (`parseListQuery`). Anything
// that changes which rows match goes back to the first page.

import {
  DEFAULT_QUERY,
  type ListQuery,
  type PageSize,
  type SortField,
} from "./query";

export type FilterField = "status" | "category" | "site";

// Numbers and dates read best newest or largest first; text A to Z.
const DESCENDING_FIRST: readonly SortField[] = ["value", "updatedAt"];

// A click on a column header: the current column flips direction, another
// column starts in its natural direction.
export function toggleSort(query: ListQuery, field: SortField): ListQuery {
  const direction =
    query.sort === field
      ? query.direction === "asc"
        ? "desc"
        : "asc"
      : DESCENDING_FIRST.includes(field)
        ? "desc"
        : "asc";
  return { ...query, sort: field, direction, page: 1 };
}

// Adds or removes one value of a multi-value filter.
export function toggleFilter<F extends FilterField>(
  query: ListQuery,
  field: F,
  value: ListQuery[F][number],
): ListQuery {
  const current = query[field] as readonly string[];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...query, [field]: next, page: 1 };
}

export function setSearch(query: ListQuery, search: string): ListQuery {
  return { ...query, search, page: 1 };
}

export function setPageSize(query: ListQuery, pageSize: PageSize): ListQuery {
  return { ...query, pageSize, page: 1 };
}

export function setPage(query: ListQuery, page: number): ListQuery {
  return { ...query, page };
}

export function hasFilters(query: ListQuery): boolean {
  return (
    query.search.trim() !== "" ||
    query.status.length > 0 ||
    query.category.length > 0 ||
    query.site.length > 0
  );
}

// Keeps the sort and page size, drops every filter.
export function clearFilters(query: ListQuery): ListQuery {
  return {
    ...query,
    search: DEFAULT_QUERY.search,
    status: [],
    category: [],
    site: [],
    page: 1,
  };
}

// Fills "{name}" placeholders in a copy string.
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
