import { join } from "node:path";

import type { Config } from "@react-router/dev/config";

import { prerenderPaths } from "./content/load";
import { finalizeBuild } from "./scripts/finalize-build";

// Static site (D-002): no runtime server; every listed path is prerendered
// to build/client. The list is derived from content/ after validating it, so
// invalid content fails the build and every project slug gets its own HTML
// file (T-020, D-025). After prerendering, the 404 page moves to 404.html and
// the CSP in _headers gets its inline script hashes (T-025, D-027).
export default {
  ssr: false,
  prerender: () => prerenderPaths(),
  buildEnd: ({ reactRouterConfig }) => {
    finalizeBuild(join(reactRouterConfig.buildDirectory, "client"));
  },
} satisfies Config;
