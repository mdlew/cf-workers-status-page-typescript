import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vike from "vike/plugin";
import { defineConfig } from "vite";

export default defineConfig({
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
});
