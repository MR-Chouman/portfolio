import { useId, type ReactNode } from "react";

import {
  Button,
  ButtonLink,
  CheckChip,
  Field,
  Link,
  Metric,
  MetricList,
  Section,
  Tag,
  TagList,
  controlStyles,
  fieldDescribedBy,
} from "~/components/ui";
import { ACCENTS } from "~/lib/accent";
import { ASSET_CATEGORIES, ASSET_STATUSES } from "~/lib/lab/records";
import { format } from "~/lib/lab/table";

import { lab } from "../../../content/lab";
import { site } from "../../../content/site";
import { PatternNotes } from "./PatternNotes";
import { StatusLabel } from "./StatusLabel";

// The lab's component gallery (T-053, D-048): the primitives the table and
// the drawer are built from, with their variants and states, in a light and
// a dark panel. Each panel sets `data-theme`, and each row of the accent
// block sets `data-accent` with its panel's theme, so the same markup shows
// every theme and accent at once; the rest of the gallery follows the
// accent chosen in the floating palette. Nothing here is per theme or
// accent: only the tokens change (D-038).
//
// The samples are live components, so hover, focus and checked states can
// be tried; the static states (disabled, invalid, checked) are set by props.

const copy = lab.gallery;
const { variants, samples } = copy;

type Theme = keyof typeof copy.themes;
type BlockKey = keyof typeof copy.blocks;

const GALLERY_ID = "component-gallery";
const SELF = `#${GALLERY_ID}`;

function Block({ name, children }: { name: BlockKey; children: ReactNode }) {
  const headingId = useId();
  const { title, components } = copy.blocks[name];
  return (
    <section aria-labelledby={headingId} className="border-t border-line pt-6">
      <h4 id={headingId} className="text-lg">
        {title}
      </h4>
      <p className="mt-1 font-mono text-xs text-fg-muted">{components}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// One sample with its variant or state named above it.
function Sample({
  caption,
  wide = false,
  children,
}: {
  caption: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={
        wide
          ? "grid min-w-0 content-start gap-2"
          : "grid content-start justify-items-start gap-2"
      }
    >
      <span className="font-mono text-xs text-fg-muted">{caption}</span>
      {children}
    </li>
  );
}

function Samples({ children }: { children: ReactNode }) {
  return (
    <ul className="flex flex-wrap items-start gap-x-5 gap-y-4">{children}</ul>
  );
}

function Fields() {
  const id = useId();
  const fields = samples.fields;
  const ids = {
    name: `${id}-name`,
    value: `${id}-value`,
    category: `${id}-category`,
    invalid: `${id}-invalid`,
    disabled: `${id}-disabled`,
  };
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      <Sample caption={variants.default} wide>
        <Field id={ids.name} label={fields.text.label}>
          <input
            id={ids.name}
            type="text"
            defaultValue={fields.text.value}
            autoComplete="off"
            className={controlStyles}
          />
        </Field>
      </Sample>
      <Sample caption={variants.hint} wide>
        <Field id={ids.value} label={fields.hint.label} hint={fields.hint.hint}>
          <input
            id={ids.value}
            type="text"
            inputMode="numeric"
            defaultValue={fields.hint.value}
            autoComplete="off"
            aria-describedby={fieldDescribedBy(ids.value, true, false)}
            className={controlStyles}
          />
        </Field>
      </Sample>
      <Sample caption={variants.select} wide>
        <Field id={ids.category} label={fields.select.label}>
          <select
            id={ids.category}
            defaultValue={ASSET_CATEGORIES[1]}
            className={controlStyles}
          >
            {ASSET_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {lab.table.values.category[option]}
              </option>
            ))}
          </select>
        </Field>
      </Sample>
      <Sample caption={variants.invalid} wide>
        <Field
          id={ids.invalid}
          label={fields.invalid.label}
          error={fields.invalid.error}
        >
          <input
            id={ids.invalid}
            type="text"
            inputMode="numeric"
            defaultValue={fields.invalid.value}
            autoComplete="off"
            aria-invalid
            aria-describedby={fieldDescribedBy(ids.invalid, false, true)}
            className={controlStyles}
          />
        </Field>
      </Sample>
      <Sample caption={variants.disabled} wide>
        <Field id={ids.disabled} label={fields.disabled.label}>
          <input
            id={ids.disabled}
            type="text"
            defaultValue={fields.disabled.value}
            disabled
            className={controlStyles}
          />
        </Field>
      </Sample>
    </ul>
  );
}

// The accent-colored primitives once per accent, in the panel's theme.
function AccentRows({ theme }: { theme: Theme }) {
  const id = useId();
  const rows = samples.accentSamples;
  return (
    <div className="grid gap-3">
      {ACCENTS.map((accent) => (
        <div
          key={accent}
          role="group"
          aria-labelledby={`${id}-${accent}`}
          data-accent={accent}
          data-theme={theme}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-line bg-surface-raised px-3 py-2 text-fg"
        >
          <span
            id={`${id}-${accent}`}
            className="w-24 shrink-0 font-mono text-xs text-fg-muted"
          >
            {format(samples.accentRow, { accent: site.accents.names[accent] })}
          </span>
          <Button size="sm">{rows.button}</Button>
          <Link href={SELF}>{rows.link}</Link>
          <Tag tone="accent">{rows.tag}</Tag>
          <CheckChip label={rows.chip} defaultChecked />
          <StatusLabel status="active" />
        </div>
      ))}
    </div>
  );
}

function ThemePanel({ theme }: { theme: Theme }) {
  return (
    <Section
      data-theme={theme}
      title={copy.themes[theme]}
      headingLevel={3}
      className="min-w-0 rounded-xl border border-line bg-surface p-4 text-fg sm:p-6"
    >
      <div className="grid gap-8">
        <Block name="buttons">
          <Samples>
            <Sample caption={variants.primary}>
              <Button>{samples.buttons.primary}</Button>
            </Sample>
            <Sample caption={variants.secondary}>
              <Button variant="secondary">{samples.buttons.secondary}</Button>
            </Sample>
            <Sample caption={variants.ghost}>
              <Button variant="ghost">{samples.buttons.ghost}</Button>
            </Sample>
            <Sample caption={variants.small}>
              <Button size="sm" variant="secondary">
                {samples.buttons.small}
              </Button>
            </Sample>
            <Sample caption={variants.disabled}>
              <Button disabled>{samples.buttons.primary}</Button>
            </Sample>
            <Sample caption={variants.link}>
              <ButtonLink href="/work" variant="secondary">
                {samples.buttons.link}
              </ButtonLink>
            </Sample>
          </Samples>
        </Block>

        <Block name="links">
          <Samples>
            <Sample caption={variants.accent}>
              <Link href="/work">{samples.links.accent}</Link>
            </Sample>
            <Sample caption={variants.muted}>
              <Link href="/about" variant="muted">
                {samples.links.muted}
              </Link>
            </Sample>
          </Samples>
        </Block>

        <Block name="tags">
          <Samples>
            <Sample caption={variants.neutral}>
              <Tag>{samples.tags.neutral}</Tag>
            </Sample>
            <Sample caption={variants.accent}>
              <Tag tone="accent">{samples.tags.accent}</Tag>
            </Sample>
            <Sample caption={variants.list}>
              <TagList items={samples.tags.list} />
            </Sample>
          </Samples>
        </Block>

        <Block name="fields">
          <Fields />
        </Block>

        <Block name="chips">
          <Samples>
            <Sample caption={variants.unchecked}>
              <CheckChip label={samples.chips.unchecked} />
            </Sample>
            <Sample caption={variants.checked}>
              <CheckChip label={samples.chips.checked} defaultChecked />
            </Sample>
            <Sample caption={variants.disabled}>
              <CheckChip label={samples.chips.disabled} disabled />
            </Sample>
          </Samples>
        </Block>

        <Block name="status">
          <Samples>
            {ASSET_STATUSES.map((status) => (
              <li key={status}>
                <StatusLabel status={status} />
              </li>
            ))}
          </Samples>
        </Block>

        <Block name="metrics">
          <MetricList>
            {samples.metrics.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </MetricList>
        </Block>

        <Block name="accents">
          <AccentRows theme={theme} />
        </Block>
      </div>
    </Section>
  );
}

export function ComponentGallery({ className }: { className?: string }) {
  return (
    <Section
      id={GALLERY_ID}
      eyebrow={copy.eyebrow}
      title={copy.title}
      intro={copy.intro}
      className={className}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ThemePanel theme="light" />
        <ThemePanel theme="dark" />
      </div>
      <PatternNotes notes={copy.notes} className="mt-8" />
    </Section>
  );
}
