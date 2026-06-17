import { endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns";
import { cs } from "date-fns/locale";

export type ReservationRow = {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number | null;
  service_id: number | null;
  services?: { price: number } | null;
};

export function parseAppointment(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}

export function resolvePrice(r: ReservationRow): number {
  if (r.total_price != null && !Number.isNaN(Number(r.total_price))) {
    return Number(r.total_price);
  }
  if (r.services?.price != null) return Number(r.services.price);
  return 0;
}

/** Uskutečněné tržby: completed nebo termín už proběhl (není canceled). */
export function isEarned(r: ReservationRow, now = new Date()): boolean {
  if (r.status === "canceled") return false;
  if (r.status === "completed") return true;
  return parseAppointment(r.booking_date, r.booking_time) < now;
}

/** Očekávané tržby: confirmed a termín ještě nepřišel. */
export function isPlanned(r: ReservationRow, now = new Date()): boolean {
  if (r.status === "canceled" || r.status === "completed") return false;
  if (r.status !== "confirmed") return false;
  return parseAppointment(r.booking_date, r.booking_time) >= now;
}

export function isInMonth(r: ReservationRow, month: Date): boolean {
  const start = format(startOfMonth(month), "yyyy-MM-dd");
  const end = format(endOfMonth(month), "yyyy-MM-dd");
  return r.booking_date >= start && r.booking_date <= end;
}

export function sumEarnedInMonth(rows: ReservationRow[], month: Date, now = new Date()): number {
  return rows
    .filter((r) => isInMonth(r, month) && isEarned(r, now))
    .reduce((s, r) => s + resolvePrice(r), 0);
}

export function sumPlannedInMonth(rows: ReservationRow[], month: Date, now = new Date()): number {
  return rows
    .filter((r) => isInMonth(r, month) && isPlanned(r, now))
    .reduce((s, r) => s + resolvePrice(r), 0);
}

export function monthlyHistory(rows: ReservationRow[], monthsBack = 6, now = new Date()) {
  const items: { key: string; label: string; total: number }[] = [];
  for (let i = 1; i <= monthsBack; i++) {
    const m = subMonths(startOfMonth(now), i);
    const total = sumEarnedInMonth(rows, m, endOfMonth(m));
    items.push({
      key: format(m, "yyyy-MM"),
      label: format(m, "LLLL yyyy", { locale: cs }),
      total,
    });
  }
  return items;
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`;
}
