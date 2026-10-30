// Validation for the lab's create and edit drawer (T-052, D-047). Two Zod
// schemas share their rules: `assetFormSchema` reads the drawer's string
// fields (the value arrives as typed text), `assetInputSchema` checks the
// typed input the mock endpoint receives, as a real API would. Messages are
// error codes, not copy: the drawer shows `lab.crud.errors[code]` from
// `content/lab.ts`, so every word on the page stays in `content/`.
//
// `zod/mini` keeps the /lab chunk small: it is tree-shakable, and only the
// checks used here ship to the browser.

import * as z from "zod/mini";

import {
  ASSET_CATEGORIES,
  ASSET_SITES,
  ASSET_STATUSES,
  type Asset,
  type AssetCategory,
  type AssetSite,
  type AssetStatus,
} from "./records";

export const ASSET_FIELDS = [
  "name",
  "category",
  "status",
  "site",
  "value",
] as const;
export type AssetField = (typeof ASSET_FIELDS)[number];

export const ASSET_ERROR_CODES = [
  "nameRequired",
  "nameShort",
  "nameLong",
  "categoryRequired",
  "statusRequired",
  "siteRequired",
  "valueRequired",
  "valueWhole",
  "valueMax",
] as const;
export type AssetErrorCode = (typeof ASSET_ERROR_CODES)[number];

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const VALUE_MAX = 1_000_000;

// What a create or an update sends: every editable field of an asset. The
// id and `updatedAt` belong to the server.
export interface AssetInput {
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  site: AssetSite;
  value: number;
}

// The drawer's fields, as the form holds them. An empty select is "".
export type AssetFormValues = Record<AssetField, string>;

export type AssetFormErrors = Partial<Record<AssetField, AssetErrorCode>>;

// A code as a Zod message, typed so a typo does not compile.
const code = (value: AssetErrorCode) => value;

const name = z
  .string()
  .check(
    z.trim(),
    z.minLength(1, code("nameRequired")),
    z.minLength(NAME_MIN, code("nameShort")),
    z.maxLength(NAME_MAX, code("nameLong")),
  );

const category = z.enum(ASSET_CATEGORIES, { error: code("categoryRequired") });
const status = z.enum(ASSET_STATUSES, { error: code("statusRequired") });
const site = z.enum(ASSET_SITES, { error: code("siteRequired") });

const valueNumber = z
  .int({ error: code("valueWhole") })
  .check(
    z.minimum(0, code("valueWhole")),
    z.maximum(VALUE_MAX, code("valueMax")),
  );

// Digits only: no sign, decimals, separators or currency symbol.
const valueText = z.pipe(
  z.pipe(
    z
      .string()
      .check(
        z.trim(),
        z.minLength(1, code("valueRequired")),
        z.regex(/^\d+$/, code("valueWhole")),
      ),
    z.transform(Number),
  ),
  valueNumber,
);

export const assetInputSchema = z.object({
  name,
  category,
  status,
  site,
  value: valueNumber,
});

export const assetFormSchema = z.object({
  name,
  category,
  status,
  site,
  value: valueText,
});

export type AssetFormResult =
  { ok: true; input: AssetInput } | { ok: false; errors: AssetFormErrors };

function isField(key: unknown): key is AssetField {
  return ASSET_FIELDS.includes(key as AssetField);
}

function isCode(message: string): message is AssetErrorCode {
  return ASSET_ERROR_CODES.includes(message as AssetErrorCode);
}

// The input to send, or the first error of each invalid field.
export function validateAssetForm(values: AssetFormValues): AssetFormResult {
  const parsed = assetFormSchema.safeParse(values);
  if (parsed.success) return { ok: true, input: parsed.data };
  const errors: AssetFormErrors = {};
  for (const issue of parsed.error.issues) {
    const [field] = issue.path;
    if (isField(field) && !errors[field] && isCode(issue.message)) {
      errors[field] = issue.message;
    }
  }
  return { ok: false, errors };
}

// A new asset starts in use; the other choices are the person's to make.
export const EMPTY_FORM: AssetFormValues = {
  name: "",
  category: "",
  status: "active",
  site: "",
  value: "",
};

export function toFormValues(asset: Asset | undefined): AssetFormValues {
  if (!asset) return { ...EMPTY_FORM };
  return {
    name: asset.name,
    category: asset.category,
    status: asset.status,
    site: asset.site,
    value: String(asset.value),
  };
}
