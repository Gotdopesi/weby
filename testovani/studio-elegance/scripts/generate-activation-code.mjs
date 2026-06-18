/**
 * Vygeneruje aktivační kód pro první admin účet salónu.
 *   node scripts/generate-activation-code.mjs
 *   node scripts/generate-activation-code.mjs --kadernictvi-id=1 --note="Studio Elegance majitel"
 */
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function parseArgs() {
  const out = { kadernictviId: 1, note: "" };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--kadernictvi-id=")) out.kadernictviId = Number(arg.split("=")[1]);
    if (arg.startsWith("--note=")) out.note = arg.slice("--note=".length);
  }
  return out;
}

function newCode(): string {
  const raw = randomBytes(4).toString("hex").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

const env = { ...loadEnvLocal(), ...process.env };
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const { kadernictviId, note } = parseArgs();

if (!url || !serviceKey) {
  console.error("Chybí VITE_SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY v .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: shop, error: shopErr } = await admin
    .from("kadernictvi")
    .select("id, name, slug")
    .eq("id", kadernictviId)
    .maybeSingle();
  if (shopErr) throw shopErr;
  if (!shop) {
    console.error(`Salón id=${kadernictviId} neexistuje.`);
    process.exit(1);
  }

  const code = newCode();
  const { error } = await admin.from("kadernictvi_aktivacni_kody").insert({
    kadernictvi_id: kadernictviId,
    code,
    note: note || null,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (error) throw error;

  console.log("");
  console.log(`Salón: ${shop.name} (id ${shop.id}, slug ${shop.slug})`);
  console.log(`Aktivační kód: ${code}`);
  console.log("Platnost: 90 dní, jednorázový.");
  console.log("");
  console.log("Předej kód majiteli — zadá ho při „Založit účet“ na /admin/login.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
