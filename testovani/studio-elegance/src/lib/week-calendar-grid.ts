import { BOOKING_SLOT_STEP_MINUTES } from "@/lib/opening-hours";
import { timeToMinutes } from "@/lib/booking-slots";
import type { Reservation } from "@/lib/reservations-by-day";

export type WeekCellBooking = {
  reservation: Reservation;
  rowSpan: number;
};

export type WeekCellState = null | "skip" | WeekCellBooking;

export function buildWeekColumnStates(
  dayRows: Reservation[],
  timeSlots: string[],
): WeekCellState[] {
  const states: WeekCellState[] = timeSlots.map(() => null);

  const sorted = [...dayRows].sort((a, b) =>
    a.booking_time.localeCompare(b.booking_time),
  );

  for (const r of sorted) {
    const startMin = timeToMinutes(r.booking_time);
    const startIdx = timeSlots.findIndex((t) => timeToMinutes(t) === startMin);
    if (startIdx === -1) continue;

    const dur = Number(r.duration_minutes) || 60;
    const span = Math.max(1, Math.ceil(dur / BOOKING_SLOT_STEP_MINUTES));

    if (states[startIdx] === "skip") continue;
    if (states[startIdx] !== null) continue;

    states[startIdx] = { reservation: r, rowSpan: span };
    for (let k = 1; k < span && startIdx + k < states.length; k++) {
      states[startIdx + k] = "skip";
    }
  }

  return states;
}
