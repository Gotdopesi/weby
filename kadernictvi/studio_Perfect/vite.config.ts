import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [tailwindcss(), react()],
  server: {
    host: "::",
    port: 5174,
  },
  build: {
    outDir: process.env.BUILD_OUT_DIR ?? "dist",
  },
});
