import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { KADERNICTVI_TABULKY, rezervaceTableFromEnv, smsTableFromEnv } from "./lib/kadernictvi-tables";

const REZERVACE_TABLE = rezervaceTableFromEnv();
const STAFF_BLOCKS_TABLE = KADERNICTVI_TABULKY.pracovnikBlokace;
const SMS_VYUCTOVANI_TABLE = smsTableFromEnv();
const DEFAULT_SMS_UNIT_COST = 1;
const DEFAULT_SMS_BILLING_MULTIPLIER = 1.6;

type RezRow = {
  id: string;
  email: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  service: string;
  booking_date: string;
  booking_time: string;
  status: string;
  duration_minutes: number | null;
  pracovnik_id: number | null;
  kadernictvi_id: number;
};

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

function timeToMinutes(time: string): number {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function normalizePhoneForBulkGate(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("420") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `420${digits.slice(1)}`;
  if (digits.length === 9) return `420${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function smsBillingAmount(shop: {
  sms_unit_cost?: number;
  sms_billing_multiplier?: number;
}): { unitCost: number; multiplier: number; amount: number } {
  const unitCost = Number(shop.sms_unit_cost) || DEFAULT_SMS_UNIT_COST;
  const multiplier = Number(shop.sms_billing_multiplier) || DEFAULT_SMS_BILLING_MULTIPLIER;
  return { unitCost, multiplier, amount: Math.round(unitCost * multiplier * 100) / 100 };
}

function buildCancelEmailHtml(p: {
  customerName: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  barbershopName: string;
  barbershopEmail?: string | null;
  staffName?: string;
  message: string;
}): string {
  const contact = p.barbershopEmail
    ? `<a href="mailto:${p.barbershopEmail}" style="color:#b8860b;">${p.barbershopEmail}</a>`
    : "viz web salónu";

  return `<!DOCTYPE html>
<html lang="cs"><body style="margin:0;padding:24px;background:#f4f1ec;font-family:Georgia,serif;">
  <table width="100%" style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:#1a1a1a;padding:24px;">
      <p style="margin:0;color:#d4af37;font-size:12px;letter-spacing:0.2em;">ZRUŠENÍ TERMÍNU</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:normal;">${p.barbershopName}</h1>
    </td></tr>
    <tr><td style="padding:24px;">
      <p style="color:#333;">Dobrý den, <strong>${p.customerName}</strong>,</p>
      <p style="color:#555;line-height:1.6;">musíme bohužel zrušit váš termín:</p>
      <p style="background:#faf8f5;border:1px solid #e8e2d9;border-radius:8px;padding:16px;color:#1a1a1a;">
        <strong>${p.service}</strong><br/>
        ${p.bookingDate} v ${p.bookingTime}
        ${p.staffName ? `<br/><span style="color:#888;font-size:13px;">u ${p.staffName}</span>` : ""}
      </p>
      <p style="color:#555;line-height:1.6;white-space:pre-wrap;">${p.message}</p>
      <p style="color:#555;font-size:14px;">Pro nový termín nás kontaktujte: ${contact}</p>
    </td></tr>
  </table>
</body></html>`;
}

async function assertStaffOrOwner(
  supabase: SupabaseClient,
  accessToken: string,
  barbershopId: number,
  staffId: number,
): Promise<{ staffName: string | null }> {
  const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
  if (userErr || !userData.user) throw new Error("Neplatné přihlášení.");

  const { data: admin, error: adminErr } = await supabase
    .from("kadernictvi_admini")
    .select("kadernictvi_id, role, pracovnik_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminErr || !admin) throw new Error("Účet není propojen s adminem salónu.");

  if (Number(admin.kadernictvi_id) !== barbershopId) {
    throw new Error("Nepovolený přístup k tomuto salónu.");
  }

  const isOwner = admin.role === "owner" || (admin.pracovnik_id == null && admin.role !== "staff");
  const adminStaffId = admin.pracovnik_id != null ? Number(admin.pracovnik_id) : null;

  if (!isOwner && adminStaffId !== staffId) {
    throw new Error("Můžete rušit jen vlastní rezervace.");
  }

  const { data: staffRow } = await supabase
    .from("kadernictvi_pracovnici")
    .select("first_name, last_name")
    .eq("id", staffId)
    .maybeSingle();

  const staffName = staffRow
    ? [staffRow.first_name, staffRow.last_name].filter(Boolean).join(" ").trim()
    : null;

  return { staffName };
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Chybí přihlášení." });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const barbershopId = Number(body?.barbershopId);
    const staffId = Number(body?.staffId);
    const blockDate = String(body?.blockDate ?? "").trim();
    const wholeDay = Boolean(body?.wholeDay);
    let startMinutes = Number(body?.startMinutes);
    let endMinutes = Number(body?.endMinutes);
    const messageRaw = String(body?.message ?? "").trim();
    const sendEmail = Boolean(body?.sendEmail);
    const sendSms = Boolean(body?.sendSms);

    if (!barbershopId || !staffId || !blockDate || !/^\d{4}-\d{2}-\d{2}$/.test(blockDate)) {
      return res.status(400).json({ error: "Vyplňte datum a údaje blokace." });
    }

    const supabase = createSupabaseAdmin();
    const { staffName } = await assertStaffOrOwner(supabase, token, barbershopId, staffId);

    if (wholeDay) {
      const { data: staffScheduleRow } = await supabase
        .from("kadernictvi_pracovnici")
        .select("work_schedule")
        .eq("id", staffId)
        .single();

      const dow = new Date(`${blockDate}T12:00:00`).getDay();
      const ws = staffScheduleRow?.work_schedule as Record<string, { open: number; close: number }> | null;
      const dayHours = ws?.[String(dow)] ?? ws?.[dow];
      if (!dayHours?.open || !dayHours?.close) {
        return res.status(400).json({
          error: "Pro celý den nastavte nejdřív pracovní dobu v rozvrhu.",
        });
      }
      startMinutes = Number(dayHours.open);
      endMinutes = Number(dayHours.close);
    }

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
      return res.status(400).json({ error: "Neplatný časový úsek." });
    }

    const defaultMessage =
      "Omlouváme se, váš termín musíme zrušit z provozních důvodů. Kontaktujte nás prosím pro nový termín.";
    const message = messageRaw || defaultMessage;

    const { data: shop } = await supabase
      .from("kadernictvi")
      .select("name, email, credit_balance, sms_unit_cost, sms_billing_multiplier")
      .eq("id", barbershopId)
      .maybeSingle();

    const { data: rezData, error: rezErr } = await supabase
      .from(REZERVACE_TABLE)
      .select(
        "id, email, phone, first_name, last_name, service, booking_date, booking_time, status, duration_minutes, pracovnik_id, kadernictvi_id",
      )
      .eq("kadernictvi_id", barbershopId)
      .eq("pracovnik_id", staffId)
      .eq("booking_date", blockDate)
      .neq("status", "canceled");

    if (rezErr) return res.status(500).json({ error: rezErr.message });

    const toCancel = (rezData ?? []).filter((r) => {
      const row = r as RezRow;
      const start = timeToMinutes(row.booking_time);
      const dur = Number(row.duration_minutes) || 60;
      return intervalsOverlap(start, start + dur, startMinutes, endMinutes);
    }) as RezRow[];

    const canceledIds: string[] = [];
    for (const r of toCancel) {
      const { error } = await supabase
        .from(REZERVACE_TABLE)
        .update({ status: "canceled" })
        .eq("id", r.id);
      if (error) return res.status(500).json({ error: error.message });
      canceledIds.push(r.id);
    }

    const blockNote = wholeDay ? `[celý den] ${message}` : message;
    const { data: blockRow, error: blockErr } = await supabase
      .from(STAFF_BLOCKS_TABLE)
      .insert({
        kadernictvi_id: barbershopId,
        pracovnik_id: staffId,
        block_date: blockDate,
        start_minutes: startMinutes,
        end_minutes: endMinutes,
        note: blockNote.slice(0, 500),
      })
      .select("id")
      .single();

    if (blockErr) {
      return res.status(500).json({ error: `Blokace: ${blockErr.message}` });
    }

    let emailsSent = 0;
    let smsSent = 0;
    const notifyErrors: string[] = [];

    const resendKey = process.env.RESEND_API_KEY?.trim();
    const resendFrom = process.env.RESEND_FROM?.trim() ?? "Studio Elegance <onboarding@resend.dev>";
    const resend = resendKey ? new Resend(resendKey) : null;

    const bulkgateId = process.env.BULKGATE_APP_ID?.trim();
    const bulkgateToken = process.env.BULKGATE_APP_TOKEN?.trim();
    const canSms = Boolean(bulkgateId && bulkgateToken && shop);

    for (const r of toCancel) {
      const customerName =
        [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "kliente";

      if (sendEmail && resend && r.email?.includes("@")) {
        const { error: mailErr } = await resend.emails.send({
          from: resendFrom,
          to: r.email,
          subject: `Zrušení termínu — ${shop?.name ?? "Studio Elegance"}`,
          html: buildCancelEmailHtml({
            customerName,
            service: r.service,
            bookingDate: r.booking_date,
            bookingTime: r.booking_time,
            barbershopName: shop?.name ?? "Studio Elegance",
            barbershopEmail: shop?.email ?? null,
            staffName: staffName ?? undefined,
            message,
          }),
        });
        if (mailErr) notifyErrors.push(`E-mail ${r.id}: ${mailErr.message}`);
        else emailsSent += 1;
      }

      if (sendSms && canSms && shop) {
        const number = normalizePhoneForBulkGate(r.phone);
        if (number) {
          const smsText = stripDiacritics(
            `${shop.name}: Vas termin ${r.booking_date} ${r.booking_time} byl zrusen. ${message}`.slice(
              0,
              459,
            ),
          );

          const { unitCost, multiplier, amount } = smsBillingAmount(shop);
          const credit = Number(shop.credit_balance) || 0;

          if (credit >= amount) {
            const bgRes = await fetch("https://portal.bulkgate.com/api/1.0/simple/transactional", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                application_id: bulkgateId,
                application_token: bulkgateToken,
                number,
                text: smsText,
                unicode: false,
                country: "cz",
                sender_id: "gText",
                sender_id_value: "s-elegance",
              }),
            });

            if (bgRes.ok) {
              await supabase.from(SMS_VYUCTOVANI_TABLE).insert({
                kadernictvi_id: barbershopId,
                pracovnik_id: r.pracovnik_id,
                rezervace_id: r.id,
                phone: r.phone,
                unit_cost: unitCost,
                billing_multiplier: multiplier,
                amount,
              });
              smsSent += 1;
            } else {
              notifyErrors.push(`SMS ${r.id}: HTTP ${bgRes.status}`);
            }
          } else {
            notifyErrors.push(`SMS ${r.id}: nedostatečný kredit`);
          }
        }
      }
    }

    return res.status(200).json({
      ok: true,
      canceledCount: canceledIds.length,
      canceledIds,
      blockId: blockRow.id,
      emailsSent,
      smsSent,
      notifyErrors: notifyErrors.length > 0 ? notifyErrors : undefined,
      wholeDay,
      startMinutes,
      endMinutes,
    });
  } catch (e) {
    console.error("[staff-bulk-cancel]", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
