import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const ADMINI_TABLE = "kadernictvi_admini";

function createServiceClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function resolveKadernictviId(): number {
  const fromEnv =
    process.env.KADERNICTVI_ID?.trim() ||
    process.env.VITE_KADERNICTVI_ID?.trim() ||
    process.env.VITE_BARBERSHOP_ID?.trim();
  return fromEnv ? Number(fromEnv) : 1;
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
    const kadernictviId = resolveKadernictviId();

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

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[admin/register-owner]", e);
    return res.status(500).json({ error: "Založení účtu se nezdařilo. Zkuste to znovu." });
  }
}
