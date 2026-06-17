/**
 * Testovací admin účty — spusť jednou lokálně:
 *   node scripts/seed-dev-admins.mjs
 *
 * Vyžaduje v .env.local: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
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

const ACCOUNTS = [
  {
    role: "owner",
    loginLabel: "dev-majitel",
    firstName: null,
    email: env.VITE_DEV_OWNER_EMAIL || "dev.majitel@studio-elegance.test",
    password: env.VITE_DEV_OWNER_PASSWORD || "DevMajitel26!",
  },
  {
    role: "staff",
    loginLabel: "dev-klara",
    firstName: "Klára",
    email: env.VITE_DEV_KLARA_EMAIL || "dev.klara@studio-elegance.test",
    password: env.VITE_DEV_KLARA_PASSWORD || "DevKlara26!",
  },
  {
    role: "staff",
    loginLabel: "dev-monika",
    firstName: "Monika",
    email: env.VITE_DEV_MONIKA_EMAIL || env.VITE_DEV_STAFF_EMAIL || "dev.monika@studio-elegance.test",
    password: env.VITE_DEV_MONIKA_PASSWORD || env.VITE_DEV_STAFF_PASSWORD || "DevMonika26!",
  },
  {
    role: "staff",
    loginLabel: "dev-eliska",
    firstName: "Eliška",
    email: env.VITE_DEV_ELISKA_EMAIL || "dev.eliska@studio-elegance.test",
    password: env.VITE_DEV_ELISKA_PASSWORD || "DevEliska26!",
  },
];

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
    console.log(`✓ Uživatel existuje, heslo aktualizováno: ${email}`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`✓ Vytvořen: ${email}`);
  return data.user.id;
}

async function staffIdByFirstName(shopId, firstName) {
  const { data } = await admin
    .from("kadernictvi_pracovnici")
    .select("id")
    .eq("kadernictvi_id", shopId)
    .eq("first_name", firstName)
    .eq("is_active", true)
    .maybeSingle();
  return data?.id ?? null;
}

async function linkAdmin(shopId, userId, { role, loginLabel, staffId }) {
  const row = {
    kadernictvi_id: shopId,
    user_id: userId,
    login_label: loginLabel,
    role,
    pracovnik_id: role === "staff" ? staffId : null,
  };

  const { error } = await admin.from("kadernictvi_admini").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
  console.log(`✓ Propojeno: ${loginLabel} (${role}${staffId ? ` → staff #${staffId}` : ""})`);
}

async function main() {
  console.log("Seed dev admin účtů…\n");

  const { data: shop } = await admin
    .from("kadernictvi")
    .select("id")
    .eq("slug", "studio-elegance")
    .maybeSingle();

  if (!shop?.id) {
    console.error("⚠ kadernictvi slug=studio-elegance nenalezen");
    process.exit(1);
  }

  for (const acc of ACCOUNTS) {
    const userId = await ensureUser(acc.email, acc.password);
    let staffId = null;
    if (acc.role === "staff" && acc.firstName) {
      staffId = await staffIdByFirstName(shop.id, acc.firstName);
      if (!staffId) {
        console.warn(`⚠ ${acc.firstName} není v kadernictvi_pracovnici — spusť studio_elegance_team.sql`);
      }
    }
    await linkAdmin(shop.id, userId, {
      role: acc.role,
      loginLabel: acc.loginLabel,
      staffId,
    });
  }

  console.log("\n--- Přihlašovací údaje (lokální test) ---");
  for (const acc of ACCOUNTS) {
    const tag = acc.role === "owner" ? "Majitel" : `Kadeřník ${acc.firstName}`;
    console.log(`${tag.padEnd(16)} ${acc.email} / ${acc.password}`);
  }
  console.log("\nAdmin: http://localhost:8080/admin/login");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
