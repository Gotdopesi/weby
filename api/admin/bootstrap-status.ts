import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  countAdminsForShop,
  createServiceClient,
  resolveKadernictviId,
} from "../lib/admin-bootstrap";

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
    const count = await countAdminsForShop(admin, kadernictviId);
    return res.status(200).json({
      canRegister: count === 0,
      kadernictviId,
    });
  } catch (e) {
    console.error("[admin/bootstrap-status]", e);
    return res.status(500).json({ error: "Nepodařilo se ověřit stav účtů." });
  }
}
