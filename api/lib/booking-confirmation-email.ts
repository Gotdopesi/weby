import type { VercelRequest } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { Resend } from "resend";

const REZERVACE_TABLE = "kadernictvi_rezervace";

export type BookingConfirmationPayload = {
  customerName: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  barbershopName: string;
  barbershopEmail?: string | null;
  phone: string;
  cancelUrl: string | null;
};

function hostFromRequest(req?: VercelRequest): string {
  return ((req?.headers?.host ?? "") as string).split(":")[0].toLowerCase();
}

export function getPublicSiteUrl(req?: VercelRequest): string {
  const host = hostFromRequest(req);
  if (host && !host.includes("vercel.app")) return `https://${host}`;
  const fromEnv = process.env.SITE_URL_KADERNICTVI?.trim() || process.env.SITE_URL?.trim();
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

function cancelSecret(): string | null {
  return process.env.CANCEL_SECRET?.trim() || process.env.CRON_SECRET?.trim() || null;
}

function normalizeBookingTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time.trim();
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function buildCancelReservationUrl(
  req: VercelRequest | undefined,
  reservationId: string,
  bookingDate: string,
  bookingTime: string,
): string | null {
  const secret = cancelSecret();
  if (!secret) return null;

  const time = normalizeBookingTime(bookingTime);
  const payload = `${reservationId}|${bookingDate}|${time}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${sig}`).toString("base64url");
  const base = `${getPublicSiteUrl(req)}/zrusit-rezervaci?token=${encodeURIComponent(token)}`;

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (!bypass) return base;
  const u = new URL(base);
  u.searchParams.set("x-vercel-protection-bypass", bypass);
  u.searchParams.set("x-vercel-set-bypass-cookie", "true");
  return u.toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildBookingConfirmationHtml(p: BookingConfirmationPayload): string {
  const contact = p.barbershopEmail
    ? `<a href="mailto:${escapeHtml(p.barbershopEmail)}" style="color:#b8860b;text-decoration:underline;">${escapeHtml(p.barbershopEmail)}</a>`
    : "viz web salónu";

  const cancelBlock = p.cancelUrl
    ? `<div style="margin:24px 0;padding:20px;background:#faf8f5;border:1px solid #e8e2d9;border-radius:10px;">
        <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a;font-weight:bold;">Zrušení rezervace</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5c574f;">
          Rezervaci můžete zrušit online nejpozději <strong>24 hodin</strong> před termínem.
        </p>
        <p style="margin:0 0 16px;text-align:center;">
          <a href="${p.cancelUrl.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 28px;background:#b8860b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;border-radius:8px;">
            Zrušit rezervaci
          </a>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#5c574f;word-break:break-all;">
          Nebo zkopírujte odkaz do prohlížeče:<br/>
          <a href="${p.cancelUrl.replace(/"/g, "&quot;")}" style="color:#b8860b;text-decoration:underline;">${escapeHtml(p.cancelUrl)}</a>
        </p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Potvrzení rezervace</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Potvrzení rezervace — ${escapeHtml(p.service)}, ${escapeHtml(p.bookingDate)} ${escapeHtml(p.bookingTime)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
        <tr><td style="height:4px;background:#b8860b;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px 28px 12px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:.28em;color:#b8860b;">POTVRZENÍ REZERVACE</p>
          <h1 style="margin:0;font-size:26px;font-weight:normal;color:#1a1a1a;">${escapeHtml(p.barbershopName)}</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.65;color:#3d3a36;">
          <p style="margin:0 0 12px;">Dobrý den, <strong>${escapeHtml(p.customerName)}</strong>,</p>
          <p style="margin:0 0 20px;">děkujeme za rezervaci. Těšíme se na vás.</p>
          <table role="presentation" width="100%" style="margin:0 0 8px;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;width:38%;">Služba</td>
                <td style="padding:10px 0;border-bottom:1px solid #efe9df;font-weight:bold;">${escapeHtml(p.service)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;">Datum</td>
                <td style="padding:10px 0;border-bottom:1px solid #efe9df;font-weight:bold;">${escapeHtml(p.bookingDate)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;">Čas</td>
                <td style="padding:10px 0;border-bottom:1px solid #efe9df;font-weight:bold;">${escapeHtml(p.bookingTime)}</td></tr>
            <tr><td style="padding:10px 0;color:#8a847c;">Telefon</td>
                <td style="padding:10px 0;">${escapeHtml(p.phone)}</td></tr>
          </table>
          ${cancelBlock}
          <p style="margin:20px 0 0;font-size:14px;color:#5c574f;">Kontakt salónu: ${contact}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildBookingConfirmationText(p: BookingConfirmationPayload): string {
  const lines = [
    `Potvrzení rezervace — ${p.barbershopName}`,
    "",
    `Dobrý den, ${p.customerName},`,
    "děkujeme za rezervaci. Těšíme se na vás.",
    "",
    `Služba: ${p.service}`,
    `Datum: ${p.bookingDate}`,
    `Čas: ${p.bookingTime}`,
    `Telefon: ${p.phone}`,
    "",
  ];
  if (p.cancelUrl) {
    lines.push("Rezervaci můžete zrušit online nejpozději 24 hodin před termínem:");
    lines.push(p.cancelUrl);
    lines.push("");
  }
  if (p.barbershopEmail) lines.push(`Kontakt salónu: ${p.barbershopEmail}`);
  return lines.join("\n");
}

function getResendFromCandidates(req?: VercelRequest): string[] {
  const host = hostFromRequest(req);
  const primary =
    host.includes("donzi")
      ? process.env.RESEND_FROM_DONZI?.trim() || "Donzi <rezervace@dweby.cz>"
      : process.env.RESEND_FROM_KADERNICTVI?.trim() || "Studio Elegance <rezervace@dweby.cz>";

  return [
    primary,
    process.env.RESEND_FROM_KADERNICTVI?.trim(),
    process.env.RESEND_FROM_DONZI?.trim(),
    process.env.RESEND_FROM?.trim(),
  ].filter((v, i, arr) => Boolean(v) && !String(v).includes("onboarding@resend.dev") && arr.indexOf(v) === i) as string[];
}

export async function sendBookingConfirmationViaResend(
  req: VercelRequest | undefined,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ emailSent: boolean; error?: string; resendId?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { emailSent: false, error: "Chybí RESEND_API_KEY." };

  const resend = new Resend(apiKey);
  const fromCandidates = getResendFromCandidates(req);
  if (fromCandidates.length === 0) {
    return { emailSent: false, error: "Není nastaven ověřený odesílatel (rezervace@dweby.cz)." };
  }

  let lastError = "Odeslání e-mailu se nezdařilo.";
  for (const from of fromCandidates) {
    const result = await resend.emails.send({ from, to: [to], subject, html, text });
    if (!result.error) {
      return { emailSent: true, resendId: result.data?.id };
    }
    lastError = result.error.message;
    console.warn("[booking-email] resend failed:", from, result.error.message);
  }

  return { emailSent: false, error: lastError };
}

export function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function loadReservationForEmail(
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

export async function sendBookingConfirmationForReservation(
  req: VercelRequest | undefined,
  reservationId: string,
  defaultShopName: string,
): Promise<{ emailSent: boolean; error?: string; resendId?: string }> {
  const supabase = createSupabaseAdmin();
  const { row, error: loadError } = await loadReservationForEmail(supabase, reservationId, defaultShopName);
  if (!row) return { emailSent: false, error: loadError ?? "Rezervace nenalezena." };

  const customerName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  const cancelUrl = buildCancelReservationUrl(req, row.id, row.booking_date, row.booking_time);
  const payload: BookingConfirmationPayload = {
    customerName,
    service: row.service,
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    barbershopName: row.barbershopName,
    barbershopEmail: row.barbershopEmail,
    phone: row.phone,
    cancelUrl,
  };

  return sendBookingConfirmationViaResend(
    req,
    row.email,
    `Potvrzení rezervace — ${row.barbershopName}`,
    buildBookingConfirmationHtml(payload),
    buildBookingConfirmationText(payload),
  );
}

export function getDefaultShopName(req?: VercelRequest): string {
  return hostFromRequest(req).includes("donzi") ? "Barbershop Donzi" : "Studio Elegance";
}
