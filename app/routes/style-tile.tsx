import {
  Button,
  ButtonLink,
  Link,
  Metric,
  MetricList,
  Prose,
  Section,
  Tag,
  TagList,
  WorkRow,
} from "~/components/ui";
import { pageMeta } from "~/lib/seo";

import { styleTile } from "../../content/style-tile";
import type { Route } from "./+types/style-tile";

// Internal reference page for the design (T-011): tokens and every UI
// primitive (T-013), in both themes.
export function meta(_: Route.MetaArgs) {
  return pageMeta({ ...styleTile.meta, path: "/style-tile", noindex: true });
}

type Theme = "light" | "dark";
type ColorToken = keyof typeof styleTile.colors;
type SectionKey = keyof typeof styleTile.sections;

// Full class names so Tailwind can find them.
const swatches: Record<ColorToken, string> = {
  surface: "bg-surface",
  "surface-raised": "bg-surface-raised",
  fg: "bg-fg",
  "fg-muted": "bg-fg-muted",
  line: "bg-line",
  accent: "bg-accent",
  "accent-fg": "bg-accent-fg",
  focus: "bg-focus",
};

const typeSteps = [
  { step: "text-5xl", className: "font-display text-5xl", sample: "display" },
  { step: "text-4xl", className: "font-display text-4xl", sample: "display" },
  { step: "text-3xl", className: "font-display text-3xl", sample: "display" },
  { step: "text-2xl", className: "font-display text-2xl", sample: "display" },
  { step: "text-xl", className: "text-xl", sample: "body" },
  { step: "text-lg", className: "text-lg", sample: "body" },
  { step: "text-base", className: "text-base", sample: "body" },
  { step: "text-sm", className: "text-sm", sample: "body" },
  { step: "text-xs", className: "font-mono text-xs", sample: "mono" },
] as const;

function Block({
  name,
  children,
}: {
  name: SectionKey;
  children: React.ReactNode;
}) {
  const { title, components } = styleTile.sections[name];
  return (
    <Section
      title={title}
      eyebrow={components}
      headingLevel={3}
      className="mt-12"
    >
      {children}
    </Section>
  );
}

function ThemePanel({ theme }: { theme: Theme }) {
  return (
    <Section
      data-theme={theme}
      title={styleTile.themes[theme]}
      className="min-w-0 rounded-xl border border-line bg-surface p-6 text-fg"
    >
      <Block name="colors">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(Object.keys(swatches) as ColorToken[]).map((token) => (
            <li key={token}>
              <div
                className={`h-12 rounded-md border border-line ${swatches[token]}`}
              />
              <p className="mt-2 font-mono text-xs">{token}</p>
              <p className="text-xs text-fg-muted">{styleTile.colors[token]}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block name="type">
        <ul className="space-y-4">
          {typeSteps.map(({ step, className, sample }) => (
            <li key={step}>
              <p className="font-mono text-xs text-fg-muted">{step}</p>
              <p className={className}>{styleTile.type[sample]}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block name="buttons">
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="#style-tile">
            {styleTile.buttons.primary}
          </ButtonLink>
          <Button variant="secondary">{styleTile.buttons.secondary}</Button>
          <Button variant="ghost">{styleTile.buttons.ghost}</Button>
          <Button size="sm">{styleTile.buttons.small}</Button>
          <Button variant="secondary" disabled>
            {styleTile.buttons.disabled}
          </Button>
        </div>
      </Block>

      <Block name="links">
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="#style-tile">{styleTile.links.accent}</Link>
          <Link href="#style-tile" variant="muted">
            {styleTile.links.muted}
          </Link>
        </p>
      </Block>

      <Block name="tags">
        <div className="flex flex-wrap items-center gap-3">
          <Tag>{styleTile.tags.neutral}</Tag>
          <Tag tone="accent">{styleTile.tags.accent}</Tag>
        </div>
        <TagList items={styleTile.tags.list} className="mt-4" />
      </Block>

      <Block name="metrics">
        <MetricList>
          {styleTile.metrics.map((metric) => (
            <Metric key={metric.label} {...metric} />
          ))}
        </MetricList>
      </Block>

      <Block name="prose">
        <Prose>
          <p>{styleTile.prose.paragraph}</p>
          <ul>
            {styleTile.prose.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <blockquote>{styleTile.prose.quote}</blockquote>
        </Prose>
      </Block>

      <Block name="work">
        <WorkRow href="#style-tile" headingLevel={4} {...styleTile.work} />
      </Block>
    </Section>
  );
}

export default function StyleTile() {
  return (
    <div id="style-tile" className="page-container pt-section">
      <h1 className="text-4xl">{styleTile.heading}</h1>
      <p className="mt-3 max-w-reading text-fg-muted">{styleTile.intro}</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <ThemePanel theme="light" />
        <ThemePanel theme="dark" />
      </div>
    </div>
  );
}
