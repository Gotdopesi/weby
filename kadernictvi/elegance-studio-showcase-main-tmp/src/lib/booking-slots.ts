import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import { BOOKING_SLOT_STEP_MINUTES, getOpeningHoursForDay } from "@/lib/opening-hours";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { blockToBookedInterval, fetchStaffBlocksForDate } from "@/lib/staff-blocks";
import { hoursForStaffOnDay, type StaffWeeklySchedule } from "@/lib/staff-schedule";

/** Po–Pá 9:00–19:00, So 9:00–14:00 — sloty po 30 min, pauza 12:00–13:30. */
const WEEKDAY_OPEN = 9 * 60;
const WEEKDAY_CLOSE = 19 * 60;
const SATURDAY_CLOSE = 14 * 60;
const LUNCH_START = 12 * 60;
const LUNCH_END = 13 * 60 + 30;
const SLOT_STEP = 30;

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

/** Všechny startovní časy pro daný den (Date.getDay(): 0=neděle, 6=sobota). */
export function getBookingTimesForDay(day: Date, staffSchedule?: StaffWeeklySchedule | null): string[] {
  const hours = staffSchedule
    ? hoursForStaffOnDay(day, staffSchedule)
    : getOpeningHoursForDay(day);
  if (!hours) return [];

  const times: string[] = [];
  for (let m = hours.open; m < hours.close; m += SLOT_STEP) {
    if (m >= LUNCH_START && m < LUNCH_END) continue;
    times.push(minutesToTime(m));
  }

  return times;
}

function closeMinutesForDay(day: Date, staffSchedule?: StaffWeeklySchedule | null): number {
  const hours = staffSchedule
    ? hoursForStaffOnDay(day, staffSchedule)
    : getOpeningHoursForDay(day);
  if (!hours) return 0;
  return hours.close;
}

/** @deprecated použij getBookingTimesForDay */
export const ALL_BOOKING_TIMES = getBookingTimesForDay(new Date(2026, 0, 5));

function intervalsOverlap(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
  return aStart < bStart + bDur && aStart + aDur > bStart;
}

function fitsInDay(startMinutes: number, durationMinutes: number, closeMinutes: number): boolean {
  let remaining = durationMinutes;
  let cursor = startMinutes;

  while (remaining > 0) {
    if (cursor >= LUNCH_START && cursor < LUNCH_END) {
      cursor = LUNCH_END;
      continue;
    }
    if (cursor >= closeMinutes) return false;
    const untilLunch = cursor < LUNCH_START ? LUNCH_START - cursor : Infinity;
    const untilClose = closeMinutes - cursor;
    const chunk = Math.min(remaining, untilLunch, untilClose);
    if (chunk <= 0) return false;
    remaining -= chunk;
    cursor += chunk;
  }

  return true;
}

/** Volné startovní časy — respektuje délku služby a existující rezervace. */
export function filterAvailableStartTimes(
  day: Date,
  durationMinutes: number,
  booked: BookedInterval[],
  now = new Date(),
  staffSchedule?: StaffWeeklySchedule | null,
): string[] {
  const close = closeMinutesForDay(day, staffSchedule);
  if (close <= 0) return [];
  const candidates = getBookingTimesForDay(day, staffSchedule);

  return candidates.filter((slot) => {
    const start = timeToMinutes(slot);

    if (isSameDayPastSlot(day, slot, now)) return false;
    if (!fitsInDay(start, durationMinutes, close)) return false;

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

/** Načte obsazené intervaly včetně délky služby z DB. */
export async function fetchBookedIntervalsForDate(
  bookingDate: string,
  barbershopId = DEFAULT_BARBERSHOP_ID,
  staffId?: number | null,
): Promise<BookedInterval[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from(REZERVACE_TABLE)
    .select("booking_time, duration_minutes, staff_id")
    .eq("booking_date", bookingDate)
    .eq("barbershop_id", barbershopId)
    .neq("status", "canceled");

  if (staffId != null && staffId > 0) {
    query = query.eq("staff_id", staffId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchBookedIntervalsForDate]", error);
    throw error;
  }

  const fromReservations = (data ?? []).map((row) => {
    const r = row as { booking_time: string; duration_minutes: number | null };
    return {
      startMinutes: timeToMinutes(r.booking_time),
      durationMinutes: Number(r.duration_minutes) || 60,
    };
  });

  try {
    const blocks = await fetchStaffBlocksForDate(bookingDate, barbershopId, staffId);
    const fromBlocks = blocks.map(blockToBookedInterval);
    return [...fromReservations, ...fromBlocks];
  } catch (e) {
    console.warn("[fetchBookedIntervalsForDate] blocks", e);
    return fromReservations;
  }
}

/** @deprecated */
export async function fetchBookedTimesForDate(bookingDate: string): Promise<string[]> {
  const intervals = await fetchBookedIntervalsForDate(bookingDate);
  return intervals.map((i) => minutesToTime(i.startMinutes));
}

/** Časové řádky pro týdenní admin mřížku. */
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
