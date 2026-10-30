import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button } from "~/components/ui";
import {
  ASSET_FIELDS,
  NAME_MAX,
  toFormValues,
  validateAssetForm,
  type AssetField,
  type AssetFormErrors,
  type AssetFormValues,
  type AssetInput,
} from "~/lib/lab/asset-form";
import {
  ASSET_CATEGORIES,
  ASSET_SITES,
  ASSET_STATUSES,
  type Asset,
} from "~/lib/lab/records";
import { format } from "~/lib/lab/table";

import { lab } from "../../../content/lab";

// The lab's create and edit drawer (T-052, D-047): a native modal <dialog>
// pinned to the right edge, like the CV preview (D-046). The page behind is
// inert, so focus stays inside; Escape, Close, Cancel and a click on the
// backdrop close it. The form validates with Zod on submit, then live as the
// fields change; a valid submit hands the input to the table, which saves it
// optimistically, and closes the drawer.

const copy = lab.crud;
const drawer = copy.drawer;

export interface AssetSubmission {
  id?: string; // the asset being edited; none for a new one
  input: AssetInput;
  fail: boolean; // the "Make this save fail" demo switch
}

export interface AssetDrawerProps {
  // The asset to edit; none opens an empty form for a new one.
  asset?: Asset;
  onSubmit: (submission: AssetSubmission) => void;
  // Called once the dialog has closed, however it was closed.
  onClosed: () => void;
}

const fieldClass =
  "mt-2 block h-10 w-full rounded-md border border-fg-muted bg-surface px-3 text-sm text-fg aria-invalid:border-2 aria-invalid:border-fg";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 flex items-start gap-1.5 text-sm font-medium"
        >
          {/* A mark beside the text, so the error never relies on color. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="mt-0.5 size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.75v4M8 11.25v.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// aria-describedby for a field: its hint, then its error.
function describedBy(id: string, hint: boolean, error: boolean) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function AssetDrawer({ asset, onSubmit, onClosed }: AssetDrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const baseId = useId();
  const fieldId = (field: AssetField) => `${baseId}-${field}`;
  const titleId = `${baseId}-title`;
  const introId = `${baseId}-intro`;

  const [values, setValues] = useState<AssetFormValues>(() =>
    toFormValues(asset),
  );
  const [errors, setErrors] = useState<AssetFormErrors>({});
  // After the first submit, errors follow every change.
  const [checked, setChecked] = useState(false);
  const [fail, setFail] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element || element.open) return;
    element.showModal();
    // Browsers differ on what a modal dialog focuses first.
    document.getElementById(`${baseId}-name`)?.focus();
  }, [baseId]);

  function change(field: AssetField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (checked) {
      const result = validateAssetForm(next);
      setErrors(result.ok ? {} : result.errors);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateAssetForm(values);
    setChecked(true);
    if (!result.ok) {
      setErrors(result.errors);
      const first = ASSET_FIELDS.find((field) => result.errors[field]);
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }
    setErrors({});
    onSubmit({ id: asset?.id, input: result.input, fail });
    dialog.current?.close();
  }

  // Props shared by every field control.
  function control(field: AssetField, hint = false) {
    const id = fieldId(field);
    const error = errors[field];
    return {
      id,
      name: field,
      value: values[field],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy(id, hint, Boolean(error)),
      className: fieldClass,
    } as const;
  }

  const errorText = (field: AssetField) => {
    const code = errors[field];
    return code && copy.errors[code];
  };

  const title = asset
    ? format(drawer.editTitle, { id: asset.id })
    : drawer.createTitle;

  return (
    // A click on the backdrop closes the drawer. Pointer-only on purpose:
    // the keyboard equivalents are Escape, Close and Cancel.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={introId}
      onClose={onClosed}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      // Slides in from the edge; the duration token is 0 under reduced
      // motion, so the drawer then simply appears.
      className="m-0 ms-auto h-dvh max-h-none w-[min(28rem,100vw)] max-w-none flex-col border-0 border-s border-line bg-surface p-0 text-fg transition-transform duration-(--duration-base) ease-standard backdrop:bg-fg/40 open:flex starting:open:translate-x-full"
    >
      <form
        noValidate
        onSubmit={submit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
          <h2 id={titleId} className="text-lg">
            {title}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dialog.current?.close()}
          >
            {drawer.close}
          </Button>
        </div>

        <div className="grid flex-1 content-start gap-5 overflow-y-auto px-4 py-5 sm:px-6">
          <p id={introId} className="text-sm text-fg-muted">
            {drawer.intro}
          </p>

          <Field
            id={fieldId("name")}
            label={drawer.fields.name}
            error={errorText("name")}
          >
            <input
              {...control("name")}
              type="text"
              autoComplete="off"
              maxLength={NAME_MAX + 20}
              onChange={(event) => change("name", event.target.value)}
            />
          </Field>

          <Field
            id={fieldId("category")}
            label={drawer.fields.category}
            error={errorText("category")}
          >
            <select
              {...control("category")}
              onChange={(event) => change("category", event.target.value)}
            >
              <option value="">{drawer.choose}</option>
              {ASSET_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {lab.table.values.category[option]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={fieldId("status")}
            label={drawer.fields.status}
            error={errorText("status")}
          >
            <select
              {...control("status")}
              onChange={(event) => change("status", event.target.value)}
            >
              <option value="">{drawer.choose}</option>
              {ASSET_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {lab.table.values.status[option]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={fieldId("site")}
            label={drawer.fields.site}
            error={errorText("site")}
          >
            <select
              {...control("site")}
              onChange={(event) => change("site", event.target.value)}
            >
              <option value="">{drawer.choose}</option>
              {ASSET_SITES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={fieldId("value")}
            label={drawer.fields.value}
            hint={drawer.valueHint}
            error={errorText("value")}
          >
            <input
              {...control("value", true)}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
              onChange={(event) => change("value", event.target.value)}
            />
          </Field>

          <div className="rounded-md border border-dashed border-fg-muted p-3">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="fail"
                checked={fail}
                onChange={(event) => setFail(event.target.checked)}
                aria-describedby={`${baseId}-fail-hint`}
                className="mt-0.5 size-4 shrink-0 accent-accent"
              />
              <span className="font-medium">{drawer.fail.label}</span>
            </label>
            <p
              id={`${baseId}-fail-hint`}
              className="mt-1 ps-6 text-sm text-fg-muted"
            >
              {drawer.fail.hint}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-line px-4 py-4 sm:px-6">
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            {drawer.cancel}
          </Button>
          <Button type="submit">{drawer.save}</Button>
        </div>
      </form>
    </dialog>
  );
}
