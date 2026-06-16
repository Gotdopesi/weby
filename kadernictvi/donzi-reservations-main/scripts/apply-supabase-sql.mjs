/**
 * Spustí SQL migrace proti Supabase Postgres.
 *
 * Do .env.local přidej (Supabase → Project Settings → Database → Connection string → URI):
 *   DATABASE_URL=postgresql://postgres.[ref]:[HESLO]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
 *
 * Pak: npm run db:apply
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvFile(name) {
  const path = join(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
// Sdílený přístup k DB pro celou složku kadernictvi (agent + oba salony)
loadEnvFile("../.env.local");

const files = [
  "supabase/kadernictvi_schema.sql",
  "supabase/migrations/20260524130000_showcase_v2.sql",
  "supabase/multi_tenant_rls.sql",
  "supabase/donzi_rls_admin_fix.sql",
  "supabase/donzi_services_v2.sql",
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "Chybí DATABASE_URL.\n" +
      "Vytvoř soubor: kadernictvi/.env.local (viz .env.local.example)\n" +
      "Supabase Dashboard → Project Settings → Database → Connection string (URI).\n" +
      "Příklad:\n" +
      "DATABASE_URL=postgresql://postgres.hnkcjrvqbeojegujuuyw:HESLO@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Připojeno k Postgres. Spouštím migrace…\n");

  for (const rel of files) {
    const path = join(root, rel);
    if (!existsSync(path)) {
      console.warn(`Přeskočeno (soubor neexistuje): ${rel}`);
      continue;
    }
    const sql = readFileSync(path, "utf8");
    console.log(`→ ${rel} (${sql.length} znaků)`);
    await client.query(sql);
    console.log(`  OK\n`);
  }

  const check = await client.query(`
    SELECT 'kadernictvi_vydelky' AS tbl, COUNT(*)::text AS cnt FROM public.kadernictvi_vydelky
    UNION ALL SELECT 'kadernictvi_admini', COUNT(*)::text FROM public.kadernictvi_admini
    UNION ALL SELECT 'portfolio_poptavky', COUNT(*)::text FROM public.portfolio_poptavky;
  `);
  console.log("Kontrola po migraci:");
  for (const row of check.rows) {
    console.log(`  ${row.tbl}: ${row.cnt} řádků`);
  }
}

main()
  .catch((err) => {
    console.error("Migrace selhala:", err.message);
    process.exit(1);
  })
  .finally(() => client.end());
