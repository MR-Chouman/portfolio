import { execSync } from "node:child_process";

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// "Last updated" in the footer is the last commit date; builds without Git
// history fall back to the build date.
function lastUpdated(): string {
  try {
    return execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim();
  } catch {
    return new Date().toISOString();
  }
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  define: {
    __LAST_UPDATED__: JSON.stringify(lastUpdated()),
  },
  resolve: {
    tsconfigPaths: true,
  },
});
