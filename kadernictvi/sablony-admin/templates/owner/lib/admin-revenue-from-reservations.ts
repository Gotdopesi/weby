import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth, startOfYear } from "date-fns";
import { cs } from "date-fns/locale";
import {
  periodAnchorStart,
  reservationsInScope,
  type RevenueChartPoint,
  type StatsPeriod,
} from "@/admin/templates/owner/lib/admin-statistics-period";
import {
  isEarned,
  isPlanned,
  resolvePrice,
  type ReservationRow,
} from "@/lib/reservation-metrics";

export type RevenueTotals = {
  earned: number;
  planned: number;
  total: number;
};

export type CatalogPriceItem = {
  id: number;
  name: string;
  price: number;
};

export function buildPriceResolver(catalog: CatalogPriceItem[]) {
  const byId = new Map<number, number>();
  const byName = new Map<string, number>();
  for (const s of catalog) {
    byId.set(s.id, s.price);
    byName.set(s.name.trim().toLowerCase(), s.price);
  }

  return (r: ReservationRow & { service?: string }) => {
    const fromTotal = r.total_price != null ? Number(r.total_price) : 0;
    if (fromTotal > 0) return fromTotal;
    if (r.service_id != null) {
      const p = byId.get(Number(r.service_id));
      if (p != null) return p;
    }
    const name = r.service?.trim().toLowerCase();
    if (name && byName.has(name)) return byName.get(name)!;
    return resolvePrice(r);
  };
}

export function aggregateRevenueFromReservations(
  reservations: ReservationRow[],
  period: StatsPeriod,
  anchor: Date,
  priceOf: (r: ReservationRow) => number = resolvePrice,
  now = new Date(),
): RevenueTotals {
  const inScope = reservationsInScope(
    reservations as Parameters<typeof reservationsInScope>[0],
    period,
    anchor,
  );

  const earned = inScope
    .filter((r) => isEarned(r, now))
    .reduce((s, r) => s + priceOf(r), 0);

  const planned = inScope
    .filter((r) => isPlanned(r, now))
    .reduce((s, r) => s + priceOf(r), 0);

  return { earned, planned, total: earned + planned };
}

export function buildRevenueChartFromReservations(
  reservations: ReservationRow[],
  period: StatsPeriod,
  anchor: Date,
  priceOf: (r: ReservationRow) => number = resolvePrice,
  now = new Date(),
): RevenueChartPoint[] {
  if (period === "year") {
    const start = startOfYear(periodAnchorStart(period, anchor));
    return Array.from({ length: 12 }, (_, i) => {
      const m = addMonths(start, i);
      const key = format(m, "yyyy-MM");
      const monthRows = reservations.filter((r) => r.booking_date.startsWith(key));
      const earned = monthRows
        .filter((r) => isEarned(r, now))
        .reduce((s, r) => s + priceOf(r), 0);
      const planned = monthRows
        .filter((r) => isPlanned(r, now))
        .reduce((s, r) => s + priceOf(r), 0);
      return {
        label: format(m, "LLL", { locale: cs }),
        earned,
        planned,
      };
    });
  }

  if (period === "month") {
    const start = startOfMonth(periodAnchorStart(period, anchor));
    const days = eachDayOfInterval({ start, end: endOfMonth(start) });
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const dayRows = reservations.filter((r) => r.booking_date === key);
      const earned = dayRows
        .filter((r) => isEarned(r, now))
        .reduce((s, r) => s + priceOf(r), 0);
      const planned = dayRows
        .filter((r) => isPlanned(r, now))
        .reduce((s, r) => s + priceOf(r), 0);
      return {
        label: format(d, "d.", { locale: cs }),
        earned,
        planned,
      };
    });
  }

  return [];
}

export function mergeRevenueChartSeries(
  fromDb: RevenueChartPoint[],
  fromRez: RevenueChartPoint[],
): RevenueChartPoint[] {
  if (fromRez.length === 0) return fromDb;
  if (fromDb.length === 0) return fromRez;

  const len = Math.max(fromDb.length, fromRez.length);
  return Array.from({ length: len }, (_, i) => {
    const db = fromDb[i];
    const rez = fromRez[i];
    if (!db && rez) return rez;
    if (!rez && db) return db;
    return {
      label: db?.label ?? rez?.label ?? "",
      earned: Math.max(db?.earned ?? 0, rez?.earned ?? 0),
      planned: Math.max(db?.planned ?? 0, rez?.planned ?? 0),
    };
  });
}

/** Sloučí agregaci z DB (vydelky) a z rezervací — bere vyšší hodnoty po polích. */
export function mergeRevenueTotals(
  fromDb: RevenueTotals,
  fromReservations: RevenueTotals,
): RevenueTotals {
  return {
    earned: Math.max(fromDb.earned, fromReservations.earned),
    planned: Math.max(fromDb.planned, fromReservations.planned),
    total: Math.max(fromDb.total, fromReservations.total),
  };
}

export function formatRevenueAxisTick(value: number): string {
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
}
