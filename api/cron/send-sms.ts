import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { addHours } from "date-fns";

const PRAGUE_TZ = "Europe/Prague";
const REZERVACE_TABLE =
  (process.env.SUPABASE_REZERVACE_TABLE ?? process.env.VITE_SUPABASE_REZERVACE_TABLE ?? "showcase_rezervace").trim();
const BARBERSHOP_TABLE =
  (process.env.SUPABASE_BARBERSHOP_TABLE ?? "showcase_barbershops").trim();
const SMS_VYUCTOVANI_TABLE =
  (process.env.SUPABASE_SMS_VYUCTOVANI_TABLE ?? "showcase_sms_vyuctovani").trim();
const DEFAULT_SMS_UNIT_COST = 1;
const DEFAULT_SMS_BILLING_MULTIPLIER = 1.6;

type RezervaceRow = {
  id: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  sms_sent: boolean;
  barbershop_id: number | null;
  shop: {
    id: number;
    name: string;
    credit_balance: number;
    sms_price: number;
    sms_unit_cost: number;
    sms_billing_multiplier: number;
  } | null;
};

function smsBillingAmount(shop: NonNullable<RezervaceRow["shop"]>): {
  unitCost: number;
  multiplier: number;
  amount: number;
} {
  const unitCost = Number(shop.sms_unit_cost) || DEFAULT_SMS_UNIT_COST;
  const multiplier = Number(shop.sms_billing_multiplier) || DEFAULT_SMS_BILLING_MULTIPLIER;
  const amount = Math.round(unitCost * multiplier * 100) / 100;
  return { unitCost, multiplier, amount };
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for API routes.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Číslo ve formátu BulkGate (420…). */
function normalizePhoneForBulkGate(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("420") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) {
    return `420${digits.slice(1)}`;
  }
  if (digits.length === 9) return `420${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Termín jako UTC timestamp — booking_date + booking_time = hodiny v Praze. */
function parseAppointmentPrague(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi ?? 0, 0);

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAGUE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  for (let offsetHours = -3; offsetHours <= 3; offsetHours++) {
    const probe = new Date(utcGuess + offsetHours * 3600_000);
    const parts = fmt.formatToParts(probe);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    if (
      get("year") === y &&
      get("month") === mo &&
      get("day") === d &&
      get("hour") === h &&
      get("minute") === (mi ?? 0)
    ) {
      return probe;
    }
  }

  return new Date(utcGuess);
}

function verifyCronAuth(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.authorization;
  if (auth === `Bearer ${secret}`) return true;
  const header = req.headers["x-cron-secret"];
  return header === secret;
}

async function loadPendingRows(supabase: SupabaseClient): Promise<{
  rows: RezervaceRow[];
  error?: string;
  tableUsed: string;
}> {
  const embedLegacy =
    "barbershops ( id, name, credit_balance, sms_price, sms_unit_cost, sms_billing_multiplier )";
  const embedShowcase =
    "showcase_barbershops ( id, name, credit_balance, sms_price, sms_unit_cost, sms_billing_multiplier )";
  const tablesToTry = [...new Set([REZERVACE_TABLE, "showcase_rezervace", "rezervace"])];

  for (const table of tablesToTry) {
    const embed = table.startsWith("showcase_") ? embedShowcase : embedLegacy;
    const { data, error } = await supabase
      .from(table)
      .select(`id, phone, booking_date, booking_time, sms_sent, barbershop_id, ${embed}`)
      .eq("sms_sent", false);

    if (error) continue;

    const shopKey = table.startsWith("showcase_") ? "showcase_barbershops" : "barbershops";
    const rows = (data ?? []).map((r) => {
      const raw = r as Record<string, unknown>;
      const shopRaw = raw[shopKey] as RezervaceRow["shop"] | null;
      return {
        id: String(raw.id),
        phone: String(raw.phone),
        booking_date: String(raw.booking_date),
        booking_time: String(raw.booking_time),
        sms_sent: Boolean(raw.sms_sent),
        barbershop_id: raw.barbershop_id as number | null,
        shop: shopRaw,
      };
    });

    return { rows, tableUsed: table };
  }

  return {
    rows: [],
    error: `Nelze načíst rezervace (zkoušeno: ${tablesToTry.join(", ")}). Spusť showcase_schema.sql nebo nastav SUPABASE_REZERVACE_TABLE.`,
    tableUsed: REZERVACE_TABLE,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!verifyCronAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const log: string[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let outsideWindow = 0;
  const isPing = req.query.ping === "1" || req.query.ping === "true";
  const isDryRun = req.query.dry_run === "1" || req.query.dry_run === "true";

  try {
    const supabase = createSupabaseAdmin();
    const { rows: pending, error: loadError, tableUsed } = await loadPendingRows(supabase);

    const now = new Date();
    const windowStart = addHours(now, 22);
    const windowEnd = addHours(now, 26);

    if (isPing) {
      return res.status(200).json({
        ok: true,
        ping: true,
        tableUsed,
        loadError,
        pendingCount: pending.length,
        env: {
          hasBulkGateId: Boolean(process.env.BULKGATE_APP_ID?.trim()),
          hasBulkGateToken: Boolean(process.env.BULKGATE_APP_TOKEN?.trim()),
          hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
          hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
          rezervaceTable: REZERVACE_TABLE,
          barbershopTable: BARBERSHOP_TABLE,
          nodeEnv: process.env.NODE_ENV,
        },
        window: {
          now: now.toISOString(),
          from: windowStart.toISOString(),
          to: windowEnd.toISOString(),
          note: "SMS se posílá jen pro termíny v tomto okně (cca 24 h předem, časová zóna Praha).",
        },
      });
    }

    if (loadError) {
      return res.status(500).json({ error: loadError, log });
    }

    if (!isDryRun) {
      requireEnv("BULKGATE_APP_ID");
      requireEnv("BULKGATE_APP_TOKEN");
    }

    for (const row of pending) {
      const at = parseAppointmentPrague(row.booking_date, row.booking_time);
      if (at < windowStart || at > windowEnd) {
        outsideWindow++;
        continue;
      }

      const shop = row.shop;
      if (!shop) {
        log.push(`[skip] ${row.id}: chybí barbershop (barbershop_id=${row.barbershop_id ?? "null"})`);
        skipped++;
        continue;
      }

      const { unitCost, multiplier, amount: billedAmount } = smsBillingAmount(shop);

      const number = normalizePhoneForBulkGate(row.phone);
      if (!number) {
        log.push(`[skip] ${row.id}: neplatne cislo "${row.phone}"`);
        skipped++;
        continue;
      }

      const text = stripDiacritics(
        `Pripominame rezervaci v ${shop.name} zitra v ${row.booking_time}. Tesime se!`,
      );

      if (isDryRun) {
        log.push(`[dry_run] ${row.id}: poslalo by se na ${number}, termin ${at.toISOString()}`);
        sent++;
        continue;
      }

      const appId = requireEnv("BULKGATE_APP_ID");
      const appToken = requireEnv("BULKGATE_APP_TOKEN");

      const bgRes = await fetch("https://portal.bulkgate.com/api/1.0/simple/transactional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: appId,
          application_token: appToken,
          number,
          text,
          unicode: false,
          country: "cz",
          sender_id: "gText",
          sender_id_value: "Donzi",
        }),
      });

      const rawBody = await bgRes.text();
      let bgJson: { data?: unknown; error?: string; message?: string } = {};
      try {
        bgJson = JSON.parse(rawBody) as typeof bgJson;
      } catch {
        bgJson = { error: rawBody.slice(0, 200) };
      }

      if (!bgRes.ok || bgJson.error) {
        log.push(
          `[fail] ${row.id}: BulkGate HTTP ${bgRes.status} — ${bgJson.error ?? bgJson.message ?? rawBody.slice(0, 120)}`,
        );
        failed++;
        continue;
      }

      const { error: ledgerErr } = await supabase.from(SMS_VYUCTOVANI_TABLE).insert({
        barbershop_id: shop.id,
        rezervace_id: row.id,
        phone: row.phone,
        unit_cost: unitCost,
        billing_multiplier: multiplier,
        amount: billedAmount,
      });

      if (ledgerErr) {
        log.push(`[fail] ${row.id}: sms vyuctovani ${ledgerErr.message}`);
        failed++;
        continue;
      }

      const { error: flagErr } = await supabase
        .from(tableUsed)
        .update({ sms_sent: true })
        .eq("id", row.id);

      if (flagErr) {
        log.push(`[fail] ${row.id}: sms_sent flag ${flagErr.message}`);
        failed++;
        continue;
      }

      log.push(`[ok] ${row.id}: SMS na ${number}, vyuctovani ${billedAmount} Kc`);
      sent++;
    }

    return res.status(200).json({
      ok: true,
      tableUsed,
      dryRun: isDryRun,
      stats: {
        pendingTotal: pending.length,
        outsideWindow,
        sent,
        skipped,
        failed,
      },
      window: {
        now: now.toISOString(),
        from: windowStart.toISOString(),
        to: windowEnd.toISOString(),
        timezone: PRAGUE_TZ,
        hint: "Pokud sent=0 a outsideWindow je vysoké, cron běží mimo 22–26 h před termínem. Rezervace zítra ve 14:00 dostane SMS dnes mezi 12:00–16:00.",
      },
      log,
    });
  } catch (e) {
    console.error("[cron/send-sms]", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message, log });
  }
}
