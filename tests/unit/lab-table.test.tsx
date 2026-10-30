import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createRoutesStub, useLoaderData, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import { AssetTable } from "~/components/lab/AssetTable";
import { createLabClient, type LabTableData } from "~/lib/lab/client";
import { DEFAULT_QUERY, type ListQuery } from "~/lib/lab/query";
import { ASSET_CATEGORIES, ASSET_STATUSES } from "~/lib/lab/records";
import {
  clearFilters,
  format,
  hasFilters,
  setPage,
  setPageSize,
  setSearch,
  toggleFilter,
  toggleSort,
} from "~/lib/lab/table";
import { meta } from "~/routes/lab";

import { lab } from "../../content/lab";
import { labSchema } from "../../content/schema";
import type { Route } from "../../app/routes/+types/lab";

const onPage3: ListQuery = { ...DEFAULT_QUERY, page: 3 };

describe("table state changes", () => {
  it("flips the direction on the current column and resets the page", () => {
    const byName = toggleSort(onPage3, "name");
    expect(byName).toMatchObject({ sort: "name", direction: "asc", page: 1 });
    expect(toggleSort(byName, "name").direction).toBe("desc");
  });

  it("starts numbers and dates descending, text ascending", () => {
    expect(toggleSort(DEFAULT_QUERY, "value").direction).toBe("desc");
    expect(toggleSort(DEFAULT_QUERY, "site").direction).toBe("asc");
    // updatedAt is the default sort, descending: a click flips it.
    expect(toggleSort(DEFAULT_QUERY, "updatedAt").direction).toBe("asc");
  });

  it("adds and removes filter values and resets the page", () => {
    const one = toggleFilter(onPage3, "status", "active");
    expect(one).toMatchObject({ status: ["active"], page: 1 });
    const two = toggleFilter(one, "status", "retired");
    expect(two.status).toEqual(["active", "retired"]);
    expect(toggleFilter(two, "status", "active").status).toEqual(["retired"]);
  });

  it("resets the page on search and page size, not on a page change", () => {
    expect(setSearch(onPage3, "drill")).toMatchObject({
      search: "drill",
      page: 1,
    });
    expect(setPageSize(onPage3, 50)).toMatchObject({ pageSize: 50, page: 1 });
    expect(setPage(onPage3, 4).page).toBe(4);
  });

  it("clears filters but keeps the sort and page size", () => {
    const filtered: ListQuery = {
      ...DEFAULT_QUERY,
      sort: "name",
      direction: "asc",
      pageSize: 25,
      page: 2,
      search: "van",
      status: ["active"],
      category: ["vehicle"],
      site: ["Hill station"],
    };
    expect(hasFilters(filtered)).toBe(true);
    const cleared = clearFilters(filtered);
    expect(hasFilters(cleared)).toBe(false);
    expect(cleared).toMatchObject({
      sort: "name",
      direction: "asc",
      pageSize: 25,
      page: 1,
    });
    expect(hasFilters({ ...DEFAULT_QUERY, search: "  " })).toBe(false);
  });

  it("fills copy placeholders and leaves unknown ones", () => {
    expect(
      format("{from}–{to} of {total}", { from: 1, to: 10, total: 240 }),
    ).toBe("1–10 of 240");
    expect(format("{page} {missing}", { page: 2 })).toBe("2 {missing}");
  });
});

describe("lab client", () => {
  const request = (search: string, signal?: AbortSignal) =>
    new Request(`http://localhost/lab${search}`, { signal });

  it("answers the query in the request URL", async () => {
    const client = createLabClient({ latencyMs: 0 });
    const data = await client.load(request("?status=retired&page=2"));
    expect(data.query).toMatchObject({ status: ["retired"], page: 2 });
    expect(data.result?.page).toBe(2);
    expect(data.result?.items.every((a) => a.status === "retired")).toBe(true);
  });

  it("fails once after failNext, returning the error with the query", async () => {
    const client = createLabClient({ latencyMs: 0 });
    client.failNext();
    const failed = await client.load(request("?q=van"));
    expect(failed.error).toBeTruthy();
    expect(failed.result).toBeUndefined();
    expect(failed.query.search).toBe("van");
    expect((await client.load(request("?q=van"))).result).toBeDefined();
  });

  it("rethrows when the request is aborted", async () => {
    const client = createLabClient({ latencyMs: 50 });
    const controller = new AbortController();
    const pending = client.load(request("", controller.signal));
    controller.abort();
    await expect(pending).rejects.toBeDefined();
  });
});

describe("lab copy", () => {
  it("is valid and names every status and category", () => {
    expect(labSchema.safeParse(lab).success).toBe(true);
    expect(Object.keys(lab.table.values.status)).toEqual([...ASSET_STATUSES]);
    expect(Object.keys(lab.table.values.category)).toEqual([
      ...ASSET_CATEGORIES,
    ]);
  });

  it("sets the title, description and canonical URL", () => {
    const tags = meta({} as Route.MetaArgs);
    expect(tags).toContainEqual({ title: lab.meta.title });
    expect(tags).toContainEqual({
      name: "description",
      content: lab.meta.description,
    });
    expect(tags).toContainEqual(
      expect.objectContaining({
        rel: "canonical",
        href: expect.stringMatching(/\/lab$/),
      }),
    );
  });
});

function renderTable(url = "/lab") {
  const client = createLabClient({ latencyMs: 0 });
  let location = "";
  function Page() {
    const data = useLoaderData() as LabTableData;
    const current = useLocation();
    location = current.pathname + current.search;
    return <AssetTable data={data} client={client} />;
  }
  const Stub = createRoutesStub([
    {
      path: "/lab",
      Component: Page,
      HydrateFallback: () => <AssetTable data={undefined} client={client} />,
      loader: ({ request }) => client.load(request),
    },
  ]);
  render(<Stub initialEntries={[url]} />);
  return { location: () => location };
}

const table = () => screen.getByRole("table");
const bodyRows = () => within(table()).getAllByRole("row").slice(1);
// The first render loads the route and the 240 records, which can take more
// than the default second on a busy test run.
const loaded = () =>
  waitFor(() => expect(table()).toHaveAttribute("aria-busy", "false"), {
    timeout: 5000,
  });

describe("AssetTable", () => {
  it("renders a page of rows with the range and page count", async () => {
    renderTable();
    await loaded();
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText("Page 1 of 24")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1–10 of 240");
    expect(
      screen.getByRole("columnheader", { name: /Updated/ }),
    ).toHaveAttribute("aria-sort", "descending");
  });

  it("reads its state from the URL", async () => {
    renderTable("/lab?status=reserved&sort=name&dir=asc&size=25");
    await loaded();
    expect(screen.getByRole("checkbox", { name: "Reserved" })).toBeChecked();
    expect(screen.getByLabelText("Rows per page")).toHaveValue("25");
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    for (const row of bodyRows()) {
      expect(row).toHaveTextContent("Reserved");
    }
  });

  it("writes sorting, filters and pages to the URL", async () => {
    const { location } = renderTable();
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: "Site" }));
    await waitFor(() => expect(location()).toBe("/lab?sort=site&dir=asc"));
    await loaded();

    fireEvent.click(screen.getByRole("checkbox", { name: "Safety" }));
    await waitFor(() =>
      expect(location()).toBe("/lab?category=safety&sort=site&dir=asc"),
    );
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(location()).toBe("/lab?category=safety&sort=site&dir=asc&page=2"),
    );
    await loaded();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(location()).toBe("/lab?sort=site&dir=asc"));
  });

  it("commits the search after a pause and shows the empty state", async () => {
    const { location } = renderTable();
    await loaded();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    });
    await waitFor(() => expect(location()).toBe("/lab?q=zzz"));
    await loaded();
    expect(within(table()).getByText(lab.table.empty.title)).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(lab.table.empty.title);
  });

  it("shows the error state and recovers on retry", async () => {
    renderTable("/lab?site=Hill+station");
    await loaded();
    fireEvent.click(
      screen.getByRole("button", { name: lab.table.simulate.label }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(lab.table.error.title);
    expect(
      screen.getByRole("checkbox", { name: "Hill station" }),
    ).toBeChecked();

    fireEvent.click(
      within(alert).getByRole("button", { name: lab.table.error.retry }),
    );
    await loaded();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(bodyRows().length).toBeGreaterThan(0);
  });

  it("disables the controls before the first response", () => {
    const client = createLabClient();
    const Stub = createRoutesStub([
      {
        path: "/lab",
        Component: () => <AssetTable data={undefined} client={client} />,
      },
    ]);
    render(<Stub initialEntries={["/lab?status=active"]} />);
    expect(table()).toHaveAttribute("aria-busy", "true");
    // Defaults, not the URL, so the prerendered markup hydrates as is.
    expect(screen.getByRole("checkbox", { name: "Active" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Active" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Name" })).toBeDisabled();
    expect(
      screen.getByText(lab.table.loading, { selector: "td" }),
    ).toBeVisible();
  });
});
