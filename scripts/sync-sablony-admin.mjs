/**
 * Zkopíruje testovací admin → kadernictvi/sablony-admin (vzory pro ostré salóny).
 * Spusť po úpravách v testovani/studio-elegance/src/admin/
 */
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "testovani/studio-elegance/src/admin");
const dest = join(root, "kadernictvi/sablony-admin");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

console.log("OK: testovani/studio-elegance/src/admin → kadernictvi/sablony-admin");
