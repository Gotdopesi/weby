/**
 * Jednorázově: přenastaví majitelský účet showcase (kadernictvi_id=1).
 * Použití: node scripts/reset-showcase-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const KADERNICTVI_ID = 1;
const NEW_EMAIL = "admin@kadernictvi.dweby.cz";
const NEW_PASSWORD = "123456789";

if (!url || !key) {
  console.error("Chybí SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY v .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: links, error: linkErr } = await admin
  .from("kadernictvi_admini")
  .select("id, user_id, role, pracovnik_id")
  .eq("kadernictvi_id", KADERNICTVI_ID);

if (linkErr) throw linkErr;

let userId = links?.[0]?.user_id ?? null;

if (!userId) {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: NEW_EMAIL,
    password: NEW_PASSWORD,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  userId = created.user.id;

  const { error: insertErr } = await admin.from("kadernictvi_admini").insert({
    kadernictvi_id: KADERNICTVI_ID,
    user_id: userId,
    login_label: "majitel",
    role: "owner",
    pracovnik_id: null,
  });
  if (insertErr) throw insertErr;
} else {
  const { error: updateUserErr } = await admin.auth.admin.updateUserById(userId, {
    email: NEW_EMAIL,
    password: NEW_PASSWORD,
    email_confirm: true,
  });
  if (updateUserErr) throw updateUserErr;

  const { error: fixLinkErr } = await admin
    .from("kadernictvi_admini")
    .update({ role: "owner", pracovnik_id: null, login_label: "majitel" })
    .eq("kadernictvi_id", KADERNICTVI_ID);
  if (fixLinkErr) throw fixLinkErr;
}

const { error: shopErr } = await admin
  .from("kadernictvi")
  .update({ admin_email: NEW_EMAIL })
  .eq("id", KADERNICTVI_ID);
if (shopErr) throw shopErr;

console.log("OK — showcase admin:");
console.log("  e-mail:", NEW_EMAIL);
console.log("  heslo:", NEW_PASSWORD);
console.log("  role: owner (combined UI)");
