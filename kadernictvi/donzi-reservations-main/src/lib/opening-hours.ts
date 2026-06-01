/** Otevírací doba Barbershop Donzi — shodně s Contact.tsx */
export type DayHours = { open: number; close: number } | null;

/** minuty od půlnoci; null = zavřeno */
export function getOpeningHoursForDay(day: Date): DayHours {
  const dow = day.getDay();
  if (dow === 0) return null;
  if (dow >= 1 && dow <= 4) return { open: 10 * 60, close: 19 * 60 };
  return { open: 10 * 60, close: 21 * 60 };
}

export const BOOKING_SLOT_STEP_MINUTES = 30;
