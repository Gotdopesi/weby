import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { blockRangeForDate } from "@/lib/staff-block-hours";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import type { BookedInterval } from "@/lib/booking-slots";
import { timeToMinutes } from "@/lib/booking-slots";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import type { Reservation } from "@/lib/reservations-by-day";

export type StaffBlock = {
  id: number;
  pracovnik_id: number;
  block_date: string;
  start_minutes: number;
  end_minutes: number;
  note: string | null;
};

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function blockToBookedInterval(block: Pick<StaffBlock, "start_minutes" | "end_minutes">): BookedInterval {
  return {
    startMinutes: block.start_minutes,
    durationMinutes: block.end_minutes - block.start_minutes,
  };
}

export async function fetchStaffBlocksForDate(
  blockDate: string,
  barbershopId = DEFAULT_KADERNICTVI_ID,
  staffId?: number | null,
): Promise<StaffBlock[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from(KADERNICTVI_TABULKY.pracovnikBlokace)
    .select("id, pracovnik_id, block_date, start_minutes, end_minutes, note")
    .eq("kadernictvi_id", barbershopId)
    .eq("block_date", blockDate);

  if (staffId != null && staffId > 0) {
    query = query.eq("pracovnik_id", staffId);
  }

  const { data, error } = await query.order("start_minutes");
  if (error) {
    console.error("[fetchStaffBlocksForDate]", error);
    throw error;
  }

  return (data ?? []) as StaffBlock[];
}

export async function fetchStaffBlocks(
  staffId: number,
  barbershopId = DEFAULT_KADERNICTVI_ID,
  fromDate?: string,
): Promise<StaffBlock[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from(KADERNICTVI_TABULKY.pracovnikBlokace)
    .select("id, pracovnik_id, block_date, start_minutes, end_minutes, note")
    .eq("kadernictvi_id", barbershopId)
    .eq("pracovnik_id", staffId)
    .order("block_date", { ascending: true })
    .order("start_minutes", { ascending: true });

  if (fromDate) {
    query = query.gte("block_date", fromDate);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[fetchStaffBlocks]", error);
    throw error;
  }

  return (data ?? []) as StaffBlock[];
}

export async function unblockStaffSlot(blockId: number): Promise<void> {
  const { error } = await supabase.from(KADERNICTVI_TABULKY.pracovnikBlokace).delete().eq("id", blockId);
  if (error) throw error;
}

export function reservationsOverlappingRange(
  rows: Reservation[],
  blockDate: string,
  startMinutes: number,
  endMinutes: number,
): Reservation[] {
  return rows.filter((r) => {
    if (r.booking_date !== blockDate || r.status === "canceled") return false;
    const start = timeToMinutes(r.booking_time);
    const dur = Number(r.duration_minutes) || 60;
    return intervalsOverlap(start, start + dur, startMinutes, endMinutes);
  });
}

export async function cancelReservationsAndBlock(params: {
  barbershopId: number;
  staffId: number;
  blockDate: string;
  startMinutes: number;
  endMinutes: number;
  note?: string;
}): Promise<{ canceledIds: string[]; blockId: number }> {
  const { barbershopId, staffId, blockDate, startMinutes, endMinutes, note } = params;

  const { data: rezData, error: rezErr } = await supabase
    .from(REZERVACE_TABLE)
    .select("id, booking_date, booking_time, status, duration_minutes")
    .eq("kadernictvi_id", barbershopId)
    .eq("pracovnik_id", staffId)
    .eq("booking_date", blockDate)
    .neq("status", "canceled");

  if (rezErr) throw rezErr;

  const toCancel = reservationsOverlappingRange(
    (rezData ?? []) as Reservation[],
    blockDate,
    startMinutes,
    endMinutes,
  );

  const canceledIds: string[] = [];
  for (const r of toCancel) {
    const { error } = await supabase
      .from(REZERVACE_TABLE)
      .update({ status: "canceled" })
      .eq("id", r.id);
    if (error) throw error;
    canceledIds.push(r.id);
  }

  const { data: blockRow, error: blockErr } = await supabase
    .from(KADERNICTVI_TABULKY.pracovnikBlokace)
    .insert({
      kadernictvi_id: barbershopId,
      pracovnik_id: staffId,
      block_date: blockDate,
      start_minutes: startMinutes,
      end_minutes: endMinutes,
      note: note?.trim() || null,
    })
    .select("id")
    .single();

  if (blockErr) throw blockErr;

  return { canceledIds, blockId: Number(blockRow.id) };
}

export type BulkCancelResult = {
  canceledCount: number;
  canceledIds: string[];
  blockId: number;
  emailsSent: number;
  smsSent: number;
  notifyErrors?: string[];
};

export async function staffBulkCancelAndNotify(params: {
  barbershopId: number;
  staffId: number;
  blockDate: string;
  wholeDay: boolean;
  startMinutes: number;
  endMinutes: number;
  workSchedule: unknown;
  message: string;
  sendEmail: boolean;
  sendSms: boolean;
}): Promise<BulkCancelResult> {
  const range = blockRangeForDate(
    params.blockDate,
    params.workSchedule,
    params.wholeDay,
    params.startMinutes,
    params.endMinutes,
  );

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Nejste přihlášeni.");

  try {
    const res = await fetch("/api/staff-bulk-cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        barbershopId: params.barbershopId,
        staffId: params.staffId,
        blockDate: params.blockDate,
        wholeDay: params.wholeDay,
        startMinutes: range.startMinutes,
        endMinutes: range.endMinutes,
        message: params.message,
        sendEmail: params.sendEmail,
        sendSms: params.sendSms,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as BulkCancelResult & { error?: string };
    if (!res.ok) {
      throw new Error(payload.error ?? `Server vrátil ${res.status}`);
    }

    return {
      canceledCount: payload.canceledCount ?? payload.canceledIds?.length ?? 0,
      canceledIds: payload.canceledIds ?? [],
      blockId: Number(payload.blockId),
      emailsSent: payload.emailsSent ?? 0,
      smsSent: payload.smsSent ?? 0,
      notifyErrors: payload.notifyErrors,
    };
  } catch (apiErr) {
    console.warn("[staffBulkCancelAndNotify] API fallback", apiErr);
    const fallback = await cancelReservationsAndBlock({
      barbershopId: params.barbershopId,
      staffId: params.staffId,
      blockDate: params.blockDate,
      startMinutes: range.startMinutes,
      endMinutes: range.endMinutes,
      note: params.wholeDay ? `[celý den] ${params.message}` : params.message,
    });
    return {
      canceledCount: fallback.canceledIds.length,
      canceledIds: fallback.canceledIds,
      blockId: fallback.blockId,
      emailsSent: 0,
      smsSent: 0,
      notifyErrors: [
        apiErr instanceof Error
          ? `${apiErr.message} (e-mail/SMS jen na Vercelu nebo přes vercel dev)`
          : "API nedostupné",
      ],
    };
  }
}
