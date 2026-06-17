import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const ADMINI_TABLE = "kadernictvi_admini";

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

function resolveKadernictviId(req: VercelRequest): number {
  if (hostFromRequest(req).includes("donzi")) return 5;
  const fromEnv =
    process.env.KADERNICTVI_ID?.trim() ||
    process.env.VITE_KADERNICTVI_ID?.trim() ||
    process.env.VITE_BARBERSHOP_ID?.trim();
  if (fromEnv) return Number(fromEnv);
  return hostFromRequest(req).includes("kadernictvi") ? 6 : 1;
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

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createServiceClient>,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email);
  return user?.id ?? null;
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

    const redirectTo = `${getPublicSiteUrl(req)}/admin/reset-password`;
    const { error: resetErr } = await admin.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });
    if (resetErr) throw resetErr;

    return res.status(200).json({ ok: true, sent: true });
  } catch (e) {
    console.error("[admin/request-password-reset]", e);
    return res.status(500).json({ error: "Odeslání e-mailu se nezdařilo. Zkuste to znovu." });
  }
}
