import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, process.cwd(), "VITE_");
  const defineEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(loaded)) {
    defineEnv[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: defineEnv,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] }), tailwindcss(), react()],
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      outDir: process.env.BUILD_OUT_DIR ?? "dist",
    },
  };
});
