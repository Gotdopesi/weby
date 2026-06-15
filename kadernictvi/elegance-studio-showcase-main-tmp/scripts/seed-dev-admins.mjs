/**
 * DOČASNÉ testovací účty — spusť jednou lokálně:
 *   node scripts/seed-dev-admins.mjs
 *
 * Vyžaduje v .env.local: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (service role zkopíruj z elegance-studio .env.local nebo Supabase → API)
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

const OWNER_EMAIL = env.VITE_DEV_OWNER_EMAIL || "dev.majitel@studio-elegance.test";
const OWNER_PASSWORD = env.VITE_DEV_OWNER_PASSWORD || "DevMajitel26!";
const STAFF_EMAIL = env.VITE_DEV_STAFF_EMAIL || "dev.monika@studio-elegance.test";
const STAFF_PASSWORD = env.VITE_DEV_STAFF_PASSWORD || "DevMonika26!";

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
    await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    console.log(`✓ Uživatel existuje, heslo aktualizováno: ${email} (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`✓ Vytvořen: ${email} (${data.user.id})`);
  return data.user.id;
}

async function linkAdmin(userId, role, loginLabel, staffId = null) {
  const { data: shop } = await admin
    .from("showcase_barbershops")
    .select("id")
    .eq("slug", "studio-elegance")
    .maybeSingle();

  if (!shop?.id) {
    console.warn("⚠ showcase_barbershops slug=studio-elegance nenalezen — propojení přeskočeno");
    return;
  }

  const row = {
    barbershop_id: shop.id,
    user_id: userId,
    login_label: loginLabel,
    role,
    staff_id: staffId,
  };

  const { error } = await admin.from("showcase_barbershop_admins").upsert(row, { onConflict: "user_id" });
  if (error) {
    const fallback = {
      barbershop_id: shop.id,
      user_id: userId,
      login_label: loginLabel,
    };
    const { error: e2 } = await admin.from("showcase_barbershop_admins").upsert(fallback, { onConflict: "user_id" });
    if (e2) throw e2;
    console.warn(`⚠ role sloupce asi chybí — propojeno bez role (${loginLabel})`);
    return;
  }
  console.log(`✓ Propojeno v showcase_barbershop_admins: ${loginLabel} (${role})`);
}

async function staffIdMonika(shopId) {
  const { data } = await admin
    .from("showcase_staff")
    .select("id")
    .eq("barbershop_id", shopId)
    .eq("first_name", "Monika")
    .maybeSingle();
  return data?.id ?? null;
}

async function main() {
  console.log("Seed dev admin účtů…\n");

  const ownerId = await ensureUser(OWNER_EMAIL, OWNER_PASSWORD);
  const staffUserId = await ensureUser(STAFF_EMAIL, STAFF_PASSWORD);

  const { data: shop } = await admin
    .from("showcase_barbershops")
    .select("id")
    .eq("slug", "studio-elegance")
    .maybeSingle();

  const monikaStaffId = shop?.id ? await staffIdMonika(shop.id) : null;

  await linkAdmin(ownerId, "owner", "dev-majitel", null);
  await linkAdmin(staffUserId, "staff", "dev-monika", monikaStaffId);

  // Jistota: Monika nikdy nemá roli majitele
  if (shop?.id && monikaStaffId) {
    const { error: fixErr } = await admin
      .from("showcase_barbershop_admins")
      .update({ role: "staff", staff_id: monikaStaffId, login_label: "dev-monika" })
      .eq("user_id", staffUserId)
      .eq("barbershop_id", shop.id);
    if (fixErr) console.warn("⚠ fix Monika role:", fixErr.message);
    else console.log("✓ Monika vynucena jako staff (ne majitel)");
  }

  if (!monikaStaffId) {
    console.warn("\n⚠ Monika není v showcase_staff — spusť showcase_staff.sql, pak znovu tento skript.");
  }

  console.log("\n--- Přihlašovací údaje (jen pro lokální test) ---");
  console.log(`Majitel:   ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log(`Kadeřník:  ${STAFF_EMAIL} / ${STAFF_PASSWORD}`);
  console.log("\nAdmin: http://localhost:8080/admin/login");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
