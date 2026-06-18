import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { KADERNICTVI_TABULKY, rezervaceTableFromEnv } from "./lib/kadernictvi-tables";
import { resolveSite } from "./tenant";

const REZERVACE_TABLE = rezervaceTableFromEnv();

type CreateBookingBody = {
  kadernictvi_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  service?: string;
  service_id?: number | null;
  total_price?: number | null;
  duration_minutes?: number;
  booking_date?: string;
  booking_time?: string;
  pracovnik_id?: number | null;
  note?: string | null;
};

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function resolveKadernictviId(req: VercelRequest, body: CreateBookingBody): number {
  const fromBody = Number(body.kadernictvi_id);
  if (Number.isFinite(fromBody) && fromBody > 0) return fromBody;
  const site = resolveSite(req);
  if (site?.kadernictviId && site.kadernictviId > 0) return site.kadernictviId;
  const fromEnv = Number(process.env.VITE_KADERNICTVI_ID ?? process.env.KADERNICTVI_ID ?? "1");
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 1;
}

function normalizeTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error("Neplatný čas rezervace.");
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function validateBody(body: CreateBookingBody) {
  const firstName = body.first_name?.trim() ?? "";
  const lastName = body.last_name?.trim() ?? "Neuvedeno";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const service = body.service?.trim() ?? "";
  const bookingDate = body.booking_date?.trim() ?? "";
  const bookingTime = body.booking_time?.trim() ?? "";

  if (firstName.length < 2) throw new Error("Zadejte jméno.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Neplatný e-mail.");
  if (phone.length < 6) throw new Error("Zadejte telefon.");
  if (!service) throw new Error("Chybí služba.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) throw new Error("Neplatné datum rezervace.");

  const durationMinutes = Number(body.duration_minutes ?? 60);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 15) {
    throw new Error("Neplatná délka služby.");
  }

  const serviceId = body.service_id == null ? null : Number(body.service_id);
  const totalPrice = body.total_price == null ? null : Number(body.total_price);
  const staffId = body.pracovnik_id == null ? null : Number(body.pracovnik_id);
  const note = body.note?.trim() ? body.note.trim() : null;

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    service,
    service_id: Number.isFinite(serviceId) && serviceId! > 0 ? serviceId : null,
    total_price: Number.isFinite(totalPrice) ? totalPrice : null,
    duration_minutes: durationMinutes,
    booking_date: bookingDate,
    booking_time: normalizeTime(bookingTime),
    pracovnik_id: Number.isFinite(staffId) && staffId! > 0 ? staffId : null,
    note,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as CreateBookingBody;
    const row = validateBody(body);
    const kadernictviId = resolveKadernictviId(req, body);
    const supabase = createSupabaseAdmin();

    const { data: shop, error: shopErr } = await supabase
      .from(KADERNICTVI_TABULKY.kadernictvi)
      .select("id")
      .eq("id", kadernictviId)
      .maybeSingle();
    if (shopErr) throw shopErr;
    if (!shop) return res.status(400).json({ error: "Salón nebyl nalezen." });

    const { data: created, error } = await supabase
      .from(REZERVACE_TABLE)
      .insert({
        ...row,
        status: "confirmed",
        kadernictvi_id: kadernictviId,
        sms_sent: false,
      })
      .select("id")
      .single();

    if (error || !created?.id) {
      console.error("[create-booking] insert", error);
      return res.status(500).json({ error: error?.message ?? "Rezervaci se nepodařilo uložit." });
    }

    return res.status(200).json({ ok: true, reservationId: created.id });
  } catch (e) {
    console.error("[create-booking]", e);
    return res.status(400).json({
      error: e instanceof Error ? e.message : "Neplatná data rezervace.",
    });
  }
}
