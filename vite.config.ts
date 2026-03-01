import type { UserConfig } from "vite";

import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

import vike from "vike/plugin";

export default {
  plugins: [
    react(),
    vike(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "#src": path.resolve(__dirname, "src"),
    },
  },
} satisfies UserConfig;
