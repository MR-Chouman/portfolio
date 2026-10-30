import { afterEach, describe, expect, it, vi } from "vitest";

import { createMockApi, MockApiError } from "~/lib/lab/api";
import {
  DEFAULT_QUERY,
  parseListQuery,
  queryRecords,
  toSearchParams,
  type ListQuery,
} from "~/lib/lab/query";
import {
  ASSET_CATEGORIES,
  ASSET_SITES,
  ASSET_STATUSES,
  createRandom,
  DEFAULT_RECORD_COUNT,
  generateAssets,
  type Asset,
} from "~/lib/lab/records";

const assets = generateAssets();

describe("generateAssets", () => {
  it("is deterministic for a seed and differs across seeds", () => {
    expect(generateAssets()).toEqual(assets);
    expect(generateAssets(20, 1)).not.toEqual(generateAssets(20, 2));
  });

  it("makes the default number of valid, unique records", () => {
    expect(assets).toHaveLength(DEFAULT_RECORD_COUNT);
    expect(new Set(assets.map((a) => a.id)).size).toBe(assets.length);
    expect(new Set(assets.map((a) => a.name)).size).toBe(assets.length);
    for (const asset of assets) {
      expect(asset.id).toMatch(/^AST-\d{4}$/);
      expect(ASSET_STATUSES).toContain(asset.status);
      expect(ASSET_CATEGORIES).toContain(asset.category);
      expect(ASSET_SITES).toContain(asset.site);
      expect(asset.value).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(asset.updatedAt))).toBe(false);
      expect(Date.parse(asset.updatedAt)).toBeLessThanOrEqual(
        Date.UTC(2026, 9, 1),
      );
    }
  });

  it("covers every status, category and site", () => {
    expect(new Set(assets.map((a) => a.status)).size).toBe(
      ASSET_STATUSES.length,
    );
    expect(new Set(assets.map((a) => a.category)).size).toBe(
      ASSET_CATEGORIES.length,
    );
    expect(new Set(assets.map((a) => a.site)).size).toBe(ASSET_SITES.length);
  });

  it("uses a PRNG in [0, 1)", () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i++) {
      const n = random();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe("queryRecords", () => {
  it("returns the first page of the default query", () => {
    const result = queryRecords(assets);
    expect(result.items).toHaveLength(DEFAULT_QUERY.pageSize);
    expect(result.total).toBe(assets.length);
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(
      Math.ceil(assets.length / DEFAULT_QUERY.pageSize),
    );
    // Default sort: most recently updated first.
    const dates = result.items.map((a) => a.updatedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("paginates without gaps or overlaps", () => {
    const seen: Asset[] = [];
    const { pageCount } = queryRecords(assets, { pageSize: 25 });
    for (let page = 1; page <= pageCount; page++) {
      seen.push(...queryRecords(assets, { pageSize: 25, page }).items);
    }
    expect(seen).toHaveLength(assets.length);
    expect(new Set(seen.map((a) => a.id)).size).toBe(assets.length);
  });

  it("clamps the page into range", () => {
    expect(queryRecords(assets, { page: 999 }).page).toBe(
      Math.ceil(assets.length / 10),
    );
    expect(queryRecords(assets, { page: -3 }).page).toBe(1);
    expect(queryRecords(assets, { page: Number.NaN }).page).toBe(1);
  });

  it("sorts numbers, strings and dates in both directions", () => {
    const byValue = queryRecords(assets, {
      sort: "value",
      direction: "asc",
      pageSize: 50,
    }).items.map((a) => a.value);
    expect(byValue).toEqual([...byValue].sort((a, b) => a - b));

    const byId = queryRecords(assets, { sort: "id", direction: "desc" });
    expect(byId.items[0]?.id).toBe("AST-0240");

    const names = queryRecords(assets, {
      sort: "name",
      direction: "asc",
      pageSize: 50,
    }).items.map((a) => a.name);
    expect(names).toEqual(
      [...names].sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
    );
  });

  it("breaks ties by id so pages are stable", () => {
    const { items } = queryRecords(assets, {
      sort: "status",
      direction: "asc",
      pageSize: 50,
    });
    const active = items.filter((a) => a.status === items[0]?.status);
    const ids = active.map((a) => a.id);
    expect(ids).toEqual([...ids].sort());
  });

  it("filters by status, category, site and search together", () => {
    const query: Partial<ListQuery> = {
      status: ["active", "reserved"],
      category: ["vehicle"],
      site: ["North depot", "Harbor yard"],
      pageSize: 50,
    };
    const result = queryRecords(assets, query);
    const expected = assets.filter(
      (a) =>
        ["active", "reserved"].includes(a.status) &&
        a.category === "vehicle" &&
        ["North depot", "Harbor yard"].includes(a.site),
    );
    expect(result.total).toBe(expected.length);
    expect(result.total).toBeGreaterThan(0);

    const search = queryRecords(assets, {
      search: "  FORKLIFT ",
      pageSize: 50,
    });
    expect(search.total).toBeGreaterThan(0);
    expect(search.items.every((a) => a.name.startsWith("Forklift"))).toBe(true);

    expect(queryRecords(assets, { search: "ast-0007" }).items[0]?.id).toBe(
      "AST-0007",
    );
  });

  it("returns an empty first page when nothing matches", () => {
    expect(queryRecords(assets, { search: "no such asset" })).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      pageCount: 1,
    });
  });

  it("does not mutate its input", () => {
    const copy = structuredClone(assets);
    queryRecords(assets, { sort: "value", direction: "asc" });
    expect(assets).toEqual(copy);
  });
});

describe("URL search parameters", () => {
  it("round-trips a full query", () => {
    const query: ListQuery = {
      page: 3,
      pageSize: 25,
      sort: "value",
      direction: "asc",
      search: "drill",
      status: ["active", "retired"],
      category: ["tooling"],
      site: ["East workshop"],
    };
    expect(parseListQuery(toSearchParams(query))).toEqual(query);
  });

  it("leaves defaults out of the URL", () => {
    expect(toSearchParams(DEFAULT_QUERY).toString()).toBe("");
  });

  it("falls back to defaults for invalid values", () => {
    const params = new URLSearchParams(
      "page=0&size=13&sort=secret&dir=up&status=lost&status=active&status=active&category=x",
    );
    expect(parseListQuery(params)).toEqual({
      ...DEFAULT_QUERY,
      status: ["active"],
    });
    expect(parseListQuery(new URLSearchParams("page=2.5")).page).toBe(1);
  });

  it("keeps list filters in a canonical order", () => {
    const params = new URLSearchParams("status=retired&status=active");
    expect(parseListQuery(params).status).toEqual(["active", "retired"]);
  });
});

describe("createMockApi", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves a list after the latency", async () => {
    vi.useFakeTimers();
    const api = createMockApi({ latencyMs: 300 });
    let settled = false;
    const request = api.listAssets({ pageSize: 25 }).then((result) => {
      settled = true;
      return result;
    });
    await vi.advanceTimersByTimeAsync(299);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const result = await request;
    expect(result.items).toHaveLength(25);
    expect(result.total).toBe(DEFAULT_RECORD_COUNT);
  });

  it("returns copies, so callers cannot change the store", async () => {
    const api = createMockApi({ latencyMs: 0 });
    const first = await api.listAssets();
    const [asset] = first.items;
    if (!asset) throw new Error("expected a record");
    asset.name = "changed";
    const second = await api.listAssets();
    expect(second.items[0]?.name).not.toBe("changed");
  });

  it("gets one record by id", async () => {
    const api = createMockApi({ latencyMs: 0 });
    expect((await api.getAsset("AST-0012"))?.id).toBe("AST-0012");
    expect(await api.getAsset("AST-9999")).toBeUndefined();
  });

  it("rejects when aborted, before or during the request", async () => {
    const api = createMockApi({ latencyMs: 50 });
    const before = new AbortController();
    before.abort();
    await expect(
      api.listAssets({}, { signal: before.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });

    const during = new AbortController();
    const request = api.listAssets({}, { signal: during.signal });
    during.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });

  it("fails on demand for the error state", async () => {
    const api = createMockApi({
      latencyMs: 0,
      shouldFail: ({ query }) => query.search === "fail",
    });
    await expect(api.listAssets({ search: "fail" })).rejects.toBeInstanceOf(
      MockApiError,
    );
    await expect(api.listAssets({ search: "forklift" })).resolves.toMatchObject(
      { page: 1 },
    );
  });
});
