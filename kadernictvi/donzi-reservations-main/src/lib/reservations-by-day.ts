import { addDays, format, isToday, isTomorrow, parse } from "date-fns";
import { cs } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

export type Reservation = Tables<"rezervace"> & {
  total_price?: number | null;
};

export type DayGroup = {
  dateKey: string;
  label: string;
  badge: "today" | "tomorrow" | "future" | "past";
  items: Reservation[];
};

export function customerLabel(r: Reservation): string {
  return [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "—";
}

function sortByTime(a: Reservation, b: Reservation) {
  return a.booking_time.localeCompare(b.booking_time);
}

function compareDayKeys(a: string, b: string, todayKey: string, tomorrowKey: string): number {
  if (a === todayKey) return -1;
  if (b === todayKey) return 1;
  if (a === tomorrowKey) return -1;
  if (b === tomorrowKey) return 1;
  if (a >= todayKey && b >= todayKey) return a.localeCompare(b);
  if (a >= todayKey) return -1;
  if (b >= todayKey) return 1;
  return b.localeCompare(a);
}

export function groupReservationsByDay(rows: Reservation[], now = new Date()): {
  upcoming: DayGroup[];
  past: DayGroup[];
} {
  const todayKey = format(now, "yyyy-MM-dd");
  const tomorrowKey = format(addDays(now, 1), "yyyy-MM-dd");
  const byDate = new Map<string, Reservation[]>();

  for (const row of rows) {
    const list = byDate.get(row.booking_date) ?? [];
    list.push(row);
    byDate.set(row.booking_date, list);
  }

  const keys = [...byDate.keys()].sort((a, b) => compareDayKeys(a, b, todayKey, tomorrowKey));

  const upcoming: DayGroup[] = [];
  const past: DayGroup[] = [];

  for (const dateKey of keys) {
    const d = parse(dateKey, "yyyy-MM-dd", now);
    const items = [...(byDate.get(dateKey) ?? [])].sort(sortByTime);
    const formatted = format(d, "EEEE d. MMMM", { locale: cs });

    let label: string;
    let badge: DayGroup["badge"];
    if (isToday(d)) {
      label = `Dnes · ${formatted}`;
      badge = "today";
    } else if (isTomorrow(d)) {
      label = `Zítra · ${formatted}`;
      badge = "tomorrow";
    } else {
      label = formatted;
      badge = dateKey < todayKey ? "past" : "future";
    }

    const group = { dateKey, label, badge, items };
    if (dateKey < todayKey) past.push(group);
    else upcoming.push(group);
  }

  return { upcoming, past };
}

export function defaultOpenDayKeys(groups: DayGroup[], now = new Date()): string[] {
  const todayKey = format(now, "yyyy-MM-dd");
  const tomorrowKey = format(addDays(now, 1), "yyyy-MM-dd");
  const keys = groups.map((g) => g.dateKey);
  const open: string[] = [];
  if (keys.includes(todayKey)) open.push(todayKey);
  if (keys.includes(tomorrowKey)) open.push(tomorrowKey);
  if (open.length > 0) return open;
  return keys.slice(0, 2);
}
