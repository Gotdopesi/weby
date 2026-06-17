import { parseISO } from "date-fns";
import { getOpeningHoursForDay } from "@/lib/opening-hours";
import { hoursForStaffOnDay, parseStaffWorkSchedule } from "@/lib/staff-schedule";

export function blockRangeForDate(
  blockDate: string,
  workSchedule: unknown,
  wholeDay: boolean,
  startMinutes: number,
  endMinutes: number,
): { startMinutes: number; endMinutes: number } {
  if (wholeDay) {
    const day = parseISO(blockDate);
    const hours =
      hoursForStaffOnDay(day, parseStaffWorkSchedule(workSchedule)) ?? getOpeningHoursForDay(day);
    if (!hours) {
      throw new Error("V tento den nemáte v rozvrhu pracovní dobu — nelze zablokovat celý den.");
    }
    return { startMinutes: hours.open, endMinutes: hours.close };
  }
  if (endMinutes <= startMinutes) {
    throw new Error("Čas „do“ musí být po čase „od“.");
  }
  return { startMinutes, endMinutes };
}

export function isWholeDayBlock(startMinutes: number, endMinutes: number): boolean {
  return endMinutes - startMinutes >= 8 * 60;
}
