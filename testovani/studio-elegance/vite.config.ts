import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const salonRoot = fileURLToPath(new URL("../../kadernictvi/studio-elegance", import.meta.url));
const sharedAdminDir = fileURLToPath(new URL("../../kadernictvi/_shared/admin", import.meta.url));
const envDir = fileURLToPath(new URL(".", import.meta.url));

function adminSharedResolver(): Plugin {
  const salonEntry = join(salonRoot, "src", "main.tsx");
  return {
    name: "admin-shared-resolver-test",
    async resolveId(source, importer) {
      if (!importer?.replace(/\\/g, "/").includes("/_shared/admin/")) return null;
      if (source.startsWith(".") || source.startsWith("/") || source.startsWith("@")) return null;
      const resolved = await this.resolve(source, salonEntry, { skipSelf: true });
      return resolved?.id ?? null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const fromFiles = loadEnv(mode, envDir, "VITE_");
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
    root: salonRoot,
    envDir,
    define: defineEnv,
    resolve: {
      alias: {
        "@": join(salonRoot, "src"),
        "@admin": sharedAdminDir,
      },
    },
    plugins: [
      adminSharedResolver(),
      tsConfigPaths({ projects: [`${salonRoot}/tsconfig.json`] }),
      tailwindcss(),
      react(),
    ],
    server: {
      host: "::",
      port: 8081,
      fs: { allow: [dirname(salonRoot), sharedAdminDir, envDir] },
    },
    build: {
      outDir: process.env.BUILD_OUT_DIR ?? "dist",
      emptyOutDir: true,
    },
  };
});
