import { execSync } from "node:child_process";
import { readFileSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "sites.config.json"), "utf8"));
const distRoot = join(root, "dist");

rmSync(distRoot, { recursive: true, force: true });
mkdirSync(distRoot, { recursive: true });

for (const site of config.sites) {
  const cwd = join(root, site.projectDir);
  const outDir = join(distRoot, site.distPath);
  mkdirSync(outDir, { recursive: true });

  console.log(`\n→ build ${site.id} (${site.projectDir}) → dist/${site.distPath}`);

  const env = {
    ...process.env,
    BUILD_OUT_DIR: outDir,
    ...site.buildEnv,
  };

  execSync("npm run build", { cwd, env, stdio: "inherit" });
}

console.log("\n✓ Monorepo build hotový:", distRoot);
