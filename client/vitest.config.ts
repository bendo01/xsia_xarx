import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "solid-js/web": path.resolve(__dirname, "./node_modules/solid-js/web/dist/dev.js"),
      "solid-js/store": path.resolve(__dirname, "./node_modules/solid-js/store/dist/dev.js"),
      "solid-js": path.resolve(__dirname, "./node_modules/solid-js/dist/dev.js"),
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
