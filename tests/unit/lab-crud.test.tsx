import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createRoutesStub, useLoaderData } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssetTable } from "~/components/lab/AssetTable";
import { createMockApi, MockApiError } from "~/lib/lab/api";
import {
  ASSET_ERROR_CODES,
  EMPTY_FORM,
  toFormValues,
  validateAssetForm,
  type AssetFormValues,
  type AssetInput,
} from "~/lib/lab/asset-form";
import { createLabClient, type LabTableData } from "~/lib/lab/client";
import { applyPending, dropChange, pendingChange } from "~/lib/lab/optimistic";
import { generateAssets } from "~/lib/lab/records";
import { format } from "~/lib/lab/table";

import { lab } from "../../content/lab";
import { labSchema } from "../../content/schema";

// The create and edit drawer (T-052). Real focus, the inert page, Escape and
// the backdrop are covered by tests/e2e/lab-crud.spec.ts.

const crud = lab.crud;
const errors = crud.errors;

const valid: AssetFormValues = {
  name: "  Spare forklift  ",
  category: "vehicle",
  status: "active",
  site: "North depot",
  value: " 12500 ",
};

const input: AssetInput = {
  name: "Spare forklift",
  category: "vehicle",
  status: "active",
  site: "North depot",
  value: 12500,
};

describe("asset form validation", () => {
  it("returns the typed input, trimmed", () => {
    expect(validateAssetForm(valid)).toEqual({ ok: true, input });
  });

  it("reports the first error of each invalid field", () => {
    expect(validateAssetForm(EMPTY_FORM)).toEqual({
      ok: false,
      errors: {
        name: "nameRequired",
        category: "categoryRequired",
        site: "siteRequired",
        value: "valueRequired",
      },
    });
  });

  it.each([
    ["name", " a ", "nameShort"],
    ["name", "x".repeat(61), "nameLong"],
    ["status", "lost", "statusRequired"],
    ["site", "Moon base", "siteRequired"],
    ["value", "-5", "valueWhole"],
    ["value", "12.5", "valueWhole"],
    ["value", "12,500", "valueWhole"],
    ["value", "1000001", "valueMax"],
  ] as const)("rejects %s %j with %s", (field, value, code) => {
    const result = validateAssetForm({ ...valid, [field]: value });
    expect(result).toEqual({ ok: false, errors: { [field]: code } });
  });

  it("accepts the limits", () => {
    expect(validateAssetForm({ ...valid, value: "0" }).ok).toBe(true);
    expect(validateAssetForm({ ...valid, value: "1000000" }).ok).toBe(true);
    expect(validateAssetForm({ ...valid, name: "x".repeat(60) }).ok).toBe(true);
  });

  it("fills the form from an asset, or starts empty and active", () => {
    const [asset] = generateAssets(1);
    expect(toFormValues(asset)).toMatchObject({
      name: asset?.name,
      value: String(asset?.value),
    });
    expect(toFormValues(undefined)).toEqual(EMPTY_FORM);
    expect(EMPTY_FORM.status).toBe("active");
  });
});

describe("mock endpoint mutations", () => {
  const now = () => new Date("2026-10-30T12:00:00Z");

  it("creates an asset with the next id and lists it", async () => {
    const api = createMockApi({ latencyMs: 0, now });
    const created = await api.createAsset(input);
    expect(created).toEqual({
      id: "AST-0241",
      ...input,
      updatedAt: "2026-10-30T12:00:00.000Z",
    });
    const list = await api.listAssets({ search: "spare forklift" });
    expect(list.items).toEqual([created]);
    expect((await api.listAssets()).total).toBe(241);
  });

  it("updates an asset in place", async () => {
    const api = createMockApi({ latencyMs: 0, now });
    const updated = await api.updateAsset("AST-0007", input);
    expect(updated).toMatchObject({ id: "AST-0007", name: "Spare forklift" });
    expect(await api.getAsset("AST-0007")).toEqual(updated);
    expect((await api.listAssets()).total).toBe(240);
  });

  it("never changes the records it was given", async () => {
    const records = generateAssets(3);
    const before = structuredClone(records);
    const api = createMockApi({ records, latencyMs: 0 });
    await api.updateAsset("AST-0001", input);
    await api.createAsset(input);
    expect(records).toEqual(before);
  });

  it("rejects invalid input, unknown ids and requested failures", async () => {
    const api = createMockApi({ latencyMs: 0 });
    await expect(
      api.createAsset({ ...input, name: " " }),
    ).rejects.toBeInstanceOf(MockApiError);
    await expect(
      api.createAsset({ ...input, value: -1 }),
    ).rejects.toBeInstanceOf(MockApiError);
    await expect(api.updateAsset("AST-9999", input)).rejects.toBeInstanceOf(
      MockApiError,
    );
    await expect(
      api.updateAsset("AST-0001", input, { fail: true }),
    ).rejects.toBeInstanceOf(MockApiError);
    expect((await api.getAsset("AST-0001"))?.name).not.toBe(input.name);
    expect((await api.listAssets()).total).toBe(240);
  });

  it("can be aborted like a request", async () => {
    const api = createMockApi({ latencyMs: 50 });
    const controller = new AbortController();
    const saving = api.createAsset(input, { signal: controller.signal });
    controller.abort();
    await expect(saving).rejects.toMatchObject({ name: "AbortError" });
    expect((await api.listAssets()).total).toBe(240);
  });

  it("saves through the lab client", async () => {
    const client = createLabClient({ latencyMs: 0 });
    const created = await client.save({ input });
    const updated = await client.save({
      id: created.id,
      input: { ...input, status: "retired" },
    });
    expect(updated).toMatchObject({ id: created.id, status: "retired" });
    await expect(client.save({ input }, { fail: true })).rejects.toThrow();
    const data = await client.load(
      new Request("http://localhost/lab?q=spare+forklift"),
    );
    expect(data.result?.items).toEqual([updated]);
  });
});

describe("optimistic rows", () => {
  const rows = generateAssets(3);
  const now = new Date("2026-10-30T12:00:00Z");

  it("shows new assets first and edits in place, marked as saving", () => {
    const first = pendingChange("pending-1", input, now);
    const second = pendingChange(
      "pending-2",
      { ...input, name: "Second" },
      now,
    );
    const edit = pendingChange("pending-3", input, now, "AST-0002");
    const shown = applyPending(rows, [first, edit, second]);

    expect(shown.map((row) => row.asset.id)).toEqual([
      "pending-2",
      "pending-1",
      "AST-0001",
      "AST-0002",
      "AST-0003",
    ]);
    expect(shown[0]).toMatchObject({ saving: true, isNew: true });
    expect(shown[3]).toMatchObject({
      saving: true,
      isNew: false,
      asset: { name: "Spare forklift", updatedAt: now.toISOString() },
    });
    expect(shown[2]).toEqual({ asset: rows[0], saving: false, isNew: false });
  });

  it("rolls back by dropping the change", () => {
    const edit = pendingChange("pending-1", input, now, "AST-0001");
    const after = dropChange([edit], "pending-1");
    expect(after).toEqual([]);
    expect(applyPending(rows, after).map((row) => row.asset)).toEqual(rows);
  });
});

describe("drawer copy", () => {
  it("is valid and has a message for every error code", () => {
    expect(labSchema.safeParse(lab).success).toBe(true);
    expect(Object.keys(errors)).toEqual([...ASSET_ERROR_CODES]);
  });
});

// jsdom has no modal dialogs: emulate `open` and the close event.
function stubDialog() {
  const proto = HTMLDialogElement.prototype;
  if (!("showModal" in proto)) {
    Object.assign(proto, { showModal() {}, close() {} });
  }
  vi.spyOn(proto, "showModal").mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  vi.spyOn(proto, "close").mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
}

function renderTable(url = "/lab", latencyMs = 0) {
  const client = createLabClient({ latencyMs });
  function Page() {
    const data = useLoaderData() as LabTableData;
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
  return client;
}

const table = () => screen.getByRole("table");
const bodyRows = () => within(table()).getAllByRole("row").slice(1);
const firstRow = () => {
  const [row] = bodyRows();
  if (!row) throw new Error("The table has no rows");
  return row;
};
const loaded = () =>
  waitFor(() => expect(table()).toHaveAttribute("aria-busy", "false"), {
    timeout: 5000,
  });
const drawer = () => screen.getByRole("dialog");
const field = (name: string) => within(drawer()).getByLabelText(name);

function fill(values: Partial<AssetFormValues>) {
  const labels = crud.drawer.fields;
  for (const [key, value] of Object.entries(values)) {
    fireEvent.change(field(labels[key as keyof typeof labels]), {
      target: { value },
    });
  }
}

const submit = () =>
  fireEvent.click(
    within(drawer()).getByRole("button", { name: crud.drawer.save }),
  );

describe("CRUD drawer", () => {
  beforeEach(stubDialog);

  it("disables New asset before the first response", () => {
    const client = createLabClient();
    const Stub = createRoutesStub([
      {
        path: "/lab",
        Component: () => <AssetTable data={undefined} client={client} />,
      },
    ]);
    render(<Stub initialEntries={["/lab"]} />);
    expect(screen.getByRole("button", { name: crud.create })).toBeDisabled();
  });

  it("validates on submit, focuses the first error and checks live", async () => {
    renderTable();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: crud.create }));
    expect(drawer()).toHaveAttribute("open");
    expect(drawer()).toHaveAccessibleName(crud.drawer.createTitle);
    expect(field("Name")).toHaveFocus();

    submit();
    expect(drawer()).toHaveAttribute("open");
    expect(field("Name")).toHaveAttribute("aria-invalid", "true");
    expect(field("Name")).toHaveAccessibleDescription(errors.nameRequired);
    expect(field("Category")).toHaveAccessibleDescription(
      errors.categoryRequired,
    );
    expect(field("Value (USD)")).toHaveAccessibleDescription(
      `${crud.drawer.valueHint} ${errors.valueRequired}`,
    );
    expect(field("Status")).not.toHaveAttribute("aria-invalid");
    expect(field("Name")).toHaveFocus();

    fill({ name: "Spare forklift" });
    expect(field("Name")).not.toHaveAttribute("aria-invalid");
    fill({ value: "12.5" });
    expect(field("Value (USD)")).toHaveAccessibleDescription(
      `${crud.drawer.valueHint} ${errors.valueWhole}`,
    );
  });

  it("creates an asset: shown at once, then saved", async () => {
    renderTable("/lab", 30);
    await loaded();
    const createButton = screen.getByRole("button", { name: crud.create });
    fireEvent.click(createButton);
    fill({ ...valid, name: "Spare forklift" });
    submit();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(createButton).toHaveFocus();
    const first = bodyRows()[0];
    expect(first).toHaveTextContent(crud.newId);
    expect(first).toHaveTextContent("Spare forklift");
    expect(first).toHaveTextContent(crud.saving);

    await waitFor(() =>
      expect(
        screen.getByText(format(crud.saved, { name: "Spare forklift" })),
      ).toBeInTheDocument(),
    );
    await loaded();
    expect(bodyRows()[0]).toHaveTextContent("AST-0241");
    expect(bodyRows()[0]).not.toHaveTextContent(crud.saving);
    expect(
      screen.getByRole("button", { name: "Edit Spare forklift" }),
    ).toBeInTheDocument();
  });

  it("edits an asset and returns focus to its Edit button", async () => {
    renderTable("/lab?sort=id&dir=asc");
    await loaded();
    const row = firstRow();
    expect(row).toHaveTextContent("AST-0001");
    const edit = within(row).getByRole("button", { name: /^Edit / });
    fireEvent.click(edit);
    expect(drawer()).toHaveAccessibleName("Edit AST-0001");
    expect(field("Name")).not.toHaveValue("");

    fill({ name: "Renamed asset" });
    submit();
    expect(bodyRows()[0]).toHaveTextContent("Renamed asset");
    await loaded();
    await waitFor(() =>
      expect(bodyRows()[0]).not.toHaveTextContent(crud.saving),
    );
    expect(bodyRows()[0]).toHaveTextContent("Renamed asset");
    expect(
      within(firstRow()).getByRole("button", {
        name: "Edit Renamed asset",
      }),
    ).toBeInTheDocument();
  });

  it("rolls an edit back when the save fails", async () => {
    renderTable("/lab?sort=id&dir=asc", 30);
    await loaded();
    const row = firstRow();
    const before = row.textContent;
    fireEvent.click(within(row).getByRole("button", { name: /^Edit / }));
    fill({ name: "Never stored" });
    fireEvent.click(
      within(drawer()).getByRole("checkbox", {
        name: crud.drawer.fail.label,
      }),
    );
    submit();
    expect(bodyRows()[0]).toHaveTextContent("Never stored");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Never stored was not saved");
    expect(bodyRows()[0]).not.toHaveTextContent("Never stored");
    expect(bodyRows()[0]?.textContent).toBe(before);

    fireEvent.click(
      within(alert).getByRole("button", { name: crud.failed.dismiss }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("closes without saving on Cancel", async () => {
    renderTable();
    await loaded();
    const createButton = screen.getByRole("button", { name: crud.create });
    fireEvent.click(createButton);
    fill({ name: "Not saved" });
    fireEvent.click(
      within(drawer()).getByRole("button", { name: crud.drawer.cancel }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(createButton).toHaveFocus();
    expect(screen.queryByText("Not saved")).not.toBeInTheDocument();
  });
});
