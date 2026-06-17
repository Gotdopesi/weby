import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import { BOOKING_SLOT_STEP_MINUTES, getOpeningHoursForDay } from "@/lib/opening-hours";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { blockToBookedInterval, fetchStaffBlocksForDate, type StaffBlock } from "@/admin/templates/staff/lib/staff-blocks";
import {
  hoursForStaffOnDay,
  parseStaffWorkSchedule,
  type StaffWeeklySchedule,
} from "@/lib/staff-schedule";
import type { StaffMember } from "@/lib/staff";

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

export type BookedIntervalWithStaff = BookedInterval & {
  staffId: number | null;
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

function mapReservationRow(row: {
  booking_time: string;
  duration_minutes: number | null;
  pracovnik_id: number | null;
}): BookedIntervalWithStaff {
  return {
    startMinutes: timeToMinutes(row.booking_time),
    durationMinutes: Number(row.duration_minutes) || 60,
    staffId: row.pracovnik_id != null ? Number(row.pracovnik_id) : null,
  };
}

function blocksForStaff(blocks: StaffBlock[], staffId: number): BookedInterval[] {
  return blocks
    .filter((b) => b.pracovnik_id === staffId)
    .map(blockToBookedInterval);
}

function reservationsForStaff(
  rows: BookedIntervalWithStaff[],
  staffId: number,
): BookedInterval[] {
  return rows
    .filter((r) => r.staffId == null || r.staffId === staffId)
    .map(({ startMinutes, durationMinutes }) => ({ startMinutes, durationMinutes }));
}

/** Volné časy, když klient nevybral konkrétního kadeřníka — stačí, že je volný kdokoli z týmu. */
export function filterAvailableStartTimesAnyStaff(
  day: Date,
  durationMinutes: number,
  staffMembers: StaffMember[],
  booked: BookedIntervalWithStaff[],
  blocks: StaffBlock[],
  now = new Date(),
): string[] {
  if (staffMembers.length === 0) {
    const legacy = booked.map(({ startMinutes, durationMinutes }) => ({ startMinutes, durationMinutes }));
    return filterAvailableStartTimes(day, durationMinutes, legacy, now, null);
  }

  const candidates = new Set<string>();
  for (const member of staffMembers) {
    const schedule = parseStaffWorkSchedule(member.work_schedule);
    for (const slot of getBookingTimesForDay(day, schedule)) {
      candidates.add(slot);
    }
  }

  return Array.from(candidates)
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    .filter((slot) =>
      staffMembers.some((member) => {
        const schedule = parseStaffWorkSchedule(member.work_schedule);
        const intervals = [
          ...reservationsForStaff(booked, member.id),
          ...blocksForStaff(blocks, member.id),
        ];
        return filterAvailableStartTimes(day, durationMinutes, intervals, now, schedule).includes(
          slot,
        );
      }),
    );
}

/** Načte obsazené intervaly včetně délky služby z DB. */
export async function fetchBookedIntervalsForDate(
  bookingDate: string,
  barbershopId = DEFAULT_KADERNICTVI_ID,
  staffId?: number | null,
): Promise<BookedInterval[]> {
  const detailed = await fetchBookedIntervalsWithStaffForDate(bookingDate, barbershopId, staffId);
  return detailed.map(({ startMinutes, durationMinutes }) => ({ startMinutes, durationMinutes }));
}

/** Rezervace + staff_id (null = starší záznam bez kadeřníka → blokuje celý salón). */
export async function fetchBookedIntervalsWithStaffForDate(
  bookingDate: string,
  barbershopId = DEFAULT_KADERNICTVI_ID,
  staffId?: number | null,
): Promise<BookedIntervalWithStaff[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from(REZERVACE_TABLE)
    .select("booking_time, duration_minutes, pracovnik_id")
    .eq("booking_date", bookingDate)
    .eq("kadernictvi_id", barbershopId)
    .neq("status", "canceled");

  if (staffId != null && staffId > 0) {
    query = query.or(`pracovnik_id.eq.${staffId},pracovnik_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchBookedIntervalsWithStaffForDate]", error);
    throw error;
  }

  return (data ?? []).map((row) =>
    mapReservationRow(
      row as { booking_time: string; duration_minutes: number | null; pracovnik_id: number | null },
    ),
  );
}

export async function fetchStaffBlocksForBooking(
  bookingDate: string,
  barbershopId = DEFAULT_KADERNICTVI_ID,
  staffId?: number | null,
): Promise<StaffBlock[]> {
  try {
    return await fetchStaffBlocksForDate(bookingDate, barbershopId, staffId ?? undefined);
  } catch (e) {
    console.warn("[fetchStaffBlocksForBooking]", e);
    return [];
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
