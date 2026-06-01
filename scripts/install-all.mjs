import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "sites.config.json"), "utf8"));

const dirs = new Set([root, ...config.sites.map((s) => join(root, s.projectDir))]);

for (const dir of dirs) {
  console.log(`\n→ npm install v ${dir}`);
  execSync("npm install --no-audit --no-fund", { cwd: dir, stdio: "inherit" });
}
