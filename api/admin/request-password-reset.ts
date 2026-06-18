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
  const raw = process.env.SITE_URL?.trim() || process.env.SITE_URL_KADERNICTVI?.trim();
  if (raw) {
    try {
      return new URL(raw.startsWith("http") ? raw : `https://${raw}`).origin;
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
  const host = hostFromRequest(req);
  if (host.includes("donzi")) {
    return process.env.RESEND_FROM_DONZI?.trim() || process.env.RESEND_FROM?.trim() || "Donzi <onboarding@resend.dev>";
  }
  return (
    process.env.RESEND_FROM_KADERNICTVI?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Studio Elegance <onboarding@resend.dev>"
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

function readBody(req: VercelRequest): { email?: string } {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as { email?: string };
    } catch {
      return {};
    }
  }
  return (req.body ?? {}) as { email?: string };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPasswordResetHtml(shopName: string, actionLink: string): string {
  const title = escapeHtml(shopName);
  const href = actionLink.replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html lang="cs"><body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#d4af37,#b8860b);"></td></tr>
<tr><td style="padding:36px 32px;text-align:center;">
<p style="margin:0 0 12px;font-size:11px;letter-spacing:.28em;color:#b8860b;">ADMIN PŘÍSTUP</p>
<h1 style="margin:0;font-size:26px;font-weight:normal;color:#1a1a1a;">Obnovení hesla</h1>
</td></tr>
<tr><td style="padding:0 32px 36px;font-size:16px;line-height:1.65;color:#3d3a36;">
<p>Dobrý den,</p>
<p>obdrželi jsme žádost o změnu hesla k admin účtu salónu <strong>${title}</strong>.</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px auto;">
<tr><td align="center" bgcolor="#b8860b" style="border-radius:10px;">
<a href="${href}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:bold;color:#ffffff !important;text-decoration:none !important;border-radius:10px;background-color:#b8860b;">
<span style="color:#ffffff !important;">Nastavit nové heslo</span>
</a>
</td></tr>
</table>
<p style="font-size:13px;color:#9a948c;text-align:center;">Pokud jste o změnu nežádali, tento e-mail ignorujte.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createServiceClient>,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email);
  return user?.id ?? null;
}

async function sendViaResend(
  req: VercelRequest,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) return false;

  const resend = new Resend(resendKey);
  const from = getResendFrom(req);
  const primary = await resend.emails.send({ from, to: [to], subject, html });
  if (!primary.error) return true;

  console.warn("[admin/request-password-reset] resend primary failed:", primary.error.message);
  if (from.includes("onboarding@resend.dev")) return false;

  const fallback = await resend.emails.send({
    from: "Studio Elegance <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });
  if (fallback.error) {
    console.warn("[admin/request-password-reset] resend fallback failed:", fallback.error.message);
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

  const trimmedEmail = (readBody(req).email ?? "").trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) {
    return res.status(400).json({ error: "Zadejte platný e-mail." });
  }

  try {
    const admin = createServiceClient();
    const kadernictviId = resolveKadernictviId(req);
    const userId = await findAuthUserIdByEmail(admin, trimmedEmail);

    if (!userId) {
      return res.status(404).json({
        error: "Tento e-mail není registrovaný u tohoto salónu.",
      });
    }

    const { data: link, error: linkErr } = await admin
      .from(ADMINI_TABLE)
      .select("id")
      .eq("kadernictvi_id", kadernictviId)
      .eq("user_id", userId)
      .maybeSingle();
    if (linkErr) throw linkErr;

    if (!link?.id) {
      return res.status(404).json({
        error: "Tento e-mail není registrovaný u tohoto salónu.",
      });
    }

    const { data: shop } = await admin
      .from(KADERNICTVI_TABLE)
      .select("name")
      .eq("id", kadernictviId)
      .maybeSingle();

    const shopName = shop?.name ?? "Salón";
    const redirectTo = `${getPublicSiteUrl(req)}/admin/reset-password`;
    const subject = `Obnovení hesla — ${shopName}`;

    const { data: linkData, error: genErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: trimmedEmail,
      options: { redirectTo },
    });

    if (!genErr && linkData?.properties?.action_link) {
      const html = buildPasswordResetHtml(shopName, linkData.properties.action_link);
      const sent = await sendViaResend(req, trimmedEmail, subject, html);
      if (sent) {
        return res.status(200).json({ ok: true, sent: true, channel: "resend" });
      }
    } else if (genErr) {
      console.warn("[admin/request-password-reset] generateLink failed:", genErr.message);
    }

    const { error: resetErr } = await admin.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
    if (resetErr) throw resetErr;

    return res.status(200).json({ ok: true, sent: true, channel: "supabase" });
  } catch (e) {
    console.error("[admin/request-password-reset]", e);
    return res.status(500).json({ error: "Odeslání e-mailu se nezdařilo. Zkuste to znovu." });
  }
}
