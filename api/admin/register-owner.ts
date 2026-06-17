import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createServiceClient,
  isValidEmail,
  isValidPassword,
  registerOwnerAccount,
  resolveKadernictviId,
} from "../lib/admin-bootstrap";

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
  const trimmedEmail = (email ?? "").trim();

  if (!isValidEmail(trimmedEmail)) {
    return res.status(400).json({ error: "Zadejte platný e-mail." });
  }
  if (!isValidPassword(password ?? "")) {
    return res.status(400).json({ error: "Heslo musí mít alespoň 8 znaků." });
  }

  try {
    const admin = createServiceClient();
    const kadernictviId = resolveKadernictviId(req);
    await registerOwnerAccount(admin, kadernictviId, trimmedEmail, password!);
    return res.status(200).json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "BOOTSTRAP_CLOSED") {
      return res.status(403).json({
        error: "Pro tento salón už existuje admin účet. Požádejte majitele o přístup.",
      });
    }
    if (msg === "EMAIL_IN_USE") {
      return res.status(409).json({ error: "Tento e-mail je už použitý u jiného salónu." });
    }
    console.error("[admin/register-owner]", e);
    return res.status(500).json({ error: "Založení účtu se nezdařilo. Zkuste to znovu." });
  }
}
