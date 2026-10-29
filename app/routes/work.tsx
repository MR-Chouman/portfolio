import { WorkRow } from "~/components/ui";
import { projects } from "~/lib/projects";
import { pageMeta } from "~/lib/seo";

import { work } from "../../content/work";
import type { Route } from "./+types/work";

// Work index (T-022, REQUIREMENTS section 5): every case study, in display
// order. Page copy comes from content/work.ts, project facts from
// content/projects/*.mdx.
export function meta(_: Route.MetaArgs) {
  return pageMeta({ ...work.meta, path: "/work" });
}

export default function WorkIndex() {
  const { index } = work;

  return (
    <div className="page-container pt-section">
      <header className="max-w-reading">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">
          {index.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{index.title}</h1>
        <p className="mt-4 text-lg text-fg-muted">{index.intro}</p>
      </header>

      <ul className="mt-12 grid gap-6">
        {projects.map((project) => {
          const [metric] = project.metrics;
          return (
            <li key={project.slug} className="grid">
              <WorkRow
                href={`/work/${project.slug}`}
                title={project.title}
                sector={project.sector}
                summary={project.summary}
                metric={`${metric.value} ${metric.label.toLowerCase()}`}
                stack={project.stack}
                linkLabel={index.linkLabel}
                headingLevel={2}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
