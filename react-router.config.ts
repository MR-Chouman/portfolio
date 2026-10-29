import type { Config } from "@react-router/dev/config";

import { prerenderPaths } from "./content/load";

// Static site (D-002): no runtime server; every listed path is prerendered
// to build/client. The list is derived from content/ after validating it, so
// invalid content fails the build and every project slug gets its own HTML
// file (T-020, D-025).
export default {
  ssr: false,
  prerender: () => prerenderPaths(),
} satisfies Config;
