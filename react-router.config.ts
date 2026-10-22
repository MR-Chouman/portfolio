import type { Config } from "@react-router/dev/config";

// Static site (D-002): no runtime server; every listed path is prerendered
// to build/client. Case study slugs are derived from content/ in T-020.
export default {
  ssr: false,
  prerender: ["/"],
} satisfies Config;
