import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const salonDir = fileURLToPath(new URL(".", import.meta.url));
const sharedAdminDir = fileURLToPath(new URL("../_shared/admin", import.meta.url));

/** Soubory v @admin jsou mimo salon root — deps řešíme z node_modules salonu. */
function adminSharedResolver(): Plugin {
  const salonEntry = join(salonDir, "src", "main.tsx");
  return {
    name: "admin-shared-resolver",
    async resolveId(source, importer) {
      if (!importer?.replace(/\\/g, "/").includes("/_shared/admin/")) return null;
      if (source.startsWith(".") || source.startsWith("/") || source.startsWith("@")) return null;
      const resolved = await this.resolve(source, salonEntry, { skipSelf: true });
      return resolved?.id ?? null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const fromFiles = loadEnv(mode, process.cwd(), "VITE_");
  const fromProcess: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("VITE_") && value != null && value !== "") {
      fromProcess[key] = value;
    }
  }
  const merged = { ...fromFiles, ...fromProcess };
  const defineEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) {
    defineEnv[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: defineEnv,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@admin": sharedAdminDir,
      },
    },
    plugins: [
      adminSharedResolver(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      react(),
    ],
    server: {
      host: "::",
      port: 8080,
      fs: { allow: [dirname(salonDir), sharedAdminDir] },
    },
    build: {
      outDir: process.env.BUILD_OUT_DIR ?? "dist",
    },
  };
});
