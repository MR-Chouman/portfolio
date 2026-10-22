import { styleTile } from "../../content/style-tile";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/style-tile";

// Internal reference page for the active skin (T-011). Primitives replace the
// inline markup once they exist (T-013).
export function meta(_: Route.MetaArgs) {
  return pageMeta({ ...styleTile.meta, path: "/style-tile", noindex: true });
}

type Theme = "light" | "dark";
type ColorToken = keyof typeof styleTile.colors;

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

function ThemePanel({ theme }: { theme: Theme }) {
  const headingId = `style-tile-${theme}`;
  return (
    <section
      data-theme={theme}
      aria-labelledby={headingId}
      className="min-w-0 rounded-xl border border-line bg-surface p-6 text-fg"
    >
      <h2 id={headingId} className="text-2xl">
        {styleTile.themes[theme]}
      </h2>

      <h3 className="mt-8 text-lg">{styleTile.sections.colors}</h3>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <h3 className="mt-10 text-lg">{styleTile.sections.type}</h3>
      <ul className="mt-4 space-y-4">
        {typeSteps.map(({ step, className, sample }) => (
          <li key={step}>
            <p className="font-mono text-xs text-fg-muted">{step}</p>
            <p className={className}>{styleTile.type[sample]}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-10 text-lg">{styleTile.sections.buttons}</h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
        >
          {styleTile.buttons.primary}
        </button>
        <button
          type="button"
          className="rounded-md border border-fg-muted px-4 py-2 text-sm font-medium"
        >
          {styleTile.buttons.secondary}
        </button>
        <a
          href="#style-tile"
          className="rounded-sm text-sm font-medium text-accent underline underline-offset-4"
        >
          {styleTile.buttons.ghost}
        </a>
      </div>

      <h3 className="mt-10 text-lg">{styleTile.sections.work}</h3>
      <article className="mt-4 grid gap-3 rounded-lg border border-line bg-surface-raised p-5 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-xs text-fg-muted">
            {styleTile.work.sector}
          </p>
          <h4 className="mt-1 font-display text-xl">{styleTile.work.title}</h4>
          <p className="mt-2 text-sm text-fg-muted">{styleTile.work.summary}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {styleTile.work.stack.map((item) => (
              <li
                key={item}
                className="rounded-sm border border-line px-2 py-0.5 font-mono text-xs"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-between gap-3 sm:items-end">
          <p className="font-mono text-sm">{styleTile.work.metric}</p>
          <a
            href="#style-tile"
            className="rounded-sm text-sm font-medium text-accent underline underline-offset-4"
          >
            {styleTile.work.link}
          </a>
        </div>
      </article>
    </section>
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
