import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const ADMINI_TABLE = "kadernictvi_admini";

function hostFromRequest(req: VercelRequest): string {
  return (req.headers.host ?? "").split(":")[0].toLowerCase();
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const admin = createServiceClient();
    const kadernictviId = resolveKadernictviId(req);
    const { count, error } = await admin
      .from(ADMINI_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("kadernictvi_id", kadernictviId);
    if (error) throw error;
    return res.status(200).json({
      canRegister: (count ?? 0) === 0,
      kadernictviId,
    });
  } catch (e) {
    console.error("[admin/bootstrap-status]", e);
    return res.status(500).json({ error: "Nepodařilo se ověřit stav účtů." });
  }
}
