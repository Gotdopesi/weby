/**
 * Přemapuje @admin/... → @/admin/... v testovacím projektu.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const replacements = [
  [/@admin\/config/g, "@/admin/config"],
  [/@admin\/router\//g, "@/admin/router/"],
  [/@admin\/core\//g, "@/admin/core/"],
  [/@admin\/templates\//g, "@/admin/templates/"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const target = join(root, "testovani/studio-elegance");
let changed = 0;
for (const file of walk(target)) {
  let src = readFileSync(file, "utf8");
  let next = src;
  for (const [from, to] of replacements) next = next.replace(from, to);
  if (next !== src) {
    writeFileSync(file, next, "utf8");
    changed++;
  }
}
console.log(`@admin -> @/admin: ${changed} files`);
