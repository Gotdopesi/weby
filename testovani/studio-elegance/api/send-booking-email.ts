import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { Resend } from "resend";

import { rezervaceTableFromEnv } from "./lib/kadernictvi-tables";

const REZERVACE_TABLE = rezervaceTableFromEnv();

/** Odesílatel z sites.config / env — bez nutnosti RESEND_FROM na Vercelu pro Studio Elegance. */
function getResendFrom(req?: VercelRequest): string {
  const host = (req?.headers?.host ?? "").split(":")[0].toLowerCase();
  if (host.includes("kadernictvi") || host.includes("studio-elegance")) {
    return (
      process.env.RESEND_FROM_KADERNICTVI?.trim() ||
      process.env.RESEND_FROM?.trim() ||
      "Studio Elegance <rezervace@dweby.cz>"
    );
  }
  return (
    process.env.RESEND_FROM_DONZI?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Studio Elegance <rezervace@dweby.cz>"
  );
}

/** Inline — Vercel serverless nenačítá api/lib/ jako samostatný modul. */
function getPublicSiteUrl(req?: VercelRequest): string {
  const host = (req?.headers?.host ?? "").split(":")[0].toLowerCase();
  const fromEnv =
    process.env.SITE_URL_KADERNICTVI?.trim() ||
    process.env.SITE_URL?.trim();
  if (fromEnv) {
    try {
      const origin = new URL(fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`).origin;
      if (!origin.includes("vercel.app")) return origin;
    } catch {
      /* fallback */
    }
  }
  if (host.includes("donzi")) return "https://donzi.dweby.cz";
  return "https://kadernictvi.dweby.cz";
}

/** Prohlížeč: cookie bypass, když je zapnutá ochrana preview (volitelné env z Vercelu). */
function withDeploymentProtectionBypass(url: string): string {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (!secret) return url;
  const u = new URL(url);
  u.searchParams.set("x-vercel-protection-bypass", secret);
  u.searchParams.set("x-vercel-set-bypass-cookie", "true");
  return u.toString();
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

function buildCancelReservationUrl(
  req: VercelRequest,
  reservationId: string,
  bookingDate: string,
  bookingTime: string,
): string {
  const time = normalizeBookingTime(bookingTime);
  const payload = `${reservationId}|${bookingDate}|${time}`;
  const sig = createHmac("sha256", cancelSecret()).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${sig}`).toString("base64url");
  const path = `${getPublicSiteUrl(req)}/zrusit-rezervaci?token=${encodeURIComponent(token)}`;
  return withDeploymentProtectionBypass(path);
}

type BookingEmailPayload = {
  customerName: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  barbershopName: string;
  barbershopEmail?: string | null;
  phone: string;
  cancelUrl: string;
};

/** Inline — Vercel serverless nenačítá api/lib/ jako samostatný modul. */
function buildBookingConfirmationHtml(p: BookingEmailPayload): string {
  const contact = p.barbershopEmail
    ? `<a href="mailto:${p.barbershopEmail}" style="color:#b8860b;text-decoration:none;">${p.barbershopEmail}</a>`
    : "viz web salónu";

  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ec;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2a26 100%);padding:28px 32px;">
          <p style="margin:0;color:#d4af37;font-size:12px;letter-spacing:0.25em;text-transform:uppercase;">Potvrzení rezervace</p>
          <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;font-weight:normal;">${p.barbershopName}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.6;">Dobrý den, <strong>${p.customerName}</strong>,</p>
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">děkujeme za rezervaci. Těšíme se na vás v následujícím termínu:</p>
          <table role="presentation" width="100%" style="background:#faf8f5;border:1px solid #e8e2d9;border-radius:8px;margin-bottom:24px;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 20px;color:#888;font-size:13px;width:38%;border-bottom:1px solid #e8e2d9;">Služba</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:15px;border-bottom:1px solid #e8e2d9;"><strong>${p.service}</strong></td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#888;font-size:13px;border-bottom:1px solid #e8e2d9;">Datum</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:15px;border-bottom:1px solid #e8e2d9;"><strong>${p.bookingDate}</strong></td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#888;font-size:13px;border-bottom:1px solid #e8e2d9;">Čas</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:15px;border-bottom:1px solid #e8e2d9;"><strong>${p.bookingTime}</strong></td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#888;font-size:13px;">Telefon</td>
              <td style="padding:12px 20px;color:#1a1a1a;font-size:15px;">${p.phone}</td>
            </tr>
          </table>
          <p style="margin:0 0 24px;color:#555;font-size:14px;">Kontakt salónu: ${contact}</p>
          <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">Rezervaci můžete zrušit online nejpozději 24&nbsp;hodin před termínem — tlačítko níže.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td align="center">
              <a href="${p.cancelUrl}" style="display:inline-block;padding:14px 28px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:15px;border-radius:8px;font-family:Georgia,serif;">Zrušit rezervaci</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">Tato zpráva byla odeslána automaticky po online rezervaci.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
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

type ReservationRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service: string;
  booking_date: string;
  booking_time: string;
  barbershopName: string;
  barbershopEmail: string | null;
};

async function loadReservation(
  supabase: SupabaseClient,
  reservationId: string,
): Promise<{ row: ReservationRow | null; error?: string }> {
  const embed = "kadernictvi ( name, email )";

  const { data, error } = await supabase
    .from(REZERVACE_TABLE)
    .select(
      `id, first_name, last_name, email, phone, service, booking_date, booking_time, kadernictvi_id, ${embed}`,
    )
    .eq("id", reservationId)
    .single();

  if (error) {
    return { row: null, error: error.message };
  }

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
      barbershopName: shop?.name ?? "Studio Elegance",
      barbershopEmail: shop?.email ?? null,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const reservationId = body?.reservationId as string | undefined;
    if (!reservationId) {
      return res.status(400).json({ error: "reservationId is required" });
    }

    const supabase = createSupabaseAdmin();
    const { row, error: loadError } = await loadReservation(supabase, reservationId);

    if (!row) {
      console.error("[send-booking-email] load", loadError);
      return res.status(404).json({ error: loadError ?? "Reservation not found" });
    }

    const customerName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    const cancelUrl = buildCancelReservationUrl(req, row.id, row.booking_date, row.booking_time);
    const resend = new Resend(requireEnv("RESEND_API_KEY"));
    const from = getResendFrom(req);

    const { data: sent, error: sendErr } = await resend.emails.send({
      from,
      to: [row.email],
      subject: `Potvrzení rezervace — ${row.barbershopName}`,
      html: buildBookingConfirmationHtml({
        customerName,
        service: row.service,
        bookingDate: row.booking_date,
        bookingTime: row.booking_time,
        barbershopName: row.barbershopName,
        barbershopEmail: row.barbershopEmail,
        phone: row.phone,
        cancelUrl,
      }),
    });

    if (sendErr) {
      console.error("[send-booking-email] resend", sendErr);
      return res.status(502).json({ error: sendErr.message });
    }

    return res.status(200).json({ ok: true, id: sent?.id });
  } catch (e) {
    console.error("[send-booking-email]", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
