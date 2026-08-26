import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      "~": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs\/router/, /@solidjs\/testing-library/],
      },
    },
  },
});
