import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Health check — ověří, že Vercel API vůbec běží. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    service: "weby-api",
    hasResendKey: Boolean(process.env.RESEND_API_KEY?.trim()),
    hasSupabaseService: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    ts: new Date().toISOString(),
  });
}
