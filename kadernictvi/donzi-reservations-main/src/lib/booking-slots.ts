import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import {
  BOOKING_SLOT_STEP_MINUTES,
  getOpeningHoursForDay,
} from "@/lib/opening-hours";
import { REZERVACE_TABLE } from "@/lib/rezervace";

export type BookedInterval = {
  startMinutes: number;
  durationMinutes: number;
};

export function normalizeBookingTime(time: string): string {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time.trim();
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = normalizeBookingTime(time).split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Startovní časy podle otevírací doby salónu (Donzi). */
export function getBookingTimesForDay(day: Date): string[] {
  const hours = getOpeningHoursForDay(day);
  if (!hours) return [];

  const times: string[] = [];
  for (let m = hours.open; m < hours.close; m += BOOKING_SLOT_STEP_MINUTES) {
    times.push(minutesToTime(m));
  }
  return times;
}

export const ALL_BOOKING_TIMES = getBookingTimesForDay(new Date(2026, 0, 5));

function intervalsOverlap(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
  return aStart < bStart + bDur && aStart + aDur > bStart;
}

function fitsInDay(startMinutes: number, durationMinutes: number, closeMinutes: number): boolean {
  return startMinutes + durationMinutes <= closeMinutes;
}

/** Volné startovní časy — respektuje délku služby a existující rezervace. */
export function filterAvailableStartTimes(
  day: Date,
  durationMinutes: number,
  booked: BookedInterval[],
  now = new Date(),
): string[] {
  const hours = getOpeningHoursForDay(day);
  if (!hours) return [];

  const candidates = getBookingTimesForDay(day);

  return candidates.filter((slot) => {
    const start = timeToMinutes(slot);

    if (isSameDayPastSlot(day, slot, now)) return false;
    if (!fitsInDay(start, durationMinutes, hours.close)) return false;

    for (const b of booked) {
      if (intervalsOverlap(start, durationMinutes, b.startMinutes, b.durationMinutes)) {
        return false;
      }
    }

    return true;
  });
}

function isSameDayPastSlot(day: Date, slot: string, now: Date): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selected = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  if (today.getTime() !== selected.getTime()) return false;

  const [h, m] = slot.split(":").map(Number);
  const slotDate = new Date(day);
  slotDate.setHours(h, m, 0, 0);
  return slotDate.getTime() < now.getTime();
}

export async function fetchBookedIntervalsForDate(
  bookingDate: string,
  barbershopId = DEFAULT_BARBERSHOP_ID,
): Promise<BookedInterval[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from(REZERVACE_TABLE)
    .select("booking_time, duration_minutes")
    .eq("booking_date", bookingDate)
    .eq("barbershop_id", barbershopId)
    .neq("status", "canceled");

  if (error) {
    console.error("[fetchBookedIntervalsForDate]", error);
    throw error;
  }

  return (data ?? []).map((row) => {
    const r = row as { booking_time: string; duration_minutes: number | null };
    return {
      startMinutes: timeToMinutes(r.booking_time),
      durationMinutes: Number(r.duration_minutes) || 60,
    };
  });
}

export async function fetchBookedTimesForDate(bookingDate: string): Promise<string[]> {
  const intervals = await fetchBookedIntervalsForDate(bookingDate);
  return intervals.map((i) => minutesToTime(i.startMinutes));
}

/** Časové řádky pro týdenní mřížku (union otevírací doby v týdnu). */
export function getTimeSlotsForWeek(weekDays: Date[]): string[] {
  let minOpen = 24 * 60;
  let maxClose = 0;
  for (const d of weekDays) {
    const h = getOpeningHoursForDay(d);
    if (!h) continue;
    minOpen = Math.min(minOpen, h.open);
    maxClose = Math.max(maxClose, h.close);
  }
  if (maxClose <= minOpen) return [];
  const slots: string[] = [];
  for (let m = minOpen; m < maxClose; m += BOOKING_SLOT_STEP_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
}
