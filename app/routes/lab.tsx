import { AssetTable } from "~/components/lab/AssetTable";
import { ComponentGallery } from "~/components/lab/ComponentGallery";
import { Section } from "~/components/ui";
import { createLabClient, type LabTableData } from "~/lib/lab/client";
import { pageMeta } from "~/lib/seo";

import { lab } from "../../content/lab";
import type { Route } from "./+types/lab";

// The lab (/lab, REQUIREMENTS section 5): live admin patterns over invented
// data (D-044). T-051 adds the server-style data table, T-052 the CRUD
// drawer, T-053 the component gallery (static, so it is in the prerendered
// page), T-054 the page copy.
//
// The table's data comes from a clientLoader, so it runs only in the browser
// (D-002): the prerendered page is the HydrateFallback, and React Router
// re-runs the loader with the new URL on every table change, reload and
// back/forward, aborting the request it replaces.
export function meta(_: Route.MetaArgs) {
  return pageMeta({ ...lab.meta, path: "/lab" });
}

const client = createLabClient();

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  return client.load(request);
}
clientLoader.hydrate = true as const;

export function LabPage({ data }: { data: LabTableData | undefined }) {
  const { header, table } = lab;
  return (
    <div className="page-container pt-section">
      <header className="max-w-reading">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">
          {header.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{header.title}</h1>
        <p className="mt-4 text-lg text-fg-muted">{header.intro}</p>
      </header>

      <Section
        eyebrow={table.eyebrow}
        title={table.title}
        intro={table.intro}
        className="mt-section"
      >
        <AssetTable data={data} client={client} />
      </Section>

      <ComponentGallery className="mt-section" />
    </div>
  );
}

// The prerendered page and the first paint before the first response.
export function HydrateFallback() {
  return <LabPage data={undefined} />;
}

export default function Lab({ loaderData }: Route.ComponentProps) {
  return <LabPage data={loaderData} />;
}
