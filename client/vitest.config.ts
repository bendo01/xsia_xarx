import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      "~": path.resolve(import.meta.dirname, "./src"),
      "solid-js/web": path.resolve(import.meta.dirname, "./node_modules/solid-js/web/dist/dev.js"),
      "solid-js/store": path.resolve(import.meta.dirname, "./node_modules/solid-js/store/dist/dev.js"),
      "solid-js": path.resolve(import.meta.dirname, "./node_modules/solid-js/dist/dev.js"),
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
        inline: [/solid-js/, /@solidjs\/.*/, /solid-transition-group/],
      },
    },
  },
});
