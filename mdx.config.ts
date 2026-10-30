import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import type { Plugin } from "vite";

// MDX for case studies (D-007, D-025). YAML frontmatter is exported from each
// file as `frontmatter`; content/load.ts validates the same YAML at build
// time. Shared by vite.config.ts and vitest.config.ts. `enforce: "pre"` runs
// it before the React Router and React transforms, which expect JS.
export function mdxPlugin(): Plugin {
  return {
    enforce: "pre",
    ...mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
    }),
  } as Plugin;
}
