/** Otevírací doba Studio Elegance — shodně s booking-slots (Po–Pá 9–19, So 9–14). */
export type DayHours = { open: number; close: number } | null;

export const BOOKING_SLOT_STEP_MINUTES = 30;

/** minuty od půlnoci; null = zavřeno */
export function getOpeningHoursForDay(day: Date): DayHours {
  const dow = day.getDay();
  if (dow === 0) return null;
  if (dow === 6) return { open: 9 * 60, close: 14 * 60 };
  return { open: 9 * 60, close: 19 * 60 };
}
