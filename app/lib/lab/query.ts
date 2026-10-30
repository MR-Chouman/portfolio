// Server-style list queries over the mock records (T-050, D-044): filtering,
// sorting and pagination as a pure function, plus a strict round trip to URL
// search parameters so the table state (T-051) can live in the URL. Unknown or
// invalid parameters fall back to the defaults instead of throwing.

import {
  ASSET_CATEGORIES,
  ASSET_SITES,
  ASSET_STATUSES,
  type Asset,
  type AssetCategory,
  type AssetSite,
  type AssetStatus,
} from "./records";

export const SORT_FIELDS = [
  "id",
  "name",
  "category",
  "status",
  "site",
  "value",
  "updatedAt",
] as const satisfies readonly (keyof Asset)[];
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export const PAGE_SIZES = [10, 25, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface ListQuery {
  page: number; // 1-based
  pageSize: PageSize;
  sort: SortField;
  direction: SortDirection;
  search: string; // matches id and name, case-insensitive
  status: AssetStatus[]; // empty: any
  category: AssetCategory[]; // empty: any
  site: AssetSite[]; // empty: any
}

export interface ListResult<T> {
  items: T[];
  total: number; // matches after filtering
  page: number; // clamped into 1..pageCount
  pageSize: PageSize;
  pageCount: number; // at least 1, so an empty result still has page 1
}

export const DEFAULT_QUERY: ListQuery = {
  page: 1,
  pageSize: 10,
  sort: "updatedAt",
  direction: "desc",
  search: "",
  status: [],
  category: [],
  site: [],
};

function matches(asset: Asset, query: ListQuery): boolean {
  if (query.status.length && !query.status.includes(asset.status)) return false;
  if (query.category.length && !query.category.includes(asset.category))
    return false;
  if (query.site.length && !query.site.includes(asset.site)) return false;
  const term = query.search.trim().toLowerCase();
  if (!term) return true;
  return (
    asset.id.toLowerCase().includes(term) ||
    asset.name.toLowerCase().includes(term)
  );
}

function compare(a: Asset, b: Asset, field: SortField): number {
  const left = a[field];
  const right = b[field];
  if (typeof left === "number" && typeof right === "number")
    return left - right;
  // ISO dates and ids sort correctly as strings; names compare numerically
  // so "Drill kit 10" follows "Drill kit 9".
  return String(left).localeCompare(String(right), "en", { numeric: true });
}

// Filter, sort and paginate `records` the way a list endpoint would. The
// input is never mutated. Ties keep a stable order by id.
export function queryRecords(
  records: readonly Asset[],
  partial: Partial<ListQuery> = {},
): ListResult<Asset> {
  const query = { ...DEFAULT_QUERY, ...partial };
  const sign = query.direction === "asc" ? 1 : -1;
  const filtered = records
    .filter((asset) => matches(asset, query))
    .sort((a, b) => sign * compare(a, b, query.sort) || compare(a, b, "id"));
  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(Math.max(1, Math.floor(query.page) || 1), pageCount);
  const start = (page - 1) * query.pageSize;
  return {
    items: filtered.slice(start, start + query.pageSize),
    total: filtered.length,
    page,
    pageSize: query.pageSize,
    pageCount,
  };
}

// URL parameter names. Lists are repeated parameters (`status=a&status=b`).
const PARAM = {
  page: "page",
  pageSize: "size",
  sort: "sort",
  direction: "dir",
  search: "q",
  status: "status",
  category: "category",
  site: "site",
} as const;

function oneOf<T extends string | number>(
  allowed: readonly T[],
  value: unknown,
): value is T {
  return allowed.includes(value as T);
}

function listOf<T extends string>(
  params: URLSearchParams,
  name: string,
  allowed: readonly T[],
): T[] {
  // Unique, valid values in the canonical order, so equal filters give
  // equal URLs.
  const values = new Set(params.getAll(name));
  return allowed.filter((value) => values.has(value));
}

// A full query from URL search parameters; anything missing or invalid takes
// its default.
export function parseListQuery(params: URLSearchParams): ListQuery {
  const page = Number(params.get(PARAM.page));
  const pageSize = Number(params.get(PARAM.pageSize));
  const sort = params.get(PARAM.sort);
  const direction = params.get(PARAM.direction);
  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_QUERY.page,
    pageSize: oneOf(PAGE_SIZES, pageSize) ? pageSize : DEFAULT_QUERY.pageSize,
    sort: oneOf(SORT_FIELDS, sort) ? sort : DEFAULT_QUERY.sort,
    direction:
      direction === "asc" || direction === "desc"
        ? direction
        : DEFAULT_QUERY.direction,
    search: (params.get(PARAM.search) ?? "").slice(0, 100),
    status: listOf(params, PARAM.status, ASSET_STATUSES),
    category: listOf(params, PARAM.category, ASSET_CATEGORIES),
    site: listOf(params, PARAM.site, ASSET_SITES),
  };
}

// URL search parameters for a query, leaving out every default so the
// default view has a clean URL.
export function toSearchParams(query: ListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search.trim()) params.set(PARAM.search, query.search.trim());
  for (const value of query.status) params.append(PARAM.status, value);
  for (const value of query.category) params.append(PARAM.category, value);
  for (const value of query.site) params.append(PARAM.site, value);
  if (query.sort !== DEFAULT_QUERY.sort) params.set(PARAM.sort, query.sort);
  if (query.direction !== DEFAULT_QUERY.direction)
    params.set(PARAM.direction, query.direction);
  if (query.pageSize !== DEFAULT_QUERY.pageSize)
    params.set(PARAM.pageSize, String(query.pageSize));
  if (query.page !== DEFAULT_QUERY.page)
    params.set(PARAM.page, String(query.page));
  return params;
}
