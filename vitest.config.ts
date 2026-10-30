import { defineConfig } from "vitest/config";

import { mdxPlugin } from "./mdx.config.ts";

// Separate from vite.config.ts so unit tests do not load the React Router
// framework plugin, which expects a full app build.
export default defineConfig({
  plugins: [mdxPlugin()],
  define: {
    __LAST_UPDATED__: JSON.stringify("2026-10-23T12:00:00+03:00"),
  },
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
  },
});
