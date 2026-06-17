/**
 * Účet chci.web@dweby.cz — staré admin rozhraní (kalendář + statistiky).
 *   node scripts/seed-chci-web-admin.mjs
 */
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

const env = { ...loadEnvLocal(), ...process.env };
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = "chci.web@dweby.cz";
const PASSWORD = "123456789";
const KADERNICTVI_ID = 1;

if (!url || !serviceKey) {
  console.error("Chybí VITE_SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY v .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(email, password) {
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  const existing = listed.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password });
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const userId = await ensureUser(EMAIL, PASSWORD);
  console.log("Auth user:", userId);

  const { error } = await admin.from("kadernictvi_admini").upsert(
    {
      kadernictvi_id: KADERNICTVI_ID,
      user_id: userId,
      role: "owner",
      login_label: "chci-web",
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  console.log(`OK — ${EMAIL} je majitel salónu id=${KADERNICTVI_ID}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
