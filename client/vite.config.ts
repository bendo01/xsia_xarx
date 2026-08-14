import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envPrefix: ['VITE_', 'CURRENT_'],
  plugins: [
    solidStart({ devOverlay: false }),
    tailwindcss(),
  ]
});
