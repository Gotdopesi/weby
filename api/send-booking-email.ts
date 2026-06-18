import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";

const REZERVACE_TABLE = "kadernictvi_rezervace";

function hostFromRequest(req: VercelRequest): string {
  return (req.headers.host ?? "").split(":")[0].toLowerCase();
}

function getPublicSiteUrl(req: VercelRequest): string {
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

function getResendFrom(req: VercelRequest): string {
  if (process.env.RESEND_USE_SANDBOX?.trim() === "true") {
    return "Studio Elegance <onboarding@resend.dev>";
  }
  const host = hostFromRequest(req);
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
    "Studio Elegance <onboarding@resend.dev>"
  );
}

function getDefaultShopName(req: VercelRequest): string {
  if (hostFromRequest(req).includes("donzi")) return "Barbershop Donzi";
  return "Studio Elegance";
}

function cancelSecretOptional(): string | null {
  return process.env.CANCEL_SECRET?.trim() || process.env.CRON_SECRET?.trim() || null;
}

function newCancelCode(): string {
  return randomBytes(9).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
}

async function ensureCancelCode(
  supabase: SupabaseClient,
  reservationId: string,
): Promise<string | null> {
  if (!cancelSecretOptional()) return null;

  const { data: existing } = await supabase
    .from(REZERVACE_TABLE)
    .select("cancel_code")
    .eq("id", reservationId)
    .maybeSingle();

  if (existing?.cancel_code) return String(existing.cancel_code);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCancelCode();
    const { error } = await supabase
      .from(REZERVACE_TABLE)
      .update({ cancel_code: code })
      .eq("id", reservationId)
      .is("cancel_code", null);
    if (!error) return code;

    const { data: retry } = await supabase
      .from(REZERVACE_TABLE)
      .select("cancel_code")
      .eq("id", reservationId)
      .maybeSingle();
    if (retry?.cancel_code) return String(retry.cancel_code);
  }
  return null;
}

function buildCancelReservationUrl(req: VercelRequest, cancelCode: string): string {
  return `${getPublicSiteUrl(req)}/zrusit-rezervaci?k=${encodeURIComponent(cancelCode)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailButton(href: string, label: string): string {
  const safeHref = href.replace(/"/g, "&quot;");
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:24px auto 8px;">
<tr><td align="center" bgcolor="#1a1a1a" style="border-radius:10px;">
<a href="${safeHref}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:bold;color:#ffffff !important;text-decoration:none !important;border-radius:10px;background-color:#1a1a1a;">
<span style="color:#ffffff !important;">${safeLabel}</span></a>
</td></tr></table>`;
}

function buildBookingConfirmationHtml(p: {
  customerName: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  barbershopName: string;
  barbershopEmail?: string | null;
  phone: string;
  cancelUrl: string | null;
}): string {
  const contact = p.barbershopEmail
    ? `<a href="mailto:${escapeHtml(p.barbershopEmail)}" style="color:#b8860b;text-decoration:none;">${escapeHtml(p.barbershopEmail)}</a>`
    : "viz web salónu";
  const cancelBlock = p.cancelUrl
    ? `<p style="margin:24px 0 0;text-align:center;color:#5c574f;font-size:14px;">Rezervaci můžete zrušit online nejpozději <strong>24&nbsp;hodin</strong> před termínem.</p>
${emailButton(p.cancelUrl, "Zrušit rezervaci")}`
    : "";

  return `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#d4af37,#b8860b);"></td></tr>
<tr><td style="padding:36px 32px 12px;text-align:center;">
<p style="margin:0 0 12px;font-size:11px;letter-spacing:.28em;color:#b8860b;">POTVRZENÍ REZERVACE</p>
<h1 style="margin:0;font-size:28px;font-weight:normal;color:#1a1a1a;">${escapeHtml(p.barbershopName)}</h1>
</td></tr>
<tr><td style="padding:8px 32px 36px;font-size:16px;line-height:1.65;color:#3d3a36;">
<p>Dobrý den, <strong>${escapeHtml(p.customerName)}</strong>,</p>
<p>děkujeme za rezervaci. Těšíme se na vás.</p>
<table role="presentation" width="100%" style="margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;width:38%;">Služba</td>
<td style="padding:10px 0;border-bottom:1px solid #efe9df;font-weight:bold;">${escapeHtml(p.service)}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;">Datum</td>
<td style="padding:10px 0;border-bottom:1px solid #efe9df;font-weight:bold;">${escapeHtml(p.bookingDate)}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;">Čas</td>
<td style="padding:10px 0;border-bottom:1px solid #efe9df;font-weight:bold;">${escapeHtml(p.bookingTime)}</td></tr>
<tr><td style="padding:10px 0;color:#8a847c;">Telefon</td>
<td style="padding:10px 0;">${escapeHtml(p.phone)}</td></tr>
</table>
<p style="font-size:14px;color:#5c574f;">Kontakt salónu: ${contact}</p>
${cancelBlock}
</td></tr></table></td></tr></table></body></html>`;
}

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

async function sendViaResend(
  req: VercelRequest,
  to: string,
  subject: string,
  html: string,
) {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const fromCandidates = [
    getResendFrom(req),
    process.env.RESEND_FROM_KADERNICTVI?.trim(),
    process.env.RESEND_FROM_DONZI?.trim(),
    process.env.RESEND_FROM?.trim(),
  ].filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i) as string[];

  let lastError: { message: string } | null = null;
  for (const from of fromCandidates) {
    const result = await resend.emails.send({ from, to: [to], subject, html });
    if (!result.error) return result;
    lastError = result.error;
    console.warn("[send-booking-email] resend failed:", from, result.error.message);
  }

  // Sandbox jen při explicitním RESEND_USE_SANDBOX — jinak by šly maily jen na účet v Resend.
  if (process.env.RESEND_USE_SANDBOX?.trim() === "true") {
    return resend.emails.send({
      from: "Studio Elegance <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });
  }

  return { data: null, error: lastError ?? { message: "Resend send failed" } };
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

    const cancelCode = await ensureCancelCode(supabase, row.id);
    const cancelUrl = cancelCode ? buildCancelReservationUrl(req, cancelCode) : null;
    const customerName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();

    const { data: sent, error: sendErr } = await sendViaResend(
      req,
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

    return res.status(200).json({ ok: true, id: sent?.id });
  } catch (e) {
    console.error("[send-booking-email]", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
