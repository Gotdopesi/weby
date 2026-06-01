import {
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { cs } from "date-fns/locale";
import type { Reservation } from "@/lib/reservations-by-day";
import { displayAmounts, type VydelkyAmounts } from "@/lib/admin-revenue-display";

export type StatsPeriod = "week" | "month" | "year";

export function periodAnchorStart(period: StatsPeriod, anchor: Date): Date {
  if (period === "week") return startOfWeek(anchor, { weekStartsOn: 1 });
  if (period === "year") return startOfYear(anchor);
  return startOfMonth(anchor);
}

export function shiftPeriodAnchor(period: StatsPeriod, anchor: Date, delta: number): Date {
  if (period === "week") return addWeeks(anchor, delta);
  if (period === "year") return addYears(anchor, delta);
  return addMonths(anchor, delta);
}

export function periodScopeLabel(period: StatsPeriod, anchor: Date): string {
  const start = periodAnchorStart(period, anchor);
  if (period === "week") {
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return `${format(start, "d. M.", { locale: cs })} – ${format(end, "d. M. yyyy", { locale: cs })}`;
  }
  if (period === "year") return format(start, "yyyy");
  return format(start, "LLLL yyyy", { locale: cs });
}

export function daysInScope(period: StatsPeriod, anchor: Date): Date[] {
  const start = periodAnchorStart(period, anchor);
  if (period === "week") {
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) });
  }
  if (period === "year") {
    return eachDayOfInterval({ start, end: endOfYear(start) });
  }
  return eachDayOfInterval({ start, end: endOfMonth(start) });
}

export function monthKeysInScope(period: StatsPeriod, anchor: Date): string[] {
  const days = daysInScope(period, anchor);
  const keys = new Set(days.map((d) => format(d, "yyyy-MM")));
  return [...keys].sort();
}

export function primaryMonthKey(period: StatsPeriod, anchor: Date): string {
  return format(periodAnchorStart(period, anchor), "yyyy-MM");
}

export function reservationsInScope(
  reservations: Reservation[],
  period: StatsPeriod,
  anchor: Date,
): Reservation[] {
  const days = daysInScope(period, anchor);
  const keys = new Set(days.map((d) => format(d, "yyyy-MM-dd")));
  return reservations.filter((r) => keys.has(r.booking_date));
}

export function aggregateVydelkyInScope(
  rows: VydelkyAmounts[],
  period: StatsPeriod,
  anchor: Date,
): VydelkyAmounts {
  const keys = new Set(monthKeysInScope(period, anchor));
  const filtered = rows.filter((r) => keys.has(r.month_key));
  const earned = filtered.reduce((s, r) => s + displayAmounts(r).earned, 0);
  const planned = filtered.reduce((s, r) => s + displayAmounts(r).planned, 0);
  const total = filtered.reduce((s, r) => s + displayAmounts(r).total, 0);
  return {
    month_key: primaryMonthKey(period, anchor),
    earned,
    planned,
    total,
  };
}

export type PerformancePoint = {
  key: string;
  label: string;
  count: number;
};

export function buildPerformanceSeries(
  reservations: Reservation[],
  period: StatsPeriod,
  anchor: Date,
): PerformancePoint[] {
  const inScope = reservationsInScope(reservations, period, anchor).filter(
    (r) => r.status !== "canceled",
  );

  if (period === "year") {
    const start = startOfYear(periodAnchorStart(period, anchor));
    return Array.from({ length: 12 }, (_, i) => {
      const m = addMonths(start, i);
      const prefix = format(m, "yyyy-MM");
      const count = inScope.filter((r) => r.booking_date.startsWith(prefix)).length;
      return {
        key: prefix,
        label: format(m, "LLL", { locale: cs }),
        count,
      };
    });
  }

  const days = daysInScope(period, anchor);
  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const count = inScope.filter((r) => r.booking_date === key).length;
    return {
      key,
      label:
        period === "week"
          ? format(d, "EEE d.", { locale: cs })
          : format(d, "d.", { locale: cs }),
      count,
    };
  });
}

export type RevenueChartPoint = {
  label: string;
  earned: number;
  planned: number;
};

export function buildRevenueChartSeries(
  rows: VydelkyAmounts[],
  period: StatsPeriod,
  anchor: Date,
): RevenueChartPoint[] {
  if (period === "year") {
    const start = startOfYear(periodAnchorStart(period, anchor));
    const byKey = new Map(rows.map((r) => [r.month_key, r]));
    return Array.from({ length: 12 }, (_, i) => {
      const m = addMonths(start, i);
      const key = format(m, "yyyy-MM");
      const d = displayAmounts(byKey.get(key) ?? { month_key: key, earned: 0, planned: 0, total: 0 });
      return {
        label: format(m, "LLL", { locale: cs }),
        earned: d.earned,
        planned: d.planned,
      };
    });
  }

  if (period === "month") {
    const start = startOfMonth(periodAnchorStart(period, anchor));
    const points: RevenueChartPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = subMonths(start, i);
      const key = format(m, "yyyy-MM");
      const raw = rows.find((r) => r.month_key === key) ?? {
        month_key: key,
        earned: 0,
        planned: 0,
        total: 0,
      };
      const d = displayAmounts(raw);
      points.push({
        label: format(m, "LLL yy", { locale: cs }),
        earned: d.earned,
        planned: d.planned,
      });
    }
    return points;
  }

  return [];
}

/** Denní/týdenní aktivita — počet rezervací (tržby po dnech v DB nejsou). */
export function buildWeekActivityChart(
  reservations: Reservation[],
  period: StatsPeriod,
  anchor: Date,
): RevenueChartPoint[] {
  const perf = buildPerformanceSeries(reservations, period, anchor);
  return perf.map((p) => ({
    label: p.label,
    earned: 0,
    planned: p.count,
  }));
}
