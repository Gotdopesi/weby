import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const ADMINI_TABLE = "kadernictvi_admini";
const KADERNICTVI_TABLE = "kadernictvi";

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
  return "https://kadernictvi.dweby.cz";
}

function getResendFrom(req: VercelRequest): string {
  if (process.env.RESEND_USE_SANDBOX?.trim() === "true") {
    return "Studio Elegance <onboarding@resend.dev>";
  }
  return (
    process.env.RESEND_FROM_KADERNICTVI?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Studio Elegance <rezervace@dweby.cz>"
  );
}

function resolveKadernictviId(req: VercelRequest): number {
  if (hostFromRequest(req).includes("donzi")) return 5;
  const fromEnv =
    process.env.KADERNICTVI_ID?.trim() ||
    process.env.VITE_KADERNICTVI_ID?.trim() ||
    process.env.VITE_BARBERSHOP_ID?.trim();
  if (fromEnv) return Number(fromEnv);
  return 1;
}

function createServiceClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readBody(req: VercelRequest): { email?: string; password?: string } {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as { email?: string; password?: string };
    } catch {
      return {};
    }
  }
  return (req.body ?? {}) as { email?: string; password?: string };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOwnerWelcomeHtml(p: {
  shopName: string;
  email: string;
  loginUrl: string;
}): string {
  const shop = escapeHtml(p.shopName);
  const mail = escapeHtml(p.email);
  const login = p.loginUrl.replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html lang="cs"><body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#d4af37,#b8860b);"></td></tr>
<tr><td style="padding:36px 32px 12px;text-align:center;">
<p style="margin:0 0 12px;font-size:11px;letter-spacing:.28em;color:#b8860b;">ADMIN PŘÍSTUP</p>
<h1 style="margin:0;font-size:28px;font-weight:normal;color:#1a1a1a;">Váš účet je připraven</h1>
</td></tr>
<tr><td style="padding:8px 32px 36px;font-size:16px;line-height:1.65;color:#3d3a36;">
<p>Dobrý den,</p>
<p>majitel admin účet pro salón <strong>${shop}</strong> byl úspěšně vytvořen.</p>
<table role="presentation" width="100%" style="margin:20px 0;border-collapse:collapse;">
<tr><td style="padding:10px 0;border-bottom:1px solid #efe9df;color:#8a847c;width:38%;">Přihlášení</td>
<td style="padding:10px 0;border-bottom:1px solid #efe9df;font-weight:bold;">${mail}</td></tr>
</table>
<p>Přihlaste se do administrace kliknutím na tlačítko níže (heslo jste zvolili při registraci).</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px auto;">
<tr><td align="center" bgcolor="#b8860b" style="border-radius:10px;">
<a href="${login}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:bold;color:#ffffff !important;text-decoration:none !important;border-radius:10px;background-color:#b8860b;">
<span style="color:#ffffff !important;">Přihlásit se do adminu</span></a>
</td></tr></table>
</td></tr></table></td></tr></table></body></html>`;
}

async function sendWelcomeEmail(
  req: VercelRequest,
  to: string,
  shopName: string,
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    console.warn("[admin/register-owner] RESEND_API_KEY missing");
    return false;
  }

  const loginUrl = `${getPublicSiteUrl(req)}/admin/login`;
  const html = buildOwnerWelcomeHtml({ shopName, email: to, loginUrl });
  const subject = `Váš admin účet — ${shopName}`;
  const resend = new Resend(resendKey);
  const from = getResendFrom(req);

  const primary = await resend.emails.send({ from, to: [to], subject, html });
  if (!primary.error) return true;

  console.warn("[admin/register-owner] resend primary failed:", primary.error.message);
  if (from.includes("onboarding@resend.dev")) return false;

  const fallback = await resend.emails.send({
    from: "Studio Elegance <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });
  if (fallback.error) {
    console.warn("[admin/register-owner] resend fallback failed:", fallback.error.message);
    return false;
  }
  return true;
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

  const { email, password } = readBody(req);
  const trimmedEmail = (email ?? "").trim().toLowerCase();

  if (!isValidEmail(trimmedEmail)) {
    return res.status(400).json({ error: "Zadejte platný e-mail." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Heslo musí mít alespoň 8 znaků." });
  }

  try {
    const admin = createServiceClient();
    const kadernictviId = resolveKadernictviId(req);

    const { count, error: countErr } = await admin
      .from(ADMINI_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("kadernictvi_id", kadernictviId);
    if (countErr) throw countErr;
    if ((count ?? 0) > 0) {
      return res.status(403).json({
        error: "Pro tento salón už existuje admin účet. Požádejte majitele o přístup.",
      });
    }

    const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw listErr;

    const existing = listed.users.find((u) => u.email?.toLowerCase() === trimmedEmail);
    let userId: string;

    if (existing) {
      const { data: linked } = await admin
        .from(ADMINI_TABLE)
        .select("id")
        .eq("user_id", existing.id)
        .maybeSingle();
      if (linked?.id) {
        return res.status(409).json({ error: "Tento e-mail je už použitý u jiného salónu." });
      }
      userId = existing.id;
      const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updateErr) throw updateErr;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      userId = data.user.id;
    }

    const { error: linkErr } = await admin.from(ADMINI_TABLE).insert({
      kadernictvi_id: kadernictviId,
      user_id: userId,
      login_label: "majitel",
      role: "owner",
      pracovnik_id: null,
    });
    if (linkErr) throw linkErr;

    const { data: shop } = await admin
      .from(KADERNICTVI_TABLE)
      .select("name")
      .eq("id", kadernictviId)
      .maybeSingle();

    const emailSent = await sendWelcomeEmail(req, trimmedEmail, shop?.name ?? "Salón");

    return res.status(200).json({ ok: true, emailSent });
  } catch (e) {
    console.error("[admin/register-owner]", e);
    return res.status(500).json({ error: "Založení účtu se nezdařilo. Zkuste to znovu." });
  }
}
