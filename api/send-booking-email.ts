import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { Resend } from "resend";

const REZERVACE_TABLE = "kadernictvi_rezervace";

function hostFromRequest(req: VercelRequest): string {
  return (req.headers.host ?? "").split(":")[0].toLowerCase();
}

function getPublicSiteUrl(req: VercelRequest): string {
  const host = hostFromRequest(req);
  const fromEnv =
    process.env.SITE_URL_KADERNICTVI?.trim() ||
    process.env.SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`).origin;
    } catch {
      /* fallback */
    }
  }
  if (host.includes("donzi")) return "https://donzi.dweby.cz";
  return "https://kadernictvi.dweby.cz";
}

function getResendFrom(req: VercelRequest): string {
  if (process.env.RESEND_USE_SANDBOX?.trim() === "true") {
    return "Studio Elegance <onboarding@resend.dev>";
  }
  const host = hostFromRequest(req);
  if (host.includes("kadernictvi") || host.includes("studio-elegance")) {
    return (
      process.env.RESEND_FROM_KADERNICTVI?.trim() ||
      process.env.RESEND_FROM?.trim() ||
      "Studio Elegance <onboarding@resend.dev>"
    );
  }
  return (
    process.env.RESEND_FROM_DONZI?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Studio Elegance <onboarding@resend.dev>"
  );
}

function getDefaultShopName(req: VercelRequest): string {
  const host = hostFromRequest(req);
  if (host.includes("donzi")) return "Barbershop Donzi";
  return "Studio Elegance";
}

function withDeploymentProtectionBypass(url: string): string {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (!secret) return url;
  const u = new URL(url);
  u.searchParams.set("x-vercel-protection-bypass", secret);
  u.searchParams.set("x-vercel-set-bypass-cookie", "true");
  return u.toString();
}

function cancelSecretOptional(): string | null {
  return process.env.CANCEL_SECRET?.trim() || process.env.CRON_SECRET?.trim() || null;
}

function normalizeBookingTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time.trim();
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function buildCancelReservationUrl(
  req: VercelRequest,
  reservationId: string,
  bookingDate: string,
  bookingTime: string,
): string | null {
  const secret = cancelSecretOptional();
  if (!secret) return null;
  const time = normalizeBookingTime(bookingTime);
  const payload = `${reservationId}|${bookingDate}|${time}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${sig}`).toString("base64url");
  return withDeploymentProtectionBypass(
    `${getPublicSiteUrl(req)}/zrusit-rezervaci?token=${encodeURIComponent(token)}`,
  );
}

type BookingEmailPayload = {
  customerName: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  barbershopName: string;
  barbershopEmail?: string | null;
  phone: string;
  cancelUrl: string | null;
};

function buildBookingConfirmationHtml(p: BookingEmailPayload): string {
  const contact = p.barbershopEmail
    ? `<a href="mailto:${p.barbershopEmail}" style="color:#b8860b;text-decoration:none;">${p.barbershopEmail}</a>`
    : "viz web salónu";
  const cancelBlock = p.cancelUrl
    ? `<p style="margin:0 0 20px;color:#555;font-size:14px;">Rezervaci můžete zrušit online nejpozději 24&nbsp;hodin před termínem.</p>
       <a href="${p.cancelUrl}" style="display:inline-block;padding:14px 28px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px;">Zrušit rezervaci</a>`
    : "";

  return `<!DOCTYPE html><html lang="cs"><body style="font-family:Georgia,serif;background:#f4f1ec;padding:24px;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
      <p style="color:#d4af37;font-size:12px;letter-spacing:.2em;">POTVRZENÍ REZERVACE</p>
      <h1 style="font-weight:normal;">${p.barbershopName}</h1>
      <p>Dobrý den, <strong>${p.customerName}</strong>,</p>
      <p>děkujeme za rezervaci:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#888;">Služba</td><td><strong>${p.service}</strong></td></tr>
        <tr><td style="padding:8px;color:#888;">Datum</td><td><strong>${p.bookingDate}</strong></td></tr>
        <tr><td style="padding:8px;color:#888;">Čas</td><td><strong>${p.bookingTime}</strong></td></tr>
        <tr><td style="padding:8px;color:#888;">Telefon</td><td>${p.phone}</td></tr>
      </table>
      <p>Kontakt salónu: ${contact}</p>
      ${cancelBlock}
    </div></body></html>`;
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
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadReservation(
  supabase: SupabaseClient,
  reservationId: string,
  defaultShopName: string,
) {
  const { data, error } = await supabase
    .from(REZERVACE_TABLE)
    .select(
      "id, first_name, last_name, email, phone, service, booking_date, booking_time, kadernictvi ( name, email )",
    )
    .eq("id", reservationId)
    .single();

  if (error) return { row: null, error: error.message };

  const raw = data as Record<string, unknown>;
  const shop = raw.kadernictvi as { name: string; email: string | null } | null;

  return {
    row: {
      id: String(raw.id),
      first_name: String(raw.first_name),
      last_name: String(raw.last_name),
      email: String(raw.email),
      phone: String(raw.phone),
      service: String(raw.service),
      booking_date: String(raw.booking_date),
      booking_time: String(raw.booking_time),
      barbershopName: shop?.name ?? defaultShopName,
      barbershopEmail: shop?.email ?? null,
    },
  };
}

async function sendConfirmationEmail(
  resend: Resend,
  from: string,
  to: string,
  subject: string,
  html: string,
) {
  const primary = await resend.emails.send({ from, to: [to], subject, html });
  if (!primary.error) return primary;

  const msg = primary.error.message ?? "";
  if (from.includes("onboarding@resend.dev")) return primary;

  console.warn("[send-booking-email] retry onboarding@resend.dev:", msg);
  return resend.emails.send({
    from: "Studio Elegance <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const reservationId = body?.reservationId as string | undefined;
    if (!reservationId) return res.status(400).json({ error: "reservationId is required" });

    const supabase = createSupabaseAdmin();
    const { row, error: loadError } = await loadReservation(
      supabase,
      reservationId,
      getDefaultShopName(req),
    );

    if (!row) {
      console.error("[send-booking-email] load", loadError);
      return res.status(404).json({ error: loadError ?? "Reservation not found" });
    }

    const resend = new Resend(requireEnv("RESEND_API_KEY"));
    const from = getResendFrom(req);
    const cancelUrl = buildCancelReservationUrl(req, row.id, row.booking_date, row.booking_time);
    const customerName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();

    const { data: sent, error: sendErr } = await sendConfirmationEmail(
      resend,
      from,
      row.email,
      `Potvrzení rezervace — ${row.barbershopName}`,
      buildBookingConfirmationHtml({
        customerName,
        service: row.service,
        bookingDate: row.booking_date,
        bookingTime: row.booking_time,
        barbershopName: row.barbershopName,
        barbershopEmail: row.barbershopEmail,
        phone: row.phone,
        cancelUrl,
      }),
    );

    if (sendErr) {
      console.error("[send-booking-email] resend", sendErr);
      return res.status(502).json({ error: sendErr.message });
    }

    return res.status(200).json({ ok: true, id: sent?.id, cancelUrl });
  } catch (e) {
    console.error("[send-booking-email]", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
