/**
 * Jednorázový přepočet showcase_vydelky z showcase_trzby (service role).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv(name) {
  const path = join(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env");
loadEnv(".env.local");

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Chybí SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY v .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const BARBERSHOP_ID = Number(process.env.VITE_BARBERSHOP_ID ?? 1);
const currentMonth = new Date().toISOString().slice(0, 7);

const { data: rows, error } = await supabase
  .from("showcase_trzby")
  .select("barbershop_id, booking_date, revenue_kind, amount, service_id, service_name")
  .eq("barbershop_id", BARBERSHOP_ID);

if (error) {
  console.error(error.message);
  process.exit(1);
}

const months = new Map();

for (const r of rows ?? []) {
  if (r.revenue_kind === "canceled") continue;
  const mk = String(r.booking_date).slice(0, 7);
  if (!months.has(mk)) {
    months.set(mk, { earned: 0, planned: 0, services: new Map() });
  }
  const m = months.get(mk);
  const amt = Number(r.amount) || 0;
  if (r.revenue_kind === "earned") m.earned += amt;
  if (r.revenue_kind === "planned") m.planned += amt;

  const sk = `${r.service_id ?? "x"}|${r.service_name}`;
  if (!m.services.has(sk)) {
    m.services.set(sk, {
      service_id: r.service_id,
      service_name: r.service_name,
      earned: 0,
      planned: 0,
      count_earned: 0,
      count_planned: 0,
    });
  }
  const s = m.services.get(sk);
  if (r.revenue_kind === "earned") {
    s.earned += amt;
    s.count_earned += 1;
  }
  if (r.revenue_kind === "planned") {
    s.planned += amt;
    s.count_planned += 1;
  }
}

for (const [month_key, m] of months) {
  const planned = month_key < currentMonth ? 0 : m.planned;
  const earned = m.earned;
  const total = earned + planned;

  const { error: upErr } = await supabase.from("showcase_vydelky").upsert(
    {
      barbershop_id: BARBERSHOP_ID,
      month_key,
      earned,
      planned,
      total,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "barbershop_id,month_key" },
  );
  if (upErr) console.error("vydelky", month_key, upErr.message);
  else console.log("vydelky", month_key, { earned, planned, total });

  await supabase
    .from("showcase_vydelky_sluzby")
    .delete()
    .eq("barbershop_id", BARBERSHOP_ID)
    .eq("month_key", month_key);

  const svcRows = [...m.services.values()].map((s) => {
    const plannedAmt = month_key < currentMonth ? 0 : s.planned;
    const earnedAmt = s.earned;
    return {
      barbershop_id: BARBERSHOP_ID,
      service_id: s.service_id,
      service_name: s.service_name,
      month_key,
      price: 0,
      count_earned: s.count_earned,
      count_planned: month_key < currentMonth ? 0 : s.count_planned,
      count_total: s.count_earned + (month_key < currentMonth ? 0 : s.count_planned),
      amount_earned: earnedAmt,
      amount_planned: plannedAmt,
      amount_total: earnedAmt + plannedAmt,
      updated_at: new Date().toISOString(),
    };
  });

  if (svcRows.length) {
    const { error: svcErr } = await supabase.from("showcase_vydelky_sluzby").insert(svcRows);
    if (svcErr) console.error("sluzby", month_key, svcErr.message);
  }
}

console.log("Hotovo, měsíců:", months.size);
