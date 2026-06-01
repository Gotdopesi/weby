import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { cs } from "date-fns/locale";

export const BOOKING_MONTHS_AHEAD = 3;
export const HISTORY_MONTHS_BACK = 12;

export type VydelkyAmounts = {
  month_key: string;
  earned: number;
  planned: number;
  total: number;
};

export function currentMonthKey(now = new Date()): string {
  return format(startOfMonth(now), "yyyy-MM");
}

export function isPastMonthKey(monthKey: string, now = new Date()): boolean {
  return monthKey < currentMonthKey(now);
}

export function isFutureMonthKey(monthKey: string, now = new Date()): boolean {
  return monthKey > currentMonthKey(now);
}

/** Minulé měsíce: jen vyděláno. Aktuální a budoucí: plný přehled včetně plánu. */
export function displayAmounts(row: VydelkyAmounts): VydelkyAmounts {
  if (isPastMonthKey(row.month_key)) {
    return {
      month_key: row.month_key,
      earned: row.earned,
      planned: 0,
      total: row.earned,
    };
  }
  return row;
}

export function showPlannedColumn(monthKey: string): boolean {
  return !isPastMonthKey(monthKey);
}

export type TimelineItem = {
  key: string;
  label: string;
  earned: number;
  planned: number;
  barValue: number;
  kind: "past" | "current" | "future";
};

export function buildRevenueTimeline(
  rows: VydelkyAmounts[],
  now = new Date(),
): { past: TimelineItem[]; upcoming: TimelineItem[] } {
  const nowMonth = startOfMonth(now);
  const byKey = new Map(rows.map((r) => [r.month_key, r]));

  const past: TimelineItem[] = [];
  for (let i = 1; i <= HISTORY_MONTHS_BACK; i++) {
    const m = subMonths(nowMonth, i);
    const key = format(m, "yyyy-MM");
    const raw = byKey.get(key) ?? { month_key: key, earned: 0, planned: 0, total: 0 };
    const d = displayAmounts(raw);
    past.push({
      key,
      label: format(m, "LLLL yyyy", { locale: cs }),
      earned: d.earned,
      planned: 0,
      barValue: d.earned,
      kind: "past",
    });
  }

  const upcoming: TimelineItem[] = [];
  for (let i = 0; i <= BOOKING_MONTHS_AHEAD; i++) {
    const m = addMonths(nowMonth, i);
    const key = format(m, "yyyy-MM");
    const raw = byKey.get(key) ?? { month_key: key, earned: 0, planned: 0, total: 0 };
    const d = displayAmounts(raw);
    const kind = i === 0 ? "current" : "future";
    upcoming.push({
      key,
      label: format(m, "LLLL yyyy", { locale: cs }),
      earned: d.earned,
      planned: d.planned,
      barValue: kind === "past" ? d.earned : d.planned > 0 ? d.planned : d.total,
      kind,
    });
  }

  return { past, upcoming };
}

export function minRevenueMonth(now = new Date()): Date {
  return subMonths(startOfMonth(now), HISTORY_MONTHS_BACK);
}

export function maxRevenueMonth(now = new Date()): Date {
  return addMonths(startOfMonth(now), BOOKING_MONTHS_AHEAD);
}
