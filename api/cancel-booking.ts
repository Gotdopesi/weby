import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

const REZERVACE_TABLE = "kadernictvi_rezervace";
const KADERNICTVI_TABLE = "kadernictvi";
const PRAGUE_TZ = "Europe/Prague";
const MIN_HOURS_BEFORE = 24;

function hostFromRequest(req: VercelRequest): string {
  return (req.headers.host ?? "").split(":")[0].toLowerCase();
}

function getDefaultBarbershopName(req: VercelRequest): string {
  if (hostFromRequest(req).includes("donzi")) return "Barbershop Donzi";
  return "Studio Elegance";
}

function cancelSecret(): string {
  const s = process.env.CANCEL_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!s) throw new Error("CANCEL_SECRET or CRON_SECRET is required for cancel links.");
  return s;
}

function normalizeBookingTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time.trim();
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function parseCancelToken(token: string): { id: string; bookingDate: string; bookingTime: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastPipe = decoded.lastIndexOf("|");
    if (lastPipe === -1) return null;
    const sig = decoded.slice(lastPipe + 1);
    const payload = decoded.slice(0, lastPipe);
    const parts = payload.split("|");
    if (parts.length !== 3) return null;
    const [id, bookingDate, bookingTime] = parts;
    const expected = createHmac("sha256", cancelSecret()).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { id, bookingDate, bookingTime: normalizeBookingTime(bookingTime) };
  } catch {
    return null;
  }
}

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

function hoursUntilAppointment(bookingDate: string, bookingTime: string): number {
  return (parseAppointmentPrague(bookingDate, bookingTime).getTime() - Date.now()) / 3_600_000;
}

function canCancelByPolicy(bookingDate: string, bookingTime: string): boolean {
  return hoursUntilAppointment(bookingDate, bookingTime) >= MIN_HOURS_BEFORE;
}

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadReservation(supabase: ReturnType<typeof createSupabaseAdmin>, id: string) {
  const { data, error } = await supabase
    .from(REZERVACE_TABLE)
    .select(`id, first_name, last_name, service, booking_date, booking_time, status, ${KADERNICTVI_TABLE} ( name )`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[cancel-booking] load", error.message);
    return null;
  }
  if (!data) return null;
  return data as Record<string, unknown>;
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const tokenRaw =
      (req.method === "GET" ? (req.query.token as string | undefined) : undefined) ??
      (typeof req.body === "string" ? JSON.parse(req.body) : req.body)?.token;

    if (!tokenRaw || typeof tokenRaw !== "string") {
      return res.status(400).json({ error: "token is required" });
    }

    const parsed = parseCancelToken(tokenRaw);
    if (!parsed) {
      return res.status(400).json({ error: "Neplatný odkaz na zrušení." });
    }

    const supabase = createSupabaseAdmin();
    const row = await loadReservation(supabase, parsed.id);

    if (!row) {
      return res.status(404).json({ error: "Rezervace nenalezena." });
    }

    const shop = row[KADERNICTVI_TABLE] as { name: string } | null;
    const bookingDate = String(row.booking_date);
    const bookingTime = normalizeBookingTime(String(row.booking_time));

    if (bookingDate !== parsed.bookingDate || bookingTime !== parsed.bookingTime) {
      return res.status(400).json({ error: "Odkaz neodpovídá aktuální rezervaci." });
    }

    if (String(row.status) === "canceled") {
      return res.status(410).json({ error: "Rezervace už byla zrušena." });
    }

    const hoursLeft = hoursUntilAppointment(bookingDate, bookingTime);
    const canCancel = canCancelByPolicy(bookingDate, bookingTime);

    const summary = {
      id: parsed.id,
      customerName: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
      service: String(row.service),
      bookingDate,
      bookingTime,
      barbershopName: shop?.name ?? getDefaultBarbershopName(req),
      hoursUntil: Math.max(0, Math.round(hoursLeft * 10) / 10),
      canCancel,
      minHoursBefore: MIN_HOURS_BEFORE,
    };

    if (req.method === "GET") {
      return res.status(200).json(summary);
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!canCancel) {
      return res.status(403).json({
        error: `Zrušení online už není možné — méně než ${MIN_HOURS_BEFORE} hodin před termínem. Kontaktujte salón telefonicky.`,
        ...summary,
      });
    }

    const { error: cancelErr } = await supabase
      .from(REZERVACE_TABLE)
      .update({ status: "canceled" })
      .eq("id", parsed.id);

    if (cancelErr) {
      console.error("[cancel-booking] cancel", cancelErr);
      return res.status(500).json({ error: cancelErr.message });
    }

    return res.status(200).json({ ok: true, canceled: true, ...summary });
  } catch (e) {
    console.error("[cancel-booking]", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
