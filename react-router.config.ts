import { join } from "node:path";

import type { Config } from "@react-router/dev/config";

import { prerenderPaths } from "./content/load";
import { finalizeBuild } from "./scripts/finalize-build";
import { writeOgImages } from "./scripts/og-images";

// Static site (D-002): no runtime server; every listed path is prerendered
// to build/client. The list is derived from content/ after validating it, so
// invalid content fails the build and every project slug gets its own HTML
// file (T-020, D-025). After prerendering, the 404 page moves to 404.html and
// the CSP in _headers gets its inline script hashes (T-025, D-027). The Open
// Graph cards are rendered first, so the final step can check every page's
// og:image (T-061, D-051).
export default {
  ssr: false,
  prerender: () => prerenderPaths(),
  buildEnd: ({ reactRouterConfig }) => {
    const clientDir = join(reactRouterConfig.buildDirectory, "client");
    writeOgImages(clientDir);
    finalizeBuild(clientDir);
  },
} satisfies Config;
