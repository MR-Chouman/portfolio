import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so unit tests do not load the React Router
// framework plugin, which expects a full app build.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
  },
});
