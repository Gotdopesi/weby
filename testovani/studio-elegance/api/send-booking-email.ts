import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getDefaultShopName,
  sendBookingConfirmationForReservation,
} from "./lib/booking-confirmation-email";

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

    const result = await sendBookingConfirmationForReservation(
      req,
      reservationId,
      getDefaultShopName(req),
    );

    if (!result.emailSent) {
      console.warn("[send-booking-email]", result.error);
      return res.status(502).json({ ok: false, emailSent: false, error: result.error });
    }

    return res.status(200).json({ ok: true, emailSent: true, id: result.resendId });
  } catch (e) {
    console.error("[send-booking-email]", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
