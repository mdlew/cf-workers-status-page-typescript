import type { UserConfig } from "vite";

import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

import vike from "vike/plugin";

import { nonce } from "./src/worker/ssr";

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
  html: {
    cspNonce: nonce, // Use the global nonce variable for CSP
  },
} satisfies UserConfig;
